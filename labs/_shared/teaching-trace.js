/* Accessible, timer-free walkthroughs. Shared data also drives the lecture slides. */
(function () {
  'use strict';
  if (!window.CourseTraces) return;
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  document.querySelectorAll('[data-teaching-trace]').forEach((root, index) => {
    const ids = root.dataset.teachingTrace.trim().split(/\s+/);
    if (!ids.length || ids.some(id => !CourseTraces.examples[id])) return;
    let example = CourseTraces.examples[ids[0]], position = 0;
    const prefix = 'teaching-trace-' + index;
    root.classList.add('teaching-trace');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-labelledby', prefix + '-title');
    const title = make('h3', 'trace-title');
    title.id = prefix + '-title';
    const premise = make('p', 'trace-premise');
    const controls = make('div', 'trace-controls');
    const selectorLabel = make('label', '', 'Example');
    selectorLabel.htmlFor = prefix + '-select';
    const selector = make('select');
    selector.id = prefix + '-select';
    ids.forEach(id => {
      const option = make('option', '', CourseTraces.examples[id].title);
      option.value = id;
      selector.append(option);
    });
    if (ids.length > 1) controls.append(selectorLabel, selector);
    const button = (action, label) => {
      const node = make('button', 'btn', label);
      node.type = 'button';
      node.dataset.traceAction = action;
      controls.append(node);
      return node;
    };
    const previous = button('previous', 'Previous');
    const next = button('next', 'Next step');
    next.classList.add('primary');
    const reset = button('reset', 'Reset');
    const status = make('p', 'trace-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    const body = make('div', 'trace-body');
    const source = make('div', 'trace-source');
    const codeLabel = make('p', 'trace-label');
    const code = make('ol', 'trace-code');
    source.append(codeLabel, code);
    const state = make('div', 'trace-state');
    const table = make('table', 'trace-table');
    const caption = make('caption');
    const tbody = make('tbody');
    table.append(caption, tbody);
    const explanation = make('p', 'trace-explanation');
    state.append(table, explanation);
    body.append(source, state);
    const check = make('details', 'trace-check');
    const question = make('summary');
    const answer = make('p');
    check.append(question, answer);
    root.replaceChildren(title, premise, controls, status, body, check);

    function render() {
      const current = example.frames[position];
      title.textContent = example.title;
      premise.textContent = example.premise;
      codeLabel.textContent = example.codeLabel;
      code.replaceChildren(...example.code.map((line, i) => {
        const li = make('li');
        li.append(make('code', '', line));
        if (current.lines.includes(i + 1)) {
          li.className = 'trace-active';
          li.setAttribute('aria-current', 'step');
        }
        return li;
      }));
      caption.textContent = current.label;
      tbody.replaceChildren(...current.rows.map(([name, value]) => {
        const tr = make('tr');
        const th = make('th', '', name);
        th.scope = 'row';
        tr.append(th, make('td', '', value));
        return tr;
      }));
      explanation.textContent = current.explanation;
      question.textContent = 'Check yourself: ' + example.question;
      answer.textContent = example.answer;
      check.open = false;
      previous.disabled = position === 0;
      next.disabled = position === example.frames.length - 1;
      reset.disabled = position === 0;
      status.textContent = 'Step ' + (position + 1) + ' of ' + example.frames.length + ': ' + current.label;
      root.dataset.traceStep = String(position);
      root.dataset.traceExample = example.id;
    }
    function move(delta) {
      const target = Math.max(0, Math.min(example.frames.length - 1, position + delta));
      if (target !== position) { position = target; render(); }
    }
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    reset.addEventListener('click', () => { position = 0; render(); });
    selector.addEventListener('change', () => {
      example = CourseTraces.examples[selector.value];
      position = 0;
      render();
    });
    // Arrow keys work while a navigation button is focused. Leave selects,
    // summaries, and the reading's presentation shortcuts to their owners.
    controls.addEventListener('keydown', event => {
      // The reading's presentation mode also handles letter and arrow keys.
      // Keep those keys native to the selector without advancing the slide.
      if (event.target.tagName === 'SELECT') { event.stopPropagation(); return; }
      if (event.target.tagName !== 'BUTTON' || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    });
    render();
  });
})();
