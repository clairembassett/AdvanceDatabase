-- Lab 8 · Worked DuckDB SQL examples over the rides dataset.
-- These complete queries support the core machine-learning investigation.
-- Run them in a connection with rides and zones loaded (see duckdb.html#build),
-- or check all eight with: python3 test_duckdb.py
-- Run from labs/lab-08/starter after python3 gen_data.py.
-- The checker loads rides and zones for you. Keep the Qn markers so it can
-- run one example at a time: python3 test_duckdb.py --unit Q3
-- Revenue means recorded fare + tip; cash tips are not recorded.
-- These are sample totals, not estimates of all citywide taxi revenue.

-- Q1: How many rides and how much recorded revenue?
-- Return one row for the whole sample. Add fares and recorded tips, then round the total to cents.
SELECT COUNT(*) AS n_rides,
       ROUND(SUM(fare + tip), 2) AS revenue
FROM rides;

-- Q2: How much revenue was recorded each month?
-- GROUP BY combines trips from the same month. ORDER BY puts the twelve monthly results in calendar order.
SELECT month,
       ROUND(SUM(fare + tip), 2) AS revenue
FROM rides
GROUP BY month
ORDER BY month;

-- Q3: Do card and cash rides differ in distance?
-- Return a ride count and average distance in miles for each payment type.
SELECT payment,
       COUNT(*) AS n,
       ROUND(AVG(distance), 2) AS avg_distance
FROM rides
GROUP BY payment
ORDER BY payment;

-- Q4: Which five rides have the highest fares?
-- Sort fares from highest to lowest. If fares tie, the smaller ride_id comes first.
SELECT ride_id, fare
FROM rides
ORDER BY fare DESC, ride_id ASC
LIMIT 5;

-- Q5: What fraction of rides were paid by card each month?
-- CASE turns each card payment into 1 and each cash payment into 0. Their average is the card share: 0.8 means 80%.
SELECT month,
       ROUND(AVG(CASE WHEN payment = 'card'
                      THEN 1.0 ELSE 0.0 END), 3) AS card_share
FROM rides
GROUP BY month
ORDER BY month;

-- Q6: How does revenue accumulate through the year?
-- The monthly step produces one total per month. The window then adds those totals from the first month through the current month, keeping one result per month. Round only the displayed results.
WITH monthly AS (
  SELECT month, SUM(fare + tip) AS revenue
  FROM rides
  GROUP BY month
)
SELECT month,
       ROUND(revenue, 2) AS revenue,
       ROUND(SUM(revenue) OVER (
         ORDER BY month
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ), 2) AS running_revenue
FROM monthly
ORDER BY month;

-- Q7: What are the totals for October–December?
-- Read the partitioned Parquet files directly. hive_partitioning makes month available from folder names such as month=10. The month filter lets DuckDB skip files for January–September; use EXPLAIN to inspect the scan.
SELECT COUNT(*) AS n_rides,
       ROUND(SUM(fare + tip), 2) AS revenue
FROM read_parquet(
  'data/rides_by_month/*/*.parquet',
  hive_partitioning = true
)
WHERE month IN (10, 11, 12);

-- Q8: Which pickup boroughs have the most recorded revenue?
-- Join each trip to its pickup zone to find the borough. Then group by borough and show the five highest revenue totals.
SELECT z.Borough AS borough,
       COUNT(*) AS n_rides,
       ROUND(SUM(r.fare + r.tip), 2) AS revenue
FROM rides AS r
JOIN zones AS z ON r.pickup_zone = z.LocationID
GROUP BY z.Borough
ORDER BY revenue DESC
LIMIT 5;
