'use strict';

// Run with: node tests/test_generator_demo.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const asset = path.join(__dirname, '../lectures/lecture-04/generator-demo.js');
const { createDemo, rows } = require(asset);
const demo = createDemo();

function initial(state) {
  assert.deepEqual(state, {
    rowsRead: 0, rowsReturned: 0, remaining: 6, done: false, latest: null,
    inspected: [], events: [], statuses: Array(6).fill('unread'),
  });
}
initial(demo.reset()); // Creating either generator must not execute its body.
const expected = [
  { name: 'ada', read: 1, inspected: ['ada'], statuses: ['returned', 'unread', 'unread', 'unread', 'unread', 'unread'] },
  { name: 'cyd', read: 3, inspected: ['ben', 'cyd'], statuses: ['returned', 'rejected', 'returned', 'unread', 'unread', 'unread'] },
  { name: 'eli', read: 5, inspected: ['dee', 'eli'], statuses: ['returned', 'rejected', 'returned', 'rejected', 'returned', 'unread'] },
];
for (let run = 0; run < 2; run++) {
  for (const [index, want] of expected.entries()) {
    const state = demo.next();
    assert.equal(state.latest.name, want.name);
    assert.equal(state.rowsRead, want.read);
    assert.equal(state.rowsReturned, index + 1);
    assert.equal(state.remaining, 6 - want.read);
    assert.equal(state.done, false, 'Returning the final match must not report exhaustion before the next request');
    assert.deepEqual(state.inspected, want.inspected);
    assert.deepEqual(state.statuses, want.statuses);
    assert.equal(state.events.filter(event => event.startsWith('student_rows() reads ')).length, want.inspected.length);
    assert.match(state.events.at(-1), /Both generators are paused at yield/);
    assert(!state.events.some(event => event.includes('StopIteration')));
    if (index > 0) {
      const reject = state.events.findIndex(event => event.includes('False. It skips'));
      const pass = state.events.findIndex(event => event.includes('True. It yields'));
      assert(reject >= 0 && reject < pass, 'One request skips a rejected row before returning a match');
      assert(state.events.some(event => event.includes('high_gpa(rows) resumes after yielding')));
    }
    // Snapshots must not expose mutable internal state or the shared source rows.
    state.latest.name = 'changed';
    state.statuses.fill('changed');
    state.inspected.push('changed');
    state.events.length = 0;
  }
  const exhausted = demo.next();
  assert.deepEqual([exhausted.rowsRead, exhausted.rowsReturned, exhausted.remaining, exhausted.done, exhausted.latest], [6, 3, 0, true, null]);
  assert.deepEqual(exhausted.inspected, ['fay']);
  assert.deepEqual(exhausted.statuses, ['returned', 'rejected', 'returned', 'rejected', 'returned', 'rejected']);
  assert.match(exhausted.events.at(-1), /StopIteration/);
  assert(exhausted.events.some(event => event.includes('False. It skips fay')));
  for (let again = 0; again < 2; again++) {
    const repeated = demo.next();
    assert.deepEqual([repeated.rowsRead, repeated.rowsReturned, repeated.remaining, repeated.done, repeated.latest], [6, 3, 0, true, null]);
    assert.deepEqual(repeated.inspected, []);
    assert.deepEqual(repeated.statuses, exhausted.statuses);
    assert.equal(repeated.events.length, 1);
    assert.match(repeated.events[0], /StopIteration without reading a row/);
  }
  initial(demo.reset());
}
assert.deepEqual(rows.map(row => row.name), ['ada', 'ben', 'cyd', 'dee', 'eli', 'fay']);
assert(Object.isFrozen(rows) && rows.every(Object.isFrozen));

// Check browser wiring using the real page IDs and a small DOM contract harness.
const html = fs.readFileSync(path.join(__dirname, '../lectures/lecture-04/iterators.html'), 'utf8');
assert.equal((html.match(/<script\s+src="generator-demo\.js\?v=1"><\/script>/g) || []).length, 1);
class Element {
  constructor() { this.dataset = {}; this.children = []; this.listeners = {}; this.attributes = {}; this.textContent = ''; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  click() { (this.listeners.click || []).forEach(fn => fn()); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes[name] = value; }
}
const nodes = new Map();
for (const match of html.matchAll(/\bid="([^"]+)"/g)) {
  assert(!nodes.has(match[1]), 'Duplicate page ID: ' + match[1]);
  nodes.set(match[1], new Element());
}
const get = id => { assert(nodes.has(id), 'Missing page ID: ' + id); return nodes.get(id); };
const root = get('viz-generators');
root.querySelector = selector => get(selector.slice(1));
const context = vm.createContext({ document: { getElementById: get, createElement: () => new Element() } });
const code = fs.readFileSync(asset, 'utf8');
vm.runInContext(code, context);
vm.runInContext(code, context);
assert.equal(get('gen-next').listeners.click.length, 1);
assert.equal(get('gen-reset').listeners.click.length, 1);
const click = id => get('gen-' + id).click();
const counters = () => ['read', 'returned', 'remaining'].map(id => Number(get('gen-' + id).textContent));
assert.deepEqual(counters(), [0, 0, 6]);
assert.equal(get('gen-source').textContent, 'not started');
assert.equal(get('gen-filter').textContent, 'waiting for a request');
assert.equal(get('gen-caller').textContent, 'no row requested');
assert.equal(get('gen-events').children.length, 0);
assert.equal(get('gen-rows').children.length, 6);
assert(get('gen-rows').children.every(chip => chip.attributes.role === 'group'));
assert(get('gen-rows').children.every(chip => chip.className.includes('is-unread')));
click('next');
assert.deepEqual(counters(), [1, 1, 5]);
assert.match(get('gen-caller').textContent, /ada/);
assert.match(get('gen-source').textContent, /paused at yield row/);
assert.match(get('gen-filter').textContent, /39 > 35 → True/);
click('next');
assert.deepEqual(counters(), [3, 2, 3]);
assert.match(get('gen-caller').textContent, /cyd/);
const inspected = get('gen-rows').children.filter(chip => chip.className.includes('is-inspected'));
assert.equal(inspected.length, 2);
assert(inspected[0].className.includes('is-rejected') && inspected[1].className.includes('is-returned'));
assert(inspected.every(chip => chip.attributes['aria-label'].includes('inspected during this request')));
assert(get('gen-events').children.some(item => item.textContent.includes('skips ben')));
click('next');
assert.deepEqual(counters(), [5, 3, 1]);
assert.match(get('gen-caller').textContent, /eli/);
assert(!get('gen-msg').textContent.includes('StopIteration'));
click('next'); click('next');
assert.deepEqual(counters(), [6, 3, 0]);
assert.equal(get('gen-caller').textContent, 'StopIteration');
assert(get('gen-rows').children.every(chip => !chip.className.includes('is-inspected')));
click('reset');
assert.deepEqual(counters(), [0, 0, 6]);
assert.equal(get('gen-caller').textContent, 'no row requested');
click('next');
assert.deepEqual(counters(), [1, 1, 5]);
for (const [key, button, stopped] of [[' ', true, true], ['Enter', true, true], ['ArrowRight', true, true], ['Escape', true, false], ['ArrowRight', false, false]]) {
  const event = { key, target: { closest: () => button ? get('gen-next') : null }, stopped: false,
    stopPropagation() { this.stopped = true; } };
  root.listeners.keydown.forEach(listener => listener(event));
  assert.equal(event.stopped, stopped);
}
console.log('Generator demo: lazy reads, filtering, suspension, exhaustion, reset, snapshots, and browser wiring passed.');
