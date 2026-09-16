/* Small, deterministic teaching examples shared by readings, labs, and slides.
 * These are worked examples, not recordings of the student's unfinished code.
 * Python-shaped snippets are explicitly labelled pseudocode unless stated otherwise.
 * Node tests check the calculations and compare lab examples with Python fixtures. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CourseTraces = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const examples = {};
  const frame = (label, lines, rows, explanation) => ({label, lines, rows, explanation});
  const add = (id, spec) => { examples[id] = {id, codeLabel: 'Teaching pseudocode', ...spec}; };
  const list = values => '[' + values.join(', ') + ']';

  add('sql-plan', {
    title: 'SQL text becomes a scan that produces rows',
    premise: 'Query: SELECT name FROM students WHERE gpa > 35. Toy rows in scan order: ada 39, ben 31, cyd 37, dee 28, eli 36, fay 34. The schema stores name as text and gpa as an integer.',
    code: ['lex = Lexer(sql)', 'consume SELECT and the field list', 'consume FROM and the table list', 'if WHERE follows: parse its terms', 'query = QueryData(fields, tables, predicate)', 'scan = TableScan(existing catalog layout)', 'scan = SelectScan(scan, query.predicate)', 'scan = ProjectScan(scan, query.fields)', 'while scan.next(): read projected fields'],
    frames: [
      frame('The lexer labels the input', [1], [['first token', 'KEYWORD select'], ['second token', 'ID name'], ['last token', 'NUM 35']], 'Token kinds distinguish syntax, names, and literal values. The numeric token holds integer 35. peek() observes a token; next() consumes it.'),
      frame('The parser consumes the lists', [2, 3], [['fields', '[name]'], ['tables', '[students]'], ['next token', 'KEYWORD where']], 'The field list ends when no comma follows name. expect(FROM) then checks and consumes the required keyword before reading the table name.'),
      frame('The predicate records an integer comparison', [4], [['left field', 'gpa'], ['operator', '>'], ['right literal', '35']], 'This term describes a comparison. Parsing does not inspect any table rows or decide whether a particular student passes.'),
      frame('QueryData holds the request', [5], [['fields', '[name]'], ['tables', '[students]'], ['predicate', 'gpa > 35'], ['rows read by parser', '0']], 'The planner can now work with the description without reparsing the SQL text. The catalog supplies the stored table layout.'),
      frame('The planner wraps the input scan', [6, 7, 8], [['inner scan', 'TableScan(students)'], ['middle scan', 'SelectScan(gpa > 35)'], ['outer scan', 'ProjectScan(name)']], 'Keep the gpa field available until selection has evaluated it. Projection narrows the fields exposed by the outer scan to name.'),
      frame('Pulling rows executes the plan', [9], [['rows examined', '6'], ['matching rows', '3'], ['names in this scan order', 'ada, cyd, eli']], 'The outer next() calls inward until a row passes selection. ProjectScan exposes name for that current row. The trace fixes input order for teaching; SQL without ORDER BY does not promise a general result order.')
    ],
    question: 'How does name = dept differ from name = \'dept\'?',
    answer: 'The unquoted ID dept becomes F("dept"), a field reference whose value comes from the current row. The quoted STR token is the literal text dept. Removing that distinction changes a join condition into a comparison with a constant.'
  });

  const tree = {
    separator: 36,
    leaves: [
      {keys: [28, 31, 34], rids: [[[0, 3]], [[0, 1], [1, 0]], [[0, 5]]]},
      {keys: [36, 37, 39], rids: [[[0, 4]], [[0, 2]], [[0, 0]]]}
    ]
  };
  const ridText = rids => '[' + rids.map(r => '(' + r.join(', ') + ')').join(', ') + ']';
  add('btree-search', {
    title: 'An equality lookup reaches a heap row',
    premise: 'Toy tree: root [36], leaves [28, 31, 34] and [36, 37, 39]. Each RID is (block, slot). Find key 36, exactly equal to the separator.',
    code: ['path = tree._descend(key)', 'leaf = path[-1]', 'if key not in leaf.keys: return []', 'i = leaf.keys.index(key)', 'rids = list(leaf.rids[i])', 'for rid in rids:', '    table.move_to_rid(rid)', '    read the requested fields'],
    frames: [
      frame('Start with the search key', [], [['key', '36'], ['root.keys', '[36]'], ['height', '2']], 'Internal keys divide ranges. A matching separator still needs a leaf lookup because RIDs live in leaves.'),
      frame('Equality routes right', [1], [['comparison', '36 >= 36'], ['child index', '1'], ['nodes touched', '2']], 'child_index_for advances past separators less than or equal to the key. Child 0 holds keys below 36; child 1 holds keys at least 36.'),
      frame('Find the leaf entry', [2, 3, 4], [['leaf.keys', '[36, 37, 39]'], ['key position i', '0'], ['leaf.rids[0]', '[(0, 4)]']], 'The child index selected a subtree. The key position selects an entry inside its leaf. They are different indexes.'),
      frame('Return a copy of the RID list', [5], [['search(36)', '[(0, 4)]'], ['tree visits', '2 in-memory nodes'], ['heap rows fetched', '0 so far']], 'search returns addresses, not rows. Returning a new list prevents callers from changing the list stored in the tree.'),
      frame('Fetch the matching heap row', [6, 7, 8], [['RID', '(0, 4)'], ['block', '0'], ['slot', '4'], ['row', 'eli, gpa 36']], 'The provided IndexSelectScan calls move_to_rid when next() succeeds. Only then can get_val read fields from that row. The lab tree is in memory, so node visits are not disk reads.')
    ],
    question: 'What should search(35) return? What if two rows have key 31?',
    answer: '35 routes left but is absent, so return []. Key 31 returns [(0, 1), (1, 0)]. One distinct key can own several RIDs; an equality scan must visit every matching row.'
  });
  add('btree-split', {
    title: 'The fifth distinct key triggers a leaf split',
    premise: 'ORDER = 4 means at most four keys per node. Start with one leaf [1, 2, 3, 4], then insert key 5. The letters a–e stand for the five RID lists.',
    code: ['insert key and [rid] at the same position', 'if len(node.keys) > ORDER:', '    mid = len(node.keys) // 2', '    right takes keys[mid:] and rids[mid:]', '    left keeps keys[:mid] and rids[:mid]', '    right.next = left.next', '    left.next = right', '    copy right.keys[0] into the parent', '    if no parent: create root; height += 1'],
    frames: [
      frame('Full is still legal', [], [['keys', '[1, 2, 3, 4]'], ['RID lists', '[a, b, c, d]'], ['height', '1']], 'Four keys fill this leaf. Splitting happens only after a fifth distinct key arrives. Another RID for an existing key does not add a key slot.'),
      frame('Insert before checking overflow', [1, 2], [['keys', '[1, 2, 3, 4, 5]'], ['RID lists', '[a, b, c, d, e]'], ['overflow?', '5 > 4: yes']], 'The provided is_full() name means over capacity: its condition is len(keys) > ORDER.'),
      frame('Divide keys and RID lists together', [3, 4, 5], [['mid', '5 // 2 = 2'], ['left keys / RIDs', '[1, 2] / [a, b]'], ['right keys / RIDs', '[3, 4, 5] / [c, d, e]']], 'Slices use a zero-based position. Key 3 is the first entry in the new right leaf, and its RID list moves with it.'),
      frame('Repair the leaf chain', [6, 7], [['left.next', 'right'], ['right.next', 'old successor (none)'], ['all leaf keys', '[1, 2, 3, 4, 5]']], 'Save the old successor before replacing left.next. Otherwise a split in the middle of a longer chain can lose later leaves.'),
      frame('Create a new root', [8, 9], [['root.keys', '[3]'], ['root children', 'left, right'], ['height', '2'], ['key 3 remains', 'in the right leaf']], 'The root contains a routing copy of 3. Every leaf moves one level farther from the root together, preserving equal depth.')
    ],
    question: 'How would an internal node [3, 5, 7, 9, 11] split?',
    answer: 'Move separator 7 to the parent. Left keeps [3, 5] and its first three children; right keeps [9, 11] and its last three children. An internal node with two separators needs three children. The actual entry for key 7 remains in a leaf.'
  });
  add('btree-range', {
    title: 'A range crosses a leaf boundary',
    premise: 'Use root [36]. Left leaf [28, 31, 34] links to right leaf [36, 37, 39]. Key 31 has two RIDs; every other key has one. Request range(31, 37), including both endpoints.',
    code: ['leaf = tree._descend(lo)[-1]', 'for each key and RID list in this leaf:', '    if key > hi: return result', '    if key >= lo: append all its RIDs', 'leaf = leaf.next', 'repeat until there is no leaf', 'return result'],
    frames: [
      frame('Descend once to the lower bound', [1], [['bounds', '31 <= key <= 37'], ['first leaf', '[28, 31, 34]'], ['selected keys', '[]']], '31 is below separator 36, so begin in the left leaf. A range scan does not restart at the root for every match.'),
      frame('Skip 28 and collect 31 and 34', [2, 3, 4], [['selected keys', '[31, 34]'], ['RIDs collected', '3'], ['why three RIDs?', 'key 31 has two rows']], 'The result flattens the RID lists. Two matching keys can represent three rows. Keep the insertion order within a duplicate key’s RID list.'),
      frame('Follow the leaf link', [5], [['next leaf', '[36, 37, 39]'], ['selected keys', '[31, 34]'], ['RIDs collected', '3']], 'The next link preserves key order across leaves. It is independent of the order of those rows in the heap file.'),
      frame('Include the upper endpoint', [2, 3, 4], [['selected keys', '[31, 34, 36, 37]'], ['RIDs collected', '5'], ['last accepted key', '37']], 'The range is inclusive, so accept key 37. Stopping at key >= hi would incorrectly omit this endpoint.'),
      frame('Stop at the first key above hi', [3], [['next key', '39 > 37'], ['matching keys', '4'], ['matching rows', '5']], 'Because leaves are sorted, every subsequent key is too large. The output contains five RIDs in key order, not five keys.')
    ],
    question: 'What changes for range(32, 36)?',
    answer: 'Return only the RIDs for 34 and 36: [(0, 5), (0, 4)]. The lower bound need not exist. Start in its leaf and collect the first key at least 32.'
  });
  const undoLog = [
    {kind:'START', tx:1}, {kind:'SET_INT', tx:1, old:100}, {kind:'COMMIT', tx:1},
    {kind:'START', tx:2}, {kind:'SET_INT', tx:2, old:60}, {kind:'SET_INT', tx:2, old:40}
  ];
  add('undo', {
    title: 'Two writes to one value require reverse undo',
    premise: 'Toy log for one integer: tx1 committed 100 → 60. Then tx2 changed 60 → 40 → 10 and crashed. Assume its final page reached disk. This is Lab 7’s FORCE/STEAL, undo-only policy.',
    code: ['finished = set()', 'for rec in log.records_backwards():', '    if completion record: remember rec.tx', '    if SET from an unfinished transaction:', '        restore rec.old through the buffer', 'flush restored pages', 'sync ROLLBACK for each unfinished tx'],
    frames: [
      frame('Crash state', [1], [['disk value', '10'], ['tx1', 'COMMIT is durable'], ['tx2', 'no completion record']], 'The log has two old values for tx2: 60 before its first write and 40 before its second write. A SET record describes one change, not the whole transaction.'),
      frame('Undo the most recent change', [2, 4, 5], [['record', 'tx2 SET old=40'], ['buffer value', '40'], ['finished', '{}']], 'Reverse the 40 → 10 change first. Write directly through the buffer and mark it modified. Calling Transaction.set_int here would log a new user change.'),
      frame('Undo the earlier change', [2, 4, 5], [['record', 'tx2 SET old=60'], ['buffer value', '60'], ['finished', '{}']], 'Now reverse 60 → 40. Undoing in forward order would end at 40, which is still an uncommitted intermediate value.'),
      frame('Recognize the committed transaction', [2, 3], [['record', 'tx1 COMMIT'], ['buffer value', '60'], ['finished', '{1}']], 'Skip tx2’s START, then remember tx1’s completion. Reading backward reaches COMMIT before tx1’s earlier SET.'),
      frame('Preserve tx1’s write', [2, 4], [['record', 'tx1 SET old=100'], ['action', 'skip completed tx1'], ['buffer value', '60']], 'Restoring 100 would erase committed work. The finished set controls which records recovery undoes.'),
      frame('Make repairs durable before completion', [6, 7], [['flush to disk', '60'], ['then sync', 'ROLLBACK tx2'], ['second recover()', '[]']], 'Finish recovery before admitting new transactions. A later recovery sees ROLLBACK and skips tx2. If recovery crashes before recording completion, restart the reverse pass before serving users.')
    ],
    question: 'If tx2’s dirty page never reached disk, may this implementation skip its SET records?',
    answer: 'No. The log does not tell this implementation which pages reached disk. It still restores 40 and then 60, flushes 60, and records ROLLBACK. The final committed value is correct even when disk already contained 60.'
  });
  add('snapshots', {
    title: 'The snapshot boundary determines the second read',
    premise: 'PostgreSQL example: balance starts at 100. Reader R performs two plain SELECTs in one transaction. Writer W commits balance = 120 between them. R makes no writes.',
    codeLabel: 'Two-session schedule',
    code: ['R: BEGIN', 'R: SELECT balance   -- first snapshot', 'W: UPDATE balance to 120', 'W: COMMIT', 'R: SELECT balance   -- same transaction', 'R: COMMIT'],
    frames: [
      frame('Initial committed version', [], [['committed balance', '100'], ['R isolation choices', 'Read Committed / Repeatable Read']], 'Compare two separate runs of the same schedule. Choose the isolation level before R’s first SELECT.'),
      frame('R reads 100', [1, 2], [['Read Committed', '100'], ['Repeatable Read', '100'], ['writer committed?', 'not yet']], 'Both runs see 100. In PostgreSQL Repeatable Read, the first non-transaction-control statement establishes the transaction snapshot, not BEGIN alone.'),
      frame('W commits a newer version', [3, 4], [['latest committed', '120'], ['R first result', 'still 100'], ['R writes', 'none']], 'The writer’s commit does not retroactively change a result R already received.'),
      frame('R reads again', [5], [['Read Committed', '120'], ['Repeatable Read', '100'], ['cause', 'new / same snapshot']], 'Read Committed takes a fresh snapshot for this SELECT. Repeatable Read keeps the snapshot established by the first SELECT and can still read the older version.'),
      frame('A new transaction can see 120', [6], [['after R commits', 'old snapshot ends'], ['new SELECT', '120 at either level']], 'This example concerns ordinary snapshot reads. Locking reads and concurrent writes have additional rules. Snapshot reads alone do not guarantee serializable execution.')
    ],
    question: 'Does WAL choose which version R may read?',
    answer: 'No. WAL supports recovery and durability. MVCC visibility and the isolation level determine the read snapshot. Lab 7 uses locks rather than implementing this PostgreSQL MVCC example.'
  });
  const cost = matches => ({scan:1000, index:3 + matches});
  add('optimizer', {
    title: 'Units make a cost comparison meaningful',
    premise: 'Toy disk index model: N = 100,000 rows, B = 1,000 heap pages, tree height h = 3. Charge one page access per matching RID, ignore caching and CPU work, and keep units in page accesses.',
    code: ['matches = N * selectivity', 'scan_cost = B', 'index_cost = h + matches', 'choose the smaller estimated cost', 'compare estimates with observed work'],
    frames: [
      frame('Record the assumptions', [], [['N: rows', '100,000'], ['B: heap pages', '1,000'], ['h: index pages', '3']], 'N counts rows; B counts pages. Adding N directly to B without a model that converts matching rows to page accesses mixes units.'),
      frame('A predicate keeps 0.1% of rows', [1], [['selectivity', '0.001 = 0.1%'], ['matching rows', '100'], ['scan pages', '1,000']], 'Percent must be converted to a fraction: 100,000 × 0.001 = 100. Both access paths return the same matching rows.'),
      frame('Price both access paths', [2, 3, 4], [['scan estimate', '1,000 page accesses'], ['index estimate', '3 + 100 = 103'], ['chosen path', 'index']], 'The index estimate includes both descent and heap access. This is an illustrative cost calculation, not a measured runtime.'),
      frame('At 2%, the choice flips', [1, 2, 3, 4], [['matching rows', '2,000'], ['index estimate', '3 + 2,000 = 2,003'], ['scan estimate', '1,000'], ['chosen path', 'scan']], 'Keeping more rows increases the assumed heap work for the index. The complete scan still visits the same table pages.'),
      frame('Solve for the crossover', [3, 4, 5], [['equal cost', '3 + matches = 1,000'], ['matching rows', '997'], ['selectivity', '997 / 100,000 = 0.997%']], 'Different page clustering, caching, coverage, or relative I/O costs change this boundary. 1% is a result of these assumptions, not a general rule.')
    ],
    question: 'If 100 matching rows occupy five cached heap pages, is 103 a count of physical reads?',
    answer: 'No. The simplified formula charges per matching RID. Several rows may share a page, and a requested page may be cached. Distinguish rows examined, logical page visits, distinct pages, physical reads, and elapsed time.'
  });
  const rides = [[1,10,2], [1,8,0], [2,20,4], [2,6,0]];
  const monthly = [1,2].map(month => [month, rides.filter(r => r[0] === month).reduce((s,r) => s+r[1]+r[2],0)]);
  add('analytics', {
    title: 'Grouping changes the rows a window sees',
    premise: 'Four toy trips, shown as (month, fare, tip): (1,10,2), (1,8,0), (2,20,4), (2,6,0). Revenue means fare + tip. These values are separate from the full taxi dataset.',
    codeLabel: 'SQL shape for a worked example',
    code: ['WITH monthly AS (', '    SELECT month, SUM(fare + tip) AS revenue', '    FROM toy_rides GROUP BY month', ')', 'SELECT month, revenue,', '    SUM(revenue) OVER (ORDER BY month', '        ROWS UNBOUNDED PRECEDING) AS running', 'FROM monthly ORDER BY month'],
    frames: [
      frame('Begin with one row per trip', [], [['month 1 trips', '12 and 8 dollars'], ['month 2 trips', '24 and 6 dollars'], ['input row count', '4']], 'First calculate each trip’s fare + tip. The row grain is one trip: state what one row represents before choosing an aggregate.'),
      frame('Group into one row per month', [1, 2, 3, 4], [['month 1 revenue', '20'], ['month 2 revenue', '30'], ['monthly row count', '2']], 'GROUP BY collapses the four trips into two monthly totals. This intermediate table is what the window consumes.'),
      frame('The first window contains January', [5, 6, 7], [['month', '1'], ['revenue', '20'], ['running', '20']], 'ROWS UNBOUNDED PRECEDING includes every earlier row and the current row. The first row has no earlier rows.'),
      frame('The next window includes both months', [5, 6, 7], [['month', '2'], ['revenue', '30'], ['running', '20 + 30 = 50']], 'The window adds a value to each monthly row. It preserves the two rows rather than collapsing them into one total.'),
      frame('Order the returned rows', [8], [['month 1: revenue / running', '20 / 20'], ['month 2: revenue / running', '30 / 50'], ['output row count', '2']], 'The ORDER BY inside OVER defines the calculation. The outer ORDER BY guarantees the order shown to the caller. Use both when the requested output order matters.')
    ],
    question: 'What happens if the window runs over the four trips before grouping?',
    answer: 'It produces a running value for each trip, so four rows remain. That is a different result grain. For Lab 8 Q6, form one monthly total first, then compute a cumulative total over those monthly rows.'
  });
  // Unit vectors chosen so a top-2 neighbor lies across a centroid boundary.
  const vectors = [[1,0], [.6,.8], [0,1], [-1,0]];
  const centroids = [[1,0],[0,1]];
  const query = [.8,.6];
  const dot = (a,b) => a.reduce((sum,v,i) => sum+v*b[i],0);
  const rank = pairs => pairs.slice().sort((a,b) => b[0]-a[0] || a[1]-b[1]);
  const buckets = centroids.map(() => []);
  vectors.forEach((v,i) => buckets[rank(centroids.map((c,j) => [dot(v,c),j]))[0][1]].push(i));
  function ivf(probe) {
    const selected = rank(centroids.map((c,i) => [dot(query,c),i])).slice(0,probe).map(p => p[1]);
    const ids = selected.flatMap(i => buckets[i]);
    const result = rank(ids.map(i => [dot(query,vectors[i]),i])).slice(0,2);
    const truth = rank(vectors.map((v,i) => [dot(query,v),i])).slice(0,2);
    return {selected, ids, result, truth, comparisons:centroids.length+ids.length,
      recall:result.filter(p => truth.some(t => t[1] === p[1])).length/2};
  }
  add('ivf', {
    title: 'A nearby vector can belong to another list',
    premise: 'Toy unit vectors: v0=(1,0), v1=(0.6,0.8), v2=(0,1), v3=(-1,0). Fixed centroids c0=(1,0), c1=(0,1). Query q=(0.8,0.6), k=2. These centroids are supplied, not learned by a k-means run.',
    code: ['assign each vector to its closest centroid', 'score every centroid against q', 'choose the probe highest-scoring centroids', 'score only vectors in those lists', 'sort by (-similarity, id); take k', 'count centroid + candidate comparisons', 'compare returned IDs with exact top-k'],
    frames: [
      frame('Build two lists', [1], [['list 0', '[0]'], ['list 1', '[1, 2, 3]'], ['v1 centroid scores', 'c0: 0.6; c1: 0.8']], 'v1 belongs to list 1 because it is closer to c1. Assignment happens at build time and depends on the centroids, not on this query.'),
      frame('Rank the centroids for this query', [2, 3], [['q dot c0', '0.8'], ['q dot c1', '0.6'], ['probe = 1 selects', 'list 0']], 'The query is closer to c0. That fact does not guarantee that all of its nearest stored vectors belong to list 0.'),
      frame('Search only the selected list', [4, 5, 6], [['candidate IDs', '[0]'], ['returned (score, id)', '(0.8, 0)'], ['comparisons', '2 + 1 = 3']], 'Only one candidate exists, so return one result even though k=2. Count the two centroid dot products as well as the one candidate dot product.'),
      frame('Compare with exact search', [7], [['exact top-2 IDs', '[1, 0]'], ['q dot v1', '0.96'], ['recall@2', '1 / 2 = 0.5']], 'Exact search ranks v1 ahead of v0. The approximate result misses v1 because its list was not searched. Recall compares IDs under the same vectors and metric.'),
      frame('Probe both lists', [3, 4, 5, 6, 7], [['returned IDs', '[1, 0]'], ['recall@2', '1.0'], ['comparisons', '2 + 4 = 6'], ['exact comparisons', '4']], 'Searching all lists recovers the exact result but adds centroid overhead. This tiny example deliberately shows that an index need not save work at every setting.')
    ],
    question: 'Does recall@2 = 1 mean these are the two most relevant documents?',
    answer: 'It means agreement with exact vector search. Whether those vectors represent relevant documents is a separate embedding and retrieval-quality question. Lab 10 evaluates labeled source documents.'
  });
  const chunks = [
    {doc:'blocks', title:'Blocks and pages', text:'Pages hold records.'},
    {doc:'wal', title:'Write-ahead logging', text:'Sync the log before the page.'},
    {doc:'wal', title:'Write-ahead logging', text:'Undo restores old values.'}
  ];
  const hits = [[.9,2], [.8,0], [.7,1]];
  add('rag', {
    title: 'Vector IDs, chunk positions, and source IDs',
    premise: 'Toy chunks at positions 0, 1, 2 have source IDs blocks, wal, wal. A supplied search result is [(0.9,2), (0.8,0), (0.7,1)]. Scores are illustrative. The relevant source for this question is wal.',
    code: ['hits = index.search(query_vector, k)', 'for score, i in hits:', '    chunk = dict(chunks[i])', '    chunk["score"] = score', '    retrieved.append(chunk)', 'source_line = "[doc] Title: text"', 'evaluate the ranked retrieved source IDs'],
    frames: [
      frame('Keep build order aligned', [], [['vector position 0', 'source blocks'], ['vector position 1', 'source wal'], ['vector position 2', 'source wal']], 'Two chunks can share one source document. The vector index returns an integer position, which is not the source’s string ID.'),
      frame('Resolve the first hit by position', [1, 2, 3], [['first hit', '(0.9, 2)'], ['chunks[2].doc', 'wal'], ['chunks[2].text', 'Undo restores old values.']], 'Read position 2, not position 0 and not a dictionary key named 2. Preserve the original alignment between vectors and chunks.'),
      frame('Attach the score to a copy', [3, 4, 5], [['returned copy score', '0.9'], ['stored chunk score', 'absent'], ['source ID', 'wal']], 'A later query can assign a different score. Copying the dictionary prevents that query-specific value from becoming stored corpus data.'),
      frame('Preserve ranking and citations', [2, 3, 4, 5, 6], [['retrieved source IDs', '[wal, blocks, wal]'], ['first citation', '[wal]'], ['first relevant rank', '1']], 'Use the source ID in the citation. Preserve each selected chunk; this lab does not silently deduplicate source documents.'),
      frame('Compute this question’s metrics', [7], [['hit@3', '1'], ['reciprocal rank@3', '1 / 1 = 1'], ['if first relevant is rank 3', 'hit 1; reciprocal rank 1/3']], 'hit@3 asks whether any relevant source occurs in the three returned chunks. Reciprocal rank uses the first relevant position. Average these per-question values to obtain hit rate and MRR@3.')
    ],
    question: 'If wal appears twice, does this question earn two hits? Does a citation prove an answer is supported?',
    answer: 'No to both. One question contributes at most one hit. A citation identifies a source; checking answer support requires reading that source and comparing it with the answer. The graded lab can run in echo mode without generating an answer.'
  });
  const documents = ['WAL, wal!', 'Page wal.'];
  const mapped = documents.flatMap(text => (text.toLowerCase().match(/[a-z]+/g) || []).map(word => [word,1]));
  add('shuffle', {
    title: 'Map emits occurrences; shuffle groups equal keys',
    premise: 'Toy records: d0="WAL, wal!", d1="Page wal.". For this drawing only, wal routes to partition 0 and page to partition 1. The Python lab uses hash(key) % n, whose bucket numbers can differ between runs.',
    code: ['for each input record:', '    emit (word, 1) for each word occurrence', 'partitions = one independent dict per bucket', 'for key, value in mapped_pairs:', '    p = partition_for(key, n)', '    append value to partitions[p][key]', 'for each key and values in each partition:', '    emit (key, sum(values))'],
    frames: [
      frame('Tokenize the first record', [1, 2], [['d0 tokens', '[wal, wal]'], ['emitted pairs', '(wal,1), (wal,1)'], ['pair count', '2']], 'Lowercase and keep alphabetic sequences. The graded map contract keeps repeated occurrences; it does not combine them yet.'),
      frame('Map the second record', [1, 2], [['d1 tokens', '[page, wal]'], ['new pairs', '(page,1), (wal,1)'], ['total pair count', '4']], 'The mapper needs only its own record. It does not know which other records also contain wal.'),
      frame('Route each pair by its key', [3, 4, 5, 6], [['partition 0', 'wal: [1, 1, 1]'], ['partition 1', 'page: [1]'], ['values preserved', '4']], 'All three wal values meet in one partition. Different keys may share a partition, but must keep separate lists within its dictionary.'),
      frame('Reduce each complete group', [7, 8], [['wal total', 'sum([1,1,1]) = 3'], ['page total', 'sum([1]) = 1'], ['sum of counts', '4']], 'reduce_counts sees all values for one key. Its sum preserves the total number of mapped word occurrences.'),
      frame('Distinguish counts from output order', [7, 8], [['result as a dictionary', '{wal: 3, page: 1}'], ['partition labels', 'may change across runs'], ['word totals', 'must stay the same']], 'The runner visits partitions in bucket order and sorts keys inside each bucket. That does not promise one global order. Compare counts by key, or explicitly sort the final results.')
    ],
    question: 'Why is [{}] * n a bug when constructing the partitions?',
    answer: 'It repeats references to one dictionary. An append through any partition changes all of them. Create a new dictionary for each bucket, for example with a comprehension, and check routing with more than one partition.'
  });
  add('lsm', {
    title: 'A tombstone must hide an older value',
    premise: 'Follow three writes to key k: old at sequence 5 is flushed to SSTable A, new at 8 is flushed to B, then DELETE at 9 stays in memory. Read after each write, then consider compaction.',
    code: ['collect possible records for key k', 'ignore versions newer than the snapshot', 'choose the highest visible sequence', 'if it is a tombstone: return absent', 'otherwise: return its value', 'compact only when old versions are safe to drop'],
    frames: [
      frame('An older value remains in an immutable file', [], [['SSTable A', 'k = old @ 5'], ['latest visible value', 'old']], 'Immutable files keep their contents until compaction replaces them. An update cannot simply overwrite this entry inside the file.'),
      frame('A newer file overrides it', [1, 2, 3, 5], [['SSTable A', 'old @ 5'], ['SSTable B', 'new @ 8'], ['read at snapshot 8', 'new']], 'Sequence numbers express recency in this toy model. File names or directory order do not decide which value wins.'),
      frame('A deletion is also a record', [1, 2, 3, 4], [['SSTable B', 'new @ 8'], ['memory', 'DELETE @ 9'], ['read at snapshot 9', 'absent']], 'Finding the newest visible tombstone means stop with absence. Continuing to an older value would resurrect a deleted key.'),
      frame('A partial compaction must retain the deletion', [6], [['merge inputs', 'DELETE @ 9 and new @ 8'], ['older file A', 'still contains old @ 5'], ['keep in merged output', 'DELETE @ 9']], 'Dropping the tombstone while old @ 5 remains elsewhere would expose that old value to future reads.'),
      frame('Removal needs a safety condition', [6], [['older covered versions', 'all accounted for'], ['older snapshots', 'none need these versions'], ['safe output for k', 'no record']], 'Only remove the tombstone when the engine can prove older values cannot reappear and no required snapshot needs the versions. Real systems also account for their replication and retention rules.')
    ],
    question: 'What should a read at snapshot 8 return while DELETE @ 9 exists?',
    answer: 'new @ 8. The tombstone is newer than that snapshot, so it is invisible to that read. This is why compaction must consider active snapshots as well as the newest state.'
  });
  const edges = {ada:['ben','cyd'], ben:['dee','ada'], cyd:['dee','eli'], dee:['eli'], eli:['fay'], fay:['ada']};
  function graphCounts(depth) {
    let frontier=['ada'], paths=0, pathFrontier=['ada'];
    const visited = new Set(frontier);
    let edgeVisits=0;
    const layers=[];
    for(let level=1;level<=depth;level++) {
      const next=[];
      frontier.forEach(v => edges[v].forEach(w => {edgeVisits++;if(!visited.has(w)){visited.add(w);next.push(w);}}));
      pathFrontier=pathFrontier.flatMap(v => edges[v]);paths+=pathFrontier.length;
      layers.push({level,frontier:next.slice(),pathRows:pathFrontier.length});frontier=next;
    }
    return {layers,edgeVisits,paths,reachable:[...visited].filter(v => v!=='ada')};
  }
  add('graph', {
    title: 'Two paths can end at the same person',
    premise: 'Use the course graph: ada→ben,cyd; ben→dee,ada; cyd→dee,eli; dee→eli; eli→fay; fay→ada. Compare all walks of one to three edges with visited-set reachability.',
    codeLabel: 'Two different result contracts',
    code: ['path rows: extend every current walk by one edge', 'keep two rows if two routes reach the same person', 'stop extending when the depth bound is reached', 'reachability: begin with visited = {ada}', 'expand only the new frontier', 'add an endpoint only if it is not yet visited'],
    frames: [
      frame('One hop agrees', [1, 4, 5, 6], [['path endpoints', '[ben, cyd]'], ['new reachable people', '[ben, cyd]'], ['outgoing edges examined', '2']], 'Both methods begin with ada’s two outgoing edges. The start node counts as visited before BFS begins.'),
      frame('Two hops produce repeated endpoints', [1, 2], [['path endpoints', '[dee, ada, dee, eli]'], ['path rows at depth 2', '4'], ['distinct new people', '[dee, eli]']], 'ada→ben→dee and ada→cyd→dee are different paths to one person. ada→ben→ada returns to the already visited start.'),
      frame('BFS keeps a new frontier', [5, 6], [['frontier at depth 2', '[dee, eli]'], ['visited people', 'ada, ben, cyd, dee, eli'], ['edge visits so far', '6']], 'The visited set prevents re-enqueuing dee and ada. It preserves reachability while discarding alternative routes.'),
      frame('Depth three gives different work counts', [1, 2, 3, 5, 6], [['new BFS frontier', '[fay]'], ['BFS edge visits total', '8'], ['walk rows at depth 3', '5'], ['walk rows over depths 1–3', '2 + 4 + 5 = 11']], 'These walk rows include repeated endpoints and cycles up to the bound. The depth-3 BFS frontier is returned but not expanded, so it does not inspect fay→ada.'),
      frame('Choose what the question asks for', [2, 6], [['unique people within 3 hops', 'ben, cyd, dee, eli, fay'], ['distinct people count', '5'], ['walk rows before exclusions', '11']], 'These are different output contracts, not a timing contest between SQL and graph databases. Recursive SQL can also deduplicate reachability. An unbounded traversal needs a stopping or cycle rule.')
    ],
    question: 'Can DISTINCT at the very end prevent the earlier repeated path expansions?',
    answer: 'No. Final DISTINCT removes duplicate result rows after those rows were generated. A visited set changes the expansion itself. Also specify whether repeated vertices or edges are legal: this example counts bounded walks, and Cypher path rules depend on the chosen syntax and engine.'
  });
  return {examples, fixtures:{tree,undoLog,rides,monthly,vectors,centroids,query,buckets,chunks,hits,documents,mapped,edges}, models:{cost,ivf,graphCounts}, list, ridText};
});
