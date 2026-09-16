'use strict';

// Run with: node tests/test_join_walkthrough_ui.js
// Execute the real controller against its HTML in a small DOM contract harness.
// This checks state, byte inspection, controls, and timing; browser QA checks layout.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { TextEncoder } = require('node:util');
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
  getAttribute(name) { return this.attributes[name] ?? null; }
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
const opening = html.match(/<div\b[^>]*\bid="viz-join-slots"[^>]*>/);
assert(opening, 'The page contains the join widget');
const document = new Node('document');
document.hidden = false;
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
const root = get('viz-join-slots');
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1].split('?')[0]);
assert(scripts.includes('join-walkthrough-model.js') && scripts.includes('join-walkthrough.js'));
assert(scripts.indexOf('join-walkthrough-model.js') < scripts.indexOf('join-walkthrough.js'), 'Load model before controller');
for (const source of ['join-walkthrough-model.js', 'join-walkthrough.js']) assert(fs.existsSync(path.join(lab, source)));

let timerId = 0;
const timers = new Map();
const context = { document, TextEncoder,
  setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
  clearTimeout(id) { timers.delete(id); }
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(lab, 'join-walkthrough-model.js'), 'utf8'), context);
const controller = fs.readFileSync(path.join(lab, 'join-walkthrough.js'), 'utf8');
vm.runInContext(controller, context);
const trace = context.JoinWalkthrough.buildTrace();
const click = id => get(id).dispatch('click');
const text = id => get(id).textContent;
const index = () => Number(text('jw-progress').match(/^Step (\d+) \/ /)[1]);
const frame = () => trace[index()];
const blocks = side => get('jw-' + side + '-blocks').children;
const slots = (side, block) => blocks(side)[block].querySelectorAll('.jw-slot');
const jump = value => { get('jw-jump').value = value; get('jw-jump').dispatch('change'); };
const nextEvent = event => {
  const next = trace.findIndex((f, i) => i > index() && f.event === event);
  return next < 0 ? trace.length - 1 : next;
};
function runTimer() {
  assert.equal(timers.size, 1, 'Playback has one pending tick');
  const [id, timer] = timers.entries().next().value;
  assert.equal(timer.delay, 650);
  timers.delete(id);
  timer.fn();
}
function checkFrame() {
  const f = frame();
  assert.equal(text('jw-message'), f.message);
  assert.equal(get('jw-message').parentElement.dataset.direction, f.direction);
  assert.equal(text('jw-pair-state'), f.pair ? f.pair.name + ' × ' + f.pair.dept +
    ' · mid ' + f.pair.mid + ' / mid2 ' + f.pair.mid2 : 'No current pair');
  assert(!text('jw-pair-state').includes('undefined'), 'Controller reads the model pair shape correctly');
  assert.equal(text('jw-output'), f.output.length ? f.output.map(row => '(' + row.join(', ') + ')').join('') : 'No rows yet.');
  assert.deepEqual(get('jw-counts').children.map(stat => Number(stat.children[0].textContent)),
    [f.counts.rootCalls, f.counts.pairs, f.counts.outputs, f.counts.rewinds]);
  ['students', 'majors'].forEach(side => {
    const c = side === 'students' ? f.left : f.right;
    assert.equal(text('jw-' + side + '-cursor'), 'block ' + c.block + ' · current_slot ' + c.slot +
      (c.pinned ? ' · pinned' : ' · unpinned'));
    blocks(side).forEach((block, b) => {
      assert.equal(block.classList.contains('is-pinned'), c.pinned && c.block === b);
      slots(side, b).forEach((slot, s) => {
        assert.equal(slot.classList.contains('is-current'), c.pinned && c.block === b && c.slot === s);
        const reading = [f.probe, f.access].some(a => a && a.side === side && a.block === b && a.slot === s);
        assert.equal(slot.classList.contains('is-reading'), reading);
      });
    });
  });
  const inspected = root.querySelectorAll('.jw-slot').filter(slot => slot.getAttribute('aria-pressed') === 'true');
  assert.equal(inspected.length, 1, 'Exactly one slot is being inspected');
  const target = inspected[0].dataset;
  assert.equal(text('jw-inspector-title'), target.side + '.tbl · block ' + target.block + ' · slot ' + target.slot);
  assert.equal(get('jw-bytes').children.length, context.JoinWalkthrough.tables[target.side].slotSize);
  assert.equal(get('jw-back').disabled, index() === 0);
  ['jw-step', 'jw-pair', 'jw-result', 'jw-play'].forEach(id => assert.equal(get(id).disabled, index() === trace.length - 1));
}

assert.equal(root.dataset.initialized, 'true');
assert.equal(blocks('students').length, 2);
assert.equal(blocks('majors').length, 1);
assert.equal(root.querySelectorAll('.jw-slot').length, 14);
assert(get('jw-follow').disabled);
checkFrame();
click('jw-step');
assert.equal(index(), 1);
click('jw-back');
assert.equal(index(), 0);
click('jw-back');
assert.equal(index(), 0);
let target = nextEvent('pair');
click('jw-pair');
assert.equal(index(), target);
assert.equal(text('jw-pair-state'), 'ada × ds · mid 1 / mid2 1');
checkFrame();
for (const expected of ['(ada, ds)', '(ada, ds)(cyd, ds)', '(ada, ds)(cyd, ds)(eli, stat)']) {
  target = nextEvent('output');
  click('jw-result');
  assert.equal(index(), target);
  assert.equal(text('jw-output'), expected);
  checkFrame();
}
assert.equal(text('jw-result'), 'Finish scan');
click('jw-result');
assert.equal(index(), trace.length - 1);
assert(frame().done && !frame().left.pinned && !frame().right.pinned);
assert.equal(text('jw-counts'), '4 root next() calls18 candidate pairs3 rows out7 right rewinds');
checkFrame();
click('jw-step');
assert.equal(index(), trace.length - 1);
click('jw-reset');
assert.equal(index(), 0);
assert.equal(get('jw-jump').value, 'start');
checkFrame();

const jumpPredicates = {
  start: () => true,
  'first-result': f => f.event === 'output',
  'join-reject': f => f.event === 'join-check' && f.predicate.join === false,
  'gpa-reject': f => f.event === 'gpa-check' && f.predicate.gpa === false,
  'block-change': f => f.event === 'pin' && f.left.block === 1,
  deleted: f => f.probe && f.probe.side === 'students' && f.probe.block === 1 && f.probe.slot === 2,
  end: f => f.event === 'exhausted'
};
assert.deepEqual(get('jw-jump').children.filter(node => node.tagName === 'OPTION').map(node => node.value), Object.keys(jumpPredicates));
for (const [value, predicate] of Object.entries(jumpPredicates)) {
  jump(value);
  assert.equal(index(), trace.findIndex(predicate), 'Jump: ' + value);
  checkFrame();
}
assert(frame().left.pinned && frame().right.pinned, 'Jump to exhaustion precedes close');
assert.equal(text('jw-output'), '(ada, ds)(cyd, ds)(eli, stat)');
jump('join-reject');
assert.equal(text('jw-predicate'), 'mid = mid2: False · gpa > 35: skipped');
jump('gpa-reject');
assert.equal(text('jw-predicate'), 'mid = mid2: True · gpa > 35: False');
jump('deleted');
assert(text('jw-inspector-status').includes('Deleted: flag = 0'));
assert(text('jw-address').includes('file offset 184'));
assert.equal(get('jw-bytes').children.filter(byte => byte.classList.contains('is-reading')).length, 4);
assert.equal(get('jw-bytes').children[0].children[1].textContent, '00');
assert.equal(get('jw-bytes').children[4].children[1].textContent, '07', 'Deleted SID bytes remain');

// Manual inspection never advances execution and stays held across stepping.
const heldAt = index();
slots('majors', 0)[4].dispatch('click');
assert.equal(index(), heldAt);
assert.equal(text('jw-inspector-title'), 'majors.tbl · block 0 · slot 4');
assert(text('jw-inspector-status').includes('Inspection held here.'));
assert(!get('jw-follow').disabled);
assert(get('jw-bytes').children.every(byte => byte.children[1].textContent === '00'));
click('jw-step');
assert.equal(text('jw-inspector-title'), 'majors.tbl · block 0 · slot 4');
click('jw-follow');
assert(get('jw-follow').disabled);
assert.equal(text('jw-inspector-title'), 'students.tbl · block 1 · slot 3');
click('jw-product');
assert(get('jw-operator-detail').open);
assert(text('jw-operator-title').startsWith('ProductScan'));
assert(text('jw-operator-description').includes('rewind majors'));
checkFrame();

// Traverse every snapshot to catch byte reads, cursor highlights, and shape drift.
click('jw-reset');
for (let step = 0; step < trace.length; step += 1) {
  assert.equal(index(), step);
  checkFrame();
  const f = frame();
  if (f.access) {
    const a = f.access;
    assert(text('jw-address').includes('file offset ' + (a.block * 128 + a.byteOffset)));
    const expectedBytes = typeof a.value === 'string' ? 4 + new TextEncoder().encode(a.value).length : 4;
    assert.equal(get('jw-bytes').children.filter(byte => byte.classList.contains('is-reading')).length, expectedBytes);
  }
  if (step < trace.length - 1) click('jw-step');
}
click('jw-back');
assert.equal(index(), trace.length - 2);
checkFrame();

// Playback is reversible, has one timer, and stops when paused or hidden.
click('jw-reset');
click('jw-play');
assert.equal(get('jw-play').getAttribute('aria-pressed'), 'true');
runTimer();
assert.equal(index(), 1);
assert.equal(timers.size, 1);
click('jw-play');
assert.equal(timers.size, 0);
assert.equal(text('jw-play'), 'Play');
click('jw-play');
click('jw-reset');
assert.equal(timers.size, 0);
assert.equal(index(), 0);
click('jw-play');
slots('students', 0)[2].dispatch('click');
assert.equal(timers.size, 0);
assert.equal(get('jw-play').getAttribute('aria-pressed'), 'false');
click('jw-follow');
click('jw-play');
document.hidden = true;
document.dispatch('visibilitychange');
assert.equal(timers.size, 0);
assert.equal(get('jw-play').getAttribute('aria-pressed'), 'false');
document.hidden = false;
click('jw-play');
root.classList.toggle('slide-hidden', true);
runTimer();
assert.equal(index(), 0);
assert.equal(timers.size, 0);
root.classList.toggle('slide-hidden', false);
root.dispatch('keydown', { key: 'End' });
click('jw-back');
click('jw-play');
runTimer();
assert.equal(index(), trace.length - 1);
assert.equal(timers.size, 0, 'Playback stops when the trace finishes');
assert.equal(get('jw-play').getAttribute('aria-pressed'), 'false');
click('jw-reset');

// Widget shortcuts must not move the surrounding presentation's current slide.
let key = get('jw-step').dispatch('keydown', { key: 'ArrowRight' });
assert(key.stopped && key.defaultPrevented);
assert.equal(index(), 1);
key = root.dispatch('keydown', { key: 'ArrowLeft' });
assert(key.stopped && key.defaultPrevented);
assert.equal(index(), 0);
root.dispatch('keydown', { key: 'End' });
assert.equal(index(), trace.length - 1);
root.dispatch('keydown', { key: 'Home' });
assert.equal(index(), 0);
for (const id of ['jw-jump', 'jw-operator-title']) {
  for (const key of ['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp']) {
    const event = get(id).dispatch('keydown', { key });
    assert.equal(event.stopped, true, 'Keep ' + key + ' on ' + id + ' inside widget');
    assert.equal(event.defaultPrevented, false, 'Preserve native control behavior');
    assert.equal(index(), 0);
  }
}
assert.equal(get('jw-jump').dispatch('keydown', { key: 'Escape' }).stopped, false);

// Reinitialization must not duplicate generated blocks, listeners, or timers.
vm.runInContext(controller, context);
assert.equal(root.querySelectorAll('.jw-slot').length, 14);
click('jw-step');
assert.equal(index(), 1);
assert.equal(timers.size, 0);
console.log('Join walkthrough UI: every frame, slots/bytes, controls, jumps, playback, and keyboard isolation passed.');
