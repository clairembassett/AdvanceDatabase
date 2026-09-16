/* Replay snapshots recorded from the actual Python storage implementation. */
(function () {
  'use strict';
  const root = document.getElementById('viz-statements');
  const data = window.StatementTraces;
  if (!root || !data || root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const $ = id => root.querySelector('#' + id);
  const decoder = new TextDecoder();
  let stage = data.stages[0], index = 0, held = null, timer = null, playing = false;
  const contexts = {
    create: 'Start with an empty database, 128-byte blocks, and eight empty buffer frames. CREATE records schemas in the two catalog files.',
    insert: 'Continue after CREATE. Opening a TableScan creates each data file. Watch the USED flag and each field change separately, then flush.',
    delete: 'Continue after INSERT has flushed. Find sid 7 and clear only its slot flag. Compare the changed RAM page with the old file contents.',
    select: 'Continue after DELETE has flushed. Follow Project → Select → TableScan as it returns Ada, Cyd, and Eli. This stage only reads.'
  };
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function layoutFor(file) { return data.layouts[file.replace(/\.tbl$/, '')]; }
  function fileAt(frame, name) { return frame.files.find(file => file.name === name); }
  function resident(frame, target) {
    return target && frame.buffers.find(b => b.file === target.file && b.block === target.block);
  }
  function sameBlock(a, b) { return a && b && a.file === b.file && a.block === b.block; }
  function fields(layout) {
    return [{ name: 'flag', offset: 0, size: 4, type: 'int' }].concat(layout.fields);
  }
  function valueAt(bytes, offset, field) {
    if (!bytes) return null;
    const array = new Uint8Array(bytes), view = new DataView(array.buffer);
    const value = view.getInt32(offset + field.offset, true);
    if (field.type === 'int') return value;
    const length = Math.max(0, Math.min(value, field.size - 4));
    return decoder.decode(array.slice(offset + field.offset + 4, offset + field.offset + 4 + length));
  }
  function values(bytes, slot, layout) {
    const result = {};
    fields(layout).forEach(field => { result[field.name] = valueAt(bytes, slot * layout.slotSize, field); });
    return result;
  }
  function display(value) { return value === null ? '—' : typeof value === 'string' ? '"' + value + '"' : String(value); }
  function differs(a, b, start, size) {
    return Boolean(a && b && a.slice(start, start + size).some((value, i) => value !== b[start + i]));
  }
  function targetFor(frame) {
    if (held) return held;
    for (let i = index; i >= 0; i--) {
      const focus = stage.frames[i].focus;
      if (!focus || !focus.file) continue;
      const file = fileAt(frame, focus.file);
      if (!file) continue;
      if (!file.blocks.length) return { file: file.name, block: null, slot: 0 };
      const block = Number.isInteger(focus.block) ? focus.block : 0;
      if (file.blocks[block]) return { file: file.name, block: block, slot: Number.isInteger(focus.slot) && focus.slot >= 0 ? focus.slot : 0 };
    }
    const first = frame.files.find(file => file.blocks.length);
    return first ? { file: first.name, block: 0, slot: 0 } : null;
  }
  function choose(file, block, slot) {
    pause();
    held = { file: file, block: block, slot: slot || 0 };
    render();
  }
  function button(className, text, key, action) {
    const node = el('button', className, text);
    node.type = 'button';
    node.dataset.focusKey = key;
    node.addEventListener('click', action);
    return node;
  }
  function renderCode(frame) {
    Array.from($('sw-code').children).forEach((line, i) => {
      const active = i + 1 === frame.line;
      line.classList.toggle('is-active', active);
      line.classList.toggle('is-complete', active && frame.phase === 'after');
      if (active) line.setAttribute('aria-current', 'step');
      else line.removeAttribute('aria-current');
    });
    const active = $('sw-code').children[frame.line - 1];
    if (active) {
      const list = $('sw-code'), top = active.offsetTop - list.offsetTop;
      if (top < list.scrollTop || top + active.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = Math.max(0, top - list.clientHeight / 2);
      }
    }
    const helper = frame.helper;
    $('sw-helper-title').textContent = helper ? 'Inside ' + helper.name + ' · line ' + helper.line : 'Inside this call';
    const code = $('sw-helper-code');
    code.replaceChildren();
    if (helper) helper.code.forEach((text, i) => {
      const line = el('span', 'sw-helper-line', (i + 1) + '  ' + text);
      line.classList.toggle('is-active', i + 1 === helper.line);
      code.append(line);
    });
    else code.textContent = 'Step into a storage call to see its actual Python implementation.';
    const locals = $('sw-locals');
    locals.replaceChildren();
    Object.entries(frame.locals).forEach(([key, value]) => {
      const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const item = el('span', 'sw-local', key + ' = ' + text);
      locals.append(item);
    });
    $('sw-output').textContent = frame.output.length ? frame.output.join('\n') : 'No output yet.';
  }
  function renderBuffers(frame, target) {
    const box = $('sw-buffers');
    box.replaceChildren();
    frame.buffers.forEach(buffer => {
      const b = button('sw-frame', undefined, 'buffer-' + buffer.index,
        () => choose(buffer.file, buffer.block, sameBlock(buffer, target) ? target.slot : 0));
      b.disabled = buffer.file === null;
      b.classList.toggle('is-pinned', buffer.pins > 0);
      b.classList.toggle('is-dirty', buffer.dirty);
      b.setAttribute('aria-pressed', String(Boolean(sameBlock(buffer, target))));
      b.append(el('span', '', 'Frame ' + buffer.index),
        el('strong', '', buffer.file ? buffer.file + ' · b' + buffer.block : 'empty frame'),
        el('small', '', buffer.file ? 'pins ' + buffer.pins + ' · ' + (buffer.dirty ? 'DIRTY · needs writing' : 'clean') : 'available'));
      box.append(b);
    });
    const disk = $('sw-files');
    disk.replaceChildren();
    if (!frame.files.length) disk.append(el('div', 'sw-empty', 'No database files exist yet.'));
    frame.files.forEach(file => {
      const card = el('div', 'sw-file');
      const header = el('div', 'sw-file-head');
      header.append(el('strong', '', file.name), el('span', '', file.blocks.length * data.blockSize + ' bytes'));
      const buttons = el('div', 'sw-file-blocks');
      if (!file.blocks.length) buttons.textContent = 'File created · no blocks yet';
      file.blocks.forEach((block, i) => {
        const b = button('sw-file-block', 'Block ' + i, file.name + '-file-' + i,
          () => choose(file.name, i, target && target.file === file.name && target.block === i ? target.slot : 0));
        b.setAttribute('aria-pressed', String(Boolean(target && target.file === file.name && target.block === i)));
        buttons.append(b);
      });
      card.append(header, buttons);
      disk.append(card);
    });
    const counts = $('sw-counts');
    counts.replaceChildren();
    [['hits', 'buffer hits'], ['misses', 'buffer misses'], ['reads', 'block reads'], ['writes', 'page writes']].forEach(([key, label]) => {
      counts.append(el('span', '', frame.counts[key] + ' ' + label));
    });
    counts.append(el('span', '', 'cumulative since setup'));
    $('sw-transfer').textContent = frame.event === 'disk-write' ? 'RAM → FileManager.write(): copy this page into its file block' :
      frame.event === 'pin-miss' ? 'File → RAM: load a block into a buffer frame' :
      frame.event === 'pin-hit' ? 'Buffer hit: reuse the resident page; no file read' :
      frame.event === 'unpin' || frame.event === 'scan-close' ? 'Unpin releases the scan’s hold. It does not flush or evict the page.' :
      'Files → pin loads missing blocks · flush writes dirty pages → files';
  }
  function renderSlots(frame, target, layout, bytes, otherBytes, side) {
    const holder = $(side === 'ram' ? 'sw-ram-slots' : 'sw-file-slots');
    holder.replaceChildren();
    if (!bytes) {
      holder.append(el('div', 'sw-empty', side === 'ram' ? 'This block is not resident in the buffer pool.' : 'No file block yet.'));
      return;
    }
    const grid = el('div', 'sw-slots'), count = Math.floor(data.blockSize / layout.slotSize);
    for (let slot = 0; slot < count; slot++) {
      const row = values(bytes, slot, layout), base = slot * layout.slotSize;
      const label = row.name || row.dept || (row.fldname ? row.tblname + '.' + row.fldname : row.tblname) ||
        (row.sid ? 'sid ' + row.sid : row.mid2 ? 'mid2 ' + row.mid2 : row.flag === 1 ? 'fields not set' : 'empty');
      const current = side === 'ram' && frame.cursors.some(c => !c.closed && c.file === target.file && c.block === target.block && c.slot === slot);
      const accessed = sameBlock(frame.focus, target) && frame.focus.slot === slot;
      const b = button('sw-slot', undefined, side + '-slot-' + slot, () => choose(target.file, target.block, slot));
      b.classList.toggle('is-empty', row.flag !== 1);
      b.classList.toggle('is-different', differs(bytes, otherBytes, base, layout.slotSize));
      b.classList.toggle('is-current', current);
      b.classList.toggle('is-accessed', Boolean(accessed));
      b.setAttribute('aria-pressed', String(slot === target.slot));
      b.setAttribute('aria-label', side + ', ' + target.file + ', block ' + target.block + ', slot ' + slot + ': ' + (row.flag === 1 ? 'USED' : 'EMPTY') + ', ' + label);
      b.append(el('span', '', (current ? '▶ ' : '') + 'slot ' + slot + ' · byte ' + base),
        el('strong', '', label), el('span', '', (row.flag === 1 ? 'USED' : 'EMPTY') + ' · flag ' + row.flag));
      grid.append(b);
    }
    holder.append(grid, el('div', 'sw-slack', count + ' slots × ' + layout.slotSize + ' B + ' +
      (data.blockSize - count * layout.slotSize) + ' unused bytes'));
  }
  function renderInspector(frame, target) {
    $('sw-follow').disabled = !held;
    if (!target || target.block === null) {
      $('sw-block-title').textContent = target ? target.file + ' · no blocks yet' : 'Block inspector';
      $('sw-inspector-note').textContent = target ? 'The empty file exists. A later append will add its first zero-filled block.' :
        'No block exists yet. Step through CREATE to see the catalog files appear.';
      ['sw-cursors', 'sw-ram-slots', 'sw-file-slots', 'sw-fields', 'sw-bytes', 'sw-address'].forEach(id => $(id).replaceChildren());
      $('sw-slot-title').textContent = 'Slot fields · waiting for a block';
      return;
    }
    const layout = layoutFor(target.file);
    const file = fileAt(frame, target.file);
    if (!layout || !file || !file.blocks[target.block]) return;
    const buffer = resident(frame, target), ram = buffer ? buffer.bytes : null, disk = file.blocks[target.block].bytes;
    target.slot = Math.max(0, Math.min(Math.floor(data.blockSize / layout.slotSize) - 1, target.slot));
    const base = target.slot * layout.slotSize;
    $('sw-block-title').textContent = target.file + ' · block ' + target.block;
    const diffCount = ram ? ram.filter((v, i) => v !== disk[i]).length : 0;
    $('sw-inspector-note').textContent = (held ? 'Inspection held here. ' : 'Following execution. ') +
      (ram ? diffCount ? diffCount + ' byte(s) differ between RAM and the file. Amber cells show pending changes.' :
        'The RAM and file bytes currently match.' : 'The file block exists; no frame currently holds it.');
    const cursors = frame.cursors.filter(c => !c.closed && c.file === target.file);
    $('sw-cursors').textContent = cursors.length ? cursors.map(c => c.name + ': block ' + c.block + ', current_slot = ' + c.slot).join(' · ') : 'No open scan holds a cursor on this file.';
    renderSlots(frame, target, layout, ram, disk, 'ram');
    renderSlots(frame, target, layout, disk, ram, 'file');
    const accessed = sameBlock(frame.focus, target) && frame.focus.slot === target.slot;
    const fieldName = accessed ? frame.focus.field : null;
    $('sw-slot-title').textContent = 'Slot ' + target.slot + ' · layout ' + layout.slotSize + ' bytes · decoded fields';
    const body = $('sw-fields');
    body.replaceChildren();
    fields(layout).forEach(field => {
      const row = el('tr');
      row.classList.toggle('is-accessed', Boolean(accessed && (field.name === fieldName || (field.name === 'flag' && frame.event === 'slot-probe'))));
      [field.name, field.offset, field.size + ' B', display(valueAt(ram, base, field)), display(valueAt(disk, base, field))].forEach((value, column) => {
        const cell = el('td', '', value);
        if (column >= 3 && differs(ram, disk, base + field.offset, field.size)) cell.classList.toggle('is-different', true);
        row.append(cell);
      });
      body.append(row);
    });
    let address = 'Slot base: ' + target.slot + ' × ' + layout.slotSize + ' = byte ' + base + ' in block ' + target.block + '.';
    if (accessed && Number.isInteger(frame.focus.byteOffset)) {
      address = (fieldName || 'flag') + ': ' + target.slot + ' × ' + layout.slotSize + ' + ' +
        (frame.focus.byteOffset - base) + ' = block byte ' + frame.focus.byteOffset +
        '; file offset ' + (target.block * data.blockSize + frame.focus.byteOffset) + '.';
    }
    $('sw-address').textContent = address;
    const bytes = $('sw-bytes');
    bytes.replaceChildren();
    for (let i = base; i < base + layout.slotSize; i++) {
      const cell = el('div', 'sw-byte');
      cell.classList.toggle('is-different', Boolean(ram && ram[i] !== disk[i]));
      cell.classList.toggle('is-accessed', Boolean(accessed && Number.isInteger(frame.focus.byteOffset) && i >= frame.focus.byteOffset && i < frame.focus.byteOffset + frame.focus.length));
      cell.append(el('small', '', '@' + i), el('span', '', (ram ? ram[i].toString(16).padStart(2, '0') : '—') + ' / ' + disk[i].toString(16).padStart(2, '0')));
      bytes.append(cell);
    }
  }
  function renderLayout(frame) {
    const layout = frame.layout, box = $('sw-layout');
    box.replaceChildren();
    $('sw-layout-title').textContent = layout ? 'Layout in use: ' + layout.name + ' · ' + layout.slotSize + ' bytes per slot' : 'Layout · no table layout computed yet';
    if (layout) fields(layout).forEach(field => box.append(el('span', '', field.name + ' @' + field.offset + ' · ' + field.size + ' B')));
    else box.textContent = 'The schema’s fields will determine their offsets and the slot size.';
  }
  function render() {
    const frame = stage.frames[index];
    const focus = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.focusKey : null;
    const target = targetFor(frame);
    $('sw-message').textContent = frame.message;
    $('sw-message').parentElement.dataset.phase = frame.phase;
    $('sw-phase').textContent = frame.done ? stage.title + ' · finished' :
      frame.line ? 'Line ' + frame.line + (frame.phase === 'after' ? ' · completed' : ' · inside this call') : 'Before execution';
    $('sw-progress').textContent = 'Step ' + index + ' / ' + (stage.frames.length - 1);
    renderCode(frame);
    renderBuffers(frame, target);
    renderInspector(frame, target);
    renderLayout(frame);
    const done = index === stage.frames.length - 1;
    $('sw-back').disabled = index === 0;
    ['sw-step', 'sw-line', 'sw-change', 'sw-finish', 'sw-play'].forEach(id => { $(id).disabled = done; });
    $('sw-play').textContent = playing ? 'Pause' : 'Play';
    $('sw-play').setAttribute('aria-pressed', String(playing));
    if (focus) Array.from(root.querySelectorAll('[data-focus-key]')).find(node => node.dataset.focusKey === focus)?.focus();
  }
  function pause() {
    playing = false;
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    $('sw-play').textContent = 'Play';
    $('sw-play').setAttribute('aria-pressed', 'false');
  }
  function go(to) {
    index = Math.max(0, Math.min(stage.frames.length - 1, to));
    if (index === stage.frames.length - 1) pause();
    // A held block may not exist when stepping backward through its creation.
    if (held && !stage.frames[index].files.some(f => f.name === held.file && f.blocks[held.block])) held = null;
    render();
  }
  function seek(events) {
    for (let i = index + 1; i < stage.frames.length; i++) if (events.includes(stage.frames[i].event)) return i;
    return stage.frames.length - 1;
  }
  function load(id) {
    pause();
    stage = data.stages.find(s => s.id === id) || data.stages[0];
    index = 0;
    held = null;
    Array.from(root.querySelectorAll('[data-stage]')).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.stage === stage.id)));
    $('sw-context').textContent = contexts[stage.id];
    $('sw-sql').textContent = stage.sql;
    $('sw-change').textContent = stage.id === 'select' ? 'Next field read' : 'Next storage change';
    const code = $('sw-code');
    code.replaceChildren();
    stage.code.forEach(text => { const line = el('li'); line.append(el('code', '', text)); code.append(line); });
    code.scrollTop = 0;
    render();
  }
  function tick() {
    timer = null;
    if (!playing) return;
    if (document.hidden || root.closest('.slide-hidden')) { pause(); return; }
    go(index + 1);
    if (playing) timer = window.setTimeout(tick, 700);
  }
  $('sw-step').addEventListener('click', () => { pause(); go(index + 1); });
  $('sw-back').addEventListener('click', () => { pause(); go(index - 1); });
  $('sw-line').addEventListener('click', () => { pause(); go(seek(['line'])); });
  $('sw-change').addEventListener('click', () => {
    pause();
    go(seek(stage.id === 'select' ? ['field-read'] : ['file-created', 'block-appended', 'slot-flag', 'field-write', 'disk-write']));
  });
  $('sw-finish').addEventListener('click', () => { pause(); go(stage.frames.length - 1); });
  $('sw-reset').addEventListener('click', () => load(stage.id));
  $('sw-follow').addEventListener('click', () => { held = null; render(); });
  $('sw-play').addEventListener('click', () => {
    if (playing) { pause(); render(); return; }
    playing = true;
    render();
    timer = window.setTimeout(tick, 700);
  });
  Array.from(root.querySelectorAll('[data-stage]')).forEach(button => button.addEventListener('click', () => load(button.dataset.stage)));
  $('sw-expand').hidden = !root.requestFullscreen || document.fullscreenEnabled === false;
  $('sw-expand').addEventListener('click', async () => {
    pause();
    try {
      if (document.fullscreenElement === root) await document.exitFullscreen();
      else await root.requestFullscreen();
    } catch (error) {
      $('sw-message').textContent = 'Full screen is unavailable here. All controls still work in the page.';
    }
  });
  document.addEventListener('fullscreenchange', () => {
    $('sw-expand').textContent = document.fullscreenElement === root ? 'Exit full screen' : 'Full screen';
  });
  Array.from(document.querySelectorAll('[data-statement-stage]')).forEach(link => link.addEventListener('click', () => load(link.dataset.statementStage)));
  root.addEventListener('keydown', event => {
    if (event.target.matches('select, input, textarea, summary')) {
      if (event.key !== 'Escape') event.stopPropagation();
      return;
    }
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End', 'PageDown', 'PageUp'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    pause();
    if (event.key === 'Home') load(stage.id);
    else go(event.key === 'End' ? stage.frames.length - 1 : index + (['ArrowRight', 'PageDown'].includes(event.key) ? 1 : -1));
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  load(stage.id);
}());
