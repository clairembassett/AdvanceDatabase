"""micro-mapreduce — the pattern under Spark, in 60 lines you write.

Lab 11 of Advanced Databases for Data Science (DS 6XXX, Fall 2026).
Part A of three; pure standard library, fully offline.

THE PATTERN: MapReduce separates per-record work from per-key aggregation:

    map      each input record -> zero or more (key, value) pairs
             processes one record independently
    shuffle  route every pair to the partition its KEY hashes to,
             then group values by key inside each partition  (the network cost)
    reduce   each (key, [values]) -> one result
             runs per key, sees ALL values for that key

The shuffle is the whole trick: hash partitioning guarantees every pair
with the same key lands in the same partition, so reduce never needs to
talk to another partition. That guarantee is what you implement today.

This file runs the phases sequentially in one process. A distributed engine
also needs serialization, scheduling, retries, and a partition function
whose configuration agrees across workers. Python's string hash is stable
within a run, but separately launched processes can use different seeds.

The corpus is 4,000 real arXiv abstracts (corpus.py), the papers Lab 9 embedded.

Run the tests any time:   python3 test_sparkray.py
See the result:           python3 mapreduce.py       (top 15 words)
"""

from __future__ import annotations

import re

from corpus import DOCS

N_PARTITIONS = 4


# ------------------------------------------------- provided: input + runner

def records() -> list[tuple[str, str]]:
    """The input: (doc_id, text) pairs, one per arXiv abstract and title."""
    return [(doc_id, title + " " + text) for doc_id, title, text in DOCS]


def run_mapreduce(inputs, map_fn, reduce_fn, n_partitions=N_PARTITIONS):
    """The plumbing every engine provides. Provided complete — read it:
    the map phase emits pairs, shuffle groups them, and reduce produces
    one result per key. This local runner performs no network transfer."""
    mapped = []                                    # map phase
    for key, value in inputs:
        mapped.extend(map_fn(key, value))

    partitions = shuffle(mapped, n_partitions)     # shuffle phase (YOUR JOB)

    results = []                                   # reduce phase
    for partition in partitions:
        for key, values in sorted(partition.items()):
            results.append(reduce_fn(key, values))
    return results


# ------------------------------------------------- YOUR JOB: four functions

def map_words(doc_id: str, text: str) -> list[tuple[str, int]]:
    """One (word, 1) pair per word occurrence in the text.

    Tokenize exactly like Lab 10: re.findall(r"[a-z]+", text.lower()).
    No counting here — map emits raw pairs and lets reduce add. (Real
    engines add a combiner later; the tests check the raw contract.)"""
    # TODO
    raise NotImplementedError


def partition_for(key: str, n_partitions: int) -> int:
    """Which partition owns this key? hash(key) modulo n_partitions —
    use Python's built-in hash(). Deterministic within one run, and the
    same key MUST always land in the same partition: that's the whole
    guarantee reduce depends on."""
    # TODO
    raise NotImplementedError


def shuffle(pairs: list[tuple[str, int]],
            n_partitions: int) -> list[dict[str, list[int]]]:
    """Route and group: partition i of the result holds every pair whose
    key hashes to i, grouped as {key: [value, value, ...]}.

    Sketch: make n_partitions empty dicts; for each (key, value), find
    the owning partition with partition_for and append the value to that
    partition's list for the key."""
    # TODO
    raise NotImplementedError


def reduce_counts(word: str, values: list[int]) -> tuple[str, int]:
    """Collapse one key's values to a total: ('wal', [1,1,1]) -> ('wal', 3)."""
    # TODO
    raise NotImplementedError


# ------------------------------------------------- run it

if __name__ == "__main__":
    counts = run_mapreduce(records(), map_words, reduce_counts)
    for word, n in sorted(counts, key=lambda t: (-t[1], t[0]))[:15]:
        print(f"{n:4}  {word}")
