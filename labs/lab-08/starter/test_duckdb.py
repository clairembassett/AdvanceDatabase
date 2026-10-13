"""Lab 8 worked SQL example checks — run: python3 test_duckdb.py

These Q1-Q8 checks do not grade the core machine-learning investigation.

Parses the supplied assignment.sql (one query under each "-- Qn:" marker), runs
each against DuckDB, and diffs the result against the reference answer
computed live from the same data. Ordered questions (2, 3, 4, 5, 6, 8) compare
exactly; unordered ones compare as sets.

Run gen_data.py once first. Requires: pip install duckdb

    python3 test_duckdb.py --list       # list query targets; no DuckDB needed
    python3 test_duckdb.py --unit Q3    # check only the distance-by-payment example
    python3 test_duckdb.py --unit       # test every query
"""

import argparse
import re
import sys
import traceback

# Reference queries — the harness's own answers, computed at test time so
# they can never drift from the data. (Yes, you could read these. The
# point of the lab is understanding them.)
REFERENCE = {
    1: ("SELECT count(*) AS n_rides, round(sum(fare + tip), 2) AS revenue FROM rides", False),
    2: ("SELECT month, round(sum(fare + tip), 2) AS revenue FROM rides "
        "GROUP BY month ORDER BY month", True),
    3: ("SELECT payment, count(*) AS n, round(avg(distance), 2) AS avg_distance "
        "FROM rides GROUP BY payment ORDER BY payment", True),
    4: ("SELECT ride_id, fare FROM rides ORDER BY fare DESC, ride_id LIMIT 5", True),
    5: ("SELECT month, round(avg(CASE WHEN payment = 'card' THEN 1.0 ELSE 0.0 END), 3) "
        "AS card_share FROM rides GROUP BY month ORDER BY month", True),
    6: ("SELECT month, round(sum(fare + tip), 2) AS revenue, "
        "round(sum(sum(fare + tip)) OVER (ORDER BY month), 2) AS running_revenue "
        "FROM rides GROUP BY month ORDER BY month", True),
    7: ("SELECT count(*) AS n_rides, round(sum(fare + tip), 2) AS revenue "
        "FROM read_parquet('data/rides_by_month/*/*.parquet', hive_partitioning = true) "
        "WHERE month IN (10, 11, 12)", False),
    8: ("SELECT z.Borough AS borough, count(*) AS n_rides, round(sum(r.fare + r.tip), 2) AS revenue "
        "FROM rides r JOIN zones z ON r.pickup_zone = z.LocationID "
        "GROUP BY z.Borough ORDER BY revenue DESC LIMIT 5", True),
}

RESULTS = []
VERBOSE = False
QUERY_NAMES = {1: "totals", 2: "revenue by month", 3: "distance by payment",
               4: "top-5 fares", 5: "card share", 6: "running revenue",
               7: "partitioned Q4 totals", 8: "revenue by pickup borough (join)"}


def check(name, fn):
    try:
        fn()
        RESULTS.append(True)
        print(f"  [PASS] SQL: {name}")
    except Exception as e:
        RESULTS.append(False)
        print(f"  [FAIL] SQL: {name} — {type(e).__name__}: {e}")
        if VERBOSE:
            traceback.print_exc()


def parse_assignment(path="assignment.sql"):
    """{q_number: sql} for every non-empty stub."""
    with open(path) as source:
        text = source.read()
    # Consume the full marker comment, including its question description.
    chunks = re.split(r"^-- Q(\d+):[^\n]*", text, flags=re.M)
    out = {}
    for i in range(1, len(chunks), 2):
        n = int(chunks[i])
        body = chunks[i + 1]
        sql = "\n".join(line for line in body.splitlines()
                        if not line.strip().startswith("--")).strip().rstrip(";")
        if sql:
            out[n] = sql
    return out


def run(con, sql):
    return con.execute(sql).fetchall()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--list", action="store_true", help="list query targets and exit")
    parser.add_argument("--unit", nargs="?", const="all", choices=["all"] +
                        [f"Q{n}" for n in REFERENCE], metavar="TARGET",
                        help="test one query, or all queries when no target is given")
    parser.add_argument("-v", action="store_true", help="show failure tracebacks")
    args = parser.parse_args(argv)
    global VERBOSE
    VERBOSE = args.v
    if args.list:
        for n, name in QUERY_NAMES.items():
            print(f"Q{n} — {name}")
        return 0
    try:
        import duckdb
    except ImportError:
        parser.exit(2, "DuckDB is required to run queries: python3 -m pip install duckdb\n")
    RESULTS.clear()
    import os
    if not os.path.exists("data/rides.csv"):
        print("data/ missing — generating it first (gen_data.py)...")
        import gen_data
        gen_data.main()
    con = duckdb.connect()
    con.execute("CREATE TABLE rides AS SELECT * FROM 'data/rides.csv'")
    con.execute("CREATE TABLE zones AS SELECT * FROM 'data/zones.csv'")

    student = parse_assignment()
    selected = sorted(REFERENCE) if args.unit in (None, "all") else [int(args.unit[1:])]
    for n in selected:
        ref_sql, ordered = REFERENCE[n]

        def one(n=n, ref_sql=ref_sql, ordered=ordered):
            if n not in student:
                raise AssertionError("no query written under this marker yet")
            got = run(con, student[n])
            want = run(con, ref_sql)
            if ordered:
                ok = got == want
            else:
                ok = sorted(map(tuple, got)) == sorted(map(tuple, want))
            if not ok:
                raise AssertionError(
                    f"result differs: yours starts {got[:2]}, expected starts {want[:2]} "
                    f"({len(got)} vs {len(want)} rows)")

        check(f"Q{n} " + QUERY_NAMES[n], one)

    con.close()
    n_pass = sum(RESULTS)
    print(f"\n{n_pass}/{len(RESULTS)} tests passed")
    return 0 if n_pass == len(RESULTS) else 1


if __name__ == "__main__":
    sys.exit(main())
