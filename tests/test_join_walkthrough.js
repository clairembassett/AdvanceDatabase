'use strict';

// Run with: node tests/test_join_walkthrough.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const modelPath = path.join(__dirname, '../labs/lab-04/join-walkthrough-model.js');
const { tables, buildTrace } = require(modelPath);
const trace = buildTrace();
const events = kind => trace.filter(frame => frame.event === kind);
const reads = field => trace.filter(frame => frame.access && frame.access.field === field);
const last = trace.at(-1);

function assertFrozen(value) {
  if (value && typeof value === 'object') {
    assert(Object.isFrozen(value), 'Replay data must be deeply immutable');
    Object.values(value).forEach(assertFrozen);
  }
}

assertFrozen(tables);
assertFrozen(trace);
assert.deepEqual(buildTrace(), trace, 'Reset generates exactly the same trace');
assert.notEqual(buildTrace()[0].left, trace[0].left, 'Traces never share mutable snapshot state');
assert.throws(() => { trace[0].counts.pairs = 99; }, TypeError);
assert.throws(() => { last.output[0][0] = 'changed'; }, TypeError);

assert.deepEqual(last.output, [['ada', 'ds'], ['cyd', 'ds'], ['eli', 'stat']]);
assert.deepEqual(last.counts, { pairs: 18, outputs: 3, rootCalls: 4, rewinds: 7 });
assert.equal(trace.filter(frame => frame.done).length, 1);
assert(last.done && !last.left.pinned && !last.right.pinned);
assert.equal(last.pair, null);
assert.equal(last.left.row, null);
assert.equal(last.right.row, null);
assert.equal(last.stack.length, 0);

// Nested-loop order is left-major, including rejected candidate pairs.
assert.deepEqual(events('pair').map(frame => [frame.pair.name, frame.pair.dept]),
  ['ada', 'ben', 'cyd', 'dee', 'eli', 'fay'].flatMap(name => ['ds', 'stat', 'econ'].map(dept => [name, dept])));
assert.equal(events('join-check').length, 18);
assert.equal(events('join-check').filter(frame => frame.predicate.join).length, 6);
assert.equal(events('gpa-check').length, 6);
assert.equal(events('reject').length, 15);
assert.equal(reads('mid').length, 18);
assert.equal(reads('mid2').length, 18);
assert.equal(reads('gpa').length, 6, 'Short-circuit AND must skip GPA on mismatched majors');
assert.equal(reads('name').length, 3);
assert.equal(reads('dept').length, 3);
assert(reads('gpa').every(frame => frame.predicate.join === true));
assert(events('join-check').filter(frame => !frame.predicate.join).every(frame => frame.predicate.gpa === null));
const calls = label => events('call').filter(frame => frame.direction === 'down' && frame.stack.at(-1) === label);
assert.equal(calls('ProductScan.next()').length, 19, '18 candidates followed by the first exhausted return');
assert.equal(calls('TableScan(students).next()').length, 7, 'Six live students plus EOF, including initial positioning');
assert.equal(calls('TableScan(majors).next()').length, 24, 'Three live majors and EOF for each student');
assert.equal(calls('plan.next()').length, 4);

// Field reads use the current USED slot and the catalog's actual byte offsets.
for (const frame of trace.filter(frame => frame.access)) {
  const access = frame.access;
  const table = tables[access.side];
  const field = table.fields.find(item => item.name === access.field);
  const scan = access.side === 'students' ? frame.left : frame.right;
  assert(scan.pinned && scan.row);
  assert.deepEqual([access.block, access.slot], [scan.block, scan.slot]);
  assert.equal(access.byteOffset, access.slot * table.slotSize + field.offset);
  assert.equal(access.offset, field.offset);
  assert.equal(access.size, field.size);
  assert.equal(access.value, table.blocks[access.block][access.slot].row[access.field]);
  assert(table.blocks[access.block][access.slot].used);
  assert(frame.stack.some(label => label.startsWith('ProductScan.get_val')));
  assert(frame.stack.some(label => label.startsWith('TableScan(' + access.side + ').get_val')));
  assert(frame.stack.at(-1).startsWith('RecordPage.get_'));
}
assert.deepEqual(reads('gpa').find(frame => frame.access.value === 36).access,
  { side: 'students', block: 1, slot: 0, field: 'gpa', offset: 20, byteOffset: 20, size: 4, value: 36 });
assert.deepEqual(reads('dept').find(frame => frame.access.value === 'stat').access,
  { side: 'majors', block: 0, slot: 1, field: 'dept', offset: 8, byteOffset: 28, size: 12, value: 'stat' });

const deleted = trace.filter(frame => frame.probe && frame.probe.side === 'students' && frame.probe.block === 1 && frame.probe.slot === 2);
assert.equal(deleted.length, 1);
assert.equal(deleted[0].probe.used, false);
assert.equal(deleted[0].probe.slot * tables.students.slotSize, 56);
assert(!trace.some(frame => frame.pair && frame.pair.name === 'temp'), 'Deleted slot bytes never become a candidate');
assert.equal(trace.filter(frame => frame.probe && frame.probe.side === 'students').length, 8);
assert.equal(trace.filter(frame => frame.probe && frame.probe.side === 'majors').length, 36);

// Rewinding reads the first student before positioning the right input.
const firstStudent = trace.findIndex(frame => frame.event === 'table-row' && frame.actor === 'students');
const firstMajorRewind = trace.findIndex(frame => frame.event === 'rewind' && frame.actor === 'majors');
assert(firstStudent < firstMajorRewind);
assert.deepEqual([trace[firstMajorRewind].left.slot, trace[firstMajorRewind].right.slot], [0, -1]);
const majorRewinds = events('rewind').filter(frame => frame.actor === 'majors');
assert.equal(majorRewinds.length, 7);
assert(majorRewinds.every(frame => frame.right.block === 0 && frame.right.slot === -1 && frame.right.pinned));
const rollover = trace.findIndex((frame, index) => index && frame.left.block === 1 && trace[index - 1].left.block === 0);
assert(rollover > 0);
assert.equal(trace[rollover - 1].left.pinned, false, 'Release block 0 before pinning block 1');
assert.equal(trace[rollover].left.pinned, true);
assert.equal(trace[rollover].left.slot, -1);
assert.equal(events('pin').filter(frame => cursorFor(frame, frame.actor).pinned).length, 9,
  'Nine pin operations after the two initial constructor pins');
assert.equal(events('pin').filter(frame => !cursorFor(frame, frame.actor).pinned).length, 9);
assert.equal(events('close').filter(frame => frame.actor === 'students' || frame.actor === 'majors').length, 2,
  'Closing balances the two remaining constructor pins');

function cursorFor(frame, side) { return side === 'students' ? frame.left : frame.right; }

// Root output boundaries preserve current cursors until get_val has finished.
assert.deepEqual(events('output').map(frame => [frame.counts.rootCalls, frame.counts.pairs]), [[1, 1], [2, 7], [3, 14]]);
for (const frame of events('output')) {
  assert(frame.left.pinned && frame.right.pinned);
  assert(frame.pair && frame.predicate.join && frame.predicate.gpa);
  assert.equal(frame.pair.name, frame.left.row.name);
  assert.equal(frame.pair.dept, frame.right.row.dept);
  assert.deepEqual(frame.output.at(-1), [frame.pair.name, frame.pair.dept]);
}
const rootEOF = trace.findIndex(frame => frame.event === 'exhausted' && frame.actor === 'project');
assert(rootEOF > 0);
assert.deepEqual([trace[rootEOF].left.block, trace[rootEOF].left.slot, trace[rootEOF].right.block, trace[rootEOF].right.slot], [1, -1, 0, -1]);
assert(trace[rootEOF].left.pinned && trace[rootEOF].right.pinned, 'EOF does not itself release pins');
assert.equal(trace[rootEOF].pair, null);
assert(trace.slice(rootEOF).every(frame => frame.counts.rootCalls === 4 && frame.counts.pairs === 18));
assert(!trace.slice(rootEOF).some(frame => frame.event === 'probe'), 'The caller must stop at the first False');

for (const frame of trace) {
  assert(['caller', 'project', 'select', 'product', 'students', 'majors'].includes(frame.actor));
  assert(['down', 'up', 'local'].includes(frame.direction));
  if (frame.pair) {
    assert(frame.left.row && frame.right.row);
    assert.deepEqual(frame.pair, Object.assign({}, frame.left.row, frame.right.row));
  }
}

const browser = {};
vm.runInNewContext(fs.readFileSync(modelPath, 'utf8'), browser);
assert.equal(browser.JoinWalkthrough.tables.students.slotSize, 28);
assert.equal(browser.JoinWalkthrough.buildTrace().at(-1).counts.outputs, 3);
console.log('Join walkthrough: nested-loop order, slot probes, field routing, short-circuit reads, and replay checks passed.');
