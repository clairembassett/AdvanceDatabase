'use strict';

// Run with: node tests/test_predicate_demo.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const asset = path.join(__dirname, '../lectures/lecture-04/predicate-model.js');
const { createDemo, formatTerm, formatRhs } = require(asset);
const terminal = state => ['accept', 'reject'].includes(state.stage);

function finishRow(demo) {
  let state = demo.snapshot();
  const row = state.row, rowIndex = state.rowIndex, checked = state.checked;
  for (let count = 0; !terminal(state); count += 1) {
    assert(count < 15, 'The current row must reach an explicit return');
    state = demo.step();
    assert.deepEqual(state.row, row, 'Stepping must not advance the displayed row');
    assert.equal(state.rowIndex, rowIndex);
    assert.equal(state.checked, checked + (terminal(state) ? 1 : 0));
    if (state.stage === 'compare' && !state.comparison) {
      assert(state.termStates.slice(state.termIndex + 1).every(value => value === 'pending'));
      const rejected = demo.step();
      assert.equal(rejected.stage, 'reject');
      assert.equal(rejected.termIndex, state.termIndex, 'A false comparison never evaluates the next term');
      assert.deepEqual([rejected.lhsVal, rejected.rhsVal], [state.lhsVal, state.rhsVal]);
      assert(rejected.termStates.slice(state.termIndex + 1).every(value => value === 'skipped'));
      state = rejected;
    }
  }
  assert.equal(state.checked, checked + 1);
  assert.equal(state.log.length, state.checked);
  assert.deepEqual(demo.step(), state, 'Repeated terminal steps must not recount or clear the row');
  return state;
}

// Field references are resolved only at the RHS line, then compared at the OPS line.
const joined = createDemo();
let state = joined.snapshot();
assert.equal(state.key, 'p3');
assert.equal(state.stage, 'ready');
assert.deepEqual(state.terms, [['mid', '=', { field: 'mid2' }], ['gpa', '>', 35]]);
assert.deepEqual(state.termStates, ['pending', 'pending']);
assert.deepEqual([state.lhsVal, state.rhsVal, state.comparison], [null, null, null]);
assert.deepEqual(joined.nextRow(), state, 'A row cannot be skipped before its terminal result');
state = joined.step();
assert.equal(state.stage, 'term');
assert.deepEqual(state.termStates, ['current', 'pending']);
assert.deepEqual([state.lhsVal, state.rhsVal, state.comparison], [null, null, null]);
state = joined.step();
assert.equal(state.stage, 'lhs');
assert.deepEqual([state.lhsVal, state.rhsVal, state.comparison], [1, null, null]);
state = joined.step();
assert.equal(state.stage, 'rhs');
assert.deepEqual([state.lhsVal, state.rhsVal, state.comparison], [1, 1, null]);
state = joined.step();
assert.equal(state.stage, 'compare');
assert.deepEqual([state.lhsVal, state.rhsVal, state.comparison], [1, 1, true]);
assert.deepEqual(state.termStates, ['true', 'pending']);
state = joined.step();
assert.equal(state.stage, 'term');
assert.equal(state.termIndex, 1);
assert.deepEqual(state.termStates, ['true', 'current']);
assert.deepEqual([state.lhsVal, state.rhsVal, state.comparison], [null, null, null]);
state = joined.step();
assert.deepEqual([state.lhsVal, state.rhsVal], [39, null]);
state = joined.step();
assert.equal(state.stage, 'rhs');
assert.equal(state.rhsVal, 35, 'An unwrapped numeric RHS remains its literal value');
state = finishRow(joined);
assert.equal(state.stage, 'accept');
assert.deepEqual(state.log, [{ label: '(ada, ds)', passed: true, failedTerm: null, skipped: 0 }]);
state = joined.nextRow();
assert.equal(state.rowIndex, 1);
assert.deepEqual([state.row.mid, state.row.mid2], [1, 2]);
state = finishRow(joined);
assert.equal(state.stage, 'reject');
assert.deepEqual(state.termStates, ['false', 'skipped']);
assert.deepEqual(state.log.at(-1), { label: '(ada, stat)', passed: false, failedTerm: 1, skipped: 1 });

// Every preset gives the known results, and the final result stays visible.
for (const [key, rowCount, expectedLabels] of [
  ['p1', 6, ['ada', 'cyd', 'eli']],
  ['p2', 6, ['cyd']],
  ['p3', 18, ['(ada, ds)', '(cyd, stat)', '(eli, econ)']],
]) {
  const demo = createDemo(key);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const initial = demo.snapshot();
    assert.equal(initial.rowIndex, rowIndex);
    assert.equal(initial.rowCount, rowCount);
    assert.equal(initial.finished, false);
    assert.equal(initial.stage, 'ready');
    assert(initial.termStates.every(value => value === 'pending'));
    state = finishRow(demo);
    assert.equal(state.finished, rowIndex === rowCount - 1);
    if (!state.finished) {
      const next = demo.nextRow();
      assert.equal(next.rowIndex, rowIndex + 1);
      assert.deepEqual([next.lhsVal, next.rhsVal, next.comparison], [null, null, null]);
      assert.deepEqual(next.log, state.log);
    }
  }
  assert.equal(state.checked, rowCount);
  assert.equal(state.passed, expectedLabels.length);
  assert.deepEqual(state.log.filter(entry => entry.passed).map(entry => entry.label), expectedLabels);
  assert.deepEqual(demo.nextRow(), state, 'There is no phantom row after the last result');
  assert.deepEqual(demo.step(), state);
  assert.deepEqual(demo.nextRow(), state);
  const fresh = demo.reset();
  assert.equal(fresh.key, key);
  assert.equal(fresh.rowIndex, 0);
  assert.equal(fresh.checked, 0);
  assert.equal(fresh.passed, 0);
  assert.deepEqual(fresh.log, []);
  assert.equal(fresh.finished, false);
  assert.deepEqual(fresh, createDemo(key).snapshot());
}

// A reset can switch modes; callers cannot mutate source data through snapshots.
const mutable = joined.reset('p3');
mutable.row.mid = 100;
mutable.terms[0][2].field = 'not_a_field';
mutable.termStates[0] = 'false';
mutable.log.push({ label: 'changed' });
assert.deepEqual(joined.snapshot(), createDemo('p3').snapshot());
state = joined.reset('p1');
assert.equal(state.key, 'p1');
assert.equal(state.rowCount, 6);
assert.deepEqual(state.terms, [['gpa', '>', 35]]);
assert.throws(() => joined.reset('unknown'), /Unknown predicate preset/);
assert.deepEqual(joined.snapshot(), state, 'An invalid reset must leave current state intact');
assert.throws(() => createDemo('unknown'), /Unknown predicate preset/);
assert.equal(formatRhs({ field: 'mid2' }), 'F("mid2")');
assert.equal(formatRhs(35), '35');
assert.equal(formatTerm(['mid', '=', { field: 'mid2' }]), '("mid", "=", F("mid2"))');
assert.equal(formatTerm(['gpa', '>', 35]), '("gpa", ">", 35)');

const browser = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(asset, 'utf8'), browser);
assert.equal(typeof browser.window.PredicateDemoModel.createDemo, 'function');
assert.equal(browser.window.PredicateDemoModel.createDemo().snapshot().stage, 'ready');
console.log('Predicate model: line stages, field/literal RHS, short-circuiting, all three result sets, frozen terminal rows, resets, and exports passed.');
