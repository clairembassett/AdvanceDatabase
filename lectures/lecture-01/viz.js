/* Lecture 1 — Anatomy of a Database · widgets.
   Presentation toggle, TOC tracking, glossary + annotated-code engines
   are owned by ../../labs/_shared/lab-base.js. */

/* ---------------- Pinned toy data (used across the whole course) -------- */
/* students(id, name, gpa×10): rows 1–3 in block 0, rows 4–6 in block 1.   */
const STUDENTS = [
  { id: 1, name: 'ada', gpa: 39, block: 0 },
  { id: 2, name: 'ben', gpa: 31, block: 0 },
  { id: 3, name: 'cyd', gpa: 37, block: 0 },
  { id: 4, name: 'dee', gpa: 28, block: 1 },
  { id: 5, name: 'eli', gpa: 36, block: 1 },
  { id: 6, name: 'fay', gpa: 34, block: 1 },
];

/* ---------------- Glossary ---------------- */
(function () {
  const GLOSSARY = {
    'page': {
      title: 'Block · Page',
      body: '<p>Disks and databases move data in fixed-size chunks, not single bytes, ' +
        'and the chunk gets a different name depending on where it is sitting:</p>' +
        '<svg viewBox="0 0 500 132" role="img" aria-label="A file is an array of fixed-size blocks on disk; one block read into memory is called a page." style="width:100%;height:auto;max-width:520px;display:block;margin:10px 0 6px">' +
        '<title>Block on disk, page in memory</title>' +
        '<text x="6" y="13" font-size="9.5" letter-spacing="0.08em" fill="#6b6459">ON DISK</text>' +
        '<text x="320" y="13" font-size="9.5" letter-spacing="0.08em" fill="#6b6459">IN MEMORY</text>' +
        '<rect x="6" y="22" width="54" height="44" rx="3" fill="#f0eee5" stroke="#c9c3b4"/>' +
        '<rect x="64" y="22" width="54" height="44" rx="3" fill="#fde0d2" stroke="#b14a2e" stroke-width="1.5"/>' +
        '<rect x="122" y="22" width="54" height="44" rx="3" fill="#f0eee5" stroke="#c9c3b4"/>' +
        '<rect x="180" y="22" width="54" height="44" rx="3" fill="#f0eee5" stroke="#c9c3b4"/>' +
        '<text x="33" y="49" font-size="9" text-anchor="middle" fill="#6b6459">block 0</text>' +
        '<text x="91" y="49" font-size="9" text-anchor="middle" fill="#1f1d1a" font-weight="700">block 1</text>' +
        '<text x="149" y="49" font-size="9" text-anchor="middle" fill="#6b6459">block 2</text>' +
        '<text x="207" y="49" font-size="9" text-anchor="middle" fill="#6b6459">block 3</text>' +
        '<line x1="242" y1="44" x2="308" y2="44" stroke="#b14a2e" stroke-width="1.5"/>' +
        '<path d="M308 44 L300 40 L300 48 Z" fill="#b14a2e"/>' +
        '<text x="275" y="36" font-size="9" text-anchor="middle" fill="#b14a2e">read(block 1)</text>' +
        '<text x="275" y="58" font-size="9" text-anchor="middle" fill="#6b6459">one trip</text>' +
        '<rect x="320" y="22" width="120" height="44" rx="3" fill="#fde0d2" stroke="#b14a2e" stroke-width="1.5"/>' +
        '<text x="380" y="46" font-size="10" text-anchor="middle" fill="#1f1d1a" font-weight="700">Page (4096 B)</text>' +
        '<text x="6" y="82" font-size="9.5" fill="#6b6459">students.tbl · an array of fixed-size blocks</text>' +
        '<text x="320" y="82" font-size="9.5" fill="#6b6459">one frame · the same 4096 bytes</text>' +
        '<line x1="6" y1="96" x2="494" y2="96" stroke="#e2ddd0"/>' +
        '<text x="6" y="114" font-size="10" fill="#1f1d1a">Same bytes, two names: <tspan font-weight="700">block</tspan> is its name on disk, <tspan font-weight="700">page</tspan> its name in RAM.</text>' +
        '</svg>' +
        '<p>A <strong>block</strong> is one such chunk <em>on disk</em> (microdb and Postgres ' +
        'default to 4\u20138\u00a0KB); a <strong>page</strong> is that same chunk once it has been ' +
        'read <em>into memory</em>. Because small reads have a substantial fixed access cost, fetching ' +
        'a whole block can make nearby data available for later requests without another ' +
        'storage operation.</p>',
    },
    'buffer-pool': {
      title: 'Buffer pool',
      body: "<p>The database’s cache of file blocks. Each memory frame holds one block. A request is a hit if the block is already present; otherwise the pool loads it into a free frame or reuses an unpinned frame. Lab 2 implements the pool and measures its hit rate.</p>",
    },
    'lru': {
      title: 'LRU eviction',
      body: "<p>Least recently used replacement chooses the unpinned frame whose block was used longest ago. It assumes recently used data is more likely to be needed again. A repeated sequential scan larger than the pool can defeat this policy: every block is evicted before the next request for it. Lab 2 implements and measures this behavior.</p>",
    },
    'wal': {
      title: 'Write-ahead log (WAL)',
      body: "<p>An append-only record of database changes used for recovery. The required log records must become durable before the corresponding changed data pages. Depending on the recovery design, the engine uses the log to redo committed changes or undo incomplete ones. Lab 7 implements transactions and recovery using a provided log manager, then tests recovery after stopping the process.</p>",
    },
    'catalog': {
      title: 'System catalog',
      body: "<p>Tables that describe the database’s tables, fields, types, and other objects. PostgreSQL’s <code>\\dt</code> and <code>\\d</code> commands obtain information from these catalogs. Lab 3 provides a catalog implementation that uses your record layer.</p>",
    },
    'plan': {
      title: 'Query planner · plan',
      body: "<p>The planner turns a query description into an executable tree of operators. It chooses such details as join order and whether to scan a table or use an index. Different valid plans can return the same rows while performing very different amounts of work.</p>",
    },
    'explain': {
      title: 'EXPLAIN',
      body: '<p>A SQL command that asks the engine to <em>show its plan instead of running the ' +
        'query</em>: put <code>EXPLAIN</code> in front of any statement and you get back the ' +
        'operator tree the planner chose, one node per line, each with the row count and cost it ' +
        'estimated. <code>EXPLAIN ANALYZE</code> runs the query as well and prints what actually ' +
        'happened beside those estimates, so you can see where the planner guessed wrong. It is ' +
        'the standard tool for answering “why is this query slow?”, and week 9 is devoted to ' +
        'reading one line by line.</p>',
    },
    'index': {
      title: 'Index',
      body: "<p>A structure that helps locate rows by field values without scanning the entire table. Lab 6 builds a B+ tree. An index can make suitable lookups faster, but takes storage and must be maintained when indexed data changes.</p>",
    },
    'oltp': {
      title: 'OLTP vs OLAP',
      body: '<p><strong>OLTP</strong> (online transaction processing) is the workload an ' +
        'application makes: thousands of small operations a second, each touching a handful of ' +
        'rows, like placing an order or updating a profile. <strong>OLAP</strong> (online ' +
        'analytical processing) is the workload a dashboard or a notebook makes: a few big ' +
        'queries that scan millions of rows but read only two or three columns, like revenue ' +
        'by month.</p>' +
        '<p>Almost every design decision in this course has an OLTP answer and an OLAP answer, ' +
        'starting with the block size in this very table: small blocks suit many little reads, ' +
        'enormous ones suit scans. Act I builds an OLTP engine; week 10 opens Act II by asking ' +
        'what changes when the workload flips.</p>',
    },
    'operator': {
      title: 'Operator (iterator)',
      body: '<p>One stage of query execution — scan, filter (select), project, join — built to a ' +
        'common interface: <em>give me your next row</em>. Operators stack into pipelines: project ' +
        'pulls from select, select pulls from scan, scan pulls from the buffer pool. Week 4 is ' +
        'entirely about this pattern.</p>',
    },
    'acid': {
      title: 'ACID',
      body: "<p>Four transaction properties: <strong>atomicity</strong> groups changes into an all-or-nothing unit; <strong>consistency</strong> preserves declared database constraints; <strong>isolation</strong> controls interactions between concurrent transactions; <strong>durability</strong> preserves committed changes after a crash. Lectures 7–8 examine the mechanisms and isolation levels behind these properties.</p>",
    },
    'fsync': {
      title: 'fsync',
      body: "<p>A system call that requests that a file’s buffered changes be written to durable storage before it returns successfully. Python file buffers must be flushed first. Lab 1 compares write throughput with and without this durability step; the cost depends on the storage system.</p>",
    },
  };
  if (window.LabBase && LabBase.initGlossary) LabBase.initGlossary(GLOSSARY);
  if (window.LabBase && LabBase.initAnnotatedCode) LabBase.initAnnotatedCode();
})();

/* ---------------- Widget: pinned students table ---------------- */
(function () {
  const tbl = document.getElementById('students-table');
  if (!tbl) return;
  let html = '<thead><tr><th>id</th><th>name</th><th>gpa (×10)</th><th></th></tr></thead><tbody>';
  STUDENTS.forEach(s => {
    html += `<tr class="blk${s.block}"><td class="num">${s.id}</td><td>${s.name}</td>` +
            `<td class="num">${s.gpa}</td>` +
            `<td class="blk-tag">block ${s.block}</td></tr>`;
  });
  tbl.innerHTML = html + '</tbody>';
})();

/* ---------------- Widget: universal layer stack ---------------- */
(function () {
  const stack = document.getElementById('ls-stack');
  if (!stack) return;
  const info = document.getElementById('ls-info');
  const LAYERS = [
    { name: 'SQL front end', lab: 'Lab 5 · Sep 24', desc: 'parser · planner',
      detail: '<strong>Job:</strong> turn SQL text into a checked, executable plan tree. ' +
        '<strong>You build:</strong> a SELECT parser and planner using the provided lexer ' +
        '(<code>sql_frontend.py</code>). After this lab, microdb answers real SQL typed at a prompt.' },
    { name: 'Execution engine', lab: 'Lab 4 · Sep 17', desc: 'scan · select · project · join',
      detail: '<strong>Job:</strong> run the plan — a pipeline of operators, each answering “next row?”. ' +
        '<strong>You build:</strong> <code>query_engine.py</code>: SelectScan, ProjectScan, and a nested-loop join. ' +
        '<strong>You measure:</strong> rows examined vs rows returned on the pinned toy queries.' },
    { name: 'Records & catalog', lab: 'Lab 3 · Sep 10', desc: 'rows in pages · schemas · tables about tables',
      detail: '<strong>Job:</strong> impose meaning on raw pages — record layout, schemas, and the system catalog. ' +
        '<strong>You build:</strong> <code>record_manager.py</code>, used by the provided <code>catalog.py</code>. ' +
        'Each field is addressed by its slot position and layout offset.' },
    { name: 'Buffer pool', lab: 'Lab 2 · Sep 3', desc: 'frames · pin/unpin · eviction',
      detail: '<strong>Job:</strong> keep hot blocks in memory so most reads never touch the disk. ' +
        '<strong>You build:</strong> <code>buffer_manager.py</code> with pin/unpin and LRU eviction. ' +
        '<strong>You measure:</strong> hit rates under sequential scans and repeated access to a hot set.' },
    { name: 'File manager', lab: 'Lab 1 · Thu!', desc: 'files as arrays of fixed-size blocks',
      detail: '<strong>Job:</strong> the only code that touches the OS — read/write block k of file f, whole blocks at a time. ' +
        '<strong>You build:</strong> <code>file_manager.py</code>: BlockId, Page, FileManager. ' +
        '<strong>You measure:</strong> what fsync really costs your SSD.' },
    { name: 'Write-ahead log & recovery', lab: 'Lab 7 · Oct 15', side: true, desc: 'logging and recovery for transactions',
      detail: '<strong>Job:</strong> record changes and enforce the ordering needed for crash recovery. ' +
        '<strong>You build:</strong> the transaction methods in <code>transaction.py</code>, then <code>kill -9</code> microdb mid-write and watch it come back. ' +
        'The transaction layer coordinates logging with data-page changes.' },
  ];
  stack.innerHTML = LAYERS.map((l, i) =>
    `<div class="ls-layer${l.side ? ' ls-side' : ''}" data-i="${i}">` +
    `<span class="ls-lab">${l.lab}</span><span class="ls-name">${l.name}</span>` +
    `<span class="ls-desc">${l.desc}</span></div>`).join('');
  stack.querySelectorAll('.ls-layer').forEach(el => {
    el.addEventListener('mouseenter', () => { info.innerHTML = LAYERS[+el.dataset.i].detail; });
  });
})();

/* ---------------- Widget: latency ladder ---------------- */
(function () {
  const holder = document.getElementById('lat-rows');
  if (!holder) return;
  const btn = document.getElementById('lat-human');
  // seconds
  const RUNGS = [
    { name: 'L1 cache hit',                t: 1e-9,   note: '1 ns' },
    { name: 'Main memory (DRAM) read',     t: 100e-9, note: '100 ns' },
    { name: 'NVMe SSD random read',        t: 25e-6,  note: '25 µs' },
    { name: 'Datacenter network round-trip', t: 500e-6, note: '500 µs' },
    { name: 'Spinning-disk seek',          t: 10e-3,  note: '10 ms' },
  ];
  const minL = Math.log10(1e-9), maxL = Math.log10(10e-3);
  const DECADES = maxL - minL;                 // 7 decades, 1 ns .. 10 ms
  const pos = k => 6 + 94 * k / DECADES;       // % across the track, k decades above 1 ns
  // Labelled every other decade so the labels never collide.
  const AXIS = [[0, '1 ns'], [2, '100 ns'], [4, '10 µs'], [6, '1 ms'], [7, '10 ms']];
  const TICKS = [1, 2, 3, 4, 5, 6];            // gridlines; 0 and 7 are the track edges
  function human(t) {
    const s = t / 1e-9; // 1 ns -> 1 s
    if (s < 90) return `${Math.round(s)} s`;
    if (s < 5400) return `${Math.round(s / 60)} min`;
    if (s < 90000) return `${(s / 3600).toFixed(1)} h`;
    if (s < 3.5e6) return `${(s / 86400).toFixed(1)} days`;
    return `${(s / 2.6e6).toFixed(1)} months`;
  }
  const ratio = t => Math.round(t / 1e-9).toLocaleString('en-US') + '×';
  let humanMode = false;
  function render() {
    const axis =
      '<div class="lat-row lat-axis-row"><span class="lat-label"></span>' +
      '<span class="lat-axis">' +
      AXIS.map(([k, label], i) => {
        const cls = i === 0 ? ' first' : (i === AXIS.length - 1 ? ' last' : '');
        return `<i class="lat-atick${cls}" style="left:${pos(k).toFixed(2)}%">${label}</i>`;
      }).join('') +
      '</span><span class="lat-val lat-axis-val">vs L1</span></div>';
    const ticks = TICKS.map(k => `<i class="lat-tick" style="left:${pos(k).toFixed(2)}%"></i>`).join('');
    holder.innerHTML = axis + RUNGS.map(r => {
      const w = 6 + 94 * (Math.log10(r.t) - minL) / DECADES;
      return `<div class="lat-row"><span class="lat-label">${r.name}</span>` +
        `<span class="lat-track">${ticks}<span class="lat-bar" style="width:${w.toFixed(2)}%"></span></span>` +
        `<span class="lat-val">${humanMode ? human(r.t) : r.note}` +
        `<span class="lat-ratio">${ratio(r.t)}</span></span></div>`;
    }).join('');
  }
  btn.addEventListener('click', () => {
    humanMode = !humanMode;
    btn.textContent = `Human scale: ${humanMode ? 'on (1 ns → 1 s)' : 'off'}`;
    render();
  });
  render();
})();

/* ---------------- Widget: endianness ---------------- */
(function () {
  const rows = document.getElementById('en-rows');
  if (!rows) return;
  const input = document.getElementById('en-val');
  const note = document.getElementById('en-note');
  const buf = new ArrayBuffer(4), dv = new DataView(buf);
  const MIN = -2147483648, MAX = 2147483647;
  const hex = b => b.toString(16).toUpperCase().padStart(2, '0');

  function bytesOf(v, little) {
    dv.setInt32(0, v, little);
    return [0, 1, 2, 3].map(i => dv.getUint8(i));
  }
  function render() {
    let v = parseInt(input.value, 10);
    if (!Number.isFinite(v)) v = 0;
    v = Math.max(MIN, Math.min(MAX, v));
    // The least significant byte is at offset 0 little-endian, offset 3 big-endian.
    const defs = [
      { name: 'little-endian', sub: "struct '&lt;i' · x86, ARM, microdb", bytes: bytesOf(v, true), lsb: 0 },
      { name: 'big-endian', sub: "struct '&gt;i' · network order, SQLite headers", bytes: bytesOf(v, false), lsb: 3 },
    ];
    rows.innerHTML = defs.map(d =>
      '<div class="en-row"><div class="en-name">' + d.name +
      '<span class="en-sub">' + d.sub + '</span></div><div class="en-cells">' +
      d.bytes.map((b, i) =>
        '<span class="en-cell' + (i === d.lsb ? ' en-lsb' : '') + '">' +
        '<span class="en-off">byte ' + i + '</span>' +
        '<span class="en-hex">' + hex(b) + '</span></span>').join('') +
      '</div></div>').join('');
    dv.setInt32(0, v, true);              // write the little-endian bytes
    const misread = dv.getInt32(0, false); // read them back as big-endian
    note.innerHTML = 'Write <code>' + v + '</code> little-endian, read those same four bytes ' +
      'as big-endian, and you get <code>' + misread + '</code>' +
      (v === misread ? ' (this value is a palindrome in bytes, so the bug hides completely).'
                     : '. Nothing errors; the number is just wrong.');
  }
  input.addEventListener('input', render);
  document.querySelectorAll('[data-en]').forEach(b =>
    b.addEventListener('click', () => { input.value = b.getAttribute('data-en'); render(); }));
  render();
})();

/* ---------------- Widget: microdb build plan ---------------- */
(function () {
  const stack = document.getElementById('mp-stack');
  if (!stack) return;
  const info = document.getElementById('mp-info');
  const PLAN = [
    { lab: 'Lab 7 · Oct 15', name: 'Transactions & recovery',
      desc: 'WAL · rollback · crash recovery · locks',
      detail: '<strong>Build:</strong> transaction updates, commit, rollback, and restart recovery using a provided log manager. ' +
        '<strong>Measure:</strong> kill microdb mid-transaction; count what survives. (Answer: exactly the committed work.)' },
    { lab: 'Lab 6 · Oct 1', name: 'B+ tree index',
      desc: 'insert · search · range scan · planner hookup',
      detail: '<strong>Build:</strong> an in-memory B+ tree with insert, lookup, and range scanning. ' +
        '<strong>Measure:</strong> lookup and range costs for a table scan versus the index.' },
    { lab: 'Lab 5 · Sep 24', name: 'SQL front end',
      desc: 'lexer · parser · planner',
      detail: '<strong>Build:</strong> a SELECT parser and a simple planner, using the supplied lexer and INSERT parser for ' +
        '<code>SELECT … FROM … WHERE …</code> and <code>INSERT</code>. microdb gets a prompt.' },
    { lab: 'Lab 4 · Sep 17', name: 'Query operators',
      desc: 'select · project · nested-loop join',
      detail: '<strong>Build:</strong> the iterator pipeline — every operator implements next()/get_val(). ' +
        '<strong>Measure:</strong> rows touched by <code>WHERE gpa > 3.5</code> with and without an early filter.' },
    { lab: 'Lab 3 · Sep 10', name: 'Records & catalog',
      desc: 'slotted records · schemas · table files',
      detail: '<strong>Build:</strong> record layouts, record-page operations, and table scans; the catalog is provided. ' +
        '<strong>Measure:</strong> rows per block at different schema widths.' },
    { lab: 'Lab 2 · Sep 3', name: 'Buffer pool',
      desc: 'frames · pin/unpin · LRU',
      detail: '<strong>Build:</strong> the buffer manager: fixed frames, pin/unpin protocol, LRU eviction. ' +
        '<strong>Measure:</strong> hit rate at different pool sizes and under different access patterns.' },
    { lab: 'Lab 1 · Thu Aug 27', name: 'Disk & file manager',
      desc: 'BlockId · Page · FileManager',
      detail: '<strong>Build:</strong> the byte layer — typed reads/writes inside a page, whole-block I/O to disk. ' +
        '<strong>Measure:</strong> buffered vs fsync’d writes per second. Thursday. Bring a charged laptop.' },
  ];
  stack.innerHTML = PLAN.map((l, i) =>
    `<div class="mp-layer" data-i="${i}"><span class="mp-lab">${l.lab}</span>` +
    `<span class="mp-name">${l.name}</span><span class="mp-desc">${l.desc}</span></div>`).join('');
  stack.querySelectorAll('.mp-layer').forEach(el => {
    el.addEventListener('mouseenter', () => { info.innerHTML = PLAN[+el.dataset.i].detail; });
  });
})();
