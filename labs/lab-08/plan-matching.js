/* Record a student's matches. Correct answers are checked by the autograder. */
(() => {
  'use strict';
  const keys = ['SEQ_SCAN', 'FILTERS', 'PROJECTION', 'CROSS_PRODUCT'];
  const choices = ['ProductScan', 'TableScan', 'ProjectScan', 'SelectScan'];
  const version = 'lab08-plan-mapping-v1';
  const storageKey = version;

  function validate(answers) {
    const selected = keys.map(key => answers[key] || '');
    const count = selected.filter(Boolean).length;
    const invalid = selected.some(value => value && !choices.includes(value));
    const duplicates = [...new Set(selected.filter((value, index) => value && selected.indexOf(value) !== index))];
    return { count, invalid, duplicates, ready: count === keys.length && !invalid && !duplicates.length };
  }

  function serialize(answers) {
    if (!validate(answers).ready) throw new Error('Choose each of the four operators once.');
    return [
      '# Lab 8: DuckDB to microdb operator matching',
      'format=' + version,
      ...keys.map(key => key + '=' + answers[key]),
      ''
    ].join('\n');
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { validate, serialize };
  if (typeof document === 'undefined') return;
  const root = document.getElementById('ml-query-plans');
  if (!root) return;
  const form = root.querySelector('#plan-match-form');
  const selects = [...form.querySelectorAll('[data-plan-operator]')];
  const download = root.querySelector('#plan-match-download');
  const reset = root.querySelector('#plan-match-reset');
  const status = root.querySelector('#plan-match-status');
  const answers = () => Object.fromEntries(selects.map(select => [select.dataset.planOperator, select.value]));

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    selects.forEach(select => {
      const value = saved && saved[select.dataset.planOperator];
      if (choices.includes(value)) select.value = value;
    });
  } catch (_) { /* The matching exercise also works without browser storage. */ }

  function render() {
    const current = answers();
    const state = validate(current);
    selects.forEach(select => {
      const duplicate = state.duplicates.includes(select.value);
      select.setAttribute('aria-invalid', String(duplicate));
      select.closest('.plan-match-row').classList.toggle('has-duplicate', duplicate);
    });
    download.disabled = !state.ready;
    reset.disabled = state.count === 0;
    status.textContent = state.duplicates.length
      ? 'Use each operator once. You selected ' + state.duplicates.join(', ') + ' more than once.'
      : state.ready
        ? '4 of 4 matched. Ready to download your selections.'
        : state.count + ' of 4 matched. Choose all four matches to enable the download.';
    try { localStorage.setItem(storageKey, JSON.stringify(current)); } catch (_) { /* Optional persistence. */ }
  }

  selects.forEach(select => { select.disabled = false; select.addEventListener('change', render); });
  // Keep native select shortcuts (including P) out of the page's presentation controls.
  form.addEventListener('keydown', event => event.stopPropagation());
  form.addEventListener('submit', event => event.preventDefault());
  reset.addEventListener('click', () => {
    selects.forEach(select => { select.value = ''; });
    render();
    selects[0].focus();
  });
  download.addEventListener('click', () => {
    if (!validate(answers()).ready) { render(); return; }
    window.LabBase.downloadBlob('plan_mapping.txt', serialize(answers()), 'text/plain;charset=utf-8');
    status.textContent = 'Save plan_mapping.txt, then submit it to the plan-matching autograder.';
  });
  render();
})();
