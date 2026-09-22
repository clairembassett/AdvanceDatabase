"""The supplied Lab 5 engine and its first-principles measurement contract."""
import ast
from html.parser import HTMLParser
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import textwrap
import unittest

ROOT = Path(__file__).resolve().parents[1]
STARTER = ROOT / 'labs/lab-05/starter'


class Lab5MeasurementTests(unittest.TestCase):
    def run_code(self, code):
        with tempfile.TemporaryDirectory(prefix='lab5-regression-') as directory:
            result = subprocess.run([sys.executable, '-c',
                'import sys\nsys.path.insert(0, ' + repr(str(STARTER)) + ')\n' + code],
                cwd=directory, env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'},
                capture_output=True, text=True, timeout=60)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertEqual(list(Path(directory).iterdir()), [])

    def test_complete_engine_and_invalid_queries_release_pins(self):
        self.run_code('''
from sql_frontend import Parser, ParseError
from measure_sql import school
for sql in ['SELECT name FROM students OR gpa > 35',
            'SELECT name FROM students WHERE gpa > 35 garbage',
            'SELECT name FROM students; SELECT name FROM students']:
    try: Parser(sql).parse()
    except ParseError: pass
    else: raise AssertionError(sql)
assert Parser('SELECT name FROM students;').parse().fields == ['name']
with school(6) as db:
    for sql in ['SELECT nonexistent FROM students',
                "SELECT name FROM students WHERE gpa > 'bad'",
                'SELECT name FROM students, missing']:
        try: db.execute(sql)
        except (ParseError, KeyError, ValueError, TypeError): pass
        else: raise AssertionError(sql)
        assert not any(frame.is_pinned() for frame in db.bm.pool)
    assert len(db.execute('SELECT name FROM students')) == 6
''')

    def test_required_comparisons_have_explainable_counts(self):
        self.run_code('''
from measure_sql import school, compare
join = "SELECT name, dept FROM students, majors WHERE mid = mid2 AND gpa > 35 AND dept = 'ds'"
with school(300) as db:
    def run(sql):
        result = compare(db, sql, repeats=2)
        assert result['same_results']
        assert not any(frame.is_pinned() for frame in db.bm.pool)
        for mode in result['measurements']:
            assert len(mode['samples_ms']) == 2 and mode['median_ms'] >= 0
        return result['measurements']
    all_names, _ = run('SELECT name FROM students')
    filtered, _ = run('SELECT name FROM students WHERE gpa > 35')
    wide, _ = run('SELECT * FROM students WHERE gpa > 35')
    assert all_names['table_row_visits'] == filtered['table_row_visits'] == wide['table_row_visits'] == {'students':300}
    assert (all_names['rows_returned'],filtered['rows_returned'],wide['rows_returned']) == (300,60,60)
    assert (all_names['output_cells'],filtered['output_cells'],wide['output_cells']) == (300,60,240)
    simple, early = run(join)
    assert simple['table_row_visits'] == {'students':300,'majors':900}
    assert early['table_row_visits'] == {'students':300,'majors':180}
    assert [m['candidate_pairs'] for m in (simple,early)] == [900,60]
    assert [m['predicate_comparisons'] for m in (simple,early)] == [1260,540]
    assert [m['rows_returned'] for m in (simple,early)] == [20,20]
    reversed_simple, reversed_early = run(join.replace('students, majors','majors, students'))
    assert reversed_simple['table_row_visits'] == {'majors':3,'students':900}
    assert reversed_early['table_row_visits'] == {'majors':3,'students':300}
    assert reversed_early['candidate_pairs'] == 60
    assert reversed_early['predicate_comparisons'] == 363
    high_simple, high_early = run(join.replace('> 35','> 38'))
    assert [m['candidate_pairs'] for m in (high_simple,high_early)] == [900,15]
    assert [m['rows_returned'] for m in (high_simple,high_early)] == [5,5]
    empty_simple, empty_early = run(join.replace('> 35','> 39'))
    assert empty_simple['candidate_pairs'] == 900 and empty_early['candidate_pairs'] == 0
    assert empty_early['table_row_visits'] == {'students':300,'majors':0}
    reordered, _ = run(join.replace("mid = mid2 AND gpa > 35 AND dept = 'ds'", "gpa > 35 AND dept = 'ds' AND mid = mid2"))
    assert reordered['candidate_pairs'] == 900 and reordered['predicate_comparisons'] == 1140
    # Projection can create duplicate result rows. Equivalence must preserve them.
    duplicates, _ = run('SELECT dept FROM students, majors WHERE mid = mid2')
    assert duplicates['rows_returned'] == 300
with school(600) as db:
    doubled = compare(db,join,repeats=1)['measurements']
    assert [m['candidate_pairs'] for m in doubled] == [1800,120]
    assert [m['rows_returned'] for m in doubled] == [40,40]
''')

    def test_query_files_and_cli(self):
        self.run_code('''
import json, pathlib, subprocess, sys
from measure_sql import read_queries, __file__ as script
assert read_queries("-- comment\\nSELECT name FROM students;\\nSELECT name FROM students WHERE name = 'x;--y';") == [
    'SELECT name FROM students', "SELECT name FROM students WHERE name = 'x;--y'"]
assert read_queries('-- only a comment') == []
result = subprocess.run([sys.executable,script,'--students','60','--repeat','2','--sql',
    'SELECT name FROM students WHERE gpa > 35','--json'], capture_output=True,text=True)
assert result.returncode == 0, result.stderr
report = json.loads(result.stdout)
assert report['students'] == 60 and report['results'][0]['same_results']
assert report['results'][0]['measurements'][0]['rows_returned'] == 12
bad = subprocess.run([sys.executable,script,'--sql','SELECT name students'],capture_output=True,text=True)
assert bad.returncode != 0 and "expected 'from'" in bad.stderr
''')

    def test_walkthrough_code_matches_supplied_methods(self):
        class Blocks(HTMLParser):
            def __init__(self):
                super().__init__()
                self.blocks, self.active = {}, None
            def handle_starttag(self, tag, attrs):
                if tag == 'pre' and 'data-source-method' in dict(attrs):
                    self.active = dict(attrs)['data-source-method']
                    self.blocks[self.active] = ''
            def handle_endtag(self, tag):
                if tag == 'pre': self.active = None
            def handle_data(self, data):
                if self.active: self.blocks[self.active] += data
        blocks = Blocks()
        blocks.feed((ROOT / 'labs/lab-05/sqlfrontend.html').read_text())
        source = ast.parse((STARTER / 'sql_frontend.py').read_text())
        self.assertEqual(len(blocks.blocks), 5)
        for full_name, code in blocks.blocks.items():
            cls_name, method_name = full_name.split('.')
            cls = next(n for n in source.body if isinstance(n, ast.ClassDef) and n.name == cls_name)
            method = next(n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name == method_name)
            if (isinstance(method.body[0], ast.Expr) and isinstance(method.body[0].value, ast.Constant)
                    and isinstance(method.body[0].value.value, str)):
                method.body.pop(0)
            shown = ast.parse(textwrap.dedent(code)).body[0]
            self.assertEqual(ast.dump(shown), ast.dump(method), full_name)


if __name__ == '__main__':
    unittest.main()
