'use strict';

// Run with: node tests/test_statement_walkthrough_ui.js
// Execute the real controller against its HTML in a small DOM contract harness.
// This checks state, byte inspection, controls, and timing; browser QA checks layout.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { TextDecoder } = require('node:util');
const lab = path.join(__dirname, '../labs/lab-04');
const html = fs.readFileSync(path.join(lab, 'scans.html'), 'utf8');
const decode = text => text.replace(/&(lt|gt|amp|quot|apos|#39);/g,
  (_, name) => ({ lt: '<', gt: '>', amp: '&', quot: '"', apos: "'", '#39': "'" })[name]);

class Node {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.listeners = {};
    this.parentElement = null;
    this.className = '';
    this.disabled = false;
    this.offsetTop = this.offsetHeight = this.scrollTop = 0;
    this.clientHeight = 300;
    this._text = '';
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      toggle: (name, enabled) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        if (enabled === undefined) enabled = !classes.has(name);
        if (enabled) classes.add(name); else classes.delete(name);
        this.className = [...classes].join(' ');
        return enabled;
      }
    };
  }
  set textContent(value) {
    this._text = String(value);
    this.children.forEach(child => { child.parentElement = null; });
    this.children = [];
  }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  append(...nodes) { nodes.forEach(node => { node.parentElement = this; this.children.push(node); }); }
  replaceChildren(...nodes) { this.textContent = ''; this.append(...nodes); }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'class') this.className = String(value);
    if (name === 'disabled') this.disabled = true;
    if (name === 'value') this.value = String(value);
    if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
  }
  getAttribute(name) {
    if (name.startsWith('data-')) return this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] ?? null;
    return this.attributes[name] ?? null;
  }
  removeAttribute(name) { delete this.attributes[name]; }
  focus() { document.activeElement = this; }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  matches(selector) {
    return selector.split(',').some(part => {
      const token = part.trim();
      if (token.startsWith('.')) return this.classList.contains(token.slice(1));
      if (token.startsWith('#')) return this.getAttribute('id') === token.slice(1);
      if (token.startsWith('[')) return this.getAttribute(token.slice(1, -1)) !== null;
      return token.toUpperCase() === this.tagName;
    });
  }
  querySelectorAll(selector) {
    return this.children.flatMap(child => (child.matches(selector) ? [child] : []).concat(child.querySelectorAll(selector)));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) {
    for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node;
    return null;
  }
  dispatch(type, extra = {}) {
    const event = Object.assign({ target: this, stopped: false, defaultPrevented: false,
      stopPropagation() { this.stopped = true; }, preventDefault() { this.defaultPrevented = true; }
    }, extra);
    if (type === 'click' && this.disabled) return event;
    for (let node = this; node && !event.stopped; node = node.parentElement) {
      (node.listeners[type] || []).forEach(listener => listener(event));
    }
    return event;
  }
}

// Parse the widget's actual nested elements; ID queries stay scoped to the widget.
const opening = html.match(/<div\b[^>]*\bid="viz-statements"[^>]*>/);
assert(opening, 'The page contains the statement widget');
const document = new Node('document');
document.hidden = false;
document.activeElement = null;
document.createElement = tag => new Node(tag);
document.createTextNode = text => { const node = new Node('#text'); node.textContent = text; return node; };
document.getElementById = id => document.querySelector('#' + id);
const stack = [document];
for (const match of html.slice(opening.index).matchAll(/<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/g)) {
  const token = match[0];
  if (token.startsWith('<!--')) continue;
  if (token.startsWith('</')) {
    assert.equal(stack.at(-1).tagName, token.match(/^<\/([\w-]+)/)[1].toUpperCase(), 'Balanced widget markup');
    stack.pop();
    if (stack.length === 1) break;
  } else if (token.startsWith('<')) {
    const tag = token.match(/^<([\w-]+)/)[1];
    const node = new Node(tag);
    for (const attr of token.slice(tag.length + 1, -1).matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) {
      node.setAttribute(attr[1], decode(attr[2] || ''));
    }
    stack.at(-1).append(node);
    if (!['br', 'hr', 'input', 'img', 'meta', 'link'].includes(tag)) stack.push(node);
  } else if (token.trim()) stack.at(-1).append(document.createTextNode(decode(token)));
}
const allIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(allIds).size, allIds.length, 'HTML IDs must remain unique');
const get = id => { const node = document.getElementById(id); assert(node, 'Missing widget element: ' + id); return node; };
const root = get('viz-statements');
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1].split('?')[0]);
assert(scripts.includes('statement-traces.js') && scripts.includes('statement-walkthrough.js'));
assert(scripts.indexOf('statement-traces.js') < scripts.indexOf('statement-walkthrough.js'));
// The inline CREATE/INSERT/DELETE/SELECT links live outside the widget.
const entryLinks = [...html.matchAll(/<a\b[^>]*\bdata-statement-stage="([^"]+)"[^>]*>/g)].map(match => {
  const node = new Node('a');
  node.setAttribute('data-statement-stage', match[1]);
  document.append(node);
  return node;
});
assert.deepEqual(entryLinks.map(link => link.dataset.statementStage), ['create', 'insert', 'delete', 'select']);

let timerId = 0;
const timers = new Map();
const context = { document, TextDecoder,
  setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
  clearTimeout(id) { timers.delete(id); }
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(lab, 'statement-traces.js'), 'utf8'), context);
const controller = fs.readFileSync(path.join(lab, 'statement-walkthrough.js'), 'utf8');
vm.runInContext(controller, context);
const model = context.StatementTraces;
const originalModel = JSON.stringify(model);
const plain = value => JSON.parse(JSON.stringify(value));
let stage = model.stages[0];
const click = id => get(id).dispatch('click');
const text = id => get(id).textContent;
const index = () => Number(text('sw-progress').match(/^Step (\d+) \/ /)[1]);
const frame = () => stage.frames[index()];
const tabs = root.querySelectorAll('[data-stage]');
const slots = side => get('sw-' + side + '-slots').querySelectorAll('.sw-slot');
const byFocusKey = key => root.querySelectorAll('[data-focus-key]').find(node => node.dataset.focusKey === key);
const nextEvent = events => {
  const next = stage.frames.findIndex((f, i) => i > index() && events.includes(f.event));
  return next < 0 ? stage.frames.length - 1 : next;
};
function load(id, entry = false) {
  stage = model.stages.find(item => item.id === id);
  const node = (entry ? entryLinks : tabs).find(item => (entry ? item.dataset.statementStage : item.dataset.stage) === id);
  node.dispatch('click');
  assert.equal(index(), 0);
  assert.equal(timers.size, 0);
  assert.equal(get('sw-play').getAttribute('aria-pressed'), 'false');
  assert(get('sw-follow').disabled);
  tabs.forEach(tab => assert.equal(tab.getAttribute('aria-pressed'), String(tab.dataset.stage === id)));
  assert.equal(text('sw-sql'), stage.sql);
  assert.deepEqual(get('sw-code').children.map(line => line.textContent), plain(stage.code));
  assert.equal(text('sw-change'), id === 'select' ? 'Next field read' : 'Next storage change');
}
function moveTo(wanted) {
  while (index() < wanted) click('sw-step');
  while (index() > wanted) click('sw-back');
}
function runTimer() {
  assert.equal(timers.size, 1, 'Playback has exactly one pending tick');
  const [id, timer] = timers.entries().next().value;
  assert.equal(timer.delay, 700);
  timers.delete(id);
  timer.fn();
}
function decoded(bytes, offset, field) {
  if (!bytes) return '—';
  const value = Buffer.from(bytes).readInt32LE(offset + field.offset);
  return field.type === 'int' ? String(value)
    : '"' + Buffer.from(bytes.slice(offset + field.offset + 4, offset + field.offset + 4 + value)).toString('utf8') + '"';
}
function checkFrame() {
  const f = frame();
  assert.equal(text('sw-message'), f.message);
  assert.equal(get('sw-message').parentElement.dataset.phase, f.phase);
  assert.equal(text('sw-output'), f.output.length ? f.output.join('\n') : 'No output yet.');
  assert.equal(get('sw-back').disabled, index() === 0);
  for (const id of ['sw-step', 'sw-line', 'sw-change', 'sw-finish', 'sw-play']) {
    assert.equal(get(id).disabled, index() === stage.frames.length - 1);
  }
  get('sw-code').children.forEach((line, i) => {
    const active = i + 1 === f.line;
    assert.equal(line.classList.contains('is-active'), active);
    assert.equal(line.classList.contains('is-complete'), active && f.phase === 'after');
    assert.equal(line.getAttribute('aria-current'), active ? 'step' : null);
  });
  assert.equal(text('sw-phase'), f.done ? stage.title + ' · finished'
    : f.line ? 'Line ' + f.line + (f.phase === 'after' ? ' · completed' : ' · inside this call') : 'Before execution');
  if (f.helper) {
    assert.equal(text('sw-helper-title'), 'Inside ' + f.helper.name + ' · line ' + f.helper.line);
    assert.equal(get('sw-helper-code').children.length, f.helper.code.length);
    get('sw-helper-code').children.forEach((line, i) => {
      assert.equal(line.textContent, (i + 1) + '  ' + f.helper.code[i]);
      assert.equal(line.classList.contains('is-active'), i + 1 === f.helper.line);
    });
  } else assert.equal(get('sw-helper-code').children.length, 0);
  assert.equal(get('sw-buffers').children.length, 8);
  get('sw-buffers').children.forEach((node, i) => {
    const buffer = f.buffers[i];
    assert.equal(node.disabled, buffer.file === null);
    assert.equal(node.classList.contains('is-pinned'), buffer.pins > 0);
    assert.equal(node.classList.contains('is-dirty'), buffer.dirty);
    assert.equal(node.children[1].textContent, buffer.file ? buffer.file + ' · b' + buffer.block : 'empty frame');
    assert.equal(node.children[2].textContent, buffer.file ? 'pins ' + buffer.pins + ' · ' +
      (buffer.dirty ? 'DIRTY · needs writing' : 'clean') : 'available');
  });
  const fileCards = get('sw-files').querySelectorAll('.sw-file');
  assert.equal(fileCards.length, f.files.length);
  fileCards.forEach((card, i) => {
    assert.equal(card.children[0].children[0].textContent, f.files[i].name);
    assert.equal(card.children[0].children[1].textContent, f.files[i].blocks.length * 128 + ' bytes');
    assert.equal(card.querySelectorAll('.sw-file-block').length, f.files[i].blocks.length);
  });
  ['hits', 'misses', 'reads', 'writes'].forEach((key, i) => assert.equal(Number(get('sw-counts').children[i].textContent.split(' ')[0]), f.counts[key]));
  if (f.layout) {
    assert.equal(text('sw-layout-title'), 'Layout in use: ' + f.layout.name + ' · ' + f.layout.slotSize + ' bytes per slot');
    assert.equal(get('sw-layout').children.length, f.layout.fields.length + 1);
  }
  const target = text('sw-block-title').match(/^(.+\.tbl) · block (\d+)$/);
  if (!target) {
    assert.equal(get('sw-bytes').children.length, 0);
    assert.equal(get('sw-fields').children.length, 0);
    return;
  }
  const file = target[1], block = Number(target[2]);
  const slot = Number(text('sw-slot-title').match(/^Slot (\d+)/)[1]);
  const layout = model.layouts[file.slice(0, -4)];
  const base = slot * layout.slotSize;
  const buffer = f.buffers.find(item => item.file === file && item.block === block);
  const ram = buffer?.bytes, disk = f.files.find(item => item.name === file).blocks[block].bytes;
  const active = f.focus && f.focus.file === file && f.focus.block === block && f.focus.slot === slot;
  for (const side of ['ram', 'file']) {
    const bytes = side === 'ram' ? ram : disk;
    assert.equal(slots(side).length, bytes ? Math.floor(128 / layout.slotSize) : 0);
    slots(side).forEach((node, n) => {
      assert.equal(node.getAttribute('aria-pressed'), String(n === slot));
      assert.equal(node.classList.contains('is-empty'), Buffer.from(bytes).readInt32LE(n * layout.slotSize) !== 1);
      assert.equal(node.classList.contains('is-current'), side === 'ram' && f.cursors.some(c => !c.closed && c.file === file && c.block === block && c.slot === n));
      const differs = Boolean(ram && ram.slice(n * layout.slotSize, (n + 1) * layout.slotSize).some((v, j) => v !== disk[n * layout.slotSize + j]));
      assert.equal(node.classList.contains('is-different'), differs);
    });
  }
  const fields = [{ name: 'flag', offset: 0, size: 4, type: 'int' }].concat(layout.fields);
  assert.equal(get('sw-fields').children.length, fields.length);
  get('sw-fields').children.forEach((node, i) => {
    const field = fields[i];
    assert.deepEqual(node.children.map(child => child.textContent),
      [field.name, String(field.offset), field.size + ' B', decoded(ram, base, field), decoded(disk, base, field)]);
  });
  assert.equal(get('sw-bytes').children.length, layout.slotSize);
  get('sw-bytes').children.forEach((node, i) => {
    const offset = base + i;
    assert.equal(node.children[0].textContent, '@' + offset);
    assert.equal(node.children[1].textContent, (ram ? ram[offset].toString(16).padStart(2, '0') : '—') + ' / ' + disk[offset].toString(16).padStart(2, '0'));
    assert.equal(node.classList.contains('is-different'), Boolean(ram && ram[offset] !== disk[offset]));
    assert.equal(node.classList.contains('is-accessed'), Boolean(active && Number.isInteger(f.focus.byteOffset) && offset >= f.focus.byteOffset && offset < f.focus.byteOffset + f.focus.length));
  });
  if (active && Number.isInteger(f.focus.byteOffset)) {
    assert(text('sw-address').includes('file offset ' + (block * 128 + f.focus.byteOffset)));
  }
}

assert.equal(root.dataset.initialized, 'true');
assert(get('sw-follow').disabled);
assert.equal(text('sw-files'), 'No database files exist yet.');
checkFrame();
click('sw-step');
assert.equal(index(), 1);
click('sw-back');
assert.equal(index(), 0);
click('sw-back');
assert.equal(index(), 0);

// Each step, line boundary, helper/phase, file, buffer and byte representation.
for (const id of ['create', 'insert', 'delete', 'select']) {
  load(id);
  for (let i = 0; i < stage.frames.length; i += 1) {
    assert.equal(index(), i);
    checkFrame();
    if (i < stage.frames.length - 1) click('sw-step');
  }
  assert(frame().done && frame().buffers.every(buffer => buffer.pins === 0));
  click('sw-step');
  assert.equal(index(), stage.frames.length - 1);
  click('sw-reset');
  assert.equal(index(), 0);
  let expected = nextEvent(['line']);
  click('sw-line');
  assert.equal(index(), expected);
  assert.equal(frame().phase, 'after');
  expected = nextEvent(id === 'select' ? ['field-read'] : ['file-created', 'block-appended', 'slot-flag', 'field-write', 'disk-write']);
  click('sw-change');
  assert.equal(index(), expected);
  checkFrame();
  click('sw-finish');
  assert.equal(index(), stage.frames.length - 1);
}
assert.equal(text('sw-output'), 'ada\ncyd\neli');

// Holding a slot does not advance execution; byte differences remain visible.
load('insert', true);
const reservation = stage.frames.findIndex(f => f.event === 'slot-flag' && f.focus.file === 'students.tbl');
moveTo(reservation);
assert.equal(get('sw-fields').children[0].children[3].textContent, '1');
assert.equal(get('sw-fields').children[0].children[4].textContent, '0');
assert.equal(get('sw-fields').children[1].children[3].textContent, '0', 'Reservation precedes writing sid');
assert(slots('ram')[0].classList.contains('is-different'));
assert(slots('file')[0].classList.contains('is-empty'));
checkFrame();
slots('ram')[2].focus();
slots('ram')[2].dispatch('click');
assert.equal(index(), reservation);
assert(!get('sw-follow').disabled);
assert(text('sw-inspector-note').startsWith('Inspection held here.'));
assert(text('sw-slot-title').startsWith('Slot 2'));
assert.equal(document.activeElement.dataset.focusKey, 'ram-slot-2', 'Repainting restores the focused slot');
click('sw-step');
assert(text('sw-slot-title').startsWith('Slot 2'));
click('sw-follow');
assert(get('sw-follow').disabled);
assert(text('sw-slot-title').startsWith('Slot 0'));
checkFrame();

load('delete', true);
const deletion = stage.frames.findIndex(f => f.event === 'slot-flag');
moveTo(deletion);
assert.equal(text('sw-block-title'), 'students.tbl · block 1');
assert(text('sw-slot-title').startsWith('Slot 2'));
assert.equal(get('sw-fields').children[0].children[3].textContent, '0');
assert.equal(get('sw-fields').children[0].children[4].textContent, '1');
assert.equal(get('sw-fields').children[1].children[3].textContent, '7');
assert.equal(get('sw-fields').children[2].children[3].textContent, '"temp"');
assert.equal(get('sw-bytes').children.filter(node => node.classList.contains('is-different')).length, 1);
assert(text('sw-address').includes('file offset 184'));
checkFrame();
byFocusKey('students.tbl-file-0').dispatch('click');
assert.equal(text('sw-block-title'), 'students.tbl · block 0');
assert(!get('sw-follow').disabled);
const resident = frame().buffers.find(buffer => buffer.file === 'students.tbl' && buffer.block === 1);
byFocusKey('buffer-' + resident.index).dispatch('click');
assert.equal(text('sw-block-title'), 'students.tbl · block 1');
click('sw-follow');
assert(text('sw-slot-title').startsWith('Slot 2'));

// Playback, reset, navigation and visibility never leave orphan timers.
load('select', true);
click('sw-play');
assert.equal(get('sw-play').getAttribute('aria-pressed'), 'true');
runTimer();
assert.equal(index(), 1);
assert.equal(timers.size, 1);
click('sw-play');
assert.equal(timers.size, 0);
click('sw-play');
click('sw-reset');
assert.equal(index(), 0);
assert.equal(timers.size, 0);
click('sw-play');
load('create', true);
click('sw-play');
load('delete');
click('sw-play');
slots('ram')[0].dispatch('click');
assert.equal(timers.size, 0, 'Manual inspection pauses playback');
click('sw-play');
document.hidden = true;
document.dispatch('visibilitychange');
assert.equal(timers.size, 0);
document.hidden = false;
click('sw-play');
root.classList.toggle('slide-hidden', true);
runTimer();
assert.equal(index(), 0);
assert.equal(timers.size, 0);
root.classList.toggle('slide-hidden', false);
click('sw-finish');
click('sw-back');
click('sw-play');
runTimer();
assert.equal(index(), stage.frames.length - 1);
assert.equal(timers.size, 0);
assert.equal(get('sw-play').getAttribute('aria-pressed'), 'false');

// Rewinding through an inspected block's creation safely releases the hold.
load('create');
const firstBlock = stage.frames.findIndex(f => f.event === 'block-appended');
moveTo(firstBlock);
root.querySelectorAll('.sw-file-block')[0].dispatch('click');
assert(!get('sw-follow').disabled);
click('sw-back');
assert(get('sw-follow').disabled);
checkFrame();

// Navigation remains local to the diagram; native control shortcuts remain native.
click('sw-reset');
let key = get('sw-step').dispatch('keydown', { key: 'ArrowRight' });
assert(key.stopped && key.defaultPrevented);
assert.equal(index(), 1);
key = root.dispatch('keydown', { key: 'PageDown' });
assert(key.stopped && key.defaultPrevented);
assert.equal(index(), 2);
root.dispatch('keydown', { key: 'ArrowLeft' });
assert.equal(index(), 1);
root.dispatch('keydown', { key: 'PageUp' });
assert.equal(index(), 0);
root.dispatch('keydown', { key: 'End' });
assert.equal(index(), stage.frames.length - 1);
root.dispatch('keydown', { key: 'Home' });
assert.equal(index(), 0);
for (const keyName of ['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp']) {
  const event = get('sw-helper-title').dispatch('keydown', { key: keyName });
  assert(event.stopped && !event.defaultPrevented);
  assert.equal(index(), 0);
}
assert.equal(get('sw-helper-title').dispatch('keydown', { key: 'Escape' }).stopped, false);

vm.runInContext(controller, context);
assert.equal(get('sw-buffers').children.length, 8);
click('sw-step');
assert.equal(index(), 1, 'Reinitialization must not duplicate listeners');
assert.equal(timers.size, 0);
assert.equal(JSON.stringify(model), originalModel, 'Rendering and held inspection must never mutate recorded snapshots');
console.log('Statement UI: all 472 snapshots, source lines, RAM/file bytes, controls, inspection, playback and keyboard isolation passed.');
