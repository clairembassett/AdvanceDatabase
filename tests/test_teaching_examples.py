"""Check worked examples against public Python helpers without completing starters.

Run: python3 -m unittest discover -s tests -p test_teaching_examples.py -v
Node is needed only to read the same fixtures used by the browser and slides.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]


class TeachingExampleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        node = shutil.which("node")
        if not node:
            raise unittest.SkipTest("Node is needed to read the shared browser fixtures")
        result = subprocess.run(
            [node, "-e", "process.stdout.write(JSON.stringify(require('./labs/_shared/teaching-traces.js').fixtures))"],
            cwd=ROOT, capture_output=True, text=True, check=True,
        )
        cls.fixtures = result.stdout

    def run_example(self, lab, code):
        setup = "import json, sys\nfixture = json.load(sys.stdin)\n"
        setup += f"sys.path.append({str(ROOT / 'tests')!r})\n"
        result = subprocess.run(
            [sys.executable, "-c", setup + code],
            input=self.fixtures, text=True, capture_output=True,
            cwd=ROOT / "labs" / f"lab-{lab:02d}" / "starter",
            env=dict(os.environ, PYTHONDONTWRITEBYTECODE="1"), timeout=30,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_tree_lookup_range_and_both_split_shapes(self):
        self.run_example(6, '''
import btree as student
from test_incremental_labs_middle import TREE_REFERENCES
namespace = {"student": student}
exec(TREE_REFERENCES, namespace)
for target, implementation in namespace["references"].items():
    setattr(student.BPlusTree, target.split(".")[1], implementation)
tree = student.BPlusTree()
leaves = []
for spec in fixture["tree"]["leaves"]:
    leaf = student.Node(True)
    leaf.keys = spec["keys"]
    leaf.rids = [[tuple(rid) for rid in rids] for rids in spec["rids"]]
    leaves.append(leaf)
leaves[0].next = leaves[1]
tree.root = student.Node(False)
tree.root.keys = [36]
tree.root.children = leaves
tree.height = 2
assert tree.root.child_index_for(35) == 0
assert tree.root.child_index_for(36) == 1
assert tree.search(36) == [(0,4)]
assert tree.nodes_touched == 2
assert tree.search(35) == []
answer = tree.search(31)
assert answer == [(0,1),(1,0)]
answer.clear()
assert tree.search(31) == [(0,1),(1,0)], "return a copy"
assert tree.range(31,37) == [(0,1),(1,0),(0,5),(0,4),(0,2)]
assert tree.range(32,36) == [(0,5),(0,4)]
small = student.BPlusTree()
for key in range(1,5): small.insert(key, (0,key))
assert not small.root.is_full() and small.height == 1
small.insert(5,(0,5))
assert small.root.keys == [3] and small.height == 2
assert [n.keys for n in small.root.children] == [[1,2],[3,4,5]]
assert small.root.children[0].next is small.root.children[1]
internal = student.Node(False)
internal.keys = [3,5,7,9,11]
children = [student.Node(True) for _ in range(6)]
internal.children = children[:]
small.root = internal
small._split(internal,None)
assert small.root.keys == [7]
assert [n.keys for n in small.root.children] == [[3,5],[9,11]]
assert small.root.children[0].children == children[:3]
assert small.root.children[1].children == children[3:]
''')

    def test_query_description_and_scan_agree_on_the_worked_query(self):
        self.run_example(5, '''
import tempfile
import sql_frontend as student
from test_incremental_labs_early import SQL_REFERENCE
namespace = dict(vars(student))
exec(SQL_REFERENCE, namespace)
for name in ("parse_query","_parse_predicate","_parse_term"):
    setattr(student.Parser,name,getattr(namespace["Parser"],name))
student.Database.plan_query = namespace["Database"].plan_query
# The reference methods resolve Parser through their globals only for types;
# all recursive calls use self and therefore the patched student instance.
query = student.Parser("SELECT name FROM students WHERE gpa > 35").parse()
assert query.fields == ["name"] and query.tables == ["students"]
lex = student.Lexer("SELECT name FROM students WHERE gpa > 35")
assert lex.peek() == ("KEYWORD","select") and lex.pos == 0
assert lex.match("KEYWORD","select") and lex.pos == 0
assert lex.expect("KEYWORD","select") == "select" and lex.pos == 1
assert lex.tokens[-1] == ("NUM",35)
from file_manager import FileManager
from buffer_manager import BufferManager
from catalog import Catalog
with tempfile.TemporaryDirectory() as directory:
    fm=FileManager(directory,4096)
    bm=BufferManager(fm,8)
    catalog=Catalog(bm,fm)
    database=student.Database(fm,bm,catalog)
    database.execute("CREATE TABLE students (name VARCHAR(8), gpa INT)")
    for name,gpa in [("ada",39),("ben",31),("cyd",37),("dee",28),("eli",36),("fay",34)]:
        database.execute(f"INSERT INTO students VALUES ('{name}', {gpa})")
    result=database.execute("SELECT name FROM students WHERE gpa > 35")
    assert [row["name"] for row in result] == ["ada","cyd","eli"], result
    fm.close()
''')

    def test_rag_measurements_are_current(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts/generate_rag_measurements.py"), "--check"],
            capture_output=True, text=True, cwd=ROOT,
            env=dict(os.environ, PYTHONDONTWRITEBYTECODE="1"), timeout=30,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_reverse_undo_with_and_without_an_uncommitted_page_flush(self):
        self.run_example(7, '''
import tempfile
import transaction as student
from file_manager import Page
from test_incremental_labs_middle import TX_REFERENCES
namespace = {"student": student}
exec(TX_REFERENCES, namespace)
for final_disk_value in (10,60):
    with tempfile.TemporaryDirectory() as directory:
        fm = student.FileManager(directory,128)
        block = fm.append("acct.tbl")
        page = Page(128)
        page.set_int(0,final_disk_value)
        fm.write(block,page)
        bm = student.BufferManager(fm,2)
        lm = student.LogManager(directory)
        for raw in fixture["undoLog"]:
            rec = dict(raw)
            if rec["kind"] == "SET_INT":
                rec.update(file="acct.tbl",blk=0,off=0)
            lm.append(rec)
        seen = []
        restore = namespace["restore"]
        def observed_restore(bm,rec):
            restore(bm,rec)
            seen.append(rec["old"])
        namespace["restore"] = observed_restore
        assert namespace["recover"](fm,bm,lm) == [2]
        assert seen == [40,60]
        fm.read(block,page)
        assert page.get_int(0) == 60
        assert namespace["recover"](fm,bm,lm) == []
        lm.close()
        fm.close()
        namespace["restore"] = restore
''')

    def test_vector_example_agrees_with_public_reference(self):
        self.run_example(10, '''
from microvector import IVFIndex, BruteForceIndex, recall_at_k
vectors, query = fixture["vectors"], fixture["query"]
index = IVFIndex.__new__(IVFIndex)
index.vectors = vectors
index.centroids = fixture["centroids"]
index.lists = [[],[]]
index.comparisons = 0
index._build()
assert index.lists == [[0],[1,2,3]]
exact = BruteForceIndex(vectors).search(query,2)
assert [i for _,i in exact] == [1,0]
for probe, expected_ids, comparisons, recall in [(1,[0],3,.5),(2,[1,0],6,1)]:
    index.comparisons = 0
    answer = index.search(query,2,probe=probe)
    assert [i for _,i in answer] == expected_ids
    assert index.comparisons == comparisons
    assert recall_at_k(answer,exact,2) == recall
assert abs(exact[0][0] - .96) < 1e-12
''')

    def test_group_then_window_yields_two_monthly_rows(self):
        # The example uses standard SUM/GROUP BY/ROWS semantics. SQLite gives
        # an always-available execution check; also check DuckDB when installed.
        self.run_example(8, '''
import sqlite3
query = """WITH monthly AS (
 SELECT month, SUM(fare + tip) AS revenue FROM toy_rides GROUP BY month
)
SELECT month, revenue,
 SUM(revenue) OVER (ORDER BY month ROWS UNBOUNDED PRECEDING) AS running
FROM monthly ORDER BY month"""
connections = [sqlite3.connect(":memory:")]
try:
    import duckdb
    connections.append(duckdb.connect())
except ImportError:
    pass
for connection in connections:
    connection.execute("CREATE TABLE toy_rides(month INTEGER, fare INTEGER, tip INTEGER)")
    connection.executemany("INSERT INTO toy_rides VALUES (?, ?, ?)", fixture["rides"])
    assert connection.execute(query).fetchall() == [(1,20,20),(2,30,50)]
    connection.close()
''')

    def test_index_measurement_times_descent_and_reports_absent_keys(self):
        self.run_example(6, '''
from contextlib import redirect_stdout
from io import StringIO
from unittest.mock import patch
import measure_index as measurement
measurement.N_ROWS = 20
for target in (7,99):
    measurement.TARGET = target
    events = []
    class Index:
        height = 1
        nodes_touched = 0
        def search(self,key):
            events.append("search")
            self.nodes_touched += 1
            return [(0,key)] if 0 <= key < measurement.N_ROWS else []
    def clock():
        events.append("clock")
        return float(events.count("clock"))
    output = StringIO()
    with patch.object(measurement,"build_index",return_value=Index()), \\
         patch.object(measurement.time,"perf_counter",side_effect=clock), \\
         redirect_stdout(output):
        measurement.main()
    assert events == ["clock"]*5 + ["search","clock"], events
    count = 1 if target == 7 else 0
    assert f"+ {count} distinct matching heap block{'s' if count != 1 else ''}" in output.getvalue(), output.getvalue()
    assert f"index:  found {count} row" in output.getvalue()
''')


if __name__ == "__main__":
    unittest.main()
