'use strict';
// Run: node tests/test_teaching_traces.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const traces = require('../labs/_shared/teaching-traces.js');
const {examples, fixtures, models} = traces;

// Examples have real intermediate states, valid code highlights, and answers.
for (const [id, example] of Object.entries(examples)) {
  assert.equal(example.id, id);
  assert(example.premise.length > 80, id+' states the input and assumptions');
  assert(example.frames.length >= 4);
  assert(example.question && example.answer);
  for (const f of example.frames) {
    assert(f.explanation.length > 70, id+' explains the state transition');
    assert(f.rows.length > 0 && f.rows.every(r => r.length === 2));
    assert(f.lines.every(n => Number.isInteger(n) && n >= 1 && n <= example.code.length));
  }
}

// Independently compute the key teaching quantities, including edge cases
// that make plausible-looking examples wrong (duplicates, short lists, cycles).
const leaves = fixtures.tree.leaves;
const rangeRids = leaves.flatMap(leaf => leaf.keys.flatMap((key,i) => key >= 31 && key <= 37 ? leaf.rids[i] : []));
assert.deepEqual(rangeRids, [[0,1],[1,0],[0,5],[0,4],[0,2]]);
assert.equal(leaves[1].keys[0], fixtures.tree.separator);
assert.deepEqual(leaves[1].rids[0], [[0,4]]);
let balance = 10;
const finished = new Set();
const restored = [];
for (const rec of fixtures.undoLog.slice().reverse()) {
  if (['COMMIT','ROLLBACK'].includes(rec.kind)) finished.add(rec.tx);
  else if (rec.kind === 'SET_INT' && !finished.has(rec.tx)) {
    balance = rec.old;
    restored.push(balance);
  }
}
assert.deepEqual(restored, [40,60]);
assert.equal(balance, 60, 'committed tx1 is preserved');
assert.deepEqual(models.cost(100), {scan:1000,index:103});
assert.deepEqual(models.cost(2000), {scan:1000,index:2003});
assert.equal(models.cost(997).scan, models.cost(997).index);
assert.deepEqual(fixtures.monthly, [[1,20],[2,30]]);
assert.equal(fixtures.monthly.reduce((s,r) => s+r[1],0), 50);
assert.deepEqual(fixtures.buckets, [[0],[1,2,3]]);
const one = models.ivf(1), all = models.ivf(2);
assert.deepEqual(one.result, [[.8,0]]);
assert.equal(one.comparisons, 3);
assert.equal(one.recall, .5);
assert.deepEqual(all.result.map(p => p[1]), [1,0]);
assert(Math.abs(all.result[0][0] - .96) < 1e-12);
assert.equal(all.comparisons, 6);
assert.equal(all.recall, 1);
assert.deepEqual(fixtures.hits.map(([,i]) => fixtures.chunks[i].doc), ['wal','blocks','wal']);
assert(fixtures.chunks.every(c => !('score' in c)), 'stored corpus has no query score');
const counts = new Map();
fixtures.mapped.forEach(([word,n]) => counts.set(word, (counts.get(word)||0)+n));
assert.deepEqual([...counts], [['wal',3],['page',1]]);
const graph = models.graphCounts(3);
assert.deepEqual(graph.layers.map(x => x.frontier), [['ben','cyd'],['dee','eli'],['fay']]);
assert.deepEqual(graph.layers.map(x => x.pathRows), [2,4,5]);
assert.equal(graph.edgeVisits, 8);
assert.equal(graph.paths, 11);
assert.equal(graph.reachable.length, 5);

// The actual lecture/lab pages load the shared controller after its data.
const covered = new Set();
let pageCount = 0;
for (const base of ['lectures','labs']) {
  for (const directory of fs.readdirSync(path.join(root,base))) {
    if (!/^(lecture|lab)-\d+$/.test(directory)) continue;
    for (const filename of fs.readdirSync(path.join(root,base,directory)).filter(n => n.endsWith('.html'))) {
      const p = path.join(root,base,directory,filename);
      const html = fs.readFileSync(p,'utf8');
      const embeds = [...html.matchAll(/data-teaching-trace="([^"]+)"/g)];
      if (!embeds.length) continue;
      pageCount++;
      embeds.forEach(match => match[1].split(/\s+/).forEach(id => {
        assert(examples[id], p+' uses a known example'); covered.add(id);
      }));
      const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1].split('?')[0]);
      const data = scripts.findIndex(p => p.endsWith('/teaching-traces.js'));
      const controller = scripts.findIndex(p => p.endsWith('/teaching-trace.js'));
      assert(data >= 0 && controller > data, p+' loads data first');
      scripts.filter(p => !/^https?:/.test(p)).forEach(src => assert(fs.existsSync(path.resolve(path.dirname(p),src)), src));
      const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
      assert.equal(new Set(ids).size, ids.length, p+' has unique HTML IDs');
      assert(html.includes('href="#worked-example"'));
    }
  }
}
assert.equal(pageCount,17);
assert.equal(covered.size,Object.keys(examples).length);

// Verify the projected scenes really use these states, and keep the sixty
// minute schedule. This catches accidental drift between slides and reading.
const context = vm.createContext({window:{},console});
for (const file of ['slides/_shared/visuals.js','labs/_shared/rag-measurements.js','labs/_shared/teaching-traces.js','slides/_shared/trace-scenes.js','slides/decks/lectures-06-10.js','slides/decks/lectures-11-15.js']) {
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
let scenes = 0, builds = 0;
for (const deck of Object.values(context.window.COURSE_DECKS)) {
  assert.equal(deck.scenes.reduce((n,s) => n+s.minutes,0),60);
  for (const scene of deck.scenes.filter(s => s.traceId)) {
    scenes++;
    const example = examples[scene.traceId];
    assert.equal(scene.steps,example.frames.length);
    const [reading,anchor] = scene.sources[0].split('#');
    const html = fs.readFileSync(path.join(root,reading),'utf8');
    const section = html.indexOf(`id="${anchor}"`);
    assert(section >= 0, 'worked scene links to an existing reading section');
    const embed = html.slice(section).match(/data-teaching-trace="([^"]+)"/);
    assert(embed && embed[1].split(/\s+/).includes(scene.traceId), 'source link reaches the matching example');
    for (let step=0;step<scene.steps;step++) {
      builds++;
      const text = context.window.DeckViz.sceneDrawing(scene,step).filter(i => i.tag==='text').map(i => i.text).join(' ');
      assert(text.includes(example.frames[step].label));
      assert.equal(scene.states[step],example.frames[step].label);
    }
  }
}
assert.equal(scenes,13);
console.log(`${pageCount} pages, ${scenes} shared slide scenes, ${builds} builds: teaching examples and arithmetic pass.`);
