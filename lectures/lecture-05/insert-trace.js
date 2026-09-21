/* Executable teaching trace of Lab 5's provided INSERT parser.
 * Lexer helpers are recorded once per direct call from Python; expect's
 * internal match/next calls are grouped into the expect step.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.InsertParserTrace = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const prefix = [['KEYWORD', 'insert'], ['KEYWORD', 'into'], ['ID', 'students'],
    ['KEYWORD', 'values'], ['PUNCT', '(']];
  const cases = {
    valid: {
      label: 'Three values', sql: "INSERT INTO students VALUES (7, 'gil', 33)",
      tokens: [...prefix, ['NUM', 7], ['PUNCT', ','], ['STR', 'gil'], ['PUNCT', ','], ['NUM', 33], ['PUNCT', ')']],
    },
    comma: {
      label: 'Missing comma', sql: "INSERT INTO students VALUES (7 'gil', 33)",
      tokens: [...prefix, ['NUM', 7], ['STR', 'gil'], ['PUNCT', ','], ['NUM', 33], ['PUNCT', ')']],
    },
    value: {
      label: 'Missing value', sql: 'INSERT INTO students VALUES (7, , 33)',
      tokens: [...prefix, ['NUM', 7], ['PUNCT', ','], ['PUNCT', ','], ['NUM', 33], ['PUNCT', ')']],
    },
  };
  const code = {
    parse_insert: [
      'def parse_insert(self):',
      '    self.lex.expect("KEYWORD", "insert")',
      '    self.lex.expect("KEYWORD", "into")',
      '    table = self.lex.expect("ID")',
      '    self.lex.expect("KEYWORD", "values")',
      '    self.lex.expect("PUNCT", "(")',
      '    values = [self._parse_literal()]',
      '    while self.lex.match("PUNCT", ","):',
      '        self.lex.next()',
      '        values.append(self._parse_literal())',
      '    self.lex.expect("PUNCT", ")")',
      '    return InsertData(table, values)',
    ],
    _parse_literal: [
      'def _parse_literal(self):',
      '    if (self.lex.match("NUM")',
      '        or self.lex.match("STR")):',
      '        return self.lex.next()[1]',
      '    k, v = self.lex.peek()',
      '    raise ParseError(',
      '        "expected a number or \'string\', "',
      '        f"found {v!r}")',
    ],
  };
  const repr = value => value === null ? 'None' : typeof value === 'string'
    ? "'" + value.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'" : String(value);
  const tokenText = ([kind, value]) => '(' + kind + ', ' + repr(value) + ')';

  function build(tokens) {
    let pos = 0, table = null, values = [], result = null;
    const steps = [], stack = ['parse_insert'];
    const current = () => tokens[pos] || ['EOF', null];
    const matches = (kind, value) => current()[0] === kind &&
      (value === undefined || current()[1] === value);
    class ParseFailure extends Error {}
    function record(line, rule, effect, action, note, error = null) {
      steps.push({ pos, line, rule, effect, action, note, error,
        method: stack.at(-1) || 'parse_insert', stack: [...stack], table,
        values: [...values], result: result && { table, values: [...values] } });
    }
    function fail(line, rule, message) {
      record(line, rule, 'error', 'ParseError: ' + message,
        'Stop at this token. No InsertData is returned and no row is written.', message);
      throw new ParseFailure(message);
    }
    function expect(kind, value, line, rule, save) {
      const call = 'expect(' + repr(kind) + (value === undefined ? '' : ', ' + repr(value)) + ')';
      if (!matches(kind, value)) {
        fail(line, rule, 'expected ' + repr(value === undefined ? kind : value) + ', found ' + repr(current()[1]));
      }
      const token = current(); pos++;
      if (save) save(token[1]);
      record(line, rule, 'consume', call + ' → ' + repr(token[1]),
        'expect checks the required token and consumes it. The cursor advances by one.');
      return token[1];
    }
    function match(kind, value, line, rule, note) {
      const answer = matches(kind, value);
      record(line, rule, 'inspect', 'match(' + repr(kind) + (value === undefined ? '' : ', ' + repr(value)) + ') → ' + (answer ? 'True' : 'False'), note);
      return answer;
    }
    function literal(callerLine, rule) {
      stack.push('_parse_literal');
      record(0, rule, 'call', 'Call _parse_literal()',
        'The literal rule has its own method. parse_insert waits for one value to be returned.');
      const numeric = match('NUM', undefined, 1, rule,
        'Is this token a number? match only inspects it; the cursor stays put.');
      const string = !numeric && match('STR', undefined, 2, rule,
        'The number test was False, so Python tries the string alternative. The cursor still stays put.');
      if (numeric || string) {
        const token = current(); pos++;
        record(3, rule, 'consume', 'next() → ' + tokenText(token),
          'The kind check passed. next consumes the token; [1] extracts its value.');
        stack.pop(); values.push(token[1]);
        record(callerLine, rule, 'return', 'Return ' + repr(token[1]) + ' to parse_insert()',
          'The caller saves the value. The literal method leaves the following comma or closing parenthesis unread.');
        return;
      }
      record(4, rule, 'inspect', 'peek() → ' + tokenText(current()),
        'Neither kind matched. peek reads the unexpected token for the error message without consuming it.');
      fail(5, rule, "expected a number or 'string', found " + repr(current()[1]));
    }
    record(0, 'insert', 'call', 'Enter parse_insert()',
      'The lexer has already produced these tokens. The insert grammar rule maps to this Python method.');
    try {
      expect('KEYWORD', 'insert', 1, 'insert');
      expect('KEYWORD', 'into', 2, 'into');
      expect('ID', undefined, 3, 'table', value => { table = value; });
      expect('KEYWORD', 'values', 4, 'values');
      expect('PUNCT', '(', 5, 'open');
      literal(6, 'first');
      while (match('PUNCT', ',', 7, 'repeat',
        'A comma means another literal follows. This test does not consume the comma. False ends the loop.')) {
        pos++;
        record(8, 'repeat', 'consume', "next() → (PUNCT, ',')",
          'Consume the comma before calling the literal method again. This is the { , literal } repetition.');
        literal(9, 'repeat');
      }
      expect('PUNCT', ')', 10, 'close');
      result = { table, values: [...values] }; stack.pop();
      record(11, 'result', 'return', 'Return InsertData',
        'Parsing is complete. This object describes the requested insert; execution has not written any rows.');
    } catch (error) {
      if (!(error instanceof ParseFailure)) throw error;
    }
    return steps;
  }
  return { cases, code, build, repr, tokenText };
});
