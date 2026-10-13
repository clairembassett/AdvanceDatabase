/* ============================================================ */
/*  Advanced Databases for Data Science — shared lab/lecture JS  */
/*  Every page MUST link this file BEFORE its own viz.js:        */
/*    <script src="../_shared/lab-base.js?v=N"></script>         */
/*    <script src="viz.js?v=N"></script>                         */
/*                                                               */
/*  Owns: the presentation-mode toggle, TOC active-link tracking,*/
/*  course prev/next navigation, the inline-glossary engine, the */
/*  annotated-code engine, and a tiny `LabBase` namespace with   */
/*  helpers pages can reuse.                                     */
/* ============================================================ */

(function () {
  'use strict';

  const NS = (window.LabBase = window.LabBase || {});

  // ----- Tiny utilities reused across labs ----- ----- ----- -----
  NS.makeLcg = function (seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  };

  NS.softmax = function (s, t) {
    t = t || 1.0;
    const scaled = s.map(v => v / t);
    const m = Math.max.apply(null, scaled);
    const e = scaled.map(v => Math.exp(v - m));
    const Z = e.reduce((a, b) => a + b, 0);
    return e.map(v => v / Z);
  };

  NS.downloadBlob = function (filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };

  // ----- Presentation-mode toggle + navigation ----- ----- -----
  // Contract (CLAUDE.md): one #present-toggle button in the page HTML;
  // this module wraps it in .present-controls, injects Back/Forward,
  // toggles body.presentation-mode, persists in localStorage.
  // Keyboard: P toggles, Esc exits, ←/PageUp back, →/PageDown forward
  // (↑/↓ scroll the page as usual; keys ignored while typing).
  (function initPresentationMode() {
    const btn = document.getElementById('present-toggle');
    if (!btn) return;
    const STORAGE_KEY = 'lab.presentationMode';
    const SLIDE_KEY = 'lab.presentationSlide';
    const mainEl = document.querySelector('main');

    let wrap = btn.parentElement;
    if (!wrap || !wrap.classList.contains('present-controls')) {
      wrap = document.createElement('div');
      wrap.className = 'present-controls';
      btn.parentNode.insertBefore(wrap, btn);
      wrap.appendChild(btn);
    }

    function makeNavBtn(id, glyph, label, ariaLabel) {
      const b = document.createElement('button');
      b.type = 'button';
      b.id = id;
      b.className = 'present-toggle present-nav';
      b.title = label;
      b.setAttribute('aria-label', ariaLabel);
      b.innerHTML = '<span class="present-icon">' + glyph + '</span>';
      return b;
    }
    const backBtn = makeNavBtn('present-back',    '\u25c0', 'Previous slide (\u2190)', 'Previous slide');
    const fwdBtn  = makeNavBtn('present-forward', '\u25b6', 'Reveal next / next slide (\u2192) \u00b7 A reveals all', 'Next slide');
    wrap.insertBefore(backBtn, btn);
    wrap.appendChild(fwdBtn);
    const counter = document.createElement('span');
    counter.id = 'present-counter';
    counter.className = 'present-toggle present-nav present-counter';
    counter.setAttribute('aria-live', 'polite');
    wrap.appendChild(counter);

    // ----- Slide partition -----
    // Presentation mode is a true slide deck: slide 0 is everything before
    // the first h2[id] (hero + lede = the title slide); each h2[id] starts
    // a new slide holding itself and all siblings up to the next h2[id].
    // Only the current slide's elements are shown; <main> goes fullscreen.
    // Nothing is re-parented, so widget state and listeners survive.
    // The glossary panel, prev/next nav, and footer are exempt from
    // partitioning (nav + footer are hidden by CSS; the panel travels).
    let slides = null, cur = 0;
    let units = null, revealed = null;   // per-slide build units + how many are shown

    // A build unit is any slide element that would be visible in presentation
    // mode, except the slide's own heading. Revealing them one per forward
    // press turns every slide into a progressive build. Exempt: the title
    // slide (0) and any slide carrying the agenda (the overview slide).
    function isBuildUnit(el) {
      if (el.tagName === 'P' && !el.classList.contains('keep-in-present')) return false;
      if (el.classList.contains('glossary-hint') || el.classList.contains('cite')) return false;
      return true;
    }

    function buildSlides() {
      slides = []; units = []; revealed = [];
      if (!mainEl) return;
      let bucket = [];
      Array.from(mainEl.children).forEach((el) => {
        if (el.tagName === 'FOOTER' || el.id === 'glossary-panel' ||
            el.classList.contains('lab-prev-next')) return;
        if ((el.tagName === 'H2' && el.id) || el.classList.contains('new-slide')) {
          if (bucket.length) slides.push(bucket);
          bucket = [el];
        } else {
          bucket.push(el);
        }
      });
      if (bucket.length) slides.push(bucket);
      slides.forEach((els, k) => {
        const exempt = k === 0 || els.some(el => el.querySelector && el.querySelector('ol.agenda'));
        const u = exempt ? [] : els.slice(1).filter(isBuildUnit);
        units.push(u);
        revealed.push(1);            // first unit shows on arrival
      });
    }

    function applyBuild() {
      const u = units[cur];
      u.forEach((el, j) => el.classList.toggle('build-dim', j >= revealed[cur]));
      counter.textContent = (cur + 1) + ' / ' + slides.length +
        (u.length > 1 ? ' \u00b7 ' + Math.min(revealed[cur], u.length) + '/' + u.length : '');
    }

    function showSlide(i, fullyBuilt) {
      if (!slides || !slides.length) return;
      cur = Math.max(0, Math.min(slides.length - 1, i));
      slides.forEach((els, k) =>
        els.forEach(el => el.classList.toggle('slide-hidden', k !== cur)));
      if (fullyBuilt) revealed[cur] = Math.max(revealed[cur], units[cur].length);
      applyBuild();
      if (mainEl) mainEl.scrollTop = 0;
      try { localStorage.setItem(SLIDE_KEY, String(cur)); } catch (e) { /* ignore */ }
    }

    function clearSlides() {
      if (!slides) return;
      slides.forEach(els => els.forEach(el => el.classList.remove('slide-hidden')));
      units.forEach(u => u.forEach(el => el.classList.remove('build-dim')));
      slides = null; units = null; revealed = null;
    }

    // Deck semantics: forward finishes the current slide's build before
    // advancing; back un-builds before retreating; a slide entered from the
    // right arrives fully built. 'A' reveals the current slide at once.
    function moveSlide(forward) {
      if (!slides) return;
      const u = units[cur];
      if (forward && revealed[cur] < u.length) { revealed[cur]++; applyBuild(); return; }
      if (!forward && revealed[cur] > 1 && u.length) { revealed[cur]--; applyBuild(); return; }
      showSlide(cur + (forward ? 1 : -1), !forward);
    }

    function revealAll() {
      if (!slides) return;
      revealed[cur] = Math.max(1, units[cur].length);
      applyBuild();
    }
    backBtn.addEventListener('click', () => moveSlide(false));
    fwdBtn.addEventListener('click',  () => moveSlide(true));

    function apply(on) {
      document.body.classList.toggle('presentation-mode', on);
      const labelEl = btn.querySelector('.present-label');
      if (labelEl) labelEl.textContent = on ? 'Exit' : 'Present';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) {
        buildSlides();
        let savedSlide = 0;
        try { savedSlide = parseInt(localStorage.getItem(SLIDE_KEY), 10) || 0; } catch (e) { savedSlide = 0; }
        showSlide(savedSlide);
      } else {
        clearSlides();
      }
      try { localStorage.setItem(STORAGE_KEY, on ? '1' : '0'); } catch (e) { /* ignore */ }
    }

    function toggle() { apply(!document.body.classList.contains('presentation-mode')); }

    btn.addEventListener('click', toggle);

    document.addEventListener('keydown', (e) => {
      if (e.target.matches && e.target.matches('input, textarea, [contenteditable]')) return;
      if (e.key === 'p' || e.key === 'P') { e.preventDefault(); toggle(); return; }
      const inPresent = document.body.classList.contains('presentation-mode');
      if (e.key === 'Escape' && inPresent) { apply(false); return; }
      if (inPresent && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); revealAll(); return; }
      if (inPresent && ['ArrowRight','ArrowLeft','PageDown','PageUp'].includes(e.key)) {
        e.preventDefault();
        const forward = e.key === 'ArrowRight' || e.key === 'PageDown';
        moveSlide(forward);
      }
    });

    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    if (saved === '1') apply(true);
  })();

  // ----- Course prev/next navigation ----- ----- ----- ----- -----
  //
  // One sequence for the whole semester, in teaching order: lectures and
  // labs interleaved exactly as they meet (Tue lecture, Thu lab). The
  // prev/next cards therefore walk the course, not just the labs.
  //
  // Append entries here as pages are built. `dir` is relative to the
  // repo root; every page lives two levels deep (labs/lab-NN/ or
  // lectures/lecture-NN/), so hrefs are ../../<dir>/<file>.
  const COURSE_SEQUENCE = [
    { kind: 'Lecture', num: '01', dir: 'lectures/lecture-01', file: 'anatomy.html',     title: 'Anatomy of a database'      },
    { kind: 'Lab',     num: '01', dir: 'labs/lab-01',         file: 'filemanager.html', title: 'microdb 1 · disk & file manager' },
    { kind: 'Lecture', num: '02', dir: 'lectures/lecture-02', file: 'bufferpool.html',    title: 'Memory & the buffer pool'   },
    { kind: 'Lab',     num: '02', dir: 'labs/lab-02',         file: 'buffermanager.html', title: 'microdb 2 · buffer manager' },
    { kind: 'Lecture', num: '03', dir: 'lectures/lecture-03', file: 'records.html',     title: 'Record layout & the catalog' },
    { kind: 'Lab',     num: '03', dir: 'labs/lab-03',         file: 'recordpages.html', title: 'microdb 3 · records & table scan' },
    { kind: 'Lecture', num: '04', dir: 'lectures/lecture-04', file: 'iterators.html',   title: 'The iterator model' },
    { kind: 'Lab',     num: '04', dir: 'labs/lab-04',         file: 'scans.html',       title: 'microdb 4 · scan operators' },
    { kind: 'Lecture', num: '05', dir: 'lectures/lecture-05', file: 'parsing.html',     title: 'From SQL text to plan' },
    { kind: 'Lab',     num: '05', dir: 'labs/lab-05',         file: 'sqlfrontend.html', title: 'microdb 5 · the SQL front end' },
    { kind: 'Lecture', num: '06', dir: 'lectures/lecture-06', file: 'btrees.html',      title: 'B+ trees from first principles' },
    { kind: 'Lab',     num: '06', dir: 'labs/lab-06',         file: 'btree.html',       title: 'microdb 6 · the B+ tree index' },
    { kind: 'Lecture', num: '07', dir: 'lectures/lecture-07', file: 'wal.html',         title: 'Transactions & the write-ahead log' },
    { kind: 'Lecture', num: '08', dir: 'lectures/lecture-08', file: 'concurrency.html', title: 'Concurrency: locks, isolation & MVCC' },
    { kind: 'Lab',     num: '07', dir: 'labs/lab-07',         file: 'transactions.html', title: 'microdb 7 · transactions & recovery' },
    { kind: 'Lecture', num: '09', dir: 'lectures/lecture-09', file: 'optimizer.html',   title: 'The query optimizer + midterm review' },
    { kind: 'Lecture', num: '10', dir: 'lectures/lecture-10', file: 'analytics.html',   title: 'The analytics stack' },
    { kind: 'Lab',     num: '08', dir: 'labs/lab-08',         file: 'duckdb.html',      title: 'Fare prediction · DuckDB + PyTorch' },
    { kind: 'Lecture', num: '11', dir: 'lectures/lecture-11', file: 'vectors.html',     title: 'Vector databases' },
    { kind: 'Lab',     num: '09', dir: 'labs/lab-09',         file: 'microvector.html', title: 'microvector · the IVF index' },
    { kind: 'Lecture', num: '12', dir: 'lectures/lecture-12', file: 'rag.html',         title: 'RAG as a systems problem' },
    { kind: 'Lab',     num: '10', dir: 'labs/lab-10',         file: 'microrag.html',    title: 'micro-rag · wire the pipeline' },
    { kind: 'Lecture', num: '13', dir: 'lectures/lecture-13', file: 'distributed.html', title: 'Distributed compute' },
    { kind: 'Lab',     num: '11', dir: 'labs/lab-11',         file: 'sparkray.html',    title: 'Spark & Ray · the pattern and the products' },
    { kind: 'Lecture', num: '14', dir: 'lectures/lecture-14', file: 'bigtable.html',    title: 'Bigtable, LSM trees & NoSQL' },
    { kind: 'Lecture', num: '15', dir: 'lectures/lecture-15', file: 'graphs.html',      title: 'Graph databases & course synthesis' },
  ];

  function currentSeqIndex() {
    const m = location.pathname.match(/\/(labs\/lab-(\d{2})|lectures\/lecture-(\d{2}))\//);
    if (!m) return -1;
    const dir = m[1];
    return COURSE_SEQUENCE.findIndex(e => e.dir === dir);
  }

  (function initIndexButton() {
    const wrap = document.querySelector('.present-controls');
    if (!wrap) return;
    if (document.getElementById('lab-back-index')) return;
    const a = document.createElement('a');
    a.id = 'lab-back-index';
    a.className = 'present-toggle lab-index-link';
    a.href = '../../index.html';
    a.title = 'Back to course home';
    a.setAttribute('aria-label', 'Back to course home');
    a.innerHTML = '<span class="present-icon">⌂</span><span class="present-label">Home</span>';
    wrap.insertBefore(a, wrap.firstChild);
  })();

  (function initPrevNextNav() {
    const main = document.querySelector('main');
    if (!main) return;
    if (main.querySelector('.lab-prev-next')) return;
    const i = currentSeqIndex();
    if (i < 0) return;

    const prev = i > 0 ? COURSE_SEQUENCE[i - 1] : null;
    const next = i < COURSE_SEQUENCE.length - 1 ? COURSE_SEQUENCE[i + 1] : null;

    function makeLink(entry, dirLabel) {
      if (!entry) return `<div class="lab-prev-next-empty"></div>`;
      const arrow = dirLabel === 'prev' ? '←' : '→';
      return `
        <a class="lab-prev-next-card lab-prev-next-${dirLabel}" href="../../${entry.dir}/${entry.file}">
          <span class="lab-prev-next-dir">${dirLabel === 'prev' ? `${arrow} Previous` : `Next ${arrow}`}</span>
          <span class="lab-prev-next-num">${entry.kind} ${entry.num}</span>
          <span class="lab-prev-next-title">${entry.title}</span>
        </a>`;
    }

    const nav = document.createElement('nav');
    nav.className = 'lab-prev-next';
    nav.setAttribute('aria-label', 'Course navigation');
    nav.innerHTML = `
      ${makeLink(prev, 'prev')}
      <a class="lab-prev-next-card lab-prev-next-home" href="../../index.html">
        <span class="lab-prev-next-dir">⌂ Course</span>
        <span class="lab-prev-next-num">Home</span>
        <span class="lab-prev-next-title">Schedule · labs · project</span>
      </a>
      ${makeLink(next, 'next')}
    `;
    const footer = main.querySelector(':scope > footer');
    if (footer) main.insertBefore(nav, footer);
    else main.appendChild(nav);
  })();

  // ----- TOC active-link tracking ----- ----- ----- ----- ----- -
  (function initToc() {
    const links = Array.from(document.querySelectorAll('aside.toc a'));
    if (!links.length) return;
    const heads = links.map(a => ({
      a,
      el: document.getElementById(a.getAttribute('href').slice(1)),
    })).filter(h => h.el);
    if (!heads.length) return;
    function update() {
      const y = window.scrollY + 120;
      let active = heads[0];
      for (const h of heads) if (h.el.offsetTop <= y) active = h;
      heads.forEach(h => h.a.classList.toggle('active', h === active));
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  })();

  // ----- Inline glossary engine ----- ----- ----- ----- ----- ----
  //
  // Contract (CLAUDE.md, "Inline glossary explainer"): the page marks terms
  // with <span class="gloss" data-gloss="key">term</span>, ships an empty
  // #glossary-panel scaffold, and its viz.js calls:
  //
  //     LabBase.initGlossary({ key: { title: '…', body: '<p>…</p>' }, … });
  //
  // Hover, focus, click, or Enter/Space on a marked term re-parents the
  // panel to sit immediately AFTER the term's nearest block-level container
  // (pushing content down — never overlaying) and populates it. The close
  // button and Esc dismiss it; Esc is ignored while an input has focus.
  NS.initGlossary = function (dict) {
    const panel = document.getElementById('glossary-panel');
    if (!panel) return;
    const content = document.getElementById('glossary-content');
    const closeBtn = document.getElementById('glossary-close');
    let activeEl = null;

    function blockHome(el) {
      // <li> → its enclosing list; otherwise the nearest block container.
      const li = el.closest('li');
      if (li) {
        const list = li.closest('ul, ol');
        if (list) return list;
      }
      // .layer-card / .code-annotated lay their innards out in grid rows, so the
      // panel must sit after the whole card (as it does after a table), never
      // inside one of its columns.
      let home =
        el.closest('p, h1, h2, h3, h4, figure, table, blockquote, pre, .callout, ' +
                   '.viz-description, .layer-card, .code-annotated') ||
        el.closest('.viz') || el.parentElement;
      // Safety net for any other grid/flex container: a panel inserted as a grid
      // or flex item gets squeezed into one track, so climb out of it first.
      while (home && home.parentElement && home !== document.body) {
        const d = getComputedStyle(home.parentElement).display;
        if (d === 'grid' || d === 'inline-grid' || d === 'flex' || d === 'inline-flex') {
          home = home.parentElement;
        } else break;
      }
      return home;
    }

    function show(el) {
      const key = el.getAttribute('data-gloss');
      const entry = dict[key];
      if (!entry) return;
      const home = blockHome(el);
      if (!home || !home.parentNode) return;
      panel.hidden = false;
      content.innerHTML =
        '<div class="glossary-panel-title">' + entry.title + '</div>' + entry.body;
      home.parentNode.insertBefore(panel, home.nextSibling);
      // restart the fade-in
      panel.style.animation = 'none';
      void panel.offsetWidth;
      panel.style.animation = '';
      if (activeEl) activeEl.classList.remove('active');
      activeEl = el;
      el.classList.add('active');
    }

    function hide() {
      panel.hidden = true;
      if (activeEl) { activeEl.classList.remove('active'); activeEl = null; }
    }

    if (closeBtn) closeBtn.addEventListener('click', hide);
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (e.target.matches && e.target.matches('input, textarea, [contenteditable]')) return;
      if (!panel.hidden) hide();
    });

    document.querySelectorAll('.gloss[data-gloss]').forEach((el) => {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.addEventListener('mouseenter', () => show(el));
      el.addEventListener('focus', () => show(el));
      el.addEventListener('click', (e) => { e.preventDefault(); show(el); });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(el); }
      });
    });
  };

  // ----- Annotated-code engine ----- ----- ----- ----- ----- -----
  //
  // For code blocks that need hover-per-line explanations (Prism would wipe
  // the wrappers, so these use a local highlighter that emits Prism-style
  // .token spans — the Prism CDN theme paints them).
  //
  // Markup:
  //   <div class="code-annotated" data-lang="python">
  //     <div class="code-step" data-step="grp" data-step-name="Label"
  //          data-explain="Shown in the panel when this line is hovered.">raw code line</div>
  //     …
  //     <div class="code-explain-panel">Hover a line to see what it does.</div>
  //   </div>
  //
  // Call LabBase.initAnnotatedCode() once from viz.js after the DOM exists.
  const PY_KEYWORDS = /\b(def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|import|from|as|with|try|except|finally|raise|pass|break|continue|lambda|yield|assert|del|global|nonlocal|self)\b/g;
  const SQL_KEYWORDS = /\b(SELECT|FROM|WHERE|AND|OR|NOT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|ON|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP|BY|ORDER|HAVING|LIMIT|AS|DISTINCT|COUNT|SUM|AVG|MIN|MAX|NULL|PRIMARY|KEY|INT|VARCHAR|BEGIN|COMMIT|ROLLBACK|EXPLAIN|ANALYZE)\b/gi;

  NS.highlightLine = function (raw, lang) {
    // Split the line into protected segments (comments, strings) and plain
    // code, then apply token regexes only to the plain segments — so a
    // number inside a string can never be double-wrapped. Output uses
    // Prism-style .token spans (painted by the Prism CDN theme).
    function esc(t) {
      return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    const protectRe = /(#.*$|--.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/;
    const kw = lang === 'sql' ? SQL_KEYWORDS : PY_KEYWORDS;

    function plain(t) {
      // Mark tokens with \u0001name\u0002text\u0003, then resolve markers
      // innermost-first so nested matches can't corrupt one another.
      let s = esc(t);
      s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, '\u0001number\u0002$1\u0003');
      s = s.replace(kw, '\u0001keyword\u0002$&\u0003');
      if (lang !== 'sql') {
        s = s.replace(/\b(struct|os|open|len|range|print|bytes|bytearray|int|str|isinstance|ValueError|NotImplementedError)\b/g,
          '\u0001builtin\u0002$1\u0003');
      }
      let prev = null;
      while (prev !== s) {
        prev = s;
        s = s.replace(/\u0001(\w+)\u0002([^\u0001\u0002\u0003]*)\u0003/g,
          '<span class="token $1">$2</span>');
      }
      return s;
    }

    let out = '', rest = raw;
    while (rest.length) {
      const m = rest.match(protectRe);
      if (!m) { out += plain(rest); break; }
      out += plain(rest.slice(0, m.index));
      const cls = (m[0][0] === '#' || m[0][0] === '-') ? 'comment' : 'string';
      out += '<span class="token ' + cls + '">' + esc(m[0]) + '</span>';
      rest = rest.slice(m.index + m[0].length);
    }
    return out;
  };

  NS.initAnnotatedCode = function () {
    document.querySelectorAll('.code-annotated').forEach((block) => {
      const lang = block.getAttribute('data-lang') || 'python';
      const panel = block.querySelector('.code-explain-panel');
      const defaultMsg = panel ? panel.innerHTML : '';
      const steps = Array.from(block.querySelectorAll('.code-step'));

      steps.forEach((line) => {
        line.innerHTML = NS.highlightLine(line.textContent, lang) || '&nbsp;';
        const grp = line.getAttribute('data-step');

        line.addEventListener('mouseenter', () => {
          steps.forEach(l => l.classList.toggle('hl', l.getAttribute('data-step') === grp));
          if (panel) {
            const name = line.getAttribute('data-step-name');
            const explain = line.getAttribute('data-explain') || '';
            panel.innerHTML =
              (name ? '<span class="code-explain-name">' + name + '</span> ' : '') + explain;
            panel.classList.add('on');
          }
        });
      });

      block.addEventListener('mouseleave', () => {
        steps.forEach(l => l.classList.remove('hl'));
        if (panel) { panel.innerHTML = defaultMsg; panel.classList.remove('on'); }
      });
    });
  };
})();
