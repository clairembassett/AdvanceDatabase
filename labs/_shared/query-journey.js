/* Shared query journey: SQL → plan → buffer pool → disk → result rows.
   Requires #viz-query-journey and its qj-* elements; used by Lectures 1 and 4. */
(function () {
  const root = document.getElementById('viz-query-journey');
  if (!root || root.dataset.queryJourneyInitialized) return;
  root.dataset.queryJourneyInitialized = 'true';

  const STUDENTS = [
    { id: 1, name: 'ada', gpa: 39, block: 0 },
    { id: 2, name: 'ben', gpa: 31, block: 0 },
    { id: 3, name: 'cyd', gpa: 37, block: 0 },
    { id: 4, name: 'dee', gpa: 28, block: 1 },
    { id: 5, name: 'eli', gpa: 36, block: 1 },
    { id: 6, name: 'fay', gpa: 34, block: 1 },
  ];
  const GPA_CUT = 35; // WHERE gpa > 3.5  (stored ×10)

  const $ = id => root.querySelector(`#${id}`);
  const msg = $('qj-msg'), sqlEl = $('qj-sql'), tokEl = $('qj-tokens'),
        planEl = $('qj-plan'), statsEl = $('qj-stats'), resEl = $('qj-results'),
        againBtn = $('qj-again');

  // Fill disk blocks with the pinned rows.
  [0, 1].forEach(b => {
    const holder = root.querySelector(`.qj-rows[data-block="${b}"]`);
    holder.innerHTML = STUDENTS.filter(s => s.block === b)
      .map(s => `<div class="qj-row" data-id="${s.id}"><span>${s.id}</span>` +
                `<span class="r-name">${s.name}</span><span>${(s.gpa / 10).toFixed(1)}</span></div>`)
      .join('');
  });

  const TOKENS = [
    ['SELECT', 1], ['name', 0], ['FROM', 1], ['students', 0],
    ['WHERE', 1], ['gpa', 0], ['>', 0], ['3.5', 0],
  ];
  tokEl.innerHTML = TOKENS
    .map(([t, kw]) => `<span class="qj-token${kw ? ' kw' : ''}">${t}</span>`).join('');

  let diskReads = 0, rowsIn = 0, rowsOut = 0, highlightTimer = null;

  function planNode(op, on) {
    root.querySelectorAll('.qj-plan-node').forEach(n =>
      n.classList.toggle('active', on && n.dataset.op === op));
  }
  function finishPlan() {
    planNode('project', true);
    highlightTimer = setTimeout(() => {
      planNode('', false);
      highlightTimer = null;
    }, 600);
  }
  function frame(i, cls, text) {
    const f = $(`qj-frame-${i}`);
    f.classList.remove('hit', 'miss');
    if (cls) f.classList.add(cls);
    if (text !== undefined) f.querySelector('.qj-frame-body').textContent = text;
  }
  function blockGlow(i, on) { $(`qj-block-${i}`).classList.toggle('reading', on); }
  function rowState(id, cls) {
    const r = root.querySelector(`.qj-row[data-id="${id}"]`);
    r.classList.remove('checking', 'pass', 'fail');
    if (cls) r.classList.add(cls);
  }
  function stats() {
    statsEl.textContent = `disk reads: ${diskReads}\nrows examined: ${rowsIn}\nrows returned: ${rowsOut}`;
  }
  function addResult(name) {
    resEl.insertAdjacentHTML('beforeend', `<span class="qj-result-chip">${name}</span>`);
  }

  function checkRows(block) {
    STUDENTS.filter(s => s.block === block).forEach(s => {
      rowsIn += 1;
      const pass = s.gpa > GPA_CUT;
      rowState(s.id, pass ? 'pass' : 'fail');
      if (pass) { rowsOut += 1; addResult(s.name); }
    });
    stats();
  }

  // Each phase: [message, effect]. Cold run then (via Run again) warm run.
  const COLD = [
    ['The query arrives as text — just characters. Nothing has been checked yet.',
      () => { sqlEl.classList.add('on'); }],
    ['The lexer produces tokens and the parser checks their grammar. Lab 5 provides the lexer and asks you to implement the SELECT parser.',
      () => { tokEl.querySelectorAll('.qj-token').forEach(t => t.classList.add('show')); }],
    ['The planner turns the parsed query description into an operator tree. Rows flow from its inputs toward the root.',
      () => { planEl.classList.add('show'); }],
    ['Scan starts. It asks the buffer pool for block 0 — not in any frame: a MISS. The disk must be read.',
      () => { planNode('scan', true); frame(0, 'miss', 'loading…'); blockGlow(0, true); diskReads += 1; stats(); }],
    ['Block 0 is now in frame 0. Select tests each row against gpa > 3.5; Project keeps only name.',
      () => { blockGlow(0, false); frame(0, null, 'students.tbl · block 0'); planNode('select', true); checkRows(0); }],
    ['Scan needs block 1 — also a MISS. Second (and last) trip to disk.',
      () => { planNode('scan', true); frame(1, 'miss', 'loading…'); blockGlow(1, true); diskReads += 1; stats(); }],
    ['Block 1 lands in frame 1; its rows are tested the same way.',
      () => { blockGlow(1, false); frame(1, null, 'students.tbl · block 1'); planNode('select', true); checkRows(1); }],
    ['Done: 3 of 6 rows survive the filter. Total cost: 2 disk reads. Now press “Run again” — the buffer pool is warm.',
      () => { finishPlan(); againBtn.hidden = false; }],
  ];
  const WARM = [
    ['On this second run, microdb parses and plans the same query again.',
      () => { sqlEl.classList.add('on'); planEl.classList.add('show'); }],
    ['Block 0 is still in frame 0. This cache hit avoids a disk read: about 1/250 of the block-access time in our model.',
      () => { frame(0, 'hit'); checkRows(0); }],
    ['Block 1 is also cached, so this request needs no disk read.',
      () => { frame(1, 'hit'); checkRows(1); }],
    ['The query returns the same three rows with zero disk reads. Lab 2 implements the buffer pool that makes this reuse possible.',
      () => { finishPlan(); }],
  ];

  let phases = COLD, idx = -1, timer = null;

  function resetVisuals(keepFrames) {
    if (highlightTimer !== null) { clearTimeout(highlightTimer); highlightTimer = null; }
    againBtn.hidden = true;
    sqlEl.classList.remove('on');
    tokEl.querySelectorAll('.qj-token').forEach(t => t.classList.remove('show'));
    planEl.classList.remove('show');
    planNode('', false);
    STUDENTS.forEach(s => rowState(s.id, null));
    [0, 1].forEach(i => { blockGlow(i, false); });
    if (!keepFrames) { frame(0, null, 'empty'); frame(1, null, 'empty'); }
    else { frame(0, null); frame(1, null); }
    diskReads = 0; rowsIn = 0; rowsOut = 0;
    resEl.innerHTML = '';
    stats();
  }

  function runPhasesUpTo(n) {
    // Re-apply phases 0..n from a clean board (keeps Step/Back simple & correct).
    resetVisuals(phases === WARM);
    for (let i = 0; i <= n && i < phases.length; i++) phases[i][1]();
    msg.textContent = n >= 0 && n < phases.length ? phases[n][0]
      : 'The query arrives as text. Step through to see what the engine does with it.';
  }

  function step(d) {
    idx = Math.max(-1, Math.min(phases.length - 1, idx + d));
    runPhasesUpTo(idx);
  }
  function stopPlay() { if (timer) { clearInterval(timer); timer = null; $('qj-play').textContent = '▶ Play'; } }

  $('qj-step').addEventListener('click', () => { stopPlay(); step(1); });
  $('qj-back').addEventListener('click', () => { stopPlay(); step(-1); });
  $('qj-reset').addEventListener('click', () => {
    stopPlay(); phases = COLD; idx = -1; runPhasesUpTo(-1);
  });
  $('qj-play').addEventListener('click', () => {
    if (timer) { stopPlay(); return; }
    $('qj-play').textContent = '❚❚ Pause';
    timer = setInterval(() => {
      if (idx >= phases.length - 1) { stopPlay(); return; }
      step(1);
    }, 1600);
  });
  againBtn.addEventListener('click', () => {
    stopPlay(); phases = WARM; idx = -1; step(1);
  });

  stats();
})();
