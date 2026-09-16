/* Lecture 6 — B+ Trees · widgets. */

/* ---------------- Glossary ---------------- */
(function () {
  const GLOSSARY = {
    'occupancy': {
      title: 'Occupancy',
      body: "<p>The fraction of a node’s key capacity currently in use. A middle split produces nodes that are roughly half full; later inserts may fill them further. Lower occupancy requires more nodes for the same keys and can increase tree height. The root is allowed to have fewer keys than the usual non-root minimum.</p>",
    },
    'routing-key': {
      title: 'Routing key',
      body: "<p>An internal-node key that separates child ranges. For keys [k1, k2, ..., kn], the node has n+1 children: keys below k1 go to the first child, keys from k1 up to but not including k2 go to the second, and so on. Routing keys do not carry RIDs. An internal split moves a separator to the parent; a leaf split copies a separator upward while preserving the leaf entry.</p>",
    },
    'invariant': {
      title: 'Invariant',
      body: "<p>A property that must hold after every completed operation. For this B+ tree, keys are sorted, leaves have equal depth, non-root nodes meet minimum occupancy, and all (key, RID) entries remain in leaves. The lab tests these properties after insertions and splits.</p>",
    },
    'rid-recall': {
      title: 'RID (record id) — recall',
      body: "<p>A record identifier from Lab 3: (block number, slot number). It stays valid while the record occupies that slot. If the record is deleted or the slot is reused, index entries referring to it must be removed or updated. B+ tree leaves store RIDs so an index lookup can locate the matching heap rows.</p>",
    },
    'fanout': {
      title: 'Fan-out',
      body: "<p>The number of children an internal node has. A binary tree has at most two; a page-sized B+ tree node can have hundreds, depending on key size and page layout. More children per node usually means fewer levels and fewer page accesses per lookup. The lecture uses about 200 as an illustrative value.</p>",
    },
    'selectivity': {
      title: 'Selectivity',
      body: "<p>The fraction of rows that a predicate keeps. A unique-ID lookup keeps one row and is highly selective; a condition matching almost every row is not selective. An index is often useful when few rows match. For many matches, a sequential scan may be cheaper. The optimizer estimates selectivity when comparing plans.</p>",
    },
    'covering-index': {
      title: 'Covering index',
      body: "<p>An index containing all columns needed by a query. This can let the engine answer from index entries without fetching the heap rows. PostgreSQL calls the corresponding plan an index-only scan, though visibility checks may still require heap access. Adding included columns increases index size.</p>",
    },
    'write-amplification': {
      title: 'Write amplification',
      body: "<p>Additional physical writes needed to perform a logical change. Inserting into a table with five indexes updates six structures, but that does not imply exactly six disk writes: buffering, page splits, and logging affect the total. Index maintenance trades additional write work and storage for faster reads.</p>",
    },
  };
  if (window.LabBase && LabBase.initGlossary) LabBase.initGlossary(GLOSSARY);
  if (window.LabBase && LabBase.initAnnotatedCode) LabBase.initAnnotatedCode();
})();

/* ---------------- Live B+ tree ---------------- */
(function () {
  const root0 = document.getElementById('viz-btree');
  if (!root0) return;
  const ORDER = 4;
  const $ = id => document.getElementById(id);
  const msg = $('bt-msg'), canvas = $('bt-canvas'), stats = $('bt-stats');

  let root, height, splits, count, scriptTimer = null;

  function stopScript() {
    if (scriptTimer !== null) clearInterval(scriptTimer);
    scriptTimer = null;
  }

  function newNode(leaf) { return { leaf, keys: [], children: [], next: null, id: Math.random() }; }

  function reset() {
    stopScript();
    root = newNode(true); height = 1; splits = 0; count = 0;
    msg.textContent = 'Insert keys until the root splits. Compare the height before and after.';
    render();
  }

  function childIndex(node, key) {
    let i = 0;
    while (i < node.keys.length && key >= node.keys[i]) i++;
    return i;
  }

  function descend(key) {
    const path = [root];
    while (!path[path.length - 1].leaf) {
      const n = path[path.length - 1];
      path.push(n.children[childIndex(n, key)]);
    }
    return path;
  }

  function insert(key) {
    const path = descend(key);
    const leaf = path[path.length - 1];
    if (leaf.keys.includes(key)) {
      msg.innerHTML = `${key} is already present. The lab adds another RID for a duplicate key; this key-only demonstration leaves the tree unchanged.`;
      return;
    }
    let i = 0;
    while (i < leaf.keys.length && leaf.keys[i] < key) i++;
    leaf.keys.splice(i, 0, key);
    count += 1;
    let didSplit = false;
    for (let d = path.length - 1; d >= 0; d--) {
      const node = path[d];
      if (node.keys.length <= ORDER) continue;
      didSplit = true; splits += 1;
      const mid = Math.floor(node.keys.length / 2);
      const sib = newNode(node.leaf);
      let hoisted;
      if (node.leaf) {
        hoisted = node.keys[mid];
        sib.keys = node.keys.slice(mid);
        node.keys = node.keys.slice(0, mid);
        sib.next = node.next; node.next = sib;
      } else {
        hoisted = node.keys[mid];
        sib.keys = node.keys.slice(mid + 1);
        sib.children = node.children.slice(mid + 1);
        node.keys = node.keys.slice(0, mid);
        node.children = node.children.slice(0, mid + 1);
      }
      const parent = d > 0 ? path[d - 1] : null;
      if (parent === null) {
        const nr = newNode(false);
        nr.keys = [hoisted];
        nr.children = [node, sib];
        root = nr; height += 1;
        msg.innerHTML = `Insert ${key}: node over capacity → <strong>split</strong>, and no parent existed — ` +
          `a new root [${hoisted}] appears. <strong>Height is now ${height}</strong>; every leaf is one level farther from the root.`;
      } else {
        const j = childIndex(parent, hoisted);
        parent.keys.splice(j, 0, hoisted);
        parent.children.splice(j + 1, 0, sib);
        msg.innerHTML = `Insert ${key}: node over capacity → <strong>split</strong> at the middle, ` +
          `${hoisted} ${node.leaf ? 'copied' : 'moved'} up into the parent.`;
      }
    }
    if (!didSplit) msg.innerHTML = `Insert ${key}: the key fits in the leaf. It is inserted in sorted order; no split is needed.`;
    render(didSplit ? key : null);
  }

  function search(key) {
    const path = descend(key);
    const leaf = path[path.length - 1];
    const found = leaf.keys.includes(key);
    render(null, path, found ? key : null);
    msg.innerHTML = `search(${key}): touched <strong>${path.length} node${path.length > 1 ? 's' : ''}</strong> ` +
      `(the height) — ${found ? `found it` : `absent; a scan would have touched all ${count}`}.`;
  }

  function levels() {
    const out = [];
    let level = [root];
    while (level.length) {
      out.push(level);
      level = level.flatMap(n => n.children);
    }
    return out;
  }

  function render(flashKey, visitedPath, foundKey) {
    const visited = new Set((visitedPath || []).map(n => n.id));
    canvas.innerHTML = levels().map(level =>
      `<div class="bt-level">` + level.map(n => {
        const cls = ['bt-node'];
        if (n.leaf) cls.push('leaf');
        if (visited.has(n.id)) cls.push('visited');
        if (flashKey !== null && flashKey !== undefined && n.keys.includes(flashKey)) cls.push('split-flash');
        return `<div class="${cls.join(' ')}">` + n.keys.map(k =>
          `<span class="bt-key${k === foundKey ? ' found' : ''}">${k}</span>`).join('') + '</div>';
      }).join('') + `</div>`
    ).join('') + (height > 1 ? `<div class="bt-chain">leaves link left → right for range scans</div>` : '');
    stats.textContent = `keys: ${count}    height: ${height}    splits so far: ${splits}`;
  }

  function runScript(keys, doneMsg) {
    reset();
    let i = 0;
    scriptTimer = setInterval(() => {
      if (i >= keys.length) { stopScript(); if (doneMsg) msg.innerHTML = doneMsg; return; }
      insert(keys[i++]);
    }, 800);
  }

  function manual(inputId, operation) {
    stopScript();
    const value = $(inputId).value;
    const key = Number(value);
    if (!value.trim() || !Number.isSafeInteger(key)) {
      msg.textContent = 'Enter a whole-number key before continuing.';
      return;
    }
    operation(key);
  }

  $('bt-script').addEventListener('click', () =>
    runScript([39, 31, 37, 28, 36, 34],
      'The six example gpas: one split, height 2, root [36] — the tree from the lecture’s traced search.'));
  $('bt-many').addEventListener('click', () =>
    runScript(Array.from({ length: 20 }, (_, k) => k + 1),
      'Sequential inserts split the rightmost leaf as it fills. Root splits increased the height twice; all leaves remain at the same depth.'));
  $('bt-one').addEventListener('click', () => manual('bt-key', insert));
  $('bt-search').addEventListener('click', () => manual('bt-skey', search));
  $('bt-reset').addEventListener('click', reset);
  reset();
})();

/* ---------------- Fan-out slider ---------------- */
(function () {
  const slider = document.getElementById('fo-slider');
  if (!slider) return;
  const stage = document.getElementById('fo-stage');
  const val = document.getElementById('fo-val');
  let n = 100000000;

  function fanout() {
    // slider 1..100 maps log-scale to 2..400
    return Math.max(2, Math.round(Math.pow(10, 0.30103 + (slider.value / 100) * 2.3) ));
  }
  function fmt(x) {
    if (x >= 1e9) return (x / 1e9).toFixed(x >= 1e10 ? 0 : 1) + 'B';
    if (x >= 1e6) return (x / 1e6).toFixed(x >= 1e7 ? 0 : 1) + 'M';
    if (x >= 1e3) return (x / 1e3).toFixed(x >= 1e4 ? 0 : 1) + 'k';
    return String(x);
  }
  function render() {
    const f = fanout();
    val.textContent = f;
    // levels bottom-up: leaves hold n entries, each upper level divides by f
    const levels = [];
    let count = Math.ceil(n / f);          // leaf nodes
    levels.push(count);
    while (count > 1) { count = Math.ceil(count / f); levels.push(count); }
    const height = levels.length;
    const maxShow = 16;
    const shown = levels.slice().reverse();   // root first
    stage.innerHTML =
      `<div class="fo-verdict">height = <strong>${height}</strong> level${height === 1 ? '' : 's'} ` +
      `for ${fmt(n)} rows at fan-out ${f} — a point lookup touches ${height} node${height === 1 ? '' : 's'}</div>` +
      (height > maxShow
        ? `<div class="fo-too-tall">${height} levels — too tall to draw. Lower fan-out requires more levels.</div>`
        : shown.map((c, i) => {
            const w = Math.max(3, 100 * (Math.log10(c) + 0.3) / (Math.log10(shown[shown.length - 1]) + 0.3));
            const label = i === 0 ? 'root' : (i === shown.length - 1 ? 'leaves' : `level ${i + 1}`);
            return `<div class="fo-row"><span class="fo-label">${label}</span>` +
              `<span class="fo-track"><span class="fo-bar" style="width:${w.toFixed(1)}%"></span></span>` +
              `<span class="fo-count">${fmt(c)} node${c === 1 ? '' : 's'}</span></div>`;
          }).join(''));
    document.querySelectorAll('#viz-fanout .qj-controls .btn').forEach(b =>
      b.classList.toggle('primary', +b.dataset.n === n));
  }
  document.querySelectorAll('#viz-fanout .qj-controls .btn').forEach(b =>
    b.addEventListener('click', () => { n = +b.dataset.n; render(); }));
  slider.addEventListener('input', render);
  render();
})();
