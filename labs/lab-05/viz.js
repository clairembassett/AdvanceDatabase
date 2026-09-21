/* Lab 5 — The SQL Front End · widgets: an in-browser microdb REPL mirror. */

/* ---------------- Glossary ---------------- */
(function () {
  const GLOSSARY = {
    'repl': {
      title: 'REPL',
      body: "<p>Read–Eval–Print Loop: read an input, evaluate it, print the result, and repeat. The provided <code>microdb.py</code> reads SQL statements and passes them to <code>db.execute()</code>. The interactive Python prompt and PostgreSQL’s <code>psql</code> offer similar workflows.</p>",
    },
    'recursive-descent': {
      title: 'Recursive descent',
      body: "<p>A parsing technique in which functions implement grammar rules. Each function consumes the tokens for its rule and calls other rule functions for nested parts. The complete supplied parser illustrates this approach. Lab 5 walks through SELECT parsing and the planner before the query experiments.</p>",
    },
    'ast': {
      title: 'AST (abstract syntax tree)',
      body: "<p>An abstract syntax tree represents the structure of parsed input without retaining every detail of its spelling. Microdb’s <code>QueryData</code>, <code>InsertData</code>, and <code>CreateData</code> are simple structured descriptions passed from the parser to later processing stages.</p>",
    },
    'token': {
      title: 'Token',
      body: "<p>A unit produced by the lexer, represented here as a kind and value, such as <code>(ID, students)</code> or <code>(NUM, 35)</code>. The parser reads these tokens. A quoted string such as <code>'from'</code> is a STR token, distinct from the FROM keyword.</p>",
    },
    'sql-injection': {
      title: 'SQL injection',
      body: "<p>An attack in which untrusted input changes the structure of a SQL statement. It can occur when an application concatenates input directly into query text. Parameterized queries keep values separate from SQL syntax so the database treats them as data.</p>",
    },
  };
  if (window.LabBase && LabBase.initGlossary) LabBase.initGlossary(GLOSSARY);
  if (window.LabBase && LabBase.initAnnotatedCode) LabBase.initAnnotatedCode();
})();

/* ---------------- In-browser microdb mirror ---------------- */
(function () {
  const root = document.getElementById('viz-repl');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const screen = $('rp-screen'), input = $('rp-input');

  const KEYWORDS = new Set(['select', 'from', 'where', 'and', 'insert', 'into',
                            'values', 'create', 'table', 'int', 'varchar']);
  let tables = {};        // name -> {fields: [names], rows: [dicts]}

  function lex(sql) {
    sql = sql.trim();
    const re = /\s*(?:(\d+)|'([^']*)'|([A-Za-z_][A-Za-z0-9_]*)|([(),=<>*;]))/y;
    const toks = []; let pos = 0;
    while (pos < sql.length) {
      re.lastIndex = pos;
      const m = re.exec(sql);
      if (!m) throw new Error(`cannot read SQL at: ${sql.slice(pos, pos + 15)}`);
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

  function execute(sql) {
    const toks = lex(sql);
    let i = 0;
    const peek = () => toks[i] || ['EOF', null];
    const next = () => toks[i++] || ['EOF', null];
    const match = (k, v) => peek()[0] === k && (v === undefined || peek()[1] === v);
    const expect = (k, v) => {
      if (!match(k, v)) throw new Error(`expected ${JSON.stringify(v ?? k)}, found ${JSON.stringify(peek()[1])}`);
      return next()[1];
    };

    const finish = () => {
      if (match('PUNCT', ';')) next();
      expect('EOF');
    };
    const literal = () => {
      if (match('NUM') || match('STR')) return next()[1];
      throw new Error(`expected a number or string, found ${JSON.stringify(peek()[1])}`);
    };

    if (match('KEYWORD', 'create')) {
      next(); expect('KEYWORD', 'table');
      const name = expect('ID');
      expect('PUNCT', '(');
      const fields = [];
      while (true) {
        fields.push(expect('ID'));
        if (match('KEYWORD', 'int')) next();
        else { expect('KEYWORD', 'varchar'); expect('PUNCT', '('); expect('NUM'); expect('PUNCT', ')'); }
        if (match('PUNCT', ',')) { next(); continue; }
        break;
      }
      expect('PUNCT', ')');
      finish();
      tables[name] = { fields, rows: [] };
      return `table ${name} created`;
    }
    if (match('KEYWORD', 'insert')) {
      next(); expect('KEYWORD', 'into');
      const name = expect('ID');
      if (!tables[name]) throw new Error(`no such table in catalog: '${name}'`);
      expect('KEYWORD', 'values'); expect('PUNCT', '(');
      const vals = [literal()];
      while (match('PUNCT', ',')) { next(); vals.push(literal()); }
      expect('PUNCT', ')');
      finish();
      if (vals.length !== tables[name].fields.length) throw new Error('wrong number of inserted values');
      const row = {};
      tables[name].fields.forEach((f, k) => row[f] = vals[k]);
      tables[name].rows.push(row);
      return `1 row into ${name}`;
    }
    expect('KEYWORD', 'select');
    let fields;
    if (match('PUNCT', '*')) { next(); fields = null; }
    else { fields = [expect('ID')]; while (match('PUNCT', ',')) { next(); fields.push(expect('ID')); } }
    expect('KEYWORD', 'from');
    const tnames = [expect('ID')];
    while (match('PUNCT', ',')) { next(); tnames.push(expect('ID')); }
    for (const t of tnames) if (!tables[t]) throw new Error(`no such table in catalog: '${t}'`);
    const terms = [];
    if (match('KEYWORD', 'where')) {
      next();
      while (true) {
        const f = expect('ID');
        const op = expect('PUNCT');
        if (!['=', '<', '>'].includes(op)) throw new Error('expected =, < or >');
        let rhs;
        if (match('NUM') || match('STR')) rhs = next()[1];
        else rhs = { field: expect('ID') };
        terms.push([f, op, rhs]);
        if (match('KEYWORD', 'and')) { next(); continue; }
        break;
      }
    }
    finish();
    // naive plan: fold products, filter, project — exactly the lab recipe
    let rows = tables[tnames[0]].rows.map(r => ({ ...r }));
    for (const t of tnames.slice(1)) {
      const out = [];
      for (const l of rows) for (const r of tables[t].rows) out.push({ ...r, ...l });
      rows = out;
    }
    rows = rows.filter(r => terms.every(([f, op, rhs]) => {
      const a = r[f], b = typeof rhs === 'object' ? r[rhs.field] : rhs;
      return op === '=' ? a === b : op === '>' ? a > b : a < b;
    }));
    const cols = fields || tables[tnames[0]].fields.concat(tnames.slice(1).flatMap(t => tables[t].fields));
    if (!rows.length) return '(no rows)';
    const w = {};
    cols.forEach(c => w[c] = Math.max(c.length, ...rows.map(r => String(r[c]).length)));
    const line = xs => xs.map((x, k) => String(x).padEnd(w[cols[k]])).join('  ');
    return [line(cols), line(cols.map(c => '-'.repeat(w[c]))),
            ...rows.map(r => line(cols.map(c => r[c])))].join('\n');
  }

  function print(cls, text) {
    const line = document.createElement('div');
    line.className = cls;
    line.textContent = text;
    screen.appendChild(line);
    screen.scrollTop = screen.scrollHeight;
  }

  function run(sql) {
    print('in', 'microdb> ' + sql);
    try {
      print('out', execute(sql));
    } catch (e) {
      print('err', 'syntax error: ' + e.message);
    }
  }

  function reset() {
    tables = {};
    screen.innerHTML = '';
    print('note', 'microdb — type SQL, or use the presets. (Browser mirror; the real one persists to ./mydb)');
  }

  $('rp-p1').addEventListener('click', () => {
    run("CREATE TABLE students (sid INT, name VARCHAR(8), gpa INT, mid INT)");
    run("CREATE TABLE majors (mid2 INT, dept VARCHAR(8))");
    [[1, 'ada', 39, 1], [2, 'ben', 31, 2], [3, 'cyd', 37, 1],
     [4, 'dee', 28, 3], [5, 'eli', 36, 2], [6, 'fay', 34, 1]].forEach(([s, n, g, m]) =>
      run(`INSERT INTO students VALUES (${s}, '${n}', ${g}, ${m})`));
    [[1, 'cs'], [2, 'stat'], [3, 'econ']].forEach(([m, d]) =>
      run(`INSERT INTO majors VALUES (${m}, '${d}')`));
  });
  $('rp-p2').addEventListener('click', () => run("SELECT name FROM students WHERE gpa > 35"));
  $('rp-p3').addEventListener('click', () =>
    run("SELECT name, dept FROM students, majors WHERE mid = mid2 AND gpa > 35"));
  $('rp-p4').addEventListener('click', () => run("SELECT name students"));
  $('rp-clear').addEventListener('click', reset);
  $('rp-run').addEventListener('click', () => { if (input.value.trim()) { run(input.value.trim()); input.value = ''; } });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim()) { run(input.value.trim()); input.value = ''; }
  });

  reset();
})();
