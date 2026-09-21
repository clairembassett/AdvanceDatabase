"""Exercise the Lab 5 terminal as students run it, across complete sessions."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'labs/lab-05/starter/microdb.py'


class Lab5TerminalTests(unittest.TestCase):
    def session(self, directory, sql, *args):
        run = subprocess.run(
            [sys.executable, str(SCRIPT), *args], input=sql, text=True,
            capture_output=True, cwd=directory, timeout=30,
            env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'})
        self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
        self.assertEqual(run.stderr, '')
        return run.stdout

    def test_demo_queries_commands_and_error_recovery(self):
        with tempfile.TemporaryDirectory() as directory:
            output = self.session(directory, '''.help
.tables
.schema students
SELECT * FROM majors;
SELECT name FROM students WHERE sid < 3;
SELECT name FROM students WHERE gpa > 39;
SELECT name students;
SELECT missing FROM students;
.schema missing
.not_a_command
;
SELECT name FROM students WHERE sid = 299;
exit
''', '--demo')
            self.assertIn('300 students and 3 majors', output)
            self.assertIn('students (sid INT, name VARCHAR(16), gpa INT, mid INT)', output)
            self.assertIn('majors (mid2 INT, dept VARCHAR(8))', output)
            self.assertIn('(2 rows)', output)  # .tables
            self.assertEqual(output.count('(3 rows)'), 2)
            self.assertIn('s0\ns1\ns2', '\n'.join(line.rstrip() for line in output.splitlines()))
            self.assertIn('(0 rows)', output)
            self.assertIn("expected 'from'", output)
            self.assertIn('unknown field(s): missing', output)
            self.assertIn('no such table in catalog', output)
            self.assertIn('Unknown command.', output)
            self.assertIn('s299', output)
            self.assertIn('(1 row)', output)
            self.assertIn('demo data removed', output)
            self.assertEqual(list(Path(directory).iterdir()), [])

    def test_persistent_session_saves_at_eof_and_reopens(self):
        with tempfile.TemporaryDirectory() as directory:
            output = self.session(directory, '''.tables
CREATE TABLE readings (rid INT, label VARCHAR(12), value INT);
INSERT INTO readings VALUES (1, 'North', 12);
INSERT INTO readings VALUES (2, 'south', 28)
''')
            self.assertIn('No tables yet.', output)
            self.assertIn('changes saved in ./mydb', output)
            reopened = self.session(directory, '''.schema readings
SELECT label FROM readings WHERE value > 10;
quit;
''')
            self.assertIn('readings (rid INT, label VARCHAR(12), value INT)', reopened)
            self.assertIn('North', reopened)
            self.assertIn('south', reopened)
            self.assertIn('(2 rows)', reopened)
            # Demo mode must not add its fixture to or modify the saved database.
            before = {p.name: p.read_bytes() for p in (Path(directory) / 'mydb').iterdir()}
            demo = self.session(directory, '.tables\n.quit\n', '--demo')
            self.assertNotIn('readings', demo)
            after = {p.name: p.read_bytes() for p in (Path(directory) / 'mydb').iterdir()}
            self.assertEqual(before, after)


if __name__ == '__main__':
    unittest.main()
