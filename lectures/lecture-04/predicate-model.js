/* Line-by-line predicate evaluation for Lecture 4. No timers or DOM dependencies. */
(function () {
  'use strict';

  const STUDENTS = [
    { name: 'ada', gpa: 39, mid: 1 }, { name: 'ben', gpa: 31, mid: 2 },
    { name: 'cyd', gpa: 37, mid: 2 }, { name: 'dee', gpa: 28, mid: 1 },
    { name: 'eli', gpa: 36, mid: 3 }, { name: 'fay', gpa: 34, mid: 2 },
  ];
  const MAJORS = [{ mid2: 1, dept: 'cs' }, { mid2: 2, dept: 'stat' }, { mid2: 3, dept: 'econ' }];
  const PRODUCT = STUDENTS.flatMap(student => MAJORS.map(major => ({ ...student, ...major })));
  const OPS = { '>': (lhs, rhs) => lhs > rhs, '=': (lhs, rhs) => lhs === rhs };
  const PRESETS = {
    p1: { rows: STUDENTS, terms: [['gpa', '>', 35]] },
    p2: { rows: STUDENTS, terms: [['gpa', '>', 35], ['mid', '=', 2]] },
    p3: { rows: PRODUCT, terms: [['mid', '=', { field: 'mid2' }], ['gpa', '>', 35]] },
  };

  function isField(rhs) { return rhs !== null && typeof rhs === 'object' && typeof rhs.field === 'string'; }
  function formatRhs(rhs) { return isField(rhs) ? `F(${JSON.stringify(rhs.field)})` : JSON.stringify(rhs); }
  function formatTerm([field, op, rhs]) { return `(${JSON.stringify(field)}, ${JSON.stringify(op)}, ${formatRhs(rhs)})`; }
  function rowLabel(row) { return row.dept ? `(${row.name}, ${row.dept})` : row.name; }

  function createDemo(key = 'p3') {
    let currentKey, preset, rowIndex, termIndex, stage, termStates;
    let lhsVal, rhsVal, comparison, checked, passed, log;
    const terminal = () => stage === 'accept' || stage === 'reject';

    function snapshot() {
      return {
        key: currentKey,
        row: { ...preset.rows[rowIndex] }, rowIndex, rowCount: preset.rows.length,
        terms: preset.terms.map(([field, op, rhs]) => [field, op, isField(rhs) ? { ...rhs } : rhs]),
        termIndex, stage, termStates: [...termStates], lhsVal, rhsVal, comparison,
        checked, passed, log: log.map(entry => ({ ...entry })),
        finished: terminal() && rowIndex === preset.rows.length - 1,
      };
    }

    function prepareRow() {
      termIndex = 0;
      stage = 'ready';
      termStates = preset.terms.map(() => 'pending');
      lhsVal = null;
      rhsVal = null;
      comparison = null;
    }

    function reset(nextKey = currentKey) {
      if (!Object.prototype.hasOwnProperty.call(PRESETS, nextKey)) throw new RangeError(`Unknown predicate preset: ${nextKey}`);
      currentKey = nextKey;
      preset = PRESETS[currentKey];
      rowIndex = 0;
      checked = 0;
      passed = 0;
      log = [];
      prepareRow();
      return snapshot();
    }

    function startTerm() {
      stage = 'term';
      termStates[termIndex] = 'current';
      lhsVal = null;
      rhsVal = null;
      comparison = null;
    }

    function finishRow(accepted) {
      stage = accepted ? 'accept' : 'reject';
      const skipped = accepted ? 0 : preset.terms.length - termIndex - 1;
      if (!accepted) {
        for (let index = termIndex + 1; index < termStates.length; index += 1) termStates[index] = 'skipped';
      }
      checked += 1;
      if (accepted) passed += 1;
      log.push({ label: rowLabel(preset.rows[rowIndex]), passed: accepted, failedTerm: accepted ? null : termIndex + 1, skipped });
    }

    function step() {
      if (terminal()) return snapshot();
      const row = preset.rows[rowIndex];
      const [field, op, rhs] = preset.terms[termIndex];
      switch (stage) {
        case 'ready': startTerm(); break;
        case 'term': lhsVal = row[field]; stage = 'lhs'; break;
        case 'lhs': rhsVal = isField(rhs) ? row[rhs.field] : rhs; stage = 'rhs'; break;
        case 'rhs':
          comparison = OPS[op](lhsVal, rhsVal);
          termStates[termIndex] = comparison ? 'true' : 'false';
          stage = 'compare';
          break;
        case 'compare':
          if (!comparison) finishRow(false);
          else if (termIndex === preset.terms.length - 1) finishRow(true);
          else { termIndex += 1; startTerm(); }
          break;
      }
      return snapshot();
    }

    function nextRow() {
      if (terminal() && rowIndex < preset.rows.length - 1) {
        rowIndex += 1;
        prepareRow();
      }
      return snapshot();
    }

    reset(key);
    return { snapshot, step, nextRow, reset };
  }

  const api = { createDemo, formatTerm, formatRhs };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.PredicateDemoModel = api;
})();
