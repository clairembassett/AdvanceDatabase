/* View/controller for the reversible join trace. No network or Python needed. */
(function () {
  'use strict';
  const root = document.getElementById('viz-join-slots');
  const model = window.JoinWalkthrough;
  if (!root || !model || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const $ = id => root.querySelector('#' + id);
  const trace = model.buildTrace();
  const tables = model.tables;
  let index = 0, timer = null, playing = false, manualSlot = null, chosenOperator = null;
  const slots = [], blocks = [];
  const jobs = {
    project: ['Project(name, dept)', 'next() delegates to Select. After True, get_val() allows only name and dept, then delegates each read to the current input row. It does not advance either table.'],
    select: ['Select(mid = mid2 AND gpa > 35)', 'next() keeps asking ProductScan for pairs. It compares the two major IDs first. Only when they match does it read GPA. A rejected pair stays below Select; a passing pair becomes its current row.'],
    product: ['ProductScan(students, majors)', 'Hold a student while advancing majors. On right exhaustion, rewind majors, advance students, and try the first major. get_val() routes each field to the child whose schema contains it; no combined row is copied by the Python operator.'],
    students: ['TableScan(students)', 'RecordPage.next_after() checks four-byte slot flags after the cursor. It skips EMPTY slots. TableScan unpins the old block and pins the next block when necessary. get_val() uses the catalog layout to locate a field within the current slot.'],
    majors: ['TableScan(majors)', 'The inner scan repeats for each student. before_first() returns to block 0, slot -1. This block has six slots; only the first three are USED. Closing the plan releases its pin.']
  };

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function sameSlot(a, b) {
    return a && b && a.side === b.side && a.block === b.block && a.slot === b.slot;
  }
  function cursor(frame, side) { return side === 'students' ? frame.left : frame.right; }
  function labelOf(slot) {
    return slot.row ? (slot.row.name || slot.row.dept) : 'empty';
  }
  function buildBlocks() {
    Object.keys(tables).forEach(side => {
      const table = tables[side];
      const container = $( 'jw-' + side + '-blocks');
      table.blocks.forEach((records, blockIndex) => {
        const block = element('div', 'jw-block');
        const header = element('div', 'jw-block-head');
        const pin = element('span', 'jw-pin');
        header.append(element('span', '', 'Block ' + blockIndex), pin);
        const grid = element('div', 'jw-slots' + (side === 'majors' ? ' is-majors' : ''));
        records.forEach((record, slotIndex) => {
          const button = element('button', 'jw-slot');
          button.type = 'button';
          button.classList.toggle('is-empty', !record.used);
          button.classList.toggle('is-deleted', Boolean(record.deleted));
          button.dataset.side = side;
          button.dataset.block = blockIndex;
          button.dataset.slot = slotIndex;
          const marker = element('span', '', 'slot ' + slotIndex);
          button.append(marker, element('strong', '', labelOf(record)),
            element('span', '', record.used ? 'USED · 1' : 'EMPTY · 0'));
          button.addEventListener('click', () => {
            pause();
            manualSlot = { side: side, block: blockIndex, slot: slotIndex };
            render();
          });
          slots.push({ side: side, block: blockIndex, slot: slotIndex, button: button, marker: marker, record: record });
          grid.append(button);
        });
        const slack = table.blockSize - records.length * table.slotSize;
        block.append(header, grid, element('div', 'jw-slack', slack + ' bytes after the last slot'));
        container.append(block);
        blocks.push({ side: side, block: blockIndex, element: block, pin: pin });
      });
    });
  }
  function inspectTarget(frame) {
    if (manualSlot) return manualSlot;
    if (frame.access) return frame.access;
    if (frame.probe) return frame.probe;
    // Keep the latest slot access visible while calls return up the plan.
    for (let i = index - 1; i >= 0; i--) {
      if (trace[i].access) return trace[i].access;
      if (trace[i].probe) return trace[i].probe;
    }
    return { side: 'students', block: 0, slot: 0 };
  }
  function fieldList(table) {
    return [{ name: 'flag', offset: 0, size: 4, type: 'int' }].concat(table.fields);
  }
  function slotBytes(table, record) {
    const bytes = new Uint8Array(table.slotSize);
    const view = new DataView(bytes.buffer);
    view.setInt32(0, record.used ? 1 : 0, true);
    if (record.row) table.fields.forEach(field => {
      const value = record.row[field.name];
      if (field.type === 'int') view.setInt32(field.offset, value, true);
      else {
        const encoded = new TextEncoder().encode(value);
        view.setInt32(field.offset, encoded.length, true);
        bytes.set(encoded, field.offset + 4);
      }
    });
    return bytes;
  }
  function renderInspector(frame, target) {
    const table = tables[target.side];
    const record = table.blocks[target.block][target.slot];
    const base = target.slot * table.slotSize;
    const access = sameSlot(frame.access, target) ? frame.access : null;
    const probe = sameSlot(frame.probe, target) ? frame.probe : null;
    const activeField = access ? access.field : probe ? 'flag' : null;
    $('jw-inspector-title').textContent = target.side + '.tbl · block ' + target.block + ' · slot ' + target.slot;
    $('jw-follow').disabled = !manualSlot;
    $('jw-inspector-status').textContent = (manualSlot ? 'Inspection held here. ' : 'Following the latest slot access. ') +
      (record.deleted ? 'Deleted: flag = 0. Temp’s old field bytes remain, but scans must skip them.' :
        record.used ? 'USED: flag = 1. The stored fields are shown below.' : 'EMPTY: flag = 0. This never-used slot contains zeros.');
    const layout = $('jw-layout');
    layout.style.gridTemplateColumns = 'repeat(' + table.slotSize + ', minmax(0, 1fr))';
    layout.replaceChildren();
    fieldList(table).forEach(field => {
      const region = element('div', 'jw-field');
      region.style.gridColumn = 'span ' + field.size;
      region.classList.toggle('is-reading', field.name === activeField);
      const value = field.name === 'flag' ? (record.used ? 1 : 0) :
        record.row ? record.row[field.name] : field.type === 'int' ? 0 : '';
      region.append(element('span', '', field.name),
        element('strong', '', typeof value === 'string' ? '"' + value + '"' : value),
        element('small', '', '@' + field.offset + ' · ' + field.size + ' B'));
      region.title = field.name + ': slot-relative bytes ' + field.offset + '–' + (field.offset + field.size - 1) +
        (field.type === 'varchar' ? '; 4-byte length prefix + 8-byte capacity' : '');
      layout.append(region);
    });
    let address = 'Slot base = ' + target.slot + ' × ' + table.slotSize + ' = byte ' + base + ' of block ' + target.block + '.';
    if (activeField) {
      const field = fieldList(table).find(f => f.name === activeField);
      const offset = base + field.offset;
      address = activeField + ': ' + target.slot + ' × ' + table.slotSize + ' + ' + field.offset +
        ' = byte ' + offset + ' in block ' + target.block +
        ' (file offset ' + (target.block * table.blockSize + offset) + ').';
      if (field.type === 'varchar') {
        const length = new TextEncoder().encode(record.row[field.name]).length;
        address += ' Read 4 length bytes, then ' + length + ' UTF-8 bytes. The reserved field region is ' + field.size + ' bytes.';
      } else address += ' Read 4 bytes.';
    }
    $('jw-address').textContent = address;
    const bytes = $('jw-bytes');
    bytes.replaceChildren();
    const active = fieldList(table).find(f => f.name === activeField);
    slotBytes(table, record).forEach((value, position) => {
      const byte = element('div', 'jw-byte');
      // String reads stop at their length; unused capacity is not highlighted.
      const readSize = active && active.type === 'varchar' ?
        4 + new TextEncoder().encode(record.row[active.name]).length : active ? active.size : 0;
      byte.classList.toggle('is-reading', Boolean(active && position >= active.offset && position < active.offset + readSize));
      byte.append(element('small', '', '@' + (base + position)), element('strong', '', value.toString(16).padStart(2, '0')));
      bytes.append(byte);
    });
  }
  function nextIndex(event) {
    for (let i = index + 1; i < trace.length; i++) if (trace[i].event === event) return i;
    return trace.length - 1;
  }
  function render() {
    const frame = trace[index];
    const target = inspectTarget(frame);
    $('jw-progress').textContent = 'Step ' + index + ' / ' + (trace.length - 1);
    $('jw-message').textContent = frame.message;
    $('jw-message').parentElement.dataset.direction = frame.direction;
    $('jw-direction').textContent = frame.direction === 'down' ? '↓ Request / field lookup' :
      frame.direction === 'up' ? '↑ Return to caller' : '• Cursor / storage state';
    const counts = $('jw-counts');
    counts.replaceChildren();
    [['rootCalls', 'root next() calls'], ['pairs', 'candidate pairs'], ['outputs', 'rows out'], ['rewinds', 'right rewinds']].forEach(item => {
      const stat = element('span');
      stat.append(element('strong', '', frame.counts[item[0]]), document.createTextNode(' ' + item[1]));
      counts.append(stat);
    });
    Object.keys(jobs).forEach(actor => {
      const active = actor === frame.actor;
      $('jw-' + actor).classList.toggle('is-active', active);
      $('jw-' + actor).classList.toggle('is-return', active && frame.direction === 'up');
      const edge = $('jw-link-' + actor);
      if (edge) {
        edge.classList.toggle('is-active', active);
        edge.classList.toggle('is-return', active && frame.direction === 'up');
      }
    });
    $('jw-project-state').textContent = frame.event === 'output' ? 'Returned (' + frame.output[frame.output.length - 1].join(', ') + ')' :
      frame.done ? 'Closed · both scans released' : frame.event === 'exhausted' && frame.actor === 'project' ? 'next() → False' : 'Only name and dept are visible here';
    const pred = frame.predicate;
    $('jw-predicate').textContent = pred.join === null ? 'No predicate check on this pair yet' :
      'mid = mid2: ' + (pred.join ? 'True' : 'False') + ' · gpa > 35: ' +
      (pred.gpa === null ? (pred.join ? 'not checked yet' : 'skipped') : pred.gpa ? 'True' : 'False');
    $('jw-pair-state').textContent = frame.pair ? frame.pair.name + ' × ' + frame.pair.dept +
      ' · mid ' + frame.pair.mid + ' / mid2 ' + frame.pair.mid2 : 'No current pair';
    ['students', 'majors'].forEach(side => {
      const c = cursor(frame, side);
      $('jw-' + side + '-cursor').textContent = 'block ' + c.block + ' · current_slot ' + c.slot +
        (c.pinned ? ' · pinned' : ' · unpinned');
    });
    blocks.forEach(b => {
      const c = cursor(frame, b.side), pinned = c.pinned && c.block === b.block;
      b.element.classList.toggle('is-pinned', pinned);
      b.pin.textContent = pinned ? '● pinned' : 'unpinned';
    });
    slots.forEach(s => {
      const c = cursor(frame, s.side);
      const current = c.pinned && c.block === s.block && c.slot === s.slot;
      const reading = sameSlot(frame.probe, s) || sameSlot(frame.access, s);
      s.button.classList.toggle('is-current', current);
      s.button.classList.toggle('is-reading', reading);
      s.button.setAttribute('aria-pressed', String(sameSlot(target, s)));
      s.marker.textContent = (current ? '▶ ' : '') + 'slot ' + s.slot;
      s.button.setAttribute('aria-label', s.side + ', block ' + s.block + ', slot ' + s.slot +
        ': ' + (s.record.used ? 'USED' : 'EMPTY') + ', ' + labelOf(s.record) +
        (current ? ', current cursor' : '') + (reading ? ', being read' : ''));
    });
    const output = $('jw-output');
    output.replaceChildren();
    if (!frame.output.length) output.textContent = 'No rows yet.';
    else frame.output.forEach(row => output.append(element('span', '', '(' + row.join(', ') + ')')));
    const actor = chosenOperator || (jobs[frame.actor] ? frame.actor : 'project');
    $('jw-operator-title').textContent = jobs[actor][0] + ' · operator details';
    $('jw-operator-description').textContent = jobs[actor][1];
    $('jw-stack').textContent = 'Call stack (outermost first):\n' + (frame.stack.length ? frame.stack.join('\n  → ') : 'Caller is between calls.');
    renderInspector(frame, target);
    const atEnd = index === trace.length - 1;
    $('jw-back').disabled = index === 0;
    ['jw-step', 'jw-pair', 'jw-result', 'jw-play'].forEach(id => { $(id).disabled = atEnd; });
    $('jw-result').textContent = nextIndex('output') === trace.length - 1 ? 'Finish scan' : 'Next result';
    $('jw-play').textContent = playing ? 'Pause' : 'Play';
    $('jw-play').setAttribute('aria-pressed', String(playing));
  }
  function pause() {
    playing = false;
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    $('jw-play').textContent = 'Play';
    $('jw-play').setAttribute('aria-pressed', 'false');
  }
  function go(to) {
    index = Math.max(0, Math.min(trace.length - 1, to));
    chosenOperator = null;
    if (index === trace.length - 1) pause();
    render();
  }
  function tick() {
    timer = null;
    if (!playing) return;
    if (document.hidden || root.closest('.slide-hidden')) { pause(); return; }
    go(index + 1);
    if (playing) timer = window.setTimeout(tick, 650);
  }
  function reset() {
    pause();
    manualSlot = null;
    $('jw-jump').value = 'start';
    go(0);
  }
  $('jw-step').addEventListener('click', () => { pause(); go(index + 1); });
  $('jw-back').addEventListener('click', () => { pause(); go(index - 1); });
  $('jw-pair').addEventListener('click', () => { pause(); go(nextIndex('pair')); });
  $('jw-result').addEventListener('click', () => { pause(); go(nextIndex('output')); });
  $('jw-play').addEventListener('click', () => {
    if (playing) { pause(); render(); return; }
    playing = true;
    render();
    timer = window.setTimeout(tick, 650);
  });
  $('jw-reset').addEventListener('click', reset);
  $('jw-follow').addEventListener('click', () => { manualSlot = null; render(); });
  $('jw-jump').addEventListener('change', () => {
    pause();
    manualSlot = null;
    const value = $('jw-jump').value;
    const targets = {
      start: () => true,
      'first-result': f => f.event === 'output',
      'join-reject': f => f.event === 'join-check' && f.predicate.join === false,
      'gpa-reject': f => f.event === 'gpa-check' && f.predicate.gpa === false,
      'block-change': f => f.event === 'pin' && f.left.block === 1,
      deleted: f => f.probe && f.probe.side === 'students' && f.probe.block === 1 && f.probe.slot === 2,
      end: f => f.event === 'exhausted'
    };
    const target = trace.findIndex(targets[value]);
    go(target < 0 ? trace.length - 1 : target);
  });
  Object.keys(jobs).forEach(actor => {
    $('jw-' + actor).addEventListener('click', () => {
      pause();
      chosenOperator = actor;
      $('jw-operator-detail').open = true;
      render();
    });
  });
  root.addEventListener('keydown', event => {
    const navigation = ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'PageDown', 'PageUp'];
    if (event.target.matches('select, input, textarea, summary')) {
      // Preserve native controls without changing the containing lecture slide.
      if (event.key !== 'Escape') event.stopPropagation();
      return;
    }
    if (!navigation.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation(); // Keep presentation-mode navigation outside the widget.
    pause();
    if (event.key === 'Home') reset();
    else go(event.key === 'End' ? trace.length - 1 : index + (['ArrowRight', 'PageDown'].includes(event.key) ? 1 : -1));
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  buildBlocks();
  render();
}());
