'use strict';

// Run with: node tests/test_statement_traces.js
// Decode the recorded physical bytes independently of the trace generator/UI.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sourcePath = path.join(__dirname, '../labs/lab-04/statement-traces.js');
const data = require(sourcePath);
const stages = Object.fromEntries(data.stages.map(stage => [stage.id, stage]));
const first = stage => stage.frames[0];
const last = stage => stage.frames.at(-1);
const int = (bytes, offset) => Buffer.from(bytes).readInt32LE(offset);
const bytesOf = (frame, file, block, memory = false) => memory
  ? frame.buffers.find(buffer => buffer.file === file && buffer.block === block)?.bytes
  : frame.files.find(item => item.name === file)?.blocks[block]?.bytes;
const fileSizes = frame => Object.fromEntries(frame.files.map(file => [file.name, file.blocks.length]));
const row = (bytes, table, slot) => {
  const layout = data.layouts[table];
  const base = slot * layout.slotSize;
  const value = { used: int(bytes, base) === 1 };
  for (const field of layout.fields) {
    const offset = base + field.offset;
    value[field.name] = field.type === 'int' ? int(bytes, offset)
      : Buffer.from(bytes.slice(offset + 4, offset + 4 + int(bytes, offset))).toString('utf8');
  }
  return value;
};
const physicalRows = (frame, table) => frame.files.find(file => file.name === table + '.tbl').blocks.flatMap(block =>
  Array.from({ length: Math.floor(data.blockSize / data.layouts[table].slotSize) }, (_, slot) => row(block.bytes, table, slot))
).filter(value => value.used).map(({ used, ...value }) => value);
const physicalState = frame => ({ files: frame.files, buffers: frame.buffers, counts: frame.counts });
const allFrames = data.stages.flatMap(stage => stage.frames);
const helpersChecked = new Set();

assert.deepEqual(data.stages.map(stage => stage.id), ['create', 'insert', 'delete', 'select']);
assert.equal(data.blockSize, 128);
assert.equal(data.poolSize, 8);
assert.equal(data.layouts.students.slotSize, 28);
assert.equal(data.layouts.majors.slotSize, 20);
assert.equal(data.layouts.table_catalog.slotSize, 28);
assert.equal(data.layouts.field_catalog.slotSize, 64);
assert.deepEqual(Object.fromEntries(data.layouts.students.fields.map(field => [field.name, field.offset])),
  { sid: 4, name: 8, gpa: 20, mid: 24 });
assert.deepEqual(Object.fromEntries(data.layouts.field_catalog.fields.map(field => [field.name, field.offset])),
  { tblname: 4, fldname: 24, fldtype: 44, length: 56, offset: 60 });

// Every frame is usable without reconstructing state from an earlier frame.
for (const stage of data.stages) {
  assert(stage.code.length > 0 && stage.frames.length > stage.code.length);
  assert.deepEqual([...new Set(stage.frames.filter(frame => frame.event === 'line').map(frame => frame.line))].sort((a, b) => a - b),
    stage.code.map((_, index) => index + 1), 'Every executed driver line has a completed snapshot');
  assert.equal(stage.frames.filter(frame => frame.done).length, 1);
  assert.equal(last(stage).done, true);
  assert(last(stage).buffers.every(buffer => buffer.pins === 0), stage.id + ' releases every scan pin');
  assert(last(stage).buffers.every(buffer => !buffer.dirty), stage.id + ' ends at the visible flush/close checkpoint');
  for (const frame of stage.frames) {
    assert(frame.line === null || Number.isInteger(frame.line) && frame.line > 0 && frame.line <= stage.code.length);
    assert(['before', 'during', 'after'].includes(frame.phase));
    assert.equal(typeof frame.message, 'string');
    assert.equal(frame.buffers.length, 8);
    if (frame.helper) {
      const helper = frame.helper;
      assert(frame.phase === 'during' && frame.line !== null, 'Helper snapshots remain inside the highlighted driver line');
      assert(helper.line > 0 && helper.line <= helper.code.length, 'The highlighted helper line exists');
      if (!helpersChecked.has(helper.name)) {
        helpersChecked.add(helper.name);
        const source = fs.readFileSync(path.join(__dirname, '..', helper.path), 'utf8');
        // inspect.getsourcelines dedents class methods before publishing them.
        assert(source.replace(/^    /gm, '').includes(helper.code.join('\n')),
          'Displayed helper code matches its referenced Python source: ' + helper.name);
      }
    }
    assert.equal(new Set(frame.files.map(file => file.name)).size, frame.files.length);
    for (const file of frame.files) {
      for (const block of file.blocks) assert.equal(block.bytes.length, 128);
    }
    const assigned = new Set();
    for (const buffer of frame.buffers) {
      assert.equal(buffer.bytes.length, 128);
      assert(Number.isInteger(buffer.pins) && buffer.pins >= 0);
      assert.equal(typeof buffer.dirty, 'boolean');
      if (buffer.file === null) {
        assert.equal(buffer.block, null);
        assert.equal(buffer.pins, 0);
        assert.equal(buffer.dirty, false);
      } else {
        const identity = buffer.file + ':' + buffer.block;
        assert(!assigned.has(identity), 'A physical block has at most one resident copy');
        assigned.add(identity);
        assert(bytesOf(frame, buffer.file, buffer.block), 'Each assigned buffer names an existing disk block');
      }
    }
    for (const count of Object.values(frame.counts)) assert(Number.isInteger(count) && count >= 0);
  }
}
for (let i = 1; i < data.stages.length; i += 1) {
  assert.deepEqual(physicalState(first(data.stages[i])), physicalState(last(data.stages[i - 1])),
    'A stage starts with the exact files, buffers and I/O counts left by the previous stage');
}

// CREATE stores the schema as ordinary catalog records; user files are lazy.
assert.deepEqual(first(stages.create).files, []);
assert(stages.create.frames.every(frame => frame.files.every(file => /^(table|field)_catalog\.tbl$/.test(file.name))),
  'CREATE must not create students.tbl or majors.tbl');
assert.deepEqual(fileSizes(last(stages.create)), { 'field_catalog.tbl': 3, 'table_catalog.tbl': 1 });
assert.deepEqual(physicalRows(last(stages.create), 'table_catalog'), [
  { tblname: 'students', slotsize: 28 }, { tblname: 'majors', slotsize: 20 }
]);
assert.deepEqual(physicalRows(last(stages.create), 'field_catalog'), [
  { tblname: 'students', fldname: 'sid', fldtype: 'int', length: 0, offset: 4 },
  { tblname: 'students', fldname: 'name', fldtype: 'varchar', length: 8, offset: 8 },
  { tblname: 'students', fldname: 'gpa', fldtype: 'int', length: 0, offset: 20 },
  { tblname: 'students', fldname: 'mid', fldtype: 'int', length: 0, offset: 24 },
  { tblname: 'majors', fldname: 'mid2', fldtype: 'int', length: 0, offset: 4 },
  { tblname: 'majors', fldname: 'dept', fldtype: 'varchar', length: 8, offset: 8 }
]);
assert(stages.create.frames.some(frame => frame.layout?.name === 'students' && frame.layout.slotSize === 28),
  'Reconstructed student layout is visible');

// An append publishes a zero disk block; writes remain in dirty buffers until flush.
for (const table of ['students', 'majors']) {
  const file = table + '.tbl';
  const created = stages.insert.frames.find(frame => bytesOf(frame, file, 0));
  assert(created && bytesOf(created, file, 0).every(byte => byte === 0));
}
for (const stage of [stages.create, stages.insert, stages.delete]) {
  const deferred = stage.frames.find(frame => frame.buffers.some(buffer => buffer.dirty &&
    JSON.stringify(buffer.bytes) !== JSON.stringify(bytesOf(frame, buffer.file, buffer.block))));
  assert(deferred, stage.id + ' shows newer bytes in a dirty buffer than on disk');
  assert(stage.frames.some(frame => frame.buffers.some(buffer => buffer.dirty && buffer.pins === 0)),
    stage.id + ' shows that unpin/close does not flush');
  const tail = last(stage);
  for (const buffer of tail.buffers.filter(buffer => buffer.file !== null)) {
    assert.deepEqual(buffer.bytes, bytesOf(tail, buffer.file, buffer.block), 'Flush brings disk and RAM into agreement');
  }
}
for (let index = 1; index < allFrames.length; index += 1) {
  const previous = allFrames[index - 1], frame = allFrames[index];
  for (const key of Object.keys(frame.counts)) assert(frame.counts[key] >= previous.counts[key], 'Counters never run backward');
  if (frame.counts.writes === previous.counts.writes) {
    for (const file of previous.files) {
      file.blocks.forEach((block, number) => assert.deepEqual(bytesOf(frame, file.name, number), block.bytes,
        'Existing disk bytes cannot change without FileManager.write'));
    }
  }
}

// Watch the first student become a partial row, then fill each field independently.
const studentRows = stages.insert.frames.map(frame => {
  const bytes = bytesOf(frame, 'students.tbl', 0, true);
  return bytes ? row(bytes, 'students', 0) : null;
}).filter(Boolean);
const partial = [
  { used: true, sid: 0, name: '', gpa: 0, mid: 0 },
  { used: true, sid: 1, name: '', gpa: 0, mid: 0 },
  { used: true, sid: 1, name: 'ada', gpa: 0, mid: 0 },
  { used: true, sid: 1, name: 'ada', gpa: 39, mid: 0 },
  { used: true, sid: 1, name: 'ada', gpa: 39, mid: 1 }
];
let previousPartial = -1;
for (const expected of partial) {
  const index = studentRows.findIndex(value => JSON.stringify(value) === JSON.stringify(expected));
  assert(index > previousPartial, 'Show reservation followed by each completed field write in order');
  previousPartial = index;
}
assert.deepEqual(physicalRows(last(stages.insert), 'students'), [
  { sid: 1, name: 'ada', gpa: 39, mid: 1 }, { sid: 2, name: 'ben', gpa: 31, mid: 2 },
  { sid: 3, name: 'cyd', gpa: 37, mid: 1 }, { sid: 4, name: 'dee', gpa: 28, mid: 3 },
  { sid: 5, name: 'eli', gpa: 36, mid: 2 }, { sid: 6, name: 'fay', gpa: 34, mid: 1 },
  { sid: 7, name: 'temp', gpa: 40, mid: 1 }
]);
assert.deepEqual(physicalRows(last(stages.insert), 'majors'), [
  { mid2: 1, dept: 'ds' }, { mid2: 2, dept: 'stat' }, { mid2: 3, dept: 'econ' }
]);
assert.deepEqual(fileSizes(last(stages.insert)),
  { 'field_catalog.tbl': 3, 'majors.tbl': 1, 'students.tbl': 2, 'table_catalog.tbl': 1 });
const rollover = stages.insert.frames.find(frame => bytesOf(frame, 'students.tbl', 1));
assert(rollover && bytesOf(rollover, 'students.tbl', 1).every(byte => byte === 0));
const completedFirstBlock = bytesOf(rollover, 'students.tbl', 0, true);
assert.deepEqual(Array.from({ length: 4 }, (_, slot) => row(completedFirstBlock, 'students', slot).name),
  ['ada', 'ben', 'cyd', 'dee'], 'The first block is full before a second block is appended');
assert(stages.insert.frames.some(frame => {
  const left = frame.buffers.find(buffer => buffer.file === 'students.tbl' && buffer.block === 0);
  const right = frame.buffers.find(buffer => buffer.file === 'students.tbl' && buffer.block === 1);
  return left && right && left.pins === 0 && right.pins === 1;
}), 'Rollover releases block 0 and pins block 1');

// DELETE changes exactly the flag byte at block1/slot2; record payload survives.
const beforeDelete = bytesOf(last(stages.insert), 'students.tbl', 1);
const afterDelete = bytesOf(last(stages.delete), 'students.tbl', 1);
assert.deepEqual(afterDelete.map((byte, offset) => byte === beforeDelete[offset] ? null : offset).filter(offset => offset !== null), [56]);
assert.equal(int(beforeDelete, 56), 1);
assert.equal(int(afterDelete, 56), 0);
assert.deepEqual(row(afterDelete, 'students', 2), { used: false, sid: 7, name: 'temp', gpa: 40, mid: 1 });
assert.deepEqual(afterDelete.slice(60, 84), beforeDelete.slice(60, 84));
assert.deepEqual(bytesOf(last(stages.insert), 'students.tbl', 0), bytesOf(last(stages.delete), 'students.tbl', 0));
assert.deepEqual(physicalRows(last(stages.delete), 'students').map(value => value.sid), [1, 2, 3, 4, 5, 6]);
assert.deepEqual(fileSizes(last(stages.delete)), fileSizes(last(stages.insert)), 'Deleting never shifts slots or truncates blocks');
const deferredDelete = stages.delete.frames.find(frame => {
  const ram = bytesOf(frame, 'students.tbl', 1, true);
  return ram && int(ram, 56) === 0 && int(bytesOf(frame, 'students.tbl', 1), 56) === 1;
});
assert(deferredDelete, 'Deleted flag becomes visible in memory before flushing to disk');

// SELECT is read-only at every instruction and projects only live qualifying rows.
assert.deepEqual(last(stages.select).output, ['ada', 'cyd', 'eli']);
assert.deepEqual(stages.select.frames.filter(frame => frame.event === 'predicate').map(frame => frame.locals.predicate),
  [true, false, true, false, true, false], 'Selection tests six live students and never evaluates the deleted row');
const selectStart = first(stages.select);
for (const frame of stages.select.frames) {
  assert.deepEqual(frame.files, selectStart.files);
  assert.equal(frame.counts.writes, selectStart.counts.writes);
  assert(frame.buffers.every(buffer => !buffer.dirty));
  for (const buffer of frame.buffers.filter(buffer => buffer.file !== null)) {
    assert.deepEqual(buffer.bytes, bytesOf(frame, buffer.file, buffer.block));
  }
  assert.deepEqual(frame.output, ['ada', 'cyd', 'eli'].slice(0, frame.output.length));
}
assert(stages.select.frames.some(frame => frame.focus?.file === 'students.tbl' && frame.focus.block === 1 && frame.focus.slot === 2),
  'SELECT exposes the flag probe which skips the deleted slot');

// The exact same payload loads in a browser without require/module.
const browser = {};
vm.runInNewContext(fs.readFileSync(sourcePath, 'utf8'), browser);
assert.deepEqual(JSON.parse(JSON.stringify(browser.StatementTraces)), data);
console.log('Statement traces: catalog bytes, partial writes, rollover, deferred flush, deletion, SELECT and stage continuity passed.');
