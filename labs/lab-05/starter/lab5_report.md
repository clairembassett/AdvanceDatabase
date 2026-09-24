# Lab 5: Query plans and measured work

Name: Claire Bassett
Environment (Python version and operating system): python3 and MAC-OS
Commands used, student count, and timing repetitions: TA said to ignore - unclear

## 1. Explain the supplied implementation

- Trace `SELECT name FROM students WHERE gpa > 35`: what does each of
  `parse_query`, `_parse_predicate`, and `_parse_term` return?
  'parse_query': Returns fields ['name'], tables ['students'], and predicate None so far
  'parse_predicate': Returns fields ['name'], tables ['students'], and predicate ('gpa', '>', 35)
  'parse_term': Returns fields ['name'], tables ['students'], and ('gpa', '>', 35)
- Why is `mid2` represented as `F("mid2")`, but `'ds'` is a string literal?
'mid2' is wrapped in F so execution reads that field from the current field, whereas, ds is referred to as a literal in the field.
- Why must selection happen before projection for this query?
Selection must see gpa before projection hides it, making it imperative that selection runs first
- Which call starts reading result rows? Why does the runner use `finally`?
The first 'next()' call on the root scan. The finally releases the plan's buffer even if a query fails, thus enumerating the result.

## 2. Write SQL

Complete and submit `queries.sql` (S1–S3 and J1–J3).
Paste the six statements here as well, so this report is readable on its own.
-- S1: Return every student's name.
SELECT name FROM students;
-- S2: Return the names of students with gpa > 35.
SELECT name FROM students WHERE gpa > 35;
-- S3: Return all student columns for exactly the same rows as S2.
SELECT sid, name, gpa, mid FROM students WHERE gpa > 35;
-- J1: Return name and dept for students with gpa > 35 in the 'ds' department. 
-- Join students.mid to majors.mid2; put students first in FROM.
SELECT name, dept FROM students, majors WHERE mid=mid2 and gpa > 35 and dept = 'ds';
-- J2: Return the same fields and rows as J1, but put majors first in FROM.
SELECT name, dept FROM majors,students WHERE mid=mid2 and gpa > 35 and dept = 'ds';
-- J3: Use J1's table order and department, but require gpa > 38.
SELECT name, dept FROM students, majors WHERE mid=mid2 and gpa > 38 and dept = 'ds';

## 3. Predict before measuring

Keep your original predictions, including any that turn out to be wrong.
For each comparison, give a count or formula and name the operator responsible.

| Comparison | Predicted row visits / pairs / output cells | Reason |
|---|---|---|
| S1 vs S2: add a selective WHERE | 300/0/300 v. 300/0/300| SelectScan filters rows after TableScan reads them, so all 300 are visited|
| S2 vs S3: change only the SELECT list | 300/0/300 -> 300/0/300 | Project scan outputs 4 fields, but all 300 rows are already visited |
| J1: simple vs early-filter plan | 300/900/900 -> 300/0/300 | ProductScan rescans major once per student event vs. Select Scan runs on product |
| J1 vs J2: reverse FROM order | 300/900/900 |It would be the same |
| J1 vs J3: make the GPA condition more selective | 300/0/300 v. 300/0/300| SelectScan filters rows after TableScan reads them, so all 300 are visited|
| J1 with 300 vs 600 students | 600/0/600 -> 600/0/600 | Changes the amount of rows 

## 4. Record evidence

Attach `results-300.json` and `results-600.json`, or include their full contents.
Run the same six queries on both sizes. Record results for both plan modes.

| Query | Students | Plan | Student row visits | Major row visits | Candidate pairs | Comparisons | Rows | Output cells | Median ms |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|
| S1 | 300 | simple | 300 | 0 | 0 | 0 | 300 | 300 | 1.622 |
| S1 | 300 | early-filter | 300 | 0 | 0 | 0 | 300 | 300 | 1.617 |
| S2 | 300 | simple | 300 | 0 | 0 | 300 | 60 | 60 | 1.645 |
| S2 | 300 | early-filter | 300 | 0 | 0 | 300 | 60 | 60 | 1.647 |
| S3 | 300 | simple | 300 | 0 | 0 | 300 | 60 | 240 | 2.118 |
| S3 | 300 | early-filter | 300 | 0 | 0 | 300 | 60 | 240 | 2.120 |
| J1 | 300 | simple | 300 | 900 | 900 | 1260 | 20 | 40 | 60.920 |
| J1 | 300 | early-filter | 300 | 180 | 60 | 540 | 20 | 40 | 13.295 |
| J2 | 300 | simple | 900 | 3 | 900 | 1260 | 20 | 40 | 9.526 |
| J2 | 300 | early-filter | 300 | 3 | 60 | 363 | 20 | 40 | 2.265 |
| J3 | 300 | simple | 300 | 900 | 900 | 1215 | 5 | 10 | 60.903 |
| J3 | 300 | early-filter | 300 | 45 | 15 | 360 | 5 | 10 | 4.410 |

| Query | Students | Plan | Student row visits | Major row visits | Candidate pairs | Comparisons | Rows | Output cells | Median ms |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|
| S1 | 600 | simple | 600 | 0 | 0 | 0 | 600 | 600 | 3.214 |
| S1 | 600 | early-filter | 600 | 0 | 0 | 0 | 600 | 600 | 3.209 |
| S2 | 600 | simple | 600 | 0 | 0 | 600 | 120 | 120 | 3.231 |
| S2 | 600 | early-filter | 600 | 0 | 0 | 600 | 120 | 120 | 3.227 |
| S3 | 600 | simple | 600 | 0 | 0 | 600 | 120 | 480 | 4.192 |
| S3 | 600 | early-filter | 600 | 0 | 0 | 600 | 120 | 480 | 4.195 |
| J1 | 600 | simple | 600 | 1800 | 1800 | 2520 | 40 | 80 | 119.668 |
| J1 | 600 | early-filter | 600 | 360 | 120 | 1080 | 40 | 80 | 25.941 |
| J2 | 600 | simple | 1800 | 3 | 1800 | 2520 | 40 | 80 | 18.712 |
| J2 | 600 | early-filter | 600 | 3 | 120 | 723 | 40 | 80 | 4.334 |
| J3 | 600 | simple | 600 | 1800 | 1800 | 2430 | 10 | 20 | 117.800 |
| J3 | 600 | early-filter | 600 | 90 | 30 | 720 | 10 | 20 | 8.622 |


## 5. Explain differences from first principles

1. Did fewer returned rows imply fewer table row visits? Explain from TableScan
   and SelectScan's next() methods; distinguish visits from disk reads.

Fewer returned rows did not mean fewer row visits, S1 returned 300 rows and S2 returned 60, but visited all 300 rows. SelectScan next() repeatedly calls next which advances to the next record and tests the predicate on each row until one passes or the table runs out. Every row must be visited and tested before being rejected, so filtering reduces what is being passed up, not what is read. A row visit is a count of records the scan passes through, not a disk read.

2. Did selecting fewer columns avoid scanning rows? Which work did it reduce?
Selecting fewer columns did not avoid scanning rows. S2 and S3 both visited 300 rows, made 300 comparisons, and returned 60 rows. The only work that changes is the amount of output cells, not rows.

3. Derive the simple and early-filter pair counts for J1. Explain why the early
   plan still revisits majors even though only one major passes its filter.
In the simple plan, 'ProductScan' pairs every student with every major before filtering(900). In the early-filter plan, it only passes 60 students given the range of GPA's and majors. Because ProductScan restarts its right-hand scan for each left-hand row it rescans each major making it 60 x 3 = 180 major visits.
4. J1 and J2 return the same rows. Which side is restarted? Explain any changes
   in base-row visits even when the candidate-pair count stays the same.

The right-hand table is restarted. J1 restarts majors once per student. J2 restarts students once per major. The candidate pair count doesn't change, because student major combinations do not change. The table that is read is changed. In the early-filter plans, J1 rereads majors for each of the 60 students that pass the GPA filter (300 + 180 = 480 visits), while J2 reads students only once because only 1 major passes (3 + 300 = 303 visits).

5. Explain J3's counts using the number of students that pass its filter.
Only GPA > 39 passes so 15 students pass (300 x 1/20). For the simple plan, the filter sits above the product so visits and pairs don't change. So, comparisons(300x3) + 300(gpa) + 15(dept for students passed) = 1,215. For the early-filter plan 300 GPA comparisons and 15 students pass. Major restarts each time (15x3) creating 45 visits and department comparisons. So, there is 15 pairs and join comparisons for 300 + 45 + 15 = 360.

6. Which counts doubled with 600 students? Why needn't the measured time double?
Every counter doubled at 600 students: row visits, pairs, comparisons, rows returned, and output cells. Measured time does not double, because costs dont change with data, as the scale capacity increases exponentially to only slightly increase times.

7. Compare the pair-count ratio with the timing ratio for J1. Use comparisons,
   source scans, and output work to explain why those ratios can differ.

Pairs dropped 15× (900 -> 60), but time dropped only 4.6× (60.92 -> 13.30 ms). The same thing happened at 600 students. Time didn't drop as much because pairs aren't the only work. The early-filter plan still scans all 300 students and makes 300 GPA comparisons. Total row visits dropped only 2.5× (1,200 -> 480), and comparisons dropped 2.3× (1,260 -> 540). Output work didn't change at all, since both plans return 40 cells. The time drop is closest to the drop in majors restarts, 5× (300 -> 60), which suggests restarting a scan is one of the main costs.
8. State what was timed, what was excluded, and how repeats/caching/noise limit
   a claim that one query is faster. If a timing difference is tiny, say so.
Only query execution was timed, running the plan and collecting its rows. Creating the test data, parsing, planning, and printing were not timed, and the counters came from separate runs. Each plan ran once as a warm-up, then 7 more times, and the table reports the median, so one slow run doesn't skew the result. For example, one J1 run at 600 students took 140.8 ms while the others took about 119 ms. J1's simple plan took about 61 ms on every run and the early-filter plan took about 13 ms, with no overlap between them. The differences for S1–S3 are tiny (for example, 1.622 vs. 1.617 ms). The two plans are identical for those queries, so those gaps are just noise, and neither plan can be called faster.

## 6. One failed prediction

Quote an original prediction, the evidence that changed it, and your revised
explanation. If all predictions matched, explain the least obvious result.

Original prediction: "J1 vs J2: reverse FROM order | 300/900/900 | It would be the same"

Evidence that changed it: The candidate pairs and returned rows were the same, but the row visits and the timing were not. In the simple plans, J1 visited students 300 and majors 900, while J2 visited majors 3 and students 900. In the early-filter plans, J1 made 480 row visits (students 300 + majors 180) and J2 made only 303 (majors 3 + students 300). Output cells were 40 in both, not 900. The biggest surprise was time: J1's simple plan took 60.92 ms and J2's took 9.53 ms, even though both formed 900 pairs and made 1,260 comparisons. The same pattern appeared at 600 students (119.67 ms vs. 18.71 ms).

Revised explanation: I assumed that reversing FROM order wouldn't matter because the join produces the same results. That's true for pairs and rows, since both orders form the same student–major combinations. But ProductScan reads its left table once and restarts its right table for every left row, so the order decides which table gets reread. J1 restarts majors 300 times, and J2 restarts students only 3 times. With early filtering, only 1 major (ds) survives, so J2 scans students just once. The large time difference with equal pair counts suggests that each restart has its own cost that the counters don't show. So FROM order doesn't change *what* the query returns, but it can change how much work it takes to get there.
