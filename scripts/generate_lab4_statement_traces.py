#!/usr/bin/env python3
"""Replay real Lab 4 storage operations into the statement explorer's data.

Run from anywhere: python3 scripts/generate_lab4_statement_traces.py [--check]

The public starter storage/catalog modules execute unchanged in a temporary
database. SELECT uses the existing, scoped test_scans reference fixtures for
the two unfinished operator methods; no student TODO is changed. Snapshots
contain actual bytes read from files and buffer pages, not a second storage
implementation. Driver line snapshots are taken at the NEXT line event (or
return), after the previous line has run. Nested method-return snapshots are
explicitly marked "during" the still-active driver line.
"""

from __future__ import annotations

import argparse
from contextlib import ExitStack
import functools
import inspect
import json
from pathlib import Path
import sys
import tempfile
import textwrap
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
STARTER = ROOT / "labs/lab-04/starter"
DESTINATION = ROOT / "labs/lab-04/statement-traces.js"
sys.path.insert(0, str(STARTER))
sys.dont_write_bytecode = True

from file_manager import FileManager  # noqa: E402
from buffer_manager import Buffer, BufferManager  # noqa: E402
from record_manager import Layout, RecordPage, Schema, TableScan  # noqa: E402
from catalog import Catalog, _field_catalog_schema, _table_catalog_schema  # noqa: E402
from query_engine import Predicate, ProjectScan, SelectScan  # noqa: E402
from test_scans import _fixture_project_get, _fixture_select_next  # noqa: E402


STAGES = [
    {
        "id": "create", "title": "CREATE: schemas become catalog records",
        "sql": "CREATE TABLE students (sid INT, name VARCHAR(8), gpa INT, mid INT);\nCREATE TABLE majors (mid2 INT, dept VARCHAR(8));",
        "code": '''catalog = Catalog(bm, fm)
schema = Schema()
schema.add_int_field("sid")
schema.add_string_field("name", 8)
schema.add_int_field("gpa")
schema.add_int_field("mid")
students_layout = catalog.create_table("students", schema)
students_layout = catalog.get_layout("students")
schema = Schema()
schema.add_int_field("mid2")
schema.add_string_field("dept", 8)
majors_layout = catalog.create_table("majors", schema)
majors_layout = catalog.get_layout("majors")
print("students: slot size", students_layout.slot_size)
bm.flush_all()  # teaching checkpoint: flush pages, not a transaction commit''',
    },
    {
        "id": "insert", "title": "INSERT: reserve a slot, then write each field",
        "sql": "INSERT INTO students (sid, name, gpa, mid) VALUES\n  (1, 'ada', 39, 1), (2, 'ben', 31, 2), (3, 'cyd', 37, 1),\n  (4, 'dee', 28, 3), (5, 'eli', 36, 2), (6, 'fay', 34, 1), (7, 'temp', 40, 1);\nINSERT INTO majors (mid2, dept) VALUES (1, 'ds'), (2, 'stat'), (3, 'econ');",
        "code": '''rows = [(1, "ada", 39, 1), (2, "ben", 31, 2), (3, "cyd", 37, 1), (4, "dee", 28, 3), (5, "eli", 36, 2), (6, "fay", 34, 1), (7, "temp", 40, 1)]
students = TableScan(bm, fm, "students", students_layout)
for sid, name, gpa, mid in rows:
    students.insert()
    students.set_int("sid", sid)
    students.set_string("name", name)
    students.set_int("gpa", gpa)
    students.set_int("mid", mid)
    print(name, "at", students.rid())
students.close()
majors = TableScan(bm, fm, "majors", majors_layout)
for mid2, dept in [(1, "ds"), (2, "stat"), (3, "econ")]:
    majors.insert()
    majors.set_int("mid2", mid2)
    majors.set_string("dept", dept)
majors.close()
bm.flush_all()  # teaching checkpoint: make file bytes match the dirty pages''',
    },
    {
        "id": "delete", "title": "DELETE: clear the flag; leave field bytes in place",
        "sql": "DELETE FROM students WHERE sid = 7;",
        "code": '''students = TableScan(bm, fm, "students", students_layout)
students.before_first()
while students.next():
    if students.get_int("sid") == 7:
        rid = students.rid()
        students.delete()
        print("Deleted sid 7 at", rid)
students.close()
bm.flush_all()  # teaching checkpoint: persist the cleared flag''',
    },
    {
        "id": "select", "title": "SELECT: pull rows through the scan plan",
        "sql": "SELECT name FROM students WHERE gpa > 35;",
        "code": '''source = TableScan(bm, fm, "students", students_layout)
selected = SelectScan(source, Predicate(("gpa", ">", 35)))
plan = ProjectScan(selected, ["name"])
plan.before_first()
names = []
while plan.next():
    name = plan.get_val("name")
    names.append(name)
    print(name)
plan.close()
assert names == ["ada", "cyd", "eli"]''',
    },
]


def layout_json(layout, name=None):
    value = {
        "slotSize": layout.slot_size,
        "fields": [{"name": field, "type": layout.schema.type_of(field),
                    "size": 4 if layout.schema.type_of(field) == "int" else
                    4 + layout.schema.length_of(field),
                    "offset": layout.offset(field)} for field in layout.schema.fields()],
    }
    if name is not None:
        value["name"] = name
    return value


def known_layout_name(layout):
    return {
        ("sid", "name", "gpa", "mid"): "students",
        ("mid2", "dept"): "majors",
        ("tblname", "slotsize"): "table_catalog",
        ("tblname", "fldname", "fldtype", "length", "offset"): "field_catalog",
    }.get(tuple(layout.schema.fields()), "layout")


class Recorder:
    def __init__(self, fm, bm):
        self.fm, self.bm = fm, bm
        self.frames = []
        self.output = []
        self.driver = None
        self.active_line = None
        self.driver_filename = None
        self.code = []
        self.scans = []
        self.last_lines = {}
        self.current_layout = None
        self.focus = None
        self.reads = self.writes = 0

    def helper(self, fn, name):
        source, start = inspect.getsourcelines(fn)
        code = textwrap.dedent("".join(source)).rstrip().splitlines()
        line = self.last_lines.get(fn.__code__, start + len(code) - 1) - start + 1
        return {"name": name, "line": max(1, min(line, len(code))), "code": code,
                "path": str(Path(inspect.getsourcefile(fn)).relative_to(ROOT))}

    def local_values(self):
        if self.driver is None:
            return {}
        values = {}
        for name, value in self.driver.f_locals.items():
            if name.startswith("_") or name in {"rows"}:
                continue
            if isinstance(value, (str, int, float, bool)) or value is None:
                values[name] = value
            elif isinstance(value, Schema):
                values[name] = ", ".join(
                    f"{field}: {value.type_of(field)}" +
                    (f"({value.length_of(field)})" if value.type_of(field) == "varchar" else "")
                    for field in value.fields()) or "empty schema"
            elif isinstance(value, Layout):
                values[name] = f"{value.slot_size} bytes per slot"
            elif name in {"rid", "names"}:
                values[name] = list(value)
        return values

    def cursor_values(self):
        cursors = []
        for item in self.scans:
            scan = item["scan"]
            rp = getattr(scan, "rp", None)
            if rp is not None:
                item["block"], item["slot"] = rp.block.blknum, getattr(scan, "current_slot", -1)
            cursors.append({"name": item["name"], "file": item["file"],
                            "block": item.get("block"), "slot": item.get("slot", -1),
                            "closed": item["closed"]})
        return cursors

    def emit(self, event, message, *, phase="during", focus=None, helper=None,
             extra=None, done=False):
        if focus is not None:
            self.focus = focus
        files = []
        for path in sorted(Path(self.fm.db_dir).glob("*.tbl")):
            data = path.read_bytes()
            files.append({"name": path.name, "blocks": [
                {"bytes": list(data[start:start + self.fm.block_size])}
                for start in range(0, len(data), self.fm.block_size)]})
        buffers = [{"index": index,
                    "file": buf.block.filename if buf.block else None,
                    "block": buf.block.blknum if buf.block else None,
                    "pins": buf.pins, "dirty": buf.dirty,
                    "bytes": list(buf.contents().contents())}
                   for index, buf in enumerate(self.bm.pool)]
        locals_ = self.local_values()
        if extra:
            locals_.update(extra)
        self.frames.append({
            "line": self.active_line, "phase": phase, "event": event,
            "message": message, "helper": helper, "files": files,
            "buffers": buffers, "cursors": self.cursor_values(),
            "layout": self.current_layout, "focus": self.focus,
            "locals": locals_, "output": list(self.output),
            "counts": {"hits": self.bm.hits, "misses": self.bm.misses,
                       "reads": self.reads, "writes": self.writes}, "done": done,
        })

    def completed_line(self):
        if self.active_line is not None:
            line = self.code[self.active_line - 1].strip()
            # A returned catalog layout is now assigned to the driver variable.
            for name in ("students_layout", "majors_layout"):
                if line.startswith(name + " =") and name in self.driver.f_locals:
                    layout = self.driver.f_locals[name]
                    self.current_layout = layout_json(layout, known_layout_name(layout))
            self.emit("line", "Executed: " + line, phase="after")

    def trace(self, frame, event, arg):
        if frame.f_code.co_filename == self.driver_filename:
            if event == "line":
                self.completed_line()
                self.driver, self.active_line = frame, frame.f_lineno
            elif event == "return":
                self.completed_line()
            return self.trace
        if frame.f_code.co_filename.startswith(str(STARTER)):
            if event == "line":
                self.last_lines[frame.f_code] = frame.f_lineno
            return self.trace
        return None

    def location(self, block, slot=None, field=None, layout=None, buffer=None):
        if buffer is None:
            buffer = next((b for b in self.bm.pool if b.block == block), None)
        offset, length = None, None
        if slot is not None and layout is not None:
            offset = slot * layout.slot_size
            length = layout.slot_size
            if field is not None:
                if field == "flag":
                    length = 4
                else:
                    offset += layout.offset(field)
                    length = 4 if layout.schema.type_of(field) == "int" else 4 + layout.schema.length_of(field)
        return {"file": block.filename, "block": block.blknum, "slot": slot,
                "field": field, "byteOffset": offset, "length": length,
                "frame": self.bm.pool.index(buffer) if buffer is not None else None}

    def instrument(self, stack):
        def wrap(cls, name, after, before=None):
            original = getattr(cls, name)
            @functools.wraps(original)
            def wrapped(obj, *args, **kwargs):
                state = before(obj, args) if before else None
                result = original(obj, *args, **kwargs)
                after(obj, args, result, state, original)
                return result
            stack.enter_context(patch.object(cls, name, wrapped))

        def file_created(obj, args, result, existed, fn):
            if not existed:
                self.emit("file-created", f"Create empty file {args[0]} (0 blocks).",
                          helper=self.helper(fn, "FileManager._file"))
        wrap(FileManager, "_file", file_created,
             lambda obj, args: (Path(obj.db_dir) / args[0]).exists())

        def append(obj, args, block, state, fn):
            self.emit("block-appended", f"Append zero-filled block {block.blknum} to {block.filename}.",
                      focus=self.location(block), helper=self.helper(fn, "FileManager.append"))
        wrap(FileManager, "append", append)

        def read(obj, args, result, state, fn):
            # pin emits after assign_to_block updates both bytes AND the label.
            self.reads += 1
        wrap(FileManager, "read", read)

        def write(obj, args, result, state, fn):
            self.writes += 1
            block = args[0]
            self.emit("disk-write", f"Write all 128 bytes of {block.filename} block {block.blknum} to its file.",
                      focus=self.location(block), helper=self.helper(fn, "FileManager.write"))
        wrap(FileManager, "write", write)

        def pin(obj, args, buffer, hit, fn):
            block = args[0]
            self.emit("pin-hit" if hit else "pin-miss",
                      ("Buffer hit: reuse " if hit else "Buffer miss: read ") +
                      f"{block.filename} block {block.blknum}; frame {obj.pool.index(buffer)} has {buffer.pins} pin(s).",
                      focus=self.location(block, buffer=buffer), helper=self.helper(fn, "BufferManager.pin"))
        wrap(BufferManager, "pin", pin,
             lambda obj, args: any(b.block == args[0] for b in obj.pool))

        def unpin(obj, args, result, state, fn):
            buffer = args[0]
            self.emit("unpin", f"Unpin frame {obj.pool.index(buffer)}; {buffer.pins} pin(s) remain. Dirty bytes stay in memory.",
                      focus=self.location(buffer.block, buffer=buffer), helper=self.helper(fn, "BufferManager.unpin"))
        wrap(BufferManager, "unpin", unpin)

        def flush(obj, args, result, dirty, fn):
            if dirty:
                self.emit("flush", f"Frame {self.bm.pool.index(obj)} is clean after flushing {obj.block.filename} block {obj.block.blknum}.",
                          focus=self.location(obj.block, buffer=obj), helper=self.helper(fn, "Buffer.flush"))
        wrap(Buffer, "flush", flush, lambda obj, args: obj.dirty)

        def layout_built(obj, args, result, state, fn):
            self.current_layout = layout_json(obj, known_layout_name(obj))
            self.emit("layout", f"Compute {self.current_layout['name']} layout: {obj.slot_size} bytes per slot; flag occupies bytes 0–3.",
                      helper=self.helper(fn, "Layout.__init__"))
        wrap(Layout, "__init__", layout_built)

        def scan_start(obj, args):
            filename = args[2] + ".tbl"
            count = sum(item["file"] == filename for item in self.scans) + 1
            name = args[2] + (f" #{count}" if count > 1 else "")
            self.scans.append({"scan": obj, "name": name, "file": filename, "closed": False})
        def scan_open(obj, args, result, state, fn):
            self.current_layout = layout_json(obj.layout, known_layout_name(obj.layout))
            self.emit("cursor", f"Open {obj.filename}: cursor starts before slot 0.",
                      focus=self.location(obj.rp.block), helper=self.helper(fn, "TableScan.__init__"))
        wrap(TableScan, "__init__", scan_open, scan_start)

        def close_start(obj, args):
            self.cursor_values()
        def scan_close(obj, args, result, state, fn):
            for item in self.scans:
                if item["scan"] is obj:
                    item["closed"] = True
            self.emit("scan-close", f"Close {obj.filename}; its scan holds no buffer pin.",
                      helper=self.helper(fn, "TableScan.close"))
        wrap(TableScan, "close", scan_close, close_start)

        def scan_next(obj, args, result, state, fn):
            message = (f"Cursor in {obj.filename} reaches block {obj.rp.block.blknum}, slot {obj.current_slot}."
                       if result else f"{obj.filename}: no more USED slots; next() returns False.")
            self.emit("cursor", message,
                      focus=self.location(obj.rp.block, obj.current_slot if result else None, layout=obj.layout),
                      helper=self.helper(fn, "TableScan.next"), extra={"next()": result})
        wrap(TableScan, "next", scan_next)

        def probe(obj, args, result, state, fn):
            self.emit("slot-probe", f"Test {obj.block.filename} block {obj.block.blknum}, slot {args[0]}: flag is {'USED (1)' if result else 'EMPTY (0)' }.",
                      focus=self.location(obj.block, args[0], "flag", obj.layout),
                      helper=self.helper(fn, "RecordPage.is_used"), extra={"is_used": result})
        wrap(RecordPage, "is_used", probe)

        def flag(obj, args, result, state, fn):
            slot, value = args
            self.emit("slot-flag", f"Set {obj.block.filename} block {obj.block.blknum}, slot {slot} flag to {'USED (1)' if value else 'EMPTY (0)'}. Field bytes are unchanged; frame is dirty.",
                      focus=self.location(obj.block, slot, "flag", obj.layout),
                      helper=self.helper(fn, "RecordPage._set_flag"), extra={"flag": value})
        wrap(RecordPage, "_set_flag", flag)

        def field_written(obj, args, result, state, fn):
            slot, field, value = args
            self.emit("field-write", f"Write {field} = {value!r} into {obj.block.filename} block {obj.block.blknum}, slot {slot}; frame is dirty.",
                      focus=self.location(obj.block, slot, field, obj.layout),
                      helper=self.helper(fn, "RecordPage." + fn.__name__), extra={"write": value})
        wrap(RecordPage, "set_int", field_written)
        wrap(RecordPage, "set_string", field_written)

        def field_read(obj, args, result, state, fn):
            slot, field = args
            self.emit("field-read", f"Read {field} = {result!r} from {obj.block.filename} block {obj.block.blknum}, slot {slot}.",
                      focus=self.location(obj.block, slot, field, obj.layout),
                      helper=self.helper(fn, "RecordPage." + fn.__name__), extra={"read": result})
        wrap(RecordPage, "get_int", field_read)
        wrap(RecordPage, "get_string", field_read)

        def predicate(obj, args, result, state, fn):
            scan = args[0]
            self.emit("predicate", "Predicate gpa > 35 is " + str(result) + ("; yield this row." if result else "; continue scanning."),
                      focus=self.location(scan.rp.block, scan.current_slot, "gpa", scan.layout),
                      helper=self.helper(fn, "Predicate.is_satisfied"), extra={"predicate": result})
        wrap(Predicate, "is_satisfied", predicate)

    def run_stage(self, stage, namespace):
        self.frames, self.output, self.scans = [], [], []
        self.driver, self.active_line = None, None
        self.code = stage["code"].splitlines()
        self.driver_filename = "<lab4-statement-" + stage["id"] + ">"
        self.emit("start", "Ready to execute " + stage["id"].upper() +
                  ". File and buffer bytes continue from the previous stage.", phase="before")
        sys.settrace(self.trace)
        try:
            exec(compile(stage["code"], self.driver_filename, "exec"), namespace)
        finally:
            sys.settrace(None)
        assert not any(buffer.pins for buffer in self.bm.pool), "stage leaked a pin"
        self.emit("complete", stage["id"].upper() + " finished; all scans are closed and no buffer pins remain.",
                  phase="after", done=True)
        return {**stage, "code": list(self.code), "frames": self.frames}


def generate():
    students_schema = (Schema().add_int_field("sid").add_string_field("name", 8)
                       .add_int_field("gpa").add_int_field("mid"))
    majors_schema = Schema().add_int_field("mid2").add_string_field("dept", 8)
    layouts = {name: layout_json(Layout(schema)) for name, schema in [
        ("students", students_schema), ("majors", majors_schema),
        ("table_catalog", _table_catalog_schema()), ("field_catalog", _field_catalog_schema())]}
    with tempfile.TemporaryDirectory(prefix="microdb-statement-traces-") as directory:
        fm = FileManager(directory, block_size=128)
        bm = BufferManager(fm, num_buffers=8)
        recorder = Recorder(fm, bm)
        namespace = {"fm": fm, "bm": bm, "Catalog": Catalog, "Schema": Schema,
                     "TableScan": TableScan, "SelectScan": SelectScan,
                     "ProjectScan": ProjectScan, "Predicate": Predicate,
                     "print": lambda *values: recorder.output.append(" ".join(map(str, values)))}
        shared_names = set(namespace) | {"students_layout", "majors_layout"}
        try:
            with ExitStack() as stack:
                # Fixtures are shipped publicly already; patch only this run.
                stack.enter_context(patch.object(SelectScan, "next", _fixture_select_next))
                stack.enter_context(patch.object(ProjectScan, "get_val", _fixture_project_get))
                recorder.instrument(stack)
                stages = []
                for stage in STAGES:
                    # Each driver excerpt gets fresh local variables, as the
                    # separate functions in sql_walkthrough.py do. Only the
                    # database managers and the two learned layouts persist.
                    namespace = {name: value for name, value in namespace.items()
                                 if name in shared_names}
                    stages.append(recorder.run_stage(stage, namespace))
        finally:
            fm.close()
    assert stages[-1]["frames"][-1]["output"] == ["ada", "cyd", "eli"]
    model = {
        "version": 1, "blockSize": 128, "poolSize": 8, "layouts": layouts,
        "source": "scripts/generate_lab4_statement_traces.py",
        "notes": [
            "Recorded by executing the provided Lab 4 file, buffer, record, and catalog modules in one fresh temporary database.",
            "SELECT uses the public test_scans.py reference fixtures for SelectScan.next and ProjectScan.get_val; the student's TODOs stay unchanged.",
            "Explicit bm.flush_all() calls after CREATE, INSERT, and DELETE are added teaching checkpoints, not transaction commits. Closing a scan only unpins its buffer.",
            "Driver line frames show state after the line executes. Nested storage frames show a completed helper operation while the highlighted driver line is still running.",
            "CREATE records metadata in table_catalog.tbl and field_catalog.tbl; the user table file is created lazily when its first TableScan opens.",
        ],
        "stages": stages,
    }
    encoded = json.dumps(model, ensure_ascii=False, separators=(",", ":"))
    return ("/* Generated by scripts/generate_lab4_statement_traces.py; do not edit. */\n"
            "(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)"
            "module.exports=factory();else root.StatementTraces=factory();}"
            "(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';return "
            + encoded + ";}));\n"), model


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify the checked-in trace without changing it")
    args = parser.parse_args()
    javascript, model = generate()
    if args.check:
        if not DESTINATION.exists() or DESTINATION.read_text() != javascript:
            raise SystemExit("Statement traces are stale; run scripts/generate_lab4_statement_traces.py")
        print("Statement traces match the actual Python execution.")
    else:
        DESTINATION.write_text(javascript)
        print("Wrote", DESTINATION.relative_to(ROOT), f"({len(javascript.encode()):,} bytes)")
    print("; ".join(f"{stage['id']}: {len(stage['frames'])} frames" for stage in model["stages"]))


if __name__ == "__main__":
    main()
