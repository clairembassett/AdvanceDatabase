-- Lab 8 · Optional SQL practice over the rides dataset.
-- The core lab submission is the ML investigation described in duckdb.html.
-- Fill in each query below its marker comment. Run the harness any time:
--     python3 test_duckdb.py
-- Rules: keep each query a single statement; when a question specifies an
-- order, use ORDER BY (the harness compares ordered results exactly, and
-- unordered results as sets). Two tables are preloaded: `rides` from
-- data/rides.csv (60,000 real 2024 NYC taxi trips) and `zones` from
-- data/zones.csv (LocationID, Borough, Zone, service_zone). The partitioned
-- dataset lives at 'data/rides_by_month/*/*.parquet' (hive_partitioning = true).

-- Q1: How big is the business? One row: the total number of rides
--     (call it n_rides) and total revenue = SUM(fare + tip), rounded to
--     2 decimals (call it revenue).
-- YOUR QUERY:



-- Q2: Revenue by month: month, revenue (SUM(fare + tip), rounded to 2
--     decimals), one row per month, ORDER BY month.
-- YOUR QUERY:



-- Q3: Do card riders take longer trips? For each payment type: payment,
--     n (count), avg_distance (rounded to 2). ORDER BY payment.
-- YOUR QUERY:



-- Q4: The five most expensive rides: ride_id, fare. ORDER BY fare DESC,
--     then ride_id ASC to break ties, LIMIT 5.
-- YOUR QUERY:



-- Q5: The card-payment share per month: month, card_share = fraction of
--     rides paid by card, rounded to 3 decimals. ORDER BY month.
--     (Hint: AVG(CASE WHEN ... THEN 1.0 ELSE 0.0 END) is idiomatic.)
-- YOUR QUERY:



-- Q6: Running (cumulative) revenue through the year: month, revenue
--     (as in Q2), running_revenue = the sum of revenue for months 1..N,
--     both rounded to 2 decimals. ORDER BY month.
--     (Hint: a window: SUM(...) OVER (ORDER BY month).)
-- YOUR QUERY:



-- Q7: From the PARTITIONED dataset (read
--     'data/rides_by_month/*/*.parquet' with hive_partitioning = true):
--     total rides and revenue (rounded to 2) for Q4 of the year
--     (months 10, 11, 12). One row: n_rides, revenue.
--     DuckDB will prune to three of the twelve files; Part 3 measures it.
-- YOUR QUERY:



-- Q8: Where does the money come from? Join rides to zones on
--     rides.pickup_zone = zones.LocationID and report, per pickup borough:
--     borough (zones.Borough), n_rides, revenue (SUM(fare + tip), rounded
--     to 2). ORDER BY revenue DESC, LIMIT 5. This is the star-schema join
--     from Lecture 10 in miniature: rides is the fact table, zones the
--     dimension table.
-- YOUR QUERY:

