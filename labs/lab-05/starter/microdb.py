"""microdb — the REPL. Provided complete for the SQL writing exercises.

    $ python3 microdb.py
    microdb> CREATE TABLE students (id INT, name VARCHAR(8), gpa INT)
    table students created
    microdb> INSERT INTO students VALUES (1, 'ada', 39)
    1 row into students
    microdb> SELECT name FROM students WHERE gpa > 35
    name
    ----
    ada

Data persists in ./mydb between sessions — it's your Lab 1 file layer
underneath, so `hexdump -C mydb/students.tbl` shows your rows for real.
"""

from file_manager import FileManager
from buffer_manager import BufferManager
from catalog import Catalog
from sql_frontend import Database, ParseError

DB_DIR = "mydb"
BLOCK_SIZE = 4096
POOL_FRAMES = 8


def print_rows(rows: list[dict]) -> None:
    if not rows:
        print("(no rows)")
        return
    fields = list(rows[0])
    widths = {f: max(len(f), *(len(str(r[f])) for r in rows)) for f in fields}
    print("  ".join(f.ljust(widths[f]) for f in fields))
    print("  ".join("-" * widths[f] for f in fields))
    for r in rows:
        print("  ".join(str(r[f]).ljust(widths[f]) for f in fields))


def main() -> None:
    fm = FileManager(DB_DIR, BLOCK_SIZE)
    bm = BufferManager(fm, POOL_FRAMES)
    db = Database(fm, bm, Catalog(bm, fm))
    print("microdb — type SQL, or 'exit'. Data lives in ./mydb")
    while True:
        try:
            sql = input("microdb> ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if not sql:
            continue
        if sql.lower() in ("exit", "quit"):
            break
        try:
            result = db.execute(sql)
            print_rows(result) if isinstance(result, list) else print(result)
        except ParseError as e:
            print(f"syntax error: {e}")
        except Exception as e:
            print(f"error: {type(e).__name__}: {e}")
    bm.flush_all()
    fm.close()
    print("bye — your data is safe in ./mydb")


if __name__ == "__main__":
    main()
