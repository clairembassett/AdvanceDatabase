/* Lecture 5 — From SQL Text to Plan · widgets. */

/* ---------------- Glossary ---------------- */
(function () {
  const GLOSSARY = {
    'pushdown': {
      title: 'Pushdown (selection pushdown)',
      body: "<p>Applying a filter earlier in a plan when the rewrite preserves the result. For our inner join, each single-table condition can filter its own input before the product. The join condition then examines fewer candidate pairs. Lecture 9 explains how statistics help a planner compare such alternatives; implementing that optimizer is optional.</p>",
    },
    'predicate': {
      title: 'Predicate',
      body: '<p>The condition in a WHERE clause: the part that decides whether a row is kept. In microSQL a predicate is one or more terms joined by AND, and each term compares a field to a number, a string, or another field, such as gpa &gt; 35. The parser stores the predicate as plain data inside QueryData. The planner later wraps the scan tree in a SelectScan that evaluates the predicate against each row and passes through only the rows for which it is true. Lab 4 already built SelectScan; this week you build the code that reads a predicate out of the text.</p>',
    },
    'token': {
      title: 'Token',
      body: '<p>The smallest meaningful unit of a statement after the lexer has split it up: a keyword, a name, a number, a quoted string, or a punctuation mark. Each token is a (kind, value) pair, so the word students becomes (ID, students) and the number 35 becomes (NUM, 35). The lexer produces the token list by scanning the characters left to right; the parser reads only that list and never looks at raw characters again. That split is what keeps a quoted string like &#39;from&#39; from ever being mistaken for the keyword FROM.</p>',
    },
    'front-end': {
      title: 'Front end (of a language system)',
      body: "<p>The stages that interpret a statement’s text and prepare it for execution. In this lecture the lexer produces tokens, the parser produces a structured statement description, and the planner builds the scan tree that the execution engine will run.</p>",
    },
    'bnf': {
      title: 'BNF (Backus–Naur form)',
      body: "<p>Backus–Naur form (BNF) describes a language using grammar rules and alternatives. Extended Backus–Naur form (EBNF), used here, adds convenient notation such as braces for repetition and square brackets for optional items. These rules describe which token sequences the parser accepts.</p><p>In <code>fieldlist := * | field { , field }</code>, <code>|</code> separates alternatives: choose either <code>*</code> or a comma-separated field list. The <code>*</code> is a literal SQL token requesting all columns, as in <code>SELECT * FROM students</code>. The bar is grammar notation and does not appear in the SQL query.</p>",
    },
    'ast': {
      title: 'AST (abstract syntax tree)',
      body: '<p>An abstract syntax tree represents a statement’s structure. For <code>SELECT name FROM students WHERE gpa &gt; 35</code>, it records:</p><pre><code>SelectQuery\n  fields: name\n  tables: students\n  predicate: &gt;(Field(gpa), Number(35))</code></pre><p>Lab 5 stores this structure in <code>QueryData</code>, using lists for fields and tables and a <code>Predicate</code> for the comparison. The planner then builds a separate tree of scan operators that can produce rows. <a href="#ast-example">See the full AST and its scan tree.</a></p>',
    },
    'repl': {
      title: 'REPL',
      body: "<p>Read–Eval–Print Loop: read input, execute it, print the result, then repeat. Python and PostgreSQL’s psql provide interactive prompts. The supplied <code>microdb.py</code> runs this loop around the engine’s execute method.</p>",
    },
    'reserved-word': {
      title: 'Reserved word',
      body: "<p>A word assigned a special role in the language. microdb’s lexer labels words in its keyword set as KEYWORD, so they cannot satisfy a parser rule that expects an ID. Production SQL systems often provide quoted identifiers and more detailed rules for which keywords can be names.</p>",
    },
  };
  if (window.LabBase && LabBase.initGlossary) LabBase.initGlossary(GLOSSARY);
  if (window.LabBase && LabBase.initAnnotatedCode) LabBase.initAnnotatedCode();
})();

/* ---------------- SQL pipeline widget ---------------- */
(function () {
  const root = document.getElementById('viz-sql');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const msg = $('sq-msg'), stages = $('sq-stages');

  const KEYWORDS = new Set(['select', 'from', 'where', 'and', 'insert', 'into',
                            'values', 'create', 'table', 'int', 'varchar']);

  function lex(sql) {
    const re = /\s*(?:(\d+)|'([^']*)'|([A-Za-z_][A-Za-z0-9_]*)|([(),=<>*]))/y;
    const toks = [];
    let pos = 0;
    while (pos < sql.length) {
      re.lastIndex = pos;
      const m = re.exec(sql);
      if (!m) break;
      if (m[1] !== undefined) toks.push(['NUM', Number(m[1])]);
      else if (m[2] !== undefined) toks.push(['STR', m[2]]);
      else if (m[3] !== undefined) {
        const w = m[3].toLowerCase();
        toks.push([KEYWORDS.has(w) ? 'KEYWORD' : 'ID', w]);
      } else toks.push(['PUNCT', m[4]]);
      pos = re.lastIndex;
    }
    return toks;
  }

  function stage(title, bodyHtml, err) {
    return `<div class="sq-stage${err ? ' err' : ''}">` +
      `<div class="sq-stage-title">${title}</div>${bodyHtml}</div>`;
  }

  function tokChips(toks) {
    return '<div class="sq-toks">' + toks.map(([k, v]) => {
      const cls = k === 'KEYWORD' ? 'kw' : (k === 'NUM' || k === 'STR') ? 'lit' : '';
      return `<span class="sq-tok ${cls}">${k} ${v}</span>`;
    }).join('') + '</div>';
  }

  // A tiny mirror of the lab's parser, enough for the demo queries.
  function parse(toks) {
    let i = 0;
    const peek = () => toks[i] || ['EOF', null];
    const next = () => toks[i++] || ['EOF', null];
    const match = (k, v) => peek()[0] === k && (v === undefined || peek()[1] === v);
    const expect = (k, v) => {
      if (!match(k, v)) throw new Error(`expected ${JSON.stringify(v ?? k)}, found ${JSON.stringify(peek()[1])}`);
      return next()[1];
    };
    const term = () => {
      const f = expect('ID');
      const op = expect('PUNCT');
      if (!'=<>'.includes(op)) throw new Error(`expected =, < or > after '${f}'`);
      if (match('NUM') || match('STR')) return [f, op, next()[1]];
      if (match('ID')) return [f, op, { field: next()[1] }];
      throw new Error(`expected a value or field after '${op}', found ${JSON.stringify(peek()[1])}`);
    };
    if (match('KEYWORD', 'insert')) {
      expect('KEYWORD', 'insert'); expect('KEYWORD', 'into');
      const table = expect('ID');
      expect('KEYWORD', 'values'); expect('PUNCT', '(');
      const vals = [next()[1]];
      while (match('PUNCT', ',')) { next(); vals.push(next()[1]); }
      expect('PUNCT', ')');
      return { kind: 'InsertData', table, values: vals };
    }
    expect('KEYWORD', 'select');
    let fields;
    if (match('PUNCT', '*')) { next(); fields = ['*']; }
    else { fields = [expect('ID')]; while (match('PUNCT', ',')) { next(); fields.push(expect('ID')); } }
    expect('KEYWORD', 'from');
    const tables = [expect('ID')];
    while (match('PUNCT', ',')) { next(); tables.push(expect('ID')); }
    let predicate = null;
    if (match('KEYWORD', 'where')) {
      next();
      predicate = [term()];
      while (match('KEYWORD', 'and')) { next(); predicate.push(term()); }
    }
    return { kind: 'QueryData', fields, tables, predicate };
  }

  function showTerm([f, op, rhs]) {
    return `${f} ${op} ${typeof rhs === 'object' ? 'F(' + rhs.field + ')' : JSON.stringify(rhs)}`;
  }

  function describe(d) {
    if (d.kind === 'InsertData') {
      return `InsertData(table=${d.table}, values=[${d.values.join(', ')}])`;
    }
    return `QueryData(\n  fields    = [${d.fields.join(', ')}]\n` +
      `  tables    = [${d.tables.join(', ')}]\n` +
      `  predicate = ${d.predicate ? d.predicate.map(showTerm).join(' AND ') : 'None'}\n)`;
  }

  function planText(d) {
    if (d.kind === 'InsertData') return `TableScan(${d.table}).insert()  +  set each field`;
    let lines = [], pad = 0;
    const push = t => lines.push('  '.repeat(pad) + t);
    if (d.fields[0] !== '*') { push(`ProjectScan[${d.fields.join(', ')}]`); pad++; }
    if (d.predicate) { push(`SelectScan[${d.predicate.map(showTerm).join(' AND ')}]`); pad++; }
    if (d.tables.length === 2) {
      push('ProductScan'); pad++;
      push(`TableScan(${d.tables[0]})`);
      push(`TableScan(${d.tables[1]})`);
    } else {
      push(`TableScan(${d.tables[0]})`);
    }
    return lines.join('\n');
  }

  function run(sql, note) {
    const toks = lex(sql);
    let html = stage('1 · text', `<div class="sq-body">${sql}</div>`) +
               stage('2 · tokens (lexer)', tokChips(toks));
    try {
      const d = parse(toks);
      html += stage('3 · description (parser)', `<div class="sq-body">${describe(d)}</div>`);
      html += stage('4 · plan (planner)', `<div class="sq-body">${planText(d)}</div>`);
      msg.innerHTML = note;
    } catch (e) {
      html += stage('3 · ParseError', `<div class="sq-body">${e.message}</div>`, true);
      msg.innerHTML = 'The parser reports the token it expected and the token it found instead.';
    }
    stages.innerHTML = html;
  }

  $('sq-q1').addEventListener('click', () =>
    run("SELECT name FROM students WHERE gpa > 35",
        'Compare the SQL text, tokens, parsed description, and execution plan.'));
  $('sq-q2').addEventListener('click', () =>
    run("SELECT name, dept FROM students, majors WHERE mid = mid2 AND gpa > 35",
        'Note the description: <code>mid = F(mid2)</code> — an ID on the right became a field reference. The parser records the comparison as field-to-field rather than field-to-constant.'));
  $('sq-q3').addEventListener('click', () =>
    run("INSERT INTO students VALUES (7, 'gil', 33)",
        'INSERT parses with the provided worked-example method — read it before Thursday.'));
  $('sq-q4').addEventListener('click', () =>
    run("SELECT name students",
        ''));
  msg.textContent = 'Pick a statement to push through the pipeline.';
})();

/* ---------------- Grammar → provided INSERT parser ---------------- */
(function () {
  const root = document.getElementById('viz-insert');
  if (!root || !window.InsertParserTrace || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const trace = window.InsertParserTrace;
  const $ = id => root.querySelector('#rd-' + id);
  const fragments = [...root.querySelectorAll('[data-rd-rule]')];
  let example, steps, step = 0;
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function render() {
    const state = steps[step], tokens = [...example.tokens, ['EOF', null]];
    $('count').textContent = 'Step ' + (step + 1) + ' of ' + steps.length;
    $('back').disabled = step === 0;
    $('next').disabled = step === steps.length - 1;
    $('cursor').textContent = state.pos + '/' + example.tokens.length + ' tokens consumed · Next unread: ' + trace.tokenText(tokens[state.pos]);
    $('tokens').replaceChildren(...tokens.map(([kind, value], index) => {
      const chip = el('span', 'rd-token' + (index < state.pos ? ' used' : '') + (index === state.pos ? ' current' : ''));
      chip.append(el('small', '', kind), el('code', '', kind === 'STR' ? trace.repr(value) : value === null ? 'end' : value));
      chip.setAttribute('aria-label', (index < state.pos ? 'Consumed: ' : index === state.pos ? 'Next unread: ' : 'Unread: ') + trace.tokenText([kind, value]));
      return chip;
    }));
    for (const button of fragments) {
      button.disabled = !steps.some(s => s.rule === button.dataset.rdRule);
      if (state.rule === button.dataset.rdRule) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    }
    $('insert-rule').classList.toggle('active', state.method === 'parse_insert' && state.stack.length > 0);
    $('literal-rule').classList.toggle('active', state.method === '_parse_literal');
    $('method').textContent = state.method + '()';
    $('code').replaceChildren(...trace.code[state.method].map((line, index) => {
      const row = el('span', 'rd-code-line', line);
      if (index === state.line) row.setAttribute('aria-current', 'step');
      return row;
    }));
    $('stack').replaceChildren(...(state.stack.length ? state.stack.map(name => el('li', '', name + '()')) : [el('li', '', 'Returned to caller')]));
    const effects = { call: 'Call', inspect: 'Inspect · cursor stays', consume: 'Consume · cursor advances', return: 'Return', error: 'Error · cursor stays' };
    $('action').textContent = effects[state.effect] + ' — ' + state.action;
    $('note').textContent = state.note;
    $('status').classList.toggle('error', !!state.error);
    $('data').textContent = state.result
      ? 'InsertData(table=' + trace.repr(state.table) + ', values=[' + state.values.map(trace.repr).join(', ') + '])\nNo rows written: this is the parser’s output.'
      : 'table = ' + (state.table === null ? '…' : trace.repr(state.table)) + '\nvalues = [' + state.values.map(trace.repr).join(', ') + ']' + (state.error ? '\nNo InsertData returned.' : '\nDescription in progress; no rows written.');
  }
  function choose() {
    example = trace.cases[$('example').value]; steps = trace.build(example.tokens); step = 0;
    $('sql').textContent = example.sql; render();
  }
  function move(delta) { step = Math.max(0, Math.min(steps.length - 1, step + delta)); render(); }
  $('example').addEventListener('change', choose);
  $('next').addEventListener('click', () => move(1));
  $('back').addEventListener('click', () => move(-1));
  $('reset').addEventListener('click', () => { step = 0; render(); });
  fragments.forEach(button => button.addEventListener('click', () => {
    const target = steps.findIndex(s => s.rule === button.dataset.rdRule);
    if (target >= 0) { step = target; render(); }
  }));
  root.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.stopPropagation();
    if (event.target.matches('select, pre')) return;
    event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
  });
  choose();
})();

/* ---------------- A parse, frame by frame ---------------- */
(function () {
  const tokensEl = document.getElementById('tr-tokens');
  if (!tokensEl) return;

  const TOKENS = [
    ['KEYWORD', 'select'], ['ID', 'name'], ['PUNCT', ','], ['ID', 'gpa'],
    ['KEYWORD', 'from'], ['ID', 'students'], ['KEYWORD', 'where'],
    ['ID', 'gpa'], ['PUNCT', '>'], ['NUM', '35'],
  ];
  // Each step: tokens consumed so far, call stack, one-line note, QueryData fields.
  const STEPS = [
    { c: 0, stack: [], note: 'dispatch peeks: KEYWORD "select" — route to parse_query',
      data: {} },
    { c: 1, stack: ['parse_query'], note: 'expect(KEYWORD, "select") — consumed and discarded',
      data: {} },
    { c: 2, stack: ['parse_query'], note: 'field list: expect(ID) returns "name"',
      data: { fields: ['name'] } },
    { c: 4, stack: ['parse_query'], note: 'match(",") — consume it and expect another ID: "gpa" (the { , } idiom)',
      data: { fields: ['name', 'gpa'] } },
    { c: 5, stack: ['parse_query'], note: 'no comma next — field list done. expect(KEYWORD, "from")',
      data: { fields: ['name', 'gpa'] } },
    { c: 6, stack: ['parse_query'], note: 'table list: expect(ID) returns "students"',
      data: { fields: ['name', 'gpa'], tables: ['students'] } },
    { c: 7, stack: ['parse_query'], note: 'match(KEYWORD, "where") — yes: consume it and CALL _parse_predicate',
      data: { fields: ['name', 'gpa'], tables: ['students'] } },
    { c: 7, stack: ['parse_query', '_parse_predicate'], note: '_parse_predicate needs at least one term — CALL _parse_term',
      data: { fields: ['name', 'gpa'], tables: ['students'] } },
    { c: 8, stack: ['parse_query', '_parse_predicate', '_parse_term'], note: '_parse_term: expect(ID) returns "gpa" (left side)',
      data: { fields: ['name', 'gpa'], tables: ['students'] } },
    { c: 9, stack: ['parse_query', '_parse_predicate', '_parse_term'], note: 'expect(PUNCT) returns ">"',
      data: { fields: ['name', 'gpa'], tables: ['students'] } },
    { c: 10, stack: ['parse_query', '_parse_predicate', '_parse_term'], note: 'expect(NUM) returns 35 — term complete, RETURN Term(gpa > 35)',
      data: { fields: ['name', 'gpa'], tables: ['students'] } },
    { c: 10, stack: ['parse_query', '_parse_predicate'], note: 'no AND next — predicate complete, RETURN Predicate([gpa > 35])',
      data: { fields: ['name', 'gpa'], tables: ['students'], predicate: 'gpa > 35' } },
    { c: 10, stack: ['parse_query'], note: 'tokens exhausted — RETURN the finished QueryData. The stack unwinds; the description remains.',
      data: { fields: ['name', 'gpa'], tables: ['students'], predicate: 'gpa > 35', done: true } },
  ];

  let step = 0;
  const note = document.getElementById('tr-note');
  const stackEl = document.getElementById('tr-stack');
  const dataEl = document.getElementById('tr-data');

  function render() {
    const s = STEPS[step];
    tokensEl.innerHTML = TOKENS.map(([kind, val], i) =>
      `<span class="tr-tok${i < s.c ? ' used' : ''}${i === s.c ? ' cursor' : ''}">` +
      `<span class="tr-kind">${kind}</span>${val}</span>`).join('');
    stackEl.innerHTML = s.stack.length
      ? s.stack.map((f, i) => `<div class="tr-frame" style="margin-left:${i}em">${f}()</div>`).join('')
      : '<div class="tr-frame empty">(empty — parsing not started or finished)</div>';
    const d = s.data;
    dataEl.innerHTML =
      `<div class="tr-field">fields: ${d.fields ? '[' + d.fields.join(', ') + ']' : '…'}</div>` +
      `<div class="tr-field">tables: ${d.tables ? '[' + d.tables.join(', ') + ']' : '…'}</div>` +
      `<div class="tr-field">predicate: ${d.predicate || '…'}</div>` +
      (d.done ? '<div class="tr-field done">→ handed to the planner, untouched by execution</div>' : '');
    note.textContent = `step ${step + 1}/${STEPS.length}: ${s.note}`;
    document.getElementById('tr-step').disabled = step === STEPS.length - 1;
    document.getElementById('tr-back').disabled = step === 0;
  }
  document.getElementById('tr-step').addEventListener('click', () => { if (step < STEPS.length - 1) { step++; render(); } });
  document.getElementById('tr-back').addEventListener('click', () => { if (step > 0) { step--; render(); } });
  document.getElementById('tr-reset').addEventListener('click', () => { step = 0; render(); });
  render();
})();
