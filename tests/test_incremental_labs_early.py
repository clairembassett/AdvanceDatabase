"""Regression checks for independent function tests in Labs 1, 2, and 4.

Run: python3 -m unittest discover -s tests -p 'test_incremental_labs_early.py' -v
These checks load only one completed method at a time. Student files are
never rewritten. Existing supplied later-lab methods serve as references.
"""
import ast
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
LABS = {
    1: ("file_manager", "test_filemanager", 2, 9),
    2: ("buffer_manager", "test_buffermanager", 3, 10),
    4: ("query_engine", "test_scans", 5, 11),
}

def todo_targets(lab):
    module = LABS[lab][0]
    tree = ast.parse((ROOT / "labs" / f"lab-{lab:02d}" / "starter" / f"{module}.py").read_text())
    return [f"{cls.name}.{method.name}" for cls in tree.body if isinstance(cls, ast.ClassDef)
            for method in cls.body if isinstance(method, ast.FunctionDef)
            if any(isinstance(node, ast.Raise) and "NotImplementedError" in ast.unparse(node)
                   for node in ast.walk(method))]


def setup_code(lab):
    module, harness, reference_lab, _ = LABS[lab]
    starter = ROOT / "labs" / f"lab-{lab:02d}" / "starter"
    reference = (
        ROOT / "labs" / f"lab-{reference_lab:02d}" / "starter" / f"{module}.py").read_text()
    return f'''
import ast, importlib, sys
sys.path.insert(0, {str(starter)!r})
student = importlib.import_module({module!r})
harness = importlib.import_module({harness!r})
targets = {todo_targets(lab)!r}
assert set(harness.UNIT_TESTS) == set(targets), (set(harness.UNIT_TESTS), targets)
reference = ast.parse({reference!r})
implementations = {{}}
for cls in reference.body:
    if not isinstance(cls, ast.ClassDef):
        continue
    for method in cls.body:
        if not isinstance(method, ast.FunctionDef):
            continue
        target = cls.name + "." + method.name
        if target in targets:
            namespace = student.__dict__
            exec(compile(ast.Module(body=[method], type_ignores=[]), "<reference>", "exec"), namespace)
            implementations[target] = namespace[method.name]
assert set(implementations) == set(targets)
owners = {{target: getattr(student, target.split(".")[0]) for target in targets}}
originals = {{target: getattr(owners[target], target.split(".")[1]) for target in targets}}
def install(target, implementation):
    setattr(owners[target], target.split(".")[1], implementation)
def assert_restored(expected):
    for target in targets:
        assert getattr(owners[target], target.split(".")[1]) is expected[target], target
'''


class EarlyLabIncrementalTests(unittest.TestCase):
    def run_python(self, code):
        with tempfile.TemporaryDirectory(prefix="incremental-regression-") as d:
            result = subprocess.run([sys.executable, "-c", code], cwd=d,
                                    env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
                                    capture_output=True, text=True, timeout=60)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertEqual(list(Path(d).iterdir()), [], "test harness left files in the working directory")
            return result.stdout

    def test_each_target_passes_alone_and_does_not_mask_a_stub_or_noop(self):
        for lab in LABS:
            with self.subTest(lab=lab):
                self.run_python(setup_code(lab) + '''
for target in targets:
    for implementation, should_pass in [(originals[target], False),
                                        (lambda *args, **kwargs: None, False),
                                        (implementations[target], True)]:
        install(target, implementation)
        expected = dict(originals, **{target: implementation})
        try:
            harness.UNIT_TESTS[target]()
        except Exception:
            if should_pass:
                raise
        else:
            assert should_pass, f"{target}: unfinished/no-op target incorrectly passed"
        assert_restored(expected)
        install(target, originals[target])
assert_restored(originals)
''')

    def test_all_units_restore_methods_and_preserve_integration_count(self):
        for lab, (_, _, _, count) in LABS.items():
            with self.subTest(lab=lab):
                output = self.run_python(setup_code(lab) + '''
for target in targets:
    install(target, implementations[target])
sys.argv = [harness.__file__, "--unit"]
try:
    harness.main()
except SystemExit as result:
    assert result.code == 0
assert len(harness.RESULTS) == len(targets) and all(harness.RESULTS)
assert_restored(implementations)
sys.argv = [harness.__file__]
try:
    harness.main()
except SystemExit as result:
    assert result.code == 0
assert_restored(implementations)
''' + f'assert len(harness.RESULTS) == {count} and all(harness.RESULTS)\n')
                self.assertIn(f"{count}/{count} tests passed", output)

    def test_cli_lists_targets_rejects_typos_and_runs_one_function(self):
        for lab, (_, harness, _, _) in LABS.items():
            with self.subTest(lab=lab):
                script = ROOT / "labs" / f"lab-{lab:02d}" / "starter" / f"{harness}.py"
                with tempfile.TemporaryDirectory(prefix="incremental-cli-") as d:
                    for args, expected_code in [(["--list"], 0), (["--unit", "typo"], 2)]:
                        result = subprocess.run([sys.executable, str(script), *args], cwd=d,
                                                env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
                                                capture_output=True, text=True, timeout=30)
                        self.assertEqual(result.returncode, expected_code, result.stdout + result.stderr)
                        if args == ["--list"]:
                            self.assertEqual(result.stdout.splitlines(), todo_targets(lab))
                        self.assertEqual(list(Path(d).iterdir()), [])
                self.run_python(setup_code(lab) + '''
target = targets[0]
install(target, implementations[target])
sys.argv = [harness.__file__, "--unit", target]
try:
    harness.main()
except SystemExit as result:
    assert result.code == 0
assert harness.RESULTS == [True], harness.RESULTS
assert_restored(dict(originals, **{target: implementations[target]}))
''')


if __name__ == "__main__":
    unittest.main()
