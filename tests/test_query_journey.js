'use strict';

// Run with: node tests/test_query_journey.js
// A small DOM/fake-timer harness checks both pages' wiring and interactive state, not layout.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const repo = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(repo, 'labs/_shared/query-journey.js'), 'utf8');
const decode = text => text.replace(/&(lt|gt|amp|quot|nbsp);/g, (_, name) =>
  ({ lt: '<', gt: '>', amp: '&', quot: '"', nbsp: '\u00a0' })[name]);

class Node {
  constructor(attrs = {}) {
    this.attrs = attrs;
    this.dataset = Object.fromEntries(Object.entries(attrs).filter(([key]) => key.startsWith('data-'))
      .map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value]));
    this.children = [];
    this.listeners = {};
    this.hidden = 'hidden' in attrs;
    this._text = '';
    const classes = new Set((attrs.class || '').split(/\s+/).filter(Boolean));
    this.classList = {
      contains: name => classes.has(name),
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
    };
  }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set innerHTML(value) { this._text = ''; this.children = parse(value).children; }
  insertAdjacentHTML(position, html) { assert.equal(position, 'beforeend'); this.children.push(...parse(html).children); }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  click() { (this.listeners.click || []).forEach(listener => listener()); }
  matches(selector) {
    const parts = selector.match(/^(?:#([\w-]+)|\.([\w-]+))(?:\[([\w-]+)="([^"]*)"\])?$/);
    assert(parts, 'Unsupported test selector: ' + selector);
    return (parts[1] ? this.attrs.id === parts[1] : this.classList.contains(parts[2])) &&
      (!parts[3] || this.attrs[parts[3]] === parts[4]);
  }
  querySelectorAll(selector) {
    return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}

function parse(html) {
  const root = new Node(), stack = [root];
  for (const token of html.match(/<[^>]+>|[^<]+/g) || []) {
    if (token.startsWith('</')) { stack.pop(); continue; }
    if (token.startsWith('<')) {
      const tag = token.match(/^<([\w-]+)/)[1];
      const attrs = {};
      for (const match of token.slice(tag.length + 1, -1).matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) {
        attrs[match[1]] = decode(match[2] || '');
      }
      const node = new Node(attrs);
      stack.at(-1).children.push(node);
      if (!['br', 'hr', 'input', 'img'].includes(tag)) stack.push(node);
    } else {
      const text = new Node();
      text.textContent = decode(token);
      stack.at(-1).children.push(text);
    }
  }
  assert.equal(stack.length, 1, 'Widget HTML must close all tags');
  return root;
}

function widgetMarkup(html) {
  const start = html.indexOf('<div class="viz" id="viz-query-journey">');
  assert(start >= 0, 'Missing query journey widget');
  let depth = 0;
  for (const match of html.slice(start).matchAll(/<\/?div\b[^>]*>/g)) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (!depth) return html.slice(start, start + match.index + match[0].length);
  }
  assert.fail('Unclosed query journey widget');
}

for (const page of ['lectures/lecture-01/anatomy.html', 'lectures/lecture-04/iterators.html']) {
  const html = fs.readFileSync(path.join(repo, page), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, page + ': duplicate IDs');
  for (const [kind, extension] of [['href', 'css'], ['src', 'js']]) {
    const asset = `../../labs/_shared/query-journey.${extension}?v=1`;
    assert.equal(html.split(`${kind}="${asset}"`).length - 1, 1, page + ': shared asset included once');
    assert(fs.existsSync(path.resolve(repo, path.dirname(page), asset.split('?')[0])));
    assert(html.indexOf(`lab-base.${extension}`) < html.indexOf(asset), 'Shared base loads first');
    if (extension === 'js') assert(html.indexOf(asset) < html.indexOf('src="viz.js'), 'Shared script loads before lecture widgets');
  }
  const documentRoot = parse(widgetMarkup(html));
  const get = id => {
    const found = documentRoot.querySelector('#' + id);
    assert(found, page + ': missing widget ID ' + id);
    return found;
  };
  let timerId = 0;
  const intervals = new Map(), timeouts = new Map();
  const context = vm.createContext({ document: { getElementById: get },
    setTimeout: callback => { const id = ++timerId; timeouts.set(id, callback); return id; },
    clearTimeout: id => timeouts.delete(id),
    setInterval: callback => { const id = ++timerId; intervals.set(id, callback); return id; },
    clearInterval: id => intervals.delete(id),
  });
  vm.runInContext(script, context);
  vm.runInContext(script, context);
  for (const id of ['play', 'step', 'back', 'reset', 'again']) {
    assert.equal(get('qj-' + id).listeners.click.length, 1, 'Duplicate load must not attach more listeners');
  }
  const click = id => get('qj-' + id).click();
  const stats = (reads, examined, returned) => assert.equal(get('qj-stats').textContent,
    `disk reads: ${reads}\nrows examined: ${examined}\nrows returned: ${returned}`);
  const results = () => get('qj-results').querySelectorAll('.qj-result-chip').map(node => node.textContent);
  const tick = () => [...intervals.values()].forEach(callback => callback());
  const frameText = number => get('qj-frame-' + number).querySelector('.qj-frame-body').textContent;
  const root = get('viz-query-journey');

  stats(0, 0, 0);
  assert.equal(root.querySelectorAll('.qj-row').length, 6);
  assert.equal(get('qj-again').hidden, true);
  click('back'); // Cannot rewind before the start.
  stats(0, 0, 0);
  for (let i = 0; i < 5; i++) click('step');
  stats(1, 3, 2);
  assert.deepEqual(results(), ['ada', 'cyd']);
  click('back');
  stats(1, 0, 0);
  assert.deepEqual(results(), []);
  assert.equal(frameText(0), 'loading…');
  for (let i = 0; i < 4; i++) click('step');
  stats(2, 6, 3);
  assert.deepEqual(results(), ['ada', 'cyd', 'eli']);
  assert.equal(get('qj-again').hidden, false);
  assert.equal(timeouts.size, 1);
  click('back');
  assert.equal(get('qj-again').hidden, true);
  assert.equal(timeouts.size, 0, 'Back cancels the old completion highlight');
  assert(root.querySelector('.qj-plan-node[data-op="select"]').classList.contains('active'));
  click('step');
  click('again');
  stats(0, 0, 0);
  assert.equal(get('qj-again').hidden, true);
  assert.equal(timeouts.size, 0);
  assert.equal(frameText(0), 'students.tbl · block 0');
  assert.equal(frameText(1), 'students.tbl · block 1');
  for (let i = 0; i < 3; i++) click('step');
  stats(0, 6, 3);
  assert.deepEqual(results(), ['ada', 'cyd', 'eli']);
  assert(get('qj-frame-0').classList.contains('hit') && get('qj-frame-1').classList.contains('hit'));
  click('back'); click('back');
  stats(0, 3, 2);
  assert.deepEqual(results(), ['ada', 'cyd']);
  click('step'); click('step');
  assert.equal(timeouts.size, 1);
  click('reset');
  stats(0, 0, 0);
  assert.deepEqual(results(), []);
  assert.equal(timeouts.size, 0, 'Reset cancels the old completion highlight');
  assert.equal(frameText(0), 'empty');
  assert.equal(frameText(1), 'empty');
  assert.equal(get('qj-again').hidden, true);
  assert(!get('qj-plan').classList.contains('show'));
  assert(root.querySelectorAll('.qj-row').every(row => !row.classList.contains('pass') && !row.classList.contains('fail')));

  click('play');
  assert.equal(intervals.size, 1);
  assert.equal(get('qj-play').textContent, '❚❚ Pause');
  tick();
  click('play'); // Pause must cancel playback.
  assert.equal(intervals.size, 0);
  assert.equal(get('qj-play').textContent, '▶ Play');
  click('play'); click('step');
  assert.equal(intervals.size, 0, 'Step cancels playback');
  click('play'); click('back');
  assert.equal(intervals.size, 0, 'Back cancels playback');
  click('play'); click('reset');
  assert.equal(intervals.size, 0, 'Reset cancels playback');
  click('play');
  for (let i = 0; i < 9; i++) tick();
  stats(2, 6, 3);
  assert.deepEqual(results(), ['ada', 'cyd', 'eli']);
  assert.equal(intervals.size, 0, 'Playback stops at completion');
  assert.equal(get('qj-play').textContent, '▶ Play');
  click('reset');
  assert.equal(timeouts.size, 0);
  console.log(page + ': query journey assets, cold/warm outputs, controls, timers, and duplicate-load guard passed.');
}
