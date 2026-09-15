/* Lab 4 — Scan Operators · widgets. */

/* ---------------- Glossary ---------------- */
(function () {
  const GLOSSARY = {
    'predicate': {
      title: 'Predicate',
      body: "<p>A condition evaluated for a row, such as <code>gpa &gt; 35</code> or <code>name = \"ada\"</code>. <code>SelectScan</code> returns rows that satisfy its predicate. A term comparing fields from two tables can express a join condition.</p>",
    },
    'delegation': {
      title: 'Delegation',
      body: "<p>Implementing a method by forwarding its work to another object. For example, <code>SelectScan.get_val</code> calls <code>self.scan.get_val(fld)</code>. The selection changes which rows are returned while using its input scan to read their field values.</p>",
    },
    'cartesian-product': {
      title: 'Cartesian product',
      body: "<p>Every row from one input paired with every row from another. Inputs with |A| and |B| rows produce |A| × |B| pairs. Filtering these pairs by a join condition gives an inner join. More efficient join algorithms can find matching pairs without enumerating the full product.</p>",
    },
    'predicate-pushdown': {
      title: 'Predicate pushdown',
      body: "<p>Moving a filter earlier in a query plan when the transformation preserves the result. For example, a filter that refers only to the left input of a product can run before that product. The lab’s measurement shows 15 times fewer candidate pairs with this change.</p>",
    },
    'materialization': {
      title: 'Materialization',
      body: "<p>Storing intermediate results so another operator can read or reuse them. The optional <code>CachingScan</code> stores its input rows on the first pass and reuses them on later passes. This reduces repeated input reads but requires memory for the cached rows.</p>",
    },
  };
  if (window.LabBase && LabBase.initGlossary) LabBase.initGlossary(GLOSSARY);
  if (window.LabBase && LabBase.initAnnotatedCode) LabBase.initAnnotatedCode();
})();

/* ---------------- Plan builder ---------------- */
(function () {
  const root = document.getElementById('viz-stack');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const msg = $('st-msg'), tree = $('st-tree'), stats = $('st-stats');

  const STUDENTS = [
    { sid: 1, name: 'ada', gpa: 39, mid: 1 }, { sid: 2, name: 'ben', gpa: 31, mid: 2 },
    { sid: 3, name: 'cyd', gpa: 37, mid: 1 }, { sid: 4, name: 'dee', gpa: 28, mid: 3 },
    { sid: 5, name: 'eli', gpa: 36, mid: 2 }, { sid: 6, name: 'fay', gpa: 34, mid: 1 },
  ];
  const MAJORS = [{ mid2: 1, dept: 'ds' }, { mid2: 2, dept: 'stat' }, { mid2: 3, dept: 'econ' }];

  function node(name, sub, traffic) {
    return `<div class="pl-node lit">${name}<span>${sub}</span>` +
           `<span class="traffic">${traffic}</span></div>`;
  }
  const arrow = '<div class="pl-arrow">↑</div>';

  function q1() {
    const scanned = STUDENTS.length;
    const kept = STUDENTS.filter(r => r.gpa > 35);
    tree.innerHTML =
      node('Project', 'name', `${kept.length} rows out: ${kept.map(r => r.name).join(', ')}`) + arrow +
      node('Select', 'gpa > 35', `${scanned} in → ${kept.length} out`) + arrow +
      node('Scan', 'students', `${scanned} rows`);
    msg.innerHTML = 'This plan examines six rows and returns the three that satisfy the filter.';
    stats.textContent = 'rows examined: 6    rows delivered: 3';
  }

  function q2() {
    const pairs = [];
    for (const s of STUDENTS) for (const m of MAJORS) pairs.push({ ...s, ...m });
    const kept = pairs.filter(p => p.mid === p.mid2 && p.gpa > 35);
    tree.innerHTML =
      node('Project', 'name, dept', kept.map(p => `(${p.name}, ${p.dept})`).join(' ')) + arrow +
      node('Select', 'mid = mid2 AND gpa > 35', `${pairs.length} pairs in → ${kept.length} out`) + arrow +
      node('Product', 'students × majors', `${pairs.length} pairs built`) +
      `<div class="pl-pair">` +
      `<div class="pl-node">Scan<span>students</span><span class="traffic">6 rows, read once</span></div>` +
      `<div class="pl-node">Scan<span>majors</span><span class="traffic">3 rows × 6 rewinds = 18</span></div>` +
      `</div>`;
    msg.innerHTML = 'The selection keeps matching pairs from the product. The majors scan restarts for each student.';
    stats.textContent = 'pairs built: 18    rows delivered: 3';
  }

  function q3() {
    tree.innerHTML =
      node('Product', 'students × majors', '18 pairs, unfiltered') +
      `<div class="pl-pair">` +
      `<div class="pl-node">Scan<span>students</span><span class="traffic">6 rows</span></div>` +
      `<div class="pl-node">Scan<span>majors</span><span class="traffic">3 rows × 6 rewinds</span></div>` +
      `</div>`;
    msg.innerHTML = 'The <strong>Cartesian product</strong> pairs every student with every major, without applying a join condition.';
    stats.textContent = 'pairs built: 18    rows delivered: 18';
  }

  function reset() {
    tree.innerHTML = '';
    stats.textContent = '';
    msg.textContent = 'Choose a plan. The tree renders, then runs row by row.';
  }

  $('st-q1').addEventListener('click', q1);
  $('st-q2').addEventListener('click', q2);
  $('st-q3').addEventListener('click', q3);
  $('st-reset').addEventListener('click', reset);
  reset();
})();
