'use strict';

// Run with: node tests/test_insert_parser_trace.js
// Compare the teaching trace with direct lexer-helper calls in the real lab parser.
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { cases, build } = require('../lectures/lecture-05/insert-trace.js');
const fixtures = [...Object.values(cases),
  { sql: 'INSERT INTO students VALUES (7)' },
  { sql: 'INSERT INTO students VALUES (7' },
  { sql: 'INSERT INTO students VALUES (name)' },
  { sql: '' },
];
const python = String.raw`
import inspect, json, sys
from sql_frontend import Lexer, Parser, ParseError

class TracedLexer(Lexer):
    def __init__(self, sql):
        super().__init__(sql)
        self.depth = 0
        self.calls = []

def wrap(name):
    original = getattr(Lexer, name)
    def traced(self, *args):
        method = inspect.currentframe().f_back.f_code.co_name
        self.depth += 1
        try:
            return original(self, *args)
        finally:
            self.depth -= 1
            if self.depth == 0:
                self.calls.append(dict(helper=name, method=method, pos=self.pos))
    return traced

for name in ('peek', 'next', 'match', 'expect'):
    setattr(TracedLexer, name, wrap(name))

answers = []
for sql in json.load(sys.stdin):
    parser = Parser(sql)
    parser.lex = TracedLexer(sql)
    result, error = None, None
    try:
        data = parser.parse_insert()
        result = dict(table=data.table, values=data.values)
    except ParseError as exc:
        error = str(exc)
    answers.append(dict(tokens=parser.lex.tokens, calls=parser.lex.calls,
                        result=result, error=error, pos=parser.lex.pos))
print(json.dumps(answers))
`;
const result = spawnSync('python3', ['-c', python], {
  cwd: path.join(__dirname, '../labs/lab-05/starter'),
  input: JSON.stringify(fixtures.map(f => f.sql)), encoding: 'utf8',
  env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
});
assert.equal(result.status, 0, result.stderr);
const expected = JSON.parse(result.stdout);
fixtures.forEach((fixture, index) => {
  const actual = expected[index];
  if (fixture.tokens) assert.deepEqual(fixture.tokens, actual.tokens, fixture.sql);
  const steps = build(actual.tokens), last = steps.at(-1);
  const helperCalls = steps.flatMap(step => {
    const helper = step.action.match(/^(peek|next|match|expect)\(/)?.[1] ||
      (step.error && step.method === 'parse_insert' ? 'expect' : null);
    return helper ? [{ helper, method: step.method, pos: step.pos }] : [];
  });
  assert.deepEqual(helperCalls, actual.calls, 'Direct helper calls: ' + fixture.sql);
  assert.deepEqual(last.result, actual.result, 'Returned data: ' + fixture.sql);
  assert.equal(last.error, actual.error, 'Error text: ' + fixture.sql);
  assert.equal(last.pos, actual.pos, 'Final cursor: ' + fixture.sql);
  steps.forEach((step, i) => {
    const before = i ? steps[i - 1].pos : 0;
    assert.equal(step.pos - before, step.effect === 'consume' ? 1 : 0, step.action);
    if (step.method === '_parse_literal') assert.deepEqual(step.stack, ['parse_insert', '_parse_literal']);
  });
  if (last.result) assert.deepEqual(last.stack, []);
  const before = JSON.stringify(steps[0]);
  last.values.push('changed');
  assert.equal(JSON.stringify(steps[0]), before, 'Snapshots must not share value arrays');
});
console.log('INSERT walkthrough matches the real Python parser for 7 cases, including helper calls, cursor positions, results, and errors.');
