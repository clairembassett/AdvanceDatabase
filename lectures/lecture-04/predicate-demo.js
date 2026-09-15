/* Connect the predicate trace model to Lecture 4's code and operand visual. */
(function () {
  'use strict';
  const root = document.getElementById('viz-pred');
  if (!root || root.dataset.predicateInitialized) return;
  root.dataset.predicateInitialized = 'true';
  const { createDemo, formatTerm, formatRhs } = window.PredicateDemoModel;
  const demo = createDemo();
  const $ = id => document.getElementById('pd-' + id);
  const codeLines = Array.from(root.querySelectorAll('.pd-code .code-step'));
  const terminal = state => state.stage === 'accept' || state.stage === 'reject';
  const bool = value => value ? 'True' : 'False';
  const element = (tag, cls, text) => {
    const node = document.createElement(tag);
    node.className = cls;
    node.textContent = text;
    return node;
  };

  function explanation(state) {
    const [field, op, rhs] = state.terms[state.termIndex];
    const term = state.termIndex + 1;
    const skipped = state.terms.length - term;
    switch (state.stage) {
      case 'ready': return 'The scan is already on this row. Press Step code to start is_satisfied(scan). Reading fields does not move the scan.';
      case 'term': return `Term ${term}: unpack ${formatTerm(state.terms[state.termIndex])} into field, op, and rhs. Each term must pass because they are joined by AND.`;
      case 'lhs': return `Read the left value: scan.get_val("${field}") returns ${state.lhsVal} from the current row. Save it in lhs_val.`;
      case 'rhs': return rhs && rhs.field
        ? `rhs is F("${rhs.field}"). The wrapper stores the name "${rhs.field}"; scan.get_val(rhs.name) now reads ${state.rhsVal} from that field in the same row. Save it in rhs_val.`
        : `rhs is the literal ${formatRhs(rhs)}. isinstance(rhs, F) is False, so use rhs directly: rhs_val = ${state.rhsVal}. No field lookup is needed on the right.`;
      case 'compare': return `OPS["${op}"] compares ${state.lhsVal} and ${state.rhsVal}: ${bool(state.comparison)}. ` + (state.comparison
        ? `The condition "if not True" is False, so skip return False. ${term < state.terms.length ? 'The next step starts the next term.' : 'All terms passed; the next step reaches return True.'}`
        : 'The condition "if not False" is True, so the next step enters the branch and returns False.');
      case 'reject': return `Return False: reject this row because term ${term} failed. ` + (skipped
        ? `${skipped} later term${skipped === 1 ? ' is' : 's are'} skipped, including ${state.terms.slice(term).map(t => `the ${t[0]} lookup`).join(' and ')}. `
        : 'There are no later terms. ') + (state.finished ? 'Every input row has now been checked.' : 'Press Next row when you are ready.');
      case 'accept': return 'Return True: every term passed, so SelectScan can keep this row. ' + (state.finished ? 'Every input row has now been checked.' : 'Press Next row when you are ready.');
    }
  }

  function render(state) {
    const [field, op, rhs] = state.terms[state.termIndex];
    const unpacked = state.stage !== 'ready';
    const isF = !!(rhs && rhs.field);
    const leftRead = state.lhsVal !== null;
    const rightRead = state.rhsVal !== null;
    const done = terminal(state);

    ['p1', 'p2', 'p3'].forEach(key => {
      $(key).classList.toggle('primary', key === state.key);
      $(key).setAttribute('aria-pressed', String(key === state.key));
    });
    $('step').disabled = done;
    $('finish').disabled = done;
    $('next').disabled = !done || state.finished;
    $('rowno').textContent = `· ${state.rowIndex + 1} of ${state.rowCount}`;
    $('source').textContent = state.key === 'p3'
      ? `ProductScan: students(${state.row.name}) + majors(${state.row.dept}) → one combined row`
      : `TableScan: the current students row is ${state.row.name}.`;

    const terms = [];
    state.terms.forEach((term, index) => {
      if (index) terms.push(element('span', 'pd-and', 'AND'));
      const status = state.termStates[index];
      const chip = element('span', 'pd-term ' + status, formatTerm(term));
      chip.appendChild(element('small', '', ({ pending: 'not checked', current: 'checking now', true: 'True', false: 'False', skipped: 'skipped — no lookups' })[status]));
      terms.push(chip);
    });
    $('terms').replaceChildren(...terms);
    $('row').replaceChildren(...Object.entries(state.row).map(([name, value]) => {
      const left = leftRead && name === field;
      const right = rightRead && isF && name === rhs.field;
      const chip = element('span', 'pd-field' + (left ? ' is-left' : '') + (right ? ' is-right' : ''), `${name} = ${value}`);
      chip.setAttribute('role', 'group');
      chip.setAttribute('aria-label', `${name} = ${value}${left ? ', read into lhs_val' : ''}${right ? ', read into rhs_val' : ''}`);
      if (state.key === 'p3') chip.appendChild(element('small', '', name === 'mid2' || name === 'dept' ? 'majors' : 'students'));
      return chip;
    }));
    $('unpack').textContent = unpacked ? `field = "${field}" · op = "${op}" · rhs = ${formatRhs(rhs)}` : 'No term unpacked yet.';
    $('lhs-source').textContent = unpacked ? `scan.get_val("${field}")` : 'waiting for a field';
    $('rhs-source').textContent = unpacked ? (isF ? `scan.get_val("${rhs.field}")` : `literal ${formatRhs(rhs)}`) : 'waiting for rhs';
    $('lhs-value').textContent = leftRead ? String(state.lhsVal) : '—';
    $('rhs-value').textContent = rightRead ? String(state.rhsVal) : '—';
    $('left').classList.toggle('is-read', leftRead);
    $('right').classList.toggle('is-read', rightRead);
    $('operator').textContent = unpacked ? (op === '=' ? '==' : op) : '?';
    $('branch').textContent = !unpacked ? 'The right side may be a literal or an F wrapper.' : !rightRead
      ? (isF ? `F("${rhs.field}") holds a field name. Its value has not been read yet.` : `${formatRhs(rhs)} is a literal. It has not been assigned to rhs_val yet.`)
      : (isF ? `isinstance(rhs, F) → True → read the field named rhs.name ("${rhs.field}").` : `isinstance(rhs, F) → False → use the literal ${formatRhs(rhs)} directly.`);
    $('comparison').textContent = state.comparison === null
      ? 'Values flow into OPS[op](lhs_val, rhs_val).'
      : `${state.lhsVal} ${op === '=' ? '==' : op} ${state.rhsVal} → ${bool(state.comparison)}`;
    $('comparison').className = 'pd-comparison' + (state.comparison === null ? '' : ' ' + String(state.comparison));
    codeLines.forEach(line => {
      const active = line.dataset.pdLine === state.stage;
      line.classList.toggle('pd-executing', active);
      line.setAttribute('aria-current', active ? 'step' : 'false');
    });
    $('code-status').textContent = state.stage === 'ready' ? '· not started' : done ? `· returned ${bool(state.stage === 'accept')}` : '· outlined line just executed';
    $('eval').textContent = explanation(state);
    $('count').textContent = `· ${state.passed} of ${state.checked} passed${state.finished ? ' · complete' : ''}`;
    $('log').replaceChildren(...state.log.map(entry => element('div', entry.passed ? 'pass' : 'rej', entry.passed
      ? `✓ ${entry.label}: every term true → keep row`
      : `✗ ${entry.label}: term ${entry.failedTerm} false → skip row${entry.skipped ? `; ${entry.skipped} term${entry.skipped === 1 ? '' : 's'} skipped` : ''}`)));
  }

  ['p1', 'p2', 'p3'].forEach(key => $(key).addEventListener('click', () => render(demo.reset(key))));
  $('step').addEventListener('click', () => render(demo.step()));
  $('next').addEventListener('click', () => render(demo.nextRow()));
  $('reset').addEventListener('click', () => render(demo.reset()));
  $('finish').addEventListener('click', () => {
    let state = demo.snapshot();
    while (!terminal(state)) state = demo.step();
    render(state);
  });

  // Keep native button, details, and code-line keyboard use out of slide navigation.
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape' && event.target.closest('button, summary, .code-step')) event.stopPropagation();
  });
  const panel = root.querySelector('.pd-code .code-explain-panel');
  const defaultPanel = panel.textContent;
  codeLines.forEach(line => {
    line.tabIndex = 0;
    const explain = () => { panel.textContent = line.dataset.explain; };
    line.addEventListener('focus', explain);
    line.addEventListener('click', explain);
    line.addEventListener('blur', () => { panel.textContent = defaultPanel; });
  });
  render(demo.snapshot());
})();
