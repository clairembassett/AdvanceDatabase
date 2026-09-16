/* Lab 10 — micro-rag · widgets. */

/* ---------------- Glossary ---------------- */
(function () {
  const GLOSSARY = {
    'echo-mode': {
      title: 'Echo mode',
      body: "<p>The offline mode in which answer() returns the assembled prompt instead of requesting generated text. This lets you inspect the selected evidence and prompt format. The graded tests need no model connection. Configuring LLM_BASE_URL enables the provided model-call path.</p>",
    },
    'eval-set': {
      title: 'Eval set',
      body: "<p>Questions paired with labels identifying relevant documents or passages. The lab supplies 12 questions in corpus.py. Run each configuration against the same labels to compare hit@k and MRR. Generated answers need separate evaluation; retrieval metrics alone do not measure answer correctness.</p>",
    },
    'hashing-trick': {
      title: 'The hashing trick',
      body: "<p>Map each word to a vector position with md5(word) mod DIM. This uses a fixed vector width without a vocabulary table or fitting step. Different words can collide at the same position. Changing DIM affects those collisions, which can change retrieval scores and ranking.</p>",
    },
    'stop-words': {
      title: 'Stop words',
      body: "<p>Words removed before embedding, often because they are frequent and provide little discrimination between documents. The lab uses a fixed list including the, of, and and. Such lists depend on the task: removing a word can also remove useful meaning, so evaluate the choice.</p>",
    },
    'mrr': {
      title: 'MRR (mean reciprocal rank)',
      body: "<p>For each question, take the reciprocal of the first relevant result’s rank: 1 for rank 1, 0.5 for rank 2, and zero if no relevant result is returned. MRR is the average across questions. It distinguishes early and late relevant results even when both count as a hit@k.</p>",
    },
  };
  if (window.LabBase && LabBase.initGlossary) LabBase.initGlossary(GLOSSARY);
  if (window.LabBase && LabBase.initAnnotatedCode) LabBase.initAnnotatedCode();
})();

/* ---------------- micro-rag core (parity-tested against micro_rag.py) ---------------- */
/* MD5 gives word→dimension parity with Python's hashlib.md5. */
function md5hex(str) {
  function rol(n, c) { return (n << c) | (n >>> (32 - c)); }
  function add(a, b) { return (a + b) | 0; }
  const K = [];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
             5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
             4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
             6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const bytes = [];
  for (let i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i) & 0xff);
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 0; i < 8; i++) bytes.push((bitLen / Math.pow(2, 8 * i)) & 0xff);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let off = 0; off < bytes.length; off += 64) {
    const M = [];
    for (let j = 0; j < 16; j++)
      M[j] = bytes[off + 4 * j] | (bytes[off + 4 * j + 1] << 8) |
             (bytes[off + 4 * j + 2] << 16) | (bytes[off + 4 * j + 3] << 24);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16)      { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D;          g = (3 * i + 5) % 16; }
      else             { F = C ^ (B | ~D);       g = (7 * i) % 16; }
      F = add(add(add(F, A), K[i]), M[g]);
      A = D; D = C; C = B; B = add(B, rol(F, S[i]));
    }
    a0 = add(a0, A); b0 = add(b0, B); c0 = add(c0, C); d0 = add(d0, D);
  }
  function hex(n) {
    let s = '';
    for (let i = 0; i < 4; i++) s += ((n >>> (8 * i)) & 0xff).toString(16).padStart(2, '0');
    return s;
  }
  return hex(a0) + hex(b0) + hex(c0) + hex(d0);
}

const RAG = {
  DIM: 2048,
  STOP: null,
  chunks: null,
  vectors: null,
  wordDim(word) {
    // int(md5, 16) % 2048 keeps only the low 11 bits = last 3 hex chars.
    return parseInt(md5hex(word).slice(-3), 16) % RAG.DIM;
  },
  embed(text) {
    const counts = {};
    for (const w of (text.toLowerCase().match(/[a-z]+/g) || [])) {
      if (RAG.STOP.has(w)) continue;
      counts[w] = (counts[w] || 0) + 1;
    }
    const v = new Float64Array(RAG.DIM);
    for (const w in counts) v[RAG.wordDim(w)] += 1.0 / (1.0 + Math.log(counts[w]));
    let norm = 0;
    for (let i = 0; i < RAG.DIM; i++) norm += v[i] * v[i];
    norm = Math.sqrt(norm) || 1.0;
    for (let i = 0; i < RAG.DIM; i++) v[i] /= norm;
    return v;
  },
  dot(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; },
  build(chunks) {
    RAG.chunks = chunks;
    RAG.vectors = chunks.map(c => RAG.embed(c.text));
  },
  retrieve(question, k) {
    const qv = RAG.embed(question);
    const scored = RAG.vectors.map((v, i) => [RAG.dot(qv, v), i]);
    scored.sort((x, y) => y[0] - x[0] || x[1] - y[1]);
    return scored.slice(0, k).map(([score, i]) => Object.assign({ score }, RAG.chunks[i]));
  },
  buildPrompt(question, retrieved) {
    const lines = ['Answer using ONLY the sources below. Cite as [doc_id].', ''];
    for (const c of retrieved) lines.push('[' + c.doc + '] ' + c.title + ': ' + c.text);
    lines.push('');
    lines.push('Question: ' + question);
    return lines.join('\n');
  },
};

const RAG_DATA = window.CourseRagMeasurements.preview;

/* ---------------- Ask-the-course widget ---------------- */
(function () {
  const input = document.getElementById('ask-input');
  if (!input || !RAG_DATA) return;
  RAG.STOP = new Set(RAG_DATA.stop);
  RAG.build(RAG_DATA.chunks);
  const results = document.getElementById('ask-results');
  const promptBox = document.getElementById('ask-prompt');

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function run(question) {
    if (!question.trim()) return;
    const top = RAG.retrieve(question, 3);
    const maxScore = Math.max(top[0].score, 1e-9);
    results.innerHTML = top.map((c, rank) =>
      '<div class="ask-hit' + (c.score < 0.12 ? ' weak' : '') + '">' +
      '<div class="ask-hit-head"><span class="ask-rank">' + (rank + 1) + '</span>' +
      '<span class="ask-doc">[' + esc(c.doc) + ']</span>' +
      '<span class="ask-title">' + esc(c.title) + '</span>' +
      '<span class="ask-bar-track"><span class="ask-bar" style="width:' +
      (100 * c.score / maxScore).toFixed(1) + '%"></span></span>' +
      '<span class="ask-score">' + c.score.toFixed(3) + '</span></div>' +
      '<div class="ask-text">' + esc(c.text) + '</div></div>'
    ).join('') +
    (top[0].score < 0.12
      ? '<div class="ask-warn">Best score ' + top[0].score.toFixed(2) +
        ' — weak retrieval. No shared content words: this is the synonym wall.</div>'
      : '');
    promptBox.textContent = RAG.buildPrompt(question, top);
  }
  document.getElementById('ask-go').addEventListener('click', () => run(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') run(input.value); });
  document.querySelectorAll('.ask-presets .btn').forEach(btn =>
    btn.addEventListener('click', () => { input.value = btn.dataset.q; run(btn.dataset.q); }));
})();

/* ---------------- The DIM dial ---------------- */
(function () {
  const slider = document.getElementById('dim-slider');
  if (!slider) return;
  const out = document.getElementById('dim-readout');
  const val = document.getElementById('dim-val');
  // Generated from the supplied Python chunker, embedder, and exact index.
  const TABLE = window.CourseRagMeasurements.width.map(row => ({
    dim: row.dim, hit3: row.hit3, mrr: row.mrr3
  }));
  function bar(label, x, cls) {
    return '<div class="dl-row"><span>' + label + '</span>' +
      '<span class="dl-track"><span class="dl-bar ' + cls + '" style="width:' +
      (100 * x).toFixed(1) + '%"></span></span>' +
      '<span class="dl-val">' + x.toFixed(2) + '</span></div>';
  }
  function render() {
    const row = TABLE[+slider.value];
    val.textContent = row.dim;
    out.innerHTML = bar('hit@3', row.hit3, 'recall') + bar('MRR@3', row.mrr, 'work') +
      '<div class="dl-row"><span></span><span style="font-family:var(--sans);font-size:12px;color:var(--ink-mute)">' +
      (row.dim <= 128 ? 'many distinct terms share ' + row.dim + ' dimensions; inspect the resulting rankings'
       : row.dim <= 512 ? 'some relevant sources rank below first; MRR@3 records that difference'
       : row.dim === 1024 ? 'ten of twelve questions have a relevant source in the top three'
       : '2048 and 4096 tie here; inspect the remaining miss before choosing another change') +
      '</span><span></span></div>';
  }
  slider.addEventListener('input', render);
  render();
})();
