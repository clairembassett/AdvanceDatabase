'use strict';

// Run with: node tests/test_predicate_demo_ui.js
// Read actual page IDs and annotated lines; check UI wiring/state without a browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lecture = path.join(__dirname, '../lectures/lecture-04');
const html = fs.readFileSync(path.join(lecture, 'iterators.html'), 'utf8');
const decode = text => text.replace(/&(lt|gt|amp|quot|#39|nbsp);/g, (_, name) =>
  ({ lt: '<', gt: '>', amp: '&', quot: '"', '#39': "'", nbsp: '\u00a0' })[name]);
const attrs = text => Object.fromEntries([...text.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)]
  .map(match => [match[1], decode(match[2] || '')]));

class Element {
  constructor(tag = 'div', attributes = {}) {
    this.tagName = tag.toUpperCase();
    this.attributes = attributes;
    this.dataset = Object.fromEntries(Object.entries(attributes).filter(([key]) => key.startsWith('data-'))
      .map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value]));
    this.className = attributes.class || '';
    this.disabled = 'disabled' in attributes;
    this.children = [];
    this.listeners = {};
    this._text = '';
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      toggle: (name, enabled) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        if (enabled) classes.add(name); else classes.delete(name);
        this.className = [...classes].join(' ');
      },
    };
  }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  appendChild(child) { child.parent = this; this.children.push(child); return child; }
  replaceChildren(...children) { this._text = ''; this.children = []; children.forEach(child => this.appendChild(child)); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  matches(selector) {
    return selector.split(',').some(part => part.trim().startsWith('.')
      ? this.classList.contains(part.trim().slice(1)) : this.tagName === part.trim().toUpperCase());
  }
  closest(selector) { for (let node = this; node; node = node.parent) if (node.matches(selector)) return node; return null; }
  dispatch(type, extra = {}) {
    const event = { target: this, stopped: false, defaultPrevented: false,
      stopPropagation() { this.stopped = true; }, preventDefault() { this.defaultPrevented = true; }, ...extra };
    if (type === 'click' && this.disabled) return event;
    for (let node = this; node && !event.stopped; node = node.parent) {
      (node.listeners[type] || []).forEach(fn => fn(event));
    }
    return event;
  }
}

const nodes = new Map();
for (const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)) {
  assert(!nodes.has(match[3]), 'Duplicate page ID: ' + match[3]);
  nodes.set(match[3], new Element(match[1], attrs(match[2])));
}
const get = id => { assert(nodes.has(id), 'Missing page ID: ' + id); return nodes.get(id); };
const root = get('viz-pred');
const widget = html.slice(html.indexOf('<div class="viz" id="viz-pred">'), html.indexOf('<h2 id="product">'));
for (const match of widget.matchAll(/\bid="([^"]+)"/g)) if (match[1] !== 'viz-pred') get(match[1]).parent = root;
const codeHtml = widget.slice(widget.indexOf('<div class="code-annotated pd-code"'), widget.indexOf('<div class="code-explain-panel"'));
const lines = [...codeHtml.matchAll(/<div class="code-step"([^>]*)>([\s\S]*?)<\/div>/g)].map(match => {
  const line = new Element('div', { class: 'code-step', ...attrs(match[1]) });
  line.textContent = decode(match[2]);
  line.parent = root;
  return line;
});
assert.equal(lines.length, 7, 'The widget must show the complete Predicate method');
assert.deepEqual(lines.map(line => line.dataset.pdLine).filter(Boolean), ['term', 'lhs', 'rhs', 'compare', 'reject', 'accept']);
const panel = new Element();
panel.textContent = decode(widget.match(/<div class="code-explain-panel">([\s\S]*?)<\/div>/)[1]);
const defaultPanel = panel.textContent;
root.querySelectorAll = selector => { assert.equal(selector, '.pd-code .code-step'); return lines; };
root.querySelector = selector => { assert.equal(selector, '.pd-code .code-explain-panel'); return panel; };
for (const asset of ['predicate-model.js', 'predicate-demo.js']) {
  assert.equal((html.match(new RegExp(`<script src="${asset.replace('.', '\\.')}\\?v=1"></script>`, 'g')) || []).length, 1);
}
assert(html.indexOf('src="predicate-model.js') < html.indexOf('src="predicate-demo.js'), 'Model loads before controller');
const context = vm.createContext({ window: {}, document: { getElementById: get, createElement: tag => new Element(tag) } });
vm.runInContext(fs.readFileSync(path.join(lecture, 'predicate-model.js'), 'utf8'), context);
const controller = fs.readFileSync(path.join(lecture, 'predicate-demo.js'), 'utf8');
vm.runInContext(controller, context);

const pd = id => get('pd-' + id);
const text = id => pd(id).textContent;
const click = id => pd(id).dispatch('click');
const terms = () => pd('terms').children.filter(child => child.classList.contains('pd-term'));
const field = name => pd('row').children.find(child => child.textContent.startsWith(name + ' = '));
const activeLine = () => {
  const active = lines.filter(line => line.classList.contains('pd-executing'));
  assert(active.length <= 1, 'Only the last executed line is outlined');
  lines.forEach(line => assert.equal(line.getAttribute('aria-current'), active.includes(line) ? 'step' : 'false'));
  return active.length ? active[0].dataset.pdLine : null;
};
const controls = (stepDisabled, nextDisabled) => {
  assert.equal(pd('step').disabled, stepDisabled);
  assert.equal(pd('finish').disabled, stepDisabled);
  assert.equal(pd('next').disabled, nextDisabled);
};
const view = () => ['rowno', 'row', 'lhs-value', 'rhs-value', 'comparison', 'eval', 'count', 'log'].map(text);

assert.equal(pd('p3').getAttribute('aria-pressed'), 'true');
assert.equal(pd('p1').getAttribute('aria-pressed'), 'false');
assert.equal(text('rowno'), '· 1 of 18');
assert.match(text('source'), /students\(ada\).*majors\(cs\)/);
assert.equal(text('count'), '· 0 of 0 passed');
assert.equal(text('lhs-value'), '—');
assert.equal(text('rhs-value'), '—');
assert.equal(activeLine(), null);
assert(terms().every(term => term.classList.contains('pending')));
controls(false, true);
const ready = view();
click('next');
assert.deepEqual(view(), ready, 'Disabled Next row cannot skip an untested row');

click('step');
assert.equal(activeLine(), 'term');
assert.match(text('unpack'), /field = "mid".*rhs = F\("mid2"\)/);
assert.equal(text('lhs-value'), '—');
assert.equal(text('rhs-value'), '—');
assert(terms()[0].classList.contains('current'));
click('step');
assert.equal(activeLine(), 'lhs');
assert.equal(text('lhs-value'), '1');
assert.equal(text('rhs-value'), '—');
assert(field('mid').classList.contains('is-left'));
assert(!field('mid2').classList.contains('is-right'));
assert.match(field('mid').getAttribute('aria-label'), /read into lhs_val/);
click('step');
assert.equal(activeLine(), 'rhs');
assert.equal(text('rhs-value'), '1');
assert(field('mid2').classList.contains('is-right'));
assert.match(field('mid2').getAttribute('aria-label'), /read into rhs_val/);
assert.match(text('branch'), /isinstance\(rhs, F\) → True/);
click('step');
assert.equal(activeLine(), 'compare');
assert.equal(text('comparison'), '1 == 1 → True');
assert.equal(text('count'), '· 0 of 0 passed', 'A comparison is not yet a return');
click('step');
assert.equal(activeLine(), 'term');
assert.equal(text('lhs-value'), '—');
assert.equal(text('rhs-value'), '—');
assert(terms()[0].classList.contains('true') && terms()[1].classList.contains('current'));
click('step'); click('step');
assert.equal(text('lhs-value'), '39');
assert.equal(text('rhs-value'), '35');
assert.equal(text('rhs-source'), 'literal 35');
assert(!pd('row').children.some(chip => chip.classList.contains('is-right')));
assert.match(text('branch'), /isinstance\(rhs, F\) → False/);

// Loading the controller twice cannot reset a trace or add duplicate handlers.
const beforeDuplicateLoad = view();
vm.runInContext(controller, context);
assert.deepEqual(view(), beforeDuplicateLoad);
for (const id of ['p1', 'p2', 'p3', 'step', 'finish', 'next', 'reset']) assert.equal(pd(id).listeners.click.length, 1);
assert.equal(root.listeners.keydown.length, 1);
click('finish');
assert.equal(activeLine(), 'accept');
assert.equal(text('rowno'), '· 1 of 18');
assert.equal(text('count'), '· 1 of 1 passed');
assert.match(text('log'), /ada, cs.*keep row/);
controls(true, false);
const accepted = view();
click('step'); click('finish');
assert.deepEqual(view(), accepted, 'The completed row stays visible until Next row');
click('next');
assert.equal(text('rowno'), '· 2 of 18');
assert.equal(activeLine(), null);
assert.equal(text('lhs-value'), '—');
assert.equal(text('rhs-value'), '—');
assert.equal(text('count'), '· 1 of 1 passed');
assert.match(text('source'), /students\(ada\).*majors\(stat\)/);
for (let i = 0; i < 4; i++) click('step');
assert.equal(activeLine(), 'compare');
assert.equal(text('comparison'), '1 == 2 → False');
assert(terms()[1].classList.contains('pending'));
click('step');
assert.equal(activeLine(), 'reject');
assert(terms()[1].classList.contains('skipped'));
assert.match(terms()[1].textContent, /skipped — no lookups/);
assert(!field('gpa').classList.contains('is-left'));
assert.equal(text('lhs-value'), '1');
assert.equal(text('rhs-value'), '2');
assert.equal(text('count'), '· 1 of 2 passed');
assert.match(text('eval'), /GPA|gpa lookup/);
controls(true, false);
const rejected = view();
click('step'); click('finish');
assert.deepEqual(view(), rejected, 'Rejected operands and skipped terms stay visible');
click('reset');
assert.deepEqual(view(), ready);

for (const [key, rowCount, passed] of [['p1', 6, 3], ['p2', 6, 1], ['p3', 18, 3]]) {
  click(key);
  for (const mode of ['p1', 'p2', 'p3']) assert.equal(pd(mode).getAttribute('aria-pressed'), String(mode === key));
  assert.equal(text('count'), '· 0 of 0 passed');
  assert.equal(pd('log').children.length, 0);
  for (let row = 1; row <= rowCount; row++) {
    assert.equal(text('rowno'), `· ${row} of ${rowCount}`);
    assert.equal(activeLine(), null);
    controls(false, true);
    click('finish');
    assert(['accept', 'reject'].includes(activeLine()));
    assert.equal(pd('log').children.length, row);
    controls(true, row === rowCount);
    if (row < rowCount) click('next');
  }
  assert.equal(text('count'), `· ${passed} of ${rowCount} passed · complete`);
  assert.match(text('eval'), /Every input row has now been checked/);
  const completed = view();
  click('next'); click('finish'); click('step');
  assert.deepEqual(view(), completed, 'Final controls cannot advance or recount');
  click('reset');
  assert.equal(pd(key).getAttribute('aria-pressed'), 'true', 'Reset preserves selected preset');
  assert.equal(text('count'), '· 0 of 0 passed');
  controls(false, true);
}

for (const line of lines) {
  assert.equal(line.tabIndex, 0, 'Annotated code can receive keyboard focus');
  line.dispatch('focus');
  assert.equal(panel.textContent, line.dataset.explain);
  line.dispatch('blur');
  assert.equal(panel.textContent, defaultPanel);
  line.dispatch('click');
  assert.equal(panel.textContent, line.dataset.explain);
}
assert(widget.includes('<summary>'), 'The row-history summary must exist in the page');
const summary = new Element('summary');
summary.parent = root;
for (const [target, key, stopped] of [
  [pd('step'), ' ', true], [pd('p2'), 'Enter', true], [lines[2], 'ArrowRight', true],
  [summary, 'Enter', true], [pd('step'), 'Escape', false], [root, 'ArrowRight', false],
]) {
  const event = target.dispatch('keydown', { key });
  assert.equal(event.stopped, stopped);
  assert.equal(event.defaultPrevented, false, 'Native keyboard actions remain enabled');
}
console.log('Predicate UI: actual markup/assets, code lines, operands, short-circuit traces, controls, all presets, focus, and keyboard behavior passed.');
