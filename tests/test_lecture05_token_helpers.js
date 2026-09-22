'use strict';

// Run with: node tests/test_lecture05_token_helpers.js
// Execute the displayed calls in Python and check the slide's cursor and result.
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
const scene = COURSE_DECKS[5].scenes.find(s => s.id === 'lecture-05-scene-07');
const builds = Array.from({ length: scene.steps }, (_, i) => DeckViz.sceneDrawing(scene, i));
const item = (drawing, key) => drawing.find(element => element.key === key);
const fixture = {
  sql: item(builds[0], 'sql').text,
  calls: builds.map(drawing => item(drawing, 'call')?.text || null),
};
const python = String.raw`
import ast, json, sys
from sql_frontend import Lexer
fixture = json.load(sys.stdin)
lex = Lexer(fixture['sql'])
states = []
for expression in fixture['calls']:
    result = None
    if expression is not None:
        call = ast.parse(expression, mode='eval').body
        assert isinstance(call, ast.Call) and isinstance(call.func, ast.Name)
        assert call.func.id in ('peek', 'match', 'next', 'expect')
        result = getattr(lex, call.func.id)(*[ast.literal_eval(arg) for arg in call.args])
    states.append(dict(pos=lex.pos, returned=repr(result).replace("'", '"')))
print(json.dumps(dict(tokens=lex.tokens, states=states)))
`;
const run = spawnSync('python3', ['-c', python], {
  cwd: path.join(root, 'labs/lab-05/starter'), input: JSON.stringify(fixture),
  encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
});
assert.equal(run.status, 0, run.stderr);
const actual = JSON.parse(run.stdout);
builds.forEach((drawing, step) => {
  const state = actual.states[step];
  actual.tokens.forEach(([kind, value], i) => {
    assert.equal(item(drawing, 'kind' + i).text, kind);
    assert.equal(item(drawing, 'value' + i).text, value);
    assert.equal(!!item(drawing, 'consumed' + i), i < state.pos);
  });
  const current = item(drawing, 'token' + state.pos).attrs;
  assert.equal(item(drawing, 'cursor').attrs.x2, current.x + current.width / 2);
  assert.equal(current.fill, DeckViz.palette.greenLight);
  if (fixture.calls[step]) assert.equal(item(drawing, 'result').text, state.returned);
});
console.log('Lecture 5 helper slide matches consecutive calls to the real Python lexer.');
