# Advanced Databases for Data Science

Course site: **https://researcher111.github.io/AdvanceDatabase/**

DS 6XXX, UVA School of Data Science. Fifteen lecture decks and eleven labs that
build **microdb**, a working relational database engine in Python, one subsystem
per week: file manager, buffer pool, record pages and catalog, iterator-model
operators, SQL front end, B+ tree, transactions and recovery. Act II moves to the
analytics stack, vector search, RAG, distributed compute, LSM engines and graphs.

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
does not prevent you from starting the next. Lab 6 supplies an in-memory index;
Lab 7 supplies a separate transaction API. Integrating them with the SQL REPL
is an optional extension.

## Layout

| Path | What it is |
|------|------------|
| `index.html` | course home |
| `schedule.html` | day-by-day schedule, the source of truth for dates |
| `project.html` | the team RAG project spec |
| `lectures/lecture-NN/` | one lecture reading with interactive examples |
| `slides/` | visual lecture decks and timed presenter guides |
| `labs/lab-NN/` | one lab page plus its `starter/` code |
| `labs/_shared/` | the shared style base every page loads |

## Requirements

Python 3.11 or newer. Labs 1 to 7 are pure standard library. Later labs add
`duckdb` (Lab 8) and optional `pandas` for the dataframe comparison. Lab 11’s
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

Every lab's test script supports these options. In Lab 8, use query names such
as `--unit Q1`. Lab 11 also provides local unit checks for the optional Spark and
Ray functions without starting either engine.

Function-level checks provide known data and working helpers for unfinished
dependencies, while always calling the selected student function. These results
are practice feedback. Running without flags uses the original integration tests
and grading rules; it never substitutes implementations. Unfinished methods still
fail their own checks. Measurements and reflections remain for class discussion.

## Maintainer checks

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
