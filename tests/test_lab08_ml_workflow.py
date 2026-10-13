"""Check the student's saved-prediction query workflow without training a model."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

try:
    import duckdb
except ImportError:
    duckdb = None

ROOT = Path(__file__).resolve().parents[1]


@unittest.skipUnless(duckdb, "Install DuckDB to check the Lab 8 query workflow")
class TestPredictionExplorer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location(
            "explore_predictions", ROOT / "labs/lab-08/starter/explore_predictions.py")
        cls.explorer = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.explorer)

    def test_saved_predictions_join_to_rides_and_zones_without_training_rows(self):
        with tempfile.TemporaryDirectory() as tmp, duckdb.connect() as con:
            data = Path(tmp)
            con.execute("""CREATE TABLE source AS SELECT * FROM (VALUES
                (1, 1, 1, 100), (2, 10, 2, 200),
                (3, 11, 1, 9), (4, 12, 2, 11)
            ) t(ride_id, month, pickup_zone, fare)""")
            con.execute("COPY source TO ? (FORMAT parquet)", [str(data / "rides.parquet")])
            (data / "zones.csv").write_text("LocationID,Borough\n1,Manhattan\n2,Queens\n")
            predictions = data / "predictions.csv"
            predictions.write_text("ride_id,month,distance,fare,linear_fare,neural_fare\n"
                                   "3,11,2.5,9,8,8\n4,12,4.5,11,12,14\n")
            self.explorer.load_tables(con, data, predictions)
            output = data / "result.csv"
            self.explorer.run_query(con, """
                SELECT z.Borough, count(*) AS n, avg(abs(p.fare-p.neural_fare)) AS mae
                FROM predictions p JOIN rides r ON p.ride_id=r.ride_id
                JOIN zones z ON r.pickup_zone=z.LocationID
                GROUP BY z.Borough ORDER BY z.Borough
            """, output)
            self.assertEqual(con.read_csv(str(output)).fetchall(),
                             [("Manhattan", 1, 1.0), ("Queens", 1, 3.0)])
            # The untouched starter also runs as the initial overall comparison.
            starter = (ROOT / "labs/lab-08/starter/investigation.sql").read_text()
            self.explorer.run_query(con, starter, output)
            self.assertEqual(con.read_csv(str(output)).fetchall(), [(2, 1.0, 2.0)])

    def test_invalid_query_does_not_overwrite_saved_results(self):
        with tempfile.TemporaryDirectory() as tmp, duckdb.connect() as con:
            output = Path(tmp) / "result.csv"
            output.write_text("previous result\n")
            for sql in ["SELECT 1; SELECT 2", "CREATE TABLE replacement(i INTEGER)", "-- unfinished"]:
                with self.subTest(sql=sql), self.assertRaises(ValueError):
                    self.explorer.run_query(con, sql, output)
                self.assertEqual(output.read_text(), "previous result\n")


if __name__ == "__main__":
    unittest.main()
