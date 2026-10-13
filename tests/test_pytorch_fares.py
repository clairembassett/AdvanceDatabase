"""ML checks: no test-data leakage, and SQL calls the frozen network.

Run with the Lab 8 environment:
    python -m unittest discover -s tests -p test_pytorch_fares.py -v
"""

import importlib.util
from pathlib import Path
import tempfile
import unittest

AVAILABLE = all(importlib.util.find_spec(name) for name in ("duckdb", "torch", "numpy", "pyarrow", "matplotlib"))
if AVAILABLE:
    import duckdb
    import torch

    path = Path(__file__).resolve().parents[1] / "labs/lab-08/starter/pytorch_fares.py"
    spec = importlib.util.spec_from_file_location("pytorch_fares", path)
    demo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(demo)


@unittest.skipUnless(AVAILABLE, "Install the Lab 8 PyTorch requirements to run these checks")
class TestPyTorchFares(unittest.TestCase):
    def prepared(self, directory, test_fare=9):
        con = duckdb.connect()
        path = Path(directory) / f"rides-{test_fare}.parquet"
        con.execute("""
            CREATE TABLE fixture AS SELECT * FROM (VALUES
              (1, 1, 1.0, 6.0), (2, 3, 2.0, 6.0),
              (3, 7, 3.0, 8.0), (4, 10, 4.0, 12.0),
              (5, 11, 2.5, ?), (6, 12, 4.5, 11.0)
            ) t(ride_id, month, distance, fare)
        """, [test_fare])
        con.execute("COPY fixture TO ? (FORMAT parquet)", [str(path)])
        counts, stats = demo.prepare(con, path)
        self.assertEqual(counts, (4, 2))
        return con, stats

    def test_reserved_fares_cannot_change_training(self):
        with tempfile.TemporaryDirectory() as directory:
            con, stats = self.prepared(directory)
            with con:
                model, history = demo.fit(con, stats, epochs=3, batch_size=2)
                baseline = con.table("linear_model").fetchall()
            changed, changed_stats = self.prepared(directory, test_fare=10000)
            with changed:
                changed_model, changed_history = demo.fit(changed, changed_stats, epochs=3, batch_size=2)
                self.assertEqual(stats, changed_stats)
                self.assertEqual(baseline, changed.table("linear_model").fetchall())
                self.assertEqual(history, changed_history)
                for a, b in zip(model.parameters(), changed_model.parameters()):
                    self.assertTrue(torch.equal(a, b))

    def test_sql_inference_matches_pytorch_and_preserves_weights(self):
        with tempfile.TemporaryDirectory() as directory:
            con, stats = self.prepared(directory)
            with con:
                model, _ = demo.fit(con, stats, epochs=3, batch_size=2)
                before = [p.detach().clone() for p in model.parameters()]
                demo.register_predictor(con, model, stats)
                metrics, groups = demo.evaluate(con)
                self.assertEqual(con.sql("SELECT ride_id FROM predictions ORDER BY ride_id").fetchall(), [(5,), (6,)])
                self.assertEqual([r[1] for r in metrics], [2, 2])
                self.assertEqual(sum(r[1] for r in groups), 2)
                self.assertAlmostEqual(metrics[0][2], 1.0)
                self.assertAlmostEqual(metrics[0][3], 1.0)
                # More than one Arrow batch, including a partial final batch.
                values = con.sql("SELECT i / 100.0 AS distance, predict_fare_nn(i / 100.0) AS predicted FROM range(1, 5002) t(i) ORDER BY i").fetchnumpy()
                x = torch.tensor(values['distance'], dtype=torch.float32).reshape(-1, 1)
                with torch.inference_mode():
                    expected = (model((x - stats[0]) / stats[1]) * stats[3] + stats[2]).flatten()
                actual = torch.tensor(values['predicted'], dtype=torch.float32)
                torch.testing.assert_close(actual, expected)
                for a, b in zip(before, model.parameters()):
                    self.assertTrue(torch.equal(a, b))


if __name__ == "__main__":
    unittest.main()
