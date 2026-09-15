/* Lecture 4 — The Iterator Model · widgets. */

/* ---------------- Glossary ---------------- */
(function () {
  const GLOSSARY = {
    'relational-algebra': {
      title: 'Relational algebra',
      body: "<p>Operations on relations, including selection, projection, product, union, difference, and rename. Algebraic identities establish when two operator expressions return the same result. For example, a filter referring only to one input of a product can be applied to that input first. An optimizer uses such valid rewrites to compare plans without changing the query’s meaning.</p>",
    },
    'tombstone': {
      title: 'Tombstone',
      body: "<p>In microdb, a deleted slot whose flag is EMPTY while its former field bytes may remain. TableScan skips EMPTY slots when looking for the next live row. A later insertion can reuse the slot without moving neighboring records.</p>",
    },
    'materialization': {
      title: 'Materialization',
      body: "<p>Computing and storing an intermediate result in memory or on disk so it can be used later. This can consume substantial space and delay the first output, but it can also avoid recomputing an input that will be scanned repeatedly. Streaming operators instead produce results as their callers request them.</p>",
    },
    'hash-aggregation': {
      title: 'Hash aggregation',
      body: "<p>A way to compute <code>GROUP BY</code> results using a hash table, much like a Python dictionary. To count students by major, use each major as a key and keep a running count. Reading <code>cs, stat, cs</code> produces <code>cs: 2, stat: 1</code>.</p><p>Any later row could change a group’s count, so final results usually wait until all input has been read. This example stores one counter per group; more groups require more memory.</p>",
    },
    'duck-typing': {
      title: 'Duck typing',
      body: "<p>Using an object through the methods it provides, without requiring it to inherit from a particular class. microdb operators expect the scan methods <code>before_first</code>, <code>next</code>, <code>get_val</code>, <code>has_field</code>, and <code>close</code>. This permits small in-memory test scans. Missing methods are discovered when called unless separate validation is added.</p>",
    },
    'cartesian-product': {
      title: 'Cartesian product',
      body: "<p>A product pairs every row from one input with every row from the other. For example, 2 students and 3 majors produce 6 student–major pairs, before checking whether a student belongs to a major. SQL’s <code>CROSS JOIN</code> expresses this operation. <code>ProductScan</code> produces the pairs one at a time; a filter then keeps those that satisfy the join condition.</p>",
    },
    'predicate-pushdown': {
      title: 'Predicate pushdown',
      body: "<p>Moving a filter closer to its input data when that preserves the query’s result. A condition on students alone can filter students before an inner join. Reducing input rows can reduce work in later operators. Which filters can move depends on their field references and the operators involved.</p>",
    },
    'cursor': {
      title: 'Cursor',
      body: "<p>A position used to continue reading a sequence of rows. TableScan records a block number and slot number. SQL cursors expose related incremental-fetch behavior to applications, although the engine may still materialize data internally.</p>",
    },
  };
  if (window.LabBase && LabBase.initGlossary) LabBase.initGlossary(GLOSSARY);
  if (window.LabBase && LabBase.initAnnotatedCode) LabBase.initAnnotatedCode();
})();

/* ---------------- Pull-a-row widget ---------------- */
(function () {
  const root = document.getElementById('viz-pull');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const msg = $('pl-msg'), tree = $('pl-tree'), log = $('pl-log'), out = $('pl-out');

  const ROWS = [
    { name: 'ada', gpa: 3.9 }, { name: 'ben', gpa: 3.1 }, { name: 'cyd', gpa: 3.7 },
    { name: 'dee', gpa: 2.8 }, { name: 'eli', gpa: 3.6 }, { name: 'fay', gpa: 3.4 },
  ];

  tree.innerHTML =
    `<div class="pl-node" data-n="P">Project<span>name</span></div>` +
    `<div class="pl-arrow">↑ rows &nbsp;·&nbsp; asks ↓</div>` +
    `<div class="pl-node" data-n="S">Select<span>gpa &gt; 3.5</span></div>` +
    `<div class="pl-arrow">↑ rows &nbsp;·&nbsp; asks ↓</div>` +
    `<div class="pl-node" data-n="T">Scan<span>students</span></div>`;

  let cursor, delivered, running;

  function reset() {
    cursor = 0; delivered = 0; running = false;
    log.innerHTML = ''; out.innerHTML = '';
    msg.textContent = 'Press pull — the Project asks the Select, which asks the Scan…';
    flash(null);
  }

  function flash(n, cls) {
    tree.querySelectorAll('.pl-node').forEach(el => {
      el.classList.remove('asking', 'giving');
      if (n && el.dataset.n === n) el.classList.add(cls);
    });
  }

  function addLog(cls, text) {
    log.insertAdjacentHTML('beforeend', `<div class="${cls}">${text}</div>`);
    log.scrollTop = log.scrollHeight;
  }

  function pull() {
    if (running) return;
    if (cursor >= ROWS.length && delivered >= 3) {
      msg.innerHTML = 'The Scan is exhausted — next() returns <strong>False</strong> all the way up. The query is over.';
      addLog('rej', 'Project.next() → False (everything exhausted)');
      return;
    }
    running = true;
    // Build the event script for this one top-level pull.
    const events = [
      ['P', 'asking', 'ask',  'Project.next() — asks Select'],
      ['S', 'asking', 'ask',  '&nbsp;&nbsp;Select.next() — asks Scan'],
    ];
    let produced = null;
    while (cursor < ROWS.length) {
      const r = ROWS[cursor];
      cursor += 1;
      events.push(['T', 'giving', 'give', `&nbsp;&nbsp;&nbsp;&nbsp;Scan → row (${r.name}, ${r.gpa})`]);
      if (r.gpa > 3.5) {
        produced = r;
        events.push(['S', 'giving', 'give', `&nbsp;&nbsp;Select: ${r.gpa} &gt; 3.5 ✓ — pass it up`]);
        events.push(['P', 'giving', 'deliver', `Project → delivers name = "${r.name}"`]);
        break;
      }
      events.push(['S', 'asking', 'rej', `&nbsp;&nbsp;Select: ${r.gpa} &gt; 3.5 ✗ — skip, ask Scan again`]);
    }
    if (!produced) {
      events.push(['T', 'asking', 'rej', '&nbsp;&nbsp;&nbsp;&nbsp;Scan → False (no rows left)']);
      events.push(['P', 'asking', 'rej', 'Project.next() → False']);
    }
    let i = 0;
    const timer = setInterval(() => {
      if (i >= events.length) {
        clearInterval(timer);
        running = false;
        flash(null);
        if (produced) {
          delivered += 1;
          out.insertAdjacentHTML('beforeend', `<span class="qj-result-chip">${produced.name}</span>`);
          msg.innerHTML = `One pull, one row: <strong>${produced.name}</strong>. ` +
            `The Scan moved ${cursor} row${cursor > 1 ? 's' : ''} so far to deliver ${delivered}.`;
        }
        return;
      }
      const [node, cls, logCls, text] = events[i];
      flash(node, cls);
      addLog(logCls, text);
      i += 1;
    }, 550);
  }

  $('pl-pull').addEventListener('click', pull);
  $('pl-reset').addEventListener('click', reset);
  reset();
})();

/* ---------------- Drive the odometer ---------------- */
(function () {
  const leftEl = document.getElementById('odo-left');
  if (!leftEl) return;

  const LEFT = ['ada', 'ben', 'cyd', 'dee', 'eli', 'fay'];
  const RIGHT = ['cs', 'stat', 'econ'];
  let li, ri, pairs, leftDelivered, rightDelivered, done;

  const pathEl = document.getElementById('odo-path');
  const rightEl = document.getElementById('odo-right');
  const pairsEl = document.getElementById('odo-pairs');

  function beforeFirst() {
    // The subtle setup: left.before_first(); left.next(); right.before_first()
    li = 0; ri = -1;
    leftDelivered = 1; rightDelivered = 0;
    pairs = []; done = false;
    pathEl.textContent = 'Setup: left is at ada; right is before its first row, cs.';
    render();
  }

  function next() {
    if (done) { pathEl.textContent = 'exhausted — before_first() to run it again'; return; }
    if (ri + 1 < RIGHT.length) {
      ri++; rightDelivered++;
      pathEl.textContent = 'right.next() found another row for the current left row.';
    } else if (li + 1 < LEFT.length) {
      li++; ri = 0;
      leftDelivered++; rightDelivered++;
      pathEl.textContent = 'Right exhausted: rewind it, advance the left, then read the first right row.';
    } else {
      done = true;
      pathEl.textContent = 'rollover attempted, but left.next() was false too — product complete, return False';
      render();
      return;
    }
    pairs.push(`(${LEFT[li]}, ${RIGHT[ri]})`);
    render();
  }

  function render() {
    leftEl.innerHTML = LEFT.map((v, i) =>
      `<div class="odo-cell${i === li && !done ? ' cur' : ''}${i < li ? ' past' : ''}">${v}</div>`).join('');
    rightEl.innerHTML = RIGHT.map((v, i) =>
      `<div class="odo-cell${i === ri && !done ? ' cur' : ''}${ri >= 0 && i < ri ? ' past' : ''}">${v}</div>`).join('');
    pairsEl.innerHTML = pairs.map((p, i) =>
      `<span class="odo-pair${i === pairs.length - 1 ? ' new' : ''}">${p}</span>`).join('');
    document.getElementById('odo-lcount').textContent = `· delivered ${leftDelivered}`;
    document.getElementById('odo-rcount').textContent = `· delivered ${rightDelivered} total`;
    document.getElementById('odo-pcount').textContent = `· ${pairs.length} of 18`;
  }

  document.getElementById('odo-next').addEventListener('click', next);
  document.getElementById('odo-reset').addEventListener('click', beforeFirst);
  beforeFirst();
})();
