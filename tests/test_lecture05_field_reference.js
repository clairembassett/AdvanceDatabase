'use strict';

// Run with: node tests/test_lecture05_field_reference.js
// Verify the pictured candidate pairs with the supplied parser and predicate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const context = vm.createContext({ window: {} });
for (const file of ['slides/_shared/visuals.js', 'slides/decks/lectures-01-05.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
}
const { COURSE_DECKS, DeckViz } = context.window;
const scene = COURSE_DECKS[5].scenes.find(s => s.id === 'lecture-05-scene-09');
const builds = [2, 3].map(step => DeckViz.sceneDrawing(scene, step));
const label = (drawing, key) => drawing.find(element => element.key === key).text;
const rows = builds.map(drawing => ({
  name: label(drawing, 'student-1-0-text'),
  mid: Number(label(drawing, 'student-1-1-text')),
  mid2: Number(label(drawing, 'major-1-0-text')),
  dept: label(drawing, 'major-1-1-text'),
}));
const python = String.raw`
import json, sys
from sql_frontend import Parser
from query_engine import F
query = Parser('SELECT name, dept FROM students, majors WHERE mid = mid2').parse()
assert isinstance(query.predicate.terms[0][2], F)
class Row:
    def __init__(self, values):
        self.values, self.reads = values, []
    def get_val(self, field):
        self.reads.append(field)
        return self.values[field]
results = []
for values in json.load(sys.stdin):
    row = Row(values)
    keep = query.predicate.is_satisfied(row)
    results.append(dict(keep=keep, reads=row.reads))
print(json.dumps(results))
`;
const run = spawnSync('python3', ['-c', python], {
  cwd: path.join(root, 'labs/lab-05/starter'), input: JSON.stringify(rows),
  encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
});
assert.equal(run.status, 0, run.stderr);
const results = JSON.parse(run.stdout);
assert.deepEqual(results.map(result => result.keep), [true, false]);
builds.forEach((drawing, i) => {
  assert.deepEqual(results[i].reads, ['mid', 'mid2']);
  ['name', 'mid', 'mid2', 'dept'].forEach((field, col) => {
    assert.equal(label(drawing, `pair-1-${col}-text`), String(rows[i][field]));
  });
  assert(label(drawing, 'comparison').includes(results[i].keep ? 'keep' : 'reject'));
  assert(label(drawing, 'lookup').includes(`reads ${rows[i].mid2} from`));
});
console.log('Lecture 5 field-reference pairs and outcomes match the supplied SQL engine.');
