# Advanced Databases for Data Science

Course site: **https://researcher111.github.io/AdvanceDatabase/**

DS 6XXX, UVA School of Data Science. The required sequence builds **microdb**
through B+ trees in Labs 1–6, then moves to analytics on **October 8**, followed
by vectors, RAG, distributed compute, LSM engines, and graphs. The **October 22
midterm** covers Lectures 1–6 and Labs 1–6, with a dedicated 75-minute
[review on October 20](lectures/review/midterm.html). Lab 9 moves to October 29;
subsequent labs and lectures follow the revised schedule. Project deadlines remain unchanged.
There are 12 required lecture decks and 10 required labs. Lectures 7–9 and Lab 7
are optional bonus material, linked at the end of the course catalog and schedule.
Resource numbers and URLs remain stable; the schedule gives the teaching order.

The [database discovery session](lectures/lecture-10/discovery.html) creates a
local DuckDB database from the bundled 60,000-trip NYC taxi sample, then guides
students through editable SQL, charts, competing explanations, and follow-up
questions. See the page for setup and the November discovery workshop.

[The discovery bureau](lectures/discovery/index.html) connects five cases across four meetings
(Nov 19, Nov 24, Dec 1, Dec 3). City and weather share the November 19 session
to make room for the dedicated midterm review.
Students query already-hosted ClickHouse taxi/weather tables, NASA's exoplanet
archive, and Wikidata, then apply the same evidence workflow to their projects.
No new account or database server is required. The outline preserves question-swap
and rehearsal time and includes timed teaching beats, four verified queries,
dated result snapshots, revealable charts, and instructor setup notes.
Refresh snapshots during class preparation with
`python3 lectures/discovery/refresh.py` (standard library; four small public reads).
The page itself makes no requests to the hosted services.

Lecture 10 also introduces **in-database machine learning**: a local DuckDB
example learns a linear model, evaluates held-out rows, and makes predictions
using SQL, alongside a managed BigQuery ML example. Lab 4 walks from `CREATE`,
`INSERT`, and `DELETE` to the catalog and record slots, then from `SELECT` and
`JOIN` to executable scan plans.

Every page is plain HTML, CSS and JavaScript. There is no build step: open any
`.html` file in a browser and it works. Press `P` on a lecture page for
presentation mode. For the dedicated animation-based decks, open
[`slides/index.html`](slides/index.html). Each lecture includes 60 minutes of
teaching, presenter notes, and tablet pen/pointer tools.

Lectures 6–15 and Labs 5–11 include **worked examples** with small inputs,
highlighted operations, intermediate state, and questions with revealable answers.
Use Previous, Next step, and Reset to trace an operation at your own pace.
The matching slide scenes use the same example data, including the SQL review,
index lookups, recovery, windows, IVF, source citations, shuffle, and graph counts.

## Get the code

```bash
git clone https://github.com/researcher111/AdvanceDatabase.git
cd AdvanceDatabase
```

Each lab's starter code and test harness live in `labs/lab-NN/starter/`. To start
Lab 1, for example:

```bash
cd labs/lab-01/starter
python3 test_filemanager.py      # 0/9 passing is the correct starting state
```

Labs 1 to 7 are cumulative: each `starter/` folder ships a working reference
implementation of every layer below the one you are building, so a difficult week
does not prevent you from starting the next. Lab 5 supplies the complete parser and planner for a guided walkthrough, SQL
writing, and measurement assignment. Lab 6 supplies an in-memory index;
Lab 7 supplies a separate transaction API. Integrating them with the SQL REPL
is an optional extension.

## Layout

| Path | What it is |
|------|------------|
| `index.html` | course home |
| `schedule.html` | day-by-day schedule, the source of truth for dates |
| `project.html` | the team RAG project spec |
| `lectures/review/midterm.html` | full-session core review, worked traces, and practice questions |
| `lectures/discovery/` | hosted-data discovery outline, queries, snapshots, and charts |
| `lectures/lecture-NN/` | one lecture reading with interactive examples |
| `slides/` | visual lecture decks and timed presenter guides |
| `labs/lab-NN/` | one lab page plus its `starter/` code |
| `labs/_shared/` | the shared style base every page loads |

## Requirements

Python 3.11 or newer. Labs 1 to 7 are pure standard library. Later labs add
DuckDB, PyTorch, PyArrow, NumPy, and Matplotlib for Lab 8’s core fare-prediction investigation (install `labs/lab-08/starter/requirements-pytorch.txt`). Optional storage experiments also use `pandas`. Lab 11’s
graded portion uses only the standard library; its Spark and Ray exercises
need `pyspark`, a compatible JDK (17 or newer), and `ray`.

Clone the whole repository or download each complete `starter/` directory.
Labs 8–11 include data files that the individual Python download links do not
include. Labs 9–10 require no model download or paid API for the graded work.

Run each lab from its `starter/` directory. Test a function as soon as you implement
it using the harness's `--unit` mode. For example, in Lab 3:

```bash
python3 test_records.py --list                     # available function names
python3 test_records.py --unit RecordPage.get_int  # one function
python3 test_records.py --unit                     # all function-level checks
python3 test_records.py                            # full integration tests
```

Every implementation/practice test script supports these options. Lab 8’s supplied SQL examples use query names such
as `--unit Q1`; that harness does not grade the core ML report. Lab 11 also provides local unit checks for the optional Spark and
Ray functions without starting either engine.

Function-level checks provide known data and working helpers for unfinished
dependencies, while always calling the selected student function. These results
are practice feedback. Running without flags uses the original integration tests
and grading rules; it never substitutes implementations. Unfinished methods still
fail their own checks. Lab 5 is the exception to the implementation workflow:
its supplied engine passes immediately, and students submit queries, predictions,
measurements, and explanations. Lab 8 also provides working model code: students submit an investigation query, its result, a comparison chart, and a short report. Other labs retain their stated grading rules.

**Lab 8 instructor setup:** use a report-based assignment with manual review for
`ml_report.txt`, `investigation.sql`, `query-results.csv`, and `fare-models.png`.
The existing Q1–Q8 Gradescope autograder accepts only `assignment.sql` and is
now practice feedback; it cannot grade the ML investigation. Configure the
course’s submission assignment accordingly before collecting the four core files.
The review criteria are listed on the lab page; exact MAE and runtime are not
grading thresholds.

**Lab 8 plan matching:** the browser exercise exports `plan_mapping.txt` for a
separate four-point checkpoint. The instructor repository contains its ready-to-upload
package at `labs/lab-08/autograder/plan-matching/autograder.zip` and setup instructions
in the adjacent `README.md`. Upload and test that package in Gradescope before
collecting matching submissions; the legacy SQL grader does not accept this file.

## Maintainer checks

Website downloads link directly to the tracked files in this repository;
GitHub Pages publishes the root of `main`. There is no separate download copy.
Run `python3 scripts/check_downloads.py` to check download targets locally.
After pushing changes and waiting for the Pages deployment, run
`python3 scripts/check_downloads.py --live` to compare every download and its
linking page byte-for-byte with your working tree. Unpublished edits will be
reported as differences.

Run `python3 -m unittest discover -s tests -v` from the repository root to check
supplied infrastructure. These ungraded checks do not require student TODOs
to be completed and are separate from each lab’s exercise tests. They also verify
that each function can pass independently and that test helpers cannot mask an
unfinished or incorrect implementation. Install `duckdb` to include the SQL
execution regressions; those checks are skipped when it is unavailable.

Lab 4’s statement diagrams replay snapshots recorded from its supplied Python
storage layers and public reference scan fixtures. After changing those layers,
run `python3 scripts/generate_lab4_statement_traces.py` to regenerate the browser
data, or add `--check` to verify it is current. Run
`node tests/test_statement_traces.js` and
`node tests/test_statement_walkthrough_ui.js` to check the trace and controls.

The later worked examples live in `labs/_shared/teaching-traces.js`. Their shared
page controller is `teaching-trace.js`; `slides/_shared/trace-scenes.js` projects
the same states while preserving the deck's scene IDs and teaching minutes.
Run `node tests/test_teaching_traces.js`, `node tests/test_teaching_trace_ui.js`,
and `node tests/test_btree_widget.js` after changing those examples or controls.
The Python maintainer suite checks the examples against the supplied Python
helpers and checks that Lab 6 times the index descent as part of its lookup.

RAG browser data and measurement tables are generated from Lab 10's supplied
corpus, chunker, embedder, exact index, and evaluation questions. Run
`python3 scripts/generate_rag_measurements.py` after changing those inputs, or
use `--check` to detect stale data. `node tests/test_rag_teaching_data.js` checks
that both browser demos reproduce the Python results. The core corpus reports
MRR@3; the separate real-paper experiment reports MRR@10. Keep those cutoffs
explicit when comparing outputs.

## Note

Instructor autograders and quiz and exam generators are kept in a separate
private repository. The public tests include reference helpers and small
implementations used to test student functions independently.
