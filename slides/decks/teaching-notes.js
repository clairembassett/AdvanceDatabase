/* Instructor cues for the visual decks. Keys are stable scene IDs.
 * Full original explanations remain available as expandable teaching context.
 * Lecture 5 and worked traces supply their own structured teaching data. */
(function () {
  'use strict';
  const notes = {
  "1": {
    "lecture-01-scene-01": {
      "idea": "The same query can do less storage work when its pages are already in memory.",
      "question": "What could make the second run faster if the SQL and answer stay the same?",
      "answer": "The buffer pool can reuse pages from the first run, avoiding storage reads.",
      "builds": [
        "Show the identical query and answer. Give students thirty seconds to predict what might change.",
        "Follow the first trip to storage. Point out the cost of fetching the blocks.",
        "Reveal the pages already in memory and follow the shorter path.",
        "Compare the two block-access costs. These are model calculations, not whole-query benchmarks."
      ]
    },
    "lecture-01-scene-02": {
      "idea": "SQL becomes a plan that operators can execute.",
      "question": "Which part still needs to understand the spelling of the SQL statement?",
      "answer": "The front end reads SQL; the operators execute the resulting plan.",
      "builds": [
        "Read the SQL as a sequence of characters.",
        "Group characters into tokens. Distinguish token recognition from parsing the grammar.",
        "Follow Project, Select, and Scan in the executable tree.",
        "Mark the boundary between understanding SQL and executing the plan."
      ]
    },
    "lecture-01-scene-03": {
      "idea": "A query returns rows but fetches storage in whole blocks.",
      "question": "How much work produced these three result rows?",
      "answer": "The engine examined six rows and read two blocks to return three rows.",
      "builds": [
        "Point to the empty frames. Predict which block the scan needs first.",
        "Follow block 0 into memory. A whole block moves, not one row.",
        "Ask which rows in block 0 pass the filter.",
        "Load block 1 and continue the same filter.",
        "Count six examined rows, three results, and two storage reads."
      ]
    },
    "lecture-01-scene-04": {
      "idea": "A warm page cache saves reads while the query still scans and filters.",
      "question": "What are the second run's disk reads, rows examined, and rows returned?",
      "answer": "Zero disk reads, six rows examined, and three rows returned.",
      "builds": [
        "Have pairs predict all three counters before advancing.",
        "Show that both blocks remain in the buffer pool.",
        "Run the filter again. Ask why the engine still examines the rows.",
        "Reveal 0, 6, and 3, then compare with the predictions."
      ]
    },
    "lecture-01-scene-05": {
      "idea": "A schema describes the fields and rules for every valid row.",
      "question": "Does a column type describe only today's rows?",
      "answer": "No. It also constrains future writes to the table.",
      "builds": [
        "Use the student rows to introduce a relation.",
        "Name each field and type. Explain that microdb stores GPA 3.9 as 39.",
        "Try a proposed future row against the schema's rules."
      ]
    },
    "lecture-01-scene-06": {
      "idea": "A key must uniquely identify every valid row, including future rows.",
      "question": "Does uniqueness in this small sample prove that a field is a key?",
      "answer": "No. A key must satisfy the rule for all valid data, with uniqueness enforced.",
      "builds": [
        "Invite students to nominate a key from the visible data.",
        "Reveal a repeated name and reconsider name as a key.",
        "Reveal a repeated name and GPA pair. Reconsider the combined key.",
        "Discuss a stable identifier and the constraint that enforces its uniqueness."
      ]
    },
    "lecture-01-scene-07": {
      "idea": "A transaction gives a transfer guarantees that separate file writes do not provide automatically.",
      "question": "What happens if a naive transfer crashes between debit and credit?",
      "answer": "One balance may change without the other. Atomicity requires the transfer to complete or roll back together.",
      "builds": [
        "Introduce the transfer and identify the total balance to preserve.",
        "Pause between debit and credit. Explain the all-or-nothing requirement.",
        "Connect consistency to the declared balance rules.",
        "Explain why overlapping transfers need a chosen isolation guarantee.",
        "Ask what must remain true after an acknowledged transfer and a restart."
      ]
    },
    "lecture-01-scene-08": {
      "idea": "SQL specifies the result while the planner chooses how to find it.",
      "question": "Why might the planner choose an index rather than a full scan?",
      "answer": "For a selective lookup, the example index path makes far fewer storage trips; broad queries may still favor a scan.",
      "builds": [
        "Establish that both paths must produce the same result.",
        "Count the scan's 500 modeled block reads.",
        "Count the index path's seven stipulated reads.",
        "Compare the result and the roughly 71-fold difference in modeled storage trips."
      ]
    },
    "lecture-01-scene-09": {
      "idea": "Each engine layer translates work into the interface of the layer below.",
      "question": "Which layers understand field names, and which work with pages or offsets?",
      "answer": "Operators and records interpret rows and fields; buffers and files handle pages and blocks.",
      "builds": [
        "Follow SQL into an executable plan at the front end.",
        "Show operators requesting and processing rows.",
        "Explain how the record layer maps fields to bytes.",
        "Follow a page request into the buffer pool.",
        "Show the file manager transferring an addressed block."
      ]
    },
    "lecture-01-scene-10": {
      "idea": "A logarithmic scale makes large differences in access latency visible.",
      "question": "Do equally spaced positions on this axis mean equal extra nanoseconds?",
      "answer": "No. Each equal interval represents a multiplicative change, here a factor of ten.",
      "builds": [
        "Read the scale before comparing any bars.",
        "Locate the representative memory access cost.",
        "Locate storage and count the orders of magnitude separating it from memory.",
        "Use the human-scale comparison to explain why avoiding a storage trip matters."
      ]
    },
    "lecture-01-scene-11": {
      "idea": "Counting block accesses gives a useful first cost model with clear limits.",
      "question": "Can we always ignore CPU work when predicting query time?",
      "answer": "No. Cached data, expensive expressions, and large scans can make CPU work significant.",
      "builds": [
        "Count the accesses before multiplying by a latency.",
        "Give students a minute to compute 12.5 ms and 0.175 ms.",
        "Increase the table size and discuss how the paths scale.",
        "Compare 50 µs with 0.2 µs for cold and warm block access; qualify the model."
      ]
    },
    "lecture-01-scene-12": {
      "idea": "The catalog stores schema metadata so the engine can interpret tables after restart.",
      "question": "How can the engine read its catalog before it knows any schemas?",
      "answer": "It starts with a small set of known catalog layouts, then reads the remaining metadata.",
      "builds": [
        "Show the layout needed to interpret a record.",
        "Store the layout description as catalog rows.",
        "Explain the bootstrap layouts that let the engine read those rows."
      ]
    },
    "lecture-01-scene-13": {
      "idea": "The labs build the engine upward through stable interfaces.",
      "question": "Which lab supplies files, and which first lets a typed SQL query run?",
      "answer": "Lab 1 supplies the file manager; Lab 5 adds the SQL front end.",
      "builds": [
        "Connect block transfers to the file-manager lab.",
        "Add the buffer pool, records, and catalog above files.",
        "Connect scans and the SQL front end to query execution.",
        "Place the B+ tree and recovery work in the completed engine."
      ]
    },
    "lecture-01-scene-14": {
      "idea": "An address locates bytes, and an encoding determines how to interpret them.",
      "question": "Can the same four bytes represent different integers?",
      "answer": "Yes. Changing the byte order changes their interpretation; microdb uses signed little-endian 32-bit integers.",
      "builds": [
        "Distinguish a block number from a byte offset within the block.",
        "Locate the four bytes that encode the integer.",
        "Identify the least-significant byte in little-endian order.",
        "Reverse the interpretation and compare the resulting value."
      ]
    },
    "lecture-01-scene-15": {
      "idea": "A completed buffered write and durable completion are different boundaries.",
      "question": "What does the sync/no-sync comparison measure?",
      "answer": "It compares different completion requirements, including the cost of requesting durable completion with fsync.",
      "builds": [
        "Show where a buffered write can return successfully.",
        "Add the request for durable completion.",
        "Explain that fsync can report failure and depends on the storage stack.",
        "Distinguish a process crash from power loss before previewing recovery."
      ]
    },
    "lecture-01-scene-16": {
      "idea": "A warm run still executes the query even when it avoids storage reads.",
      "question": "What work remains when the second run has no disk reads?",
      "answer": "Parsing and planning still happen, and the engine still scans and filters rows.",
      "builds": [
        "Have students reconstruct the engine layers from the diagram.",
        "Ask three students to narrate SQL-to-plan, row-to-page, and page-to-disk boundaries.",
        "Return to the warm query and identify the work that remains."
      ]
    }
  },
  "2": {
    "lecture-02-scene-01": {
      "idea": "Keeping a page in memory can eliminate repeated storage requests.",
      "question": "Where could a useful copy of this block stay between requests?",
      "answer": "In a frame in the buffer pool, ready for another request.",
      "builds": [
        "Show three requests for the same block.",
        "Follow each request to storage without a buffer pool.",
        "Keep the page in a frame and reuse it for later requests."
      ]
    },
    "lecture-02-scene-02": {
      "idea": "The Lab 1 timing comparison depends on where each write is considered complete.",
      "question": "Does a fast buffered write directly measure SSD throughput?",
      "answer": "No. Buffering and OS caching can let it return before durable completion.",
      "builds": [
        "Ask two students for their measured sync/no-sync ratios and methods.",
        "Identify the buffered-acceptance boundary.",
        "Identify the boundary that requests durable completion.",
        "Interpret the measured gap, then ask how a cache could avoid a new request entirely."
      ]
    },
    "lecture-02-scene-03": {
      "idea": "A frame is a reusable memory slot that holds a page from an addressed block.",
      "question": "Does replacing a page create more memory?",
      "answer": "No. The fixed frame is reused for different page contents.",
      "builds": [
        "Identify the frame as a fixed slot in memory.",
        "Load a block's contents into that frame as a page.",
        "Replace the page while keeping the same frame and memory capacity."
      ]
    },
    "lecture-02-scene-04": {
      "idea": "A repeated scan can miss every time when reuse exceeds cache capacity.",
      "question": "Will the second request for block 0 hit in this pool?",
      "answer": "No. It has already been evicted; this preset has 16 accesses and zero hits.",
      "builds": [
        "Load the first three blocks and mark the resident set.",
        "Continue beyond capacity and identify each victim.",
        "Pause before the second block 0 and predict whether it remains resident.",
        "Finish the trace and explain why every request still misses."
      ]
    },
    "lecture-02-scene-05": {
      "idea": "Frequently reused blocks can stay hot even while cold blocks pass through.",
      "question": "How many hits and misses does this preset produce?",
      "answer": "Eleven hits and five misses, or about a 69% hit rate.",
      "builds": [
        "Predict the hit rate and count the compulsory first misses.",
        "Follow the short reuse intervals for blocks 0 and 1.",
        "Insert a cold request and check whether the hot blocks survive.",
        "Count 11 hits and five misses; compare the access order with the previous scan."
      ]
    },
    "lecture-02-scene-06": {
      "idea": "Pin counts keep a frame from being replaced while callers still use it.",
      "question": "Why does pinning need a count instead of a boolean?",
      "answer": "Several callers can hold the same frame, and each must release its own hold.",
      "builds": [
        "Show one caller holding the frame and a pin count of one.",
        "Add a second caller and increase the count.",
        "Release one hold. The remaining caller still protects the page.",
        "Release the last hold so the frame becomes eligible for replacement."
      ]
    },
    "lecture-02-scene-07": {
      "idea": "LRU recency must update on hits as well as misses.",
      "question": "Which page should D replace after A is touched again?",
      "answer": "B. A's successful pin refreshed its recency; stamping only on misses would choose incorrectly.",
      "builds": [
        "Fill the frames with A, B, and C.",
        "Touch A again and update its last-used tick.",
        "Take a vote on the least recently pinned eligible frame.",
        "Load D in B's frame and explain the choice."
      ]
    },
    "lecture-02-scene-08": {
      "idea": "Replacement can choose only frames that have no active pins.",
      "question": "What should microdb do when every frame is pinned?",
      "answer": "Raise BufferAbortError. Replacing an active page would corrupt a caller's view.",
      "builds": [
        "Mark A as pinned and remove it from the eligible victims.",
        "Load E by replacing C.",
        "Load B by replacing D; explain how pinning A changed the choice.",
        "Pin every frame and connect the failure to forgotten unpin calls."
      ]
    },
    "lecture-02-scene-09": {
      "idea": "A page lookup map can replace a linear frame search without changing the pin interface.",
      "question": "Why does a frame scan become expensive as the pool grows?",
      "answer": "Each lookup examines more frames; a hash mapping provides expected constant-time lookup.",
      "builds": [
        "Ask how to locate an already resident block.",
        "Count the work of scanning the frame list.",
        "Map an immutable BlockId to its frame.",
        "Increase the pool size and compare lookup work while preserving the interface."
      ]
    },
    "lecture-02-scene-10": {
      "idea": "Unpin releases a hold; dirty data needs a separate write before frame reuse.",
      "question": "Does unpin mean save the page?",
      "answer": "No. A dirty page must be flushed before replacement or by an explicit flush policy.",
      "builds": [
        "Start with a clean page whose memory and stored contents agree.",
        "Modify the page and mark it dirty.",
        "Unpin it. The change still exists in memory.",
        "Flush the dirty contents before overwriting the frame.",
        "Load the replacement and ask what would be lost if the flush were skipped."
      ]
    },
    "lecture-02-scene-11": {
      "idea": "The database needs control over page use, write ordering, and its memory budget.",
      "question": "What problem can arise when the database and OS both cache the same bytes?",
      "answer": "Duplicate copies consume memory and can contribute to swapping if the combined budget is too large.",
      "builds": [
        "Identify the database buffer pool and OS cache as separate layers.",
        "Explain the database's active page holds.",
        "Connect database-controlled writes to recovery ordering.",
        "Discuss the combined memory budget and the risk of double caching."
      ]
    },
    "lecture-02-scene-12": {
      "idea": "Replacement policy should account for how a workload reuses pages.",
      "question": "Should a one-pass scan get the same protection as frequently reused pages?",
      "answer": "Often it should not; scan-resistant policies can protect the hot working set.",
      "builds": [
        "Identify the pages repeatedly used by short transactions.",
        "Run a large scan and show how it displaces hot pages.",
        "Use a small conceptual scan ring to limit pollution.",
        "Compare exact LRU with a clock approximation and discuss policy tradeoffs."
      ]
    },
    "lecture-02-scene-13": {
      "idea": "A small fraction of expensive misses can dominate average access time.",
      "question": "At 90% hits, roughly what share of the modeled time comes from misses?",
      "answer": "About 96.5%, despite misses being only one in ten accesses.",
      "builds": [
        "Compute 0.9 × 100 ns + 0.1 × 25,000 ns = 2,590 ns.",
        "Raise hits to 99% and compare the 349 ns average.",
        "Raise hits to 99.6% and compare the 199.6 ns average.",
        "Show the 100 ns all-hit limit. These figures model access costs, not whole queries."
      ]
    },
    "lecture-02-scene-14": {
      "idea": "A one-frame capacity change can transform a cyclic workload's reuse.",
      "question": "What changes when the pool grows from 49 to 50 frames for 50 blocks?",
      "answer": "Exact LRU misses on the cyclic scan at 49 frames; at 50, later passes hit after the initial fill.",
      "builds": [
        "Set the pool to 49 frames for a 50-block working set.",
        "Give pairs a minute to predict the second pass.",
        "Reveal the misses and explain the eviction cycle.",
        "Add the fiftieth frame. Distinguish later-pass hits from the two-pass total."
      ]
    },
    "lecture-02-scene-15": {
      "idea": "The buffer manager must preserve holds, recency, and dirty contents through every request.",
      "question": "What must happen before a dirty frame is reused?",
      "answer": "The supplied flush plumbing must save its contents before a replacement is loaded.",
      "builds": [
        "Look for the requested block among resident pages.",
        "Choose an eligible frame if the request misses.",
        "Reuse or load the page and update recency on every successful pin.",
        "Release the caller's hold without losing track of other users."
      ]
    },
    "lecture-02-scene-16": {
      "idea": "Cache performance depends on reuse, while pins protect work that is still active.",
      "question": "Why can the same pool give zero hits on one workload and about 69% on another?",
      "answer": "The access order changes reuse distance; capacity alone does not determine the hit rate.",
      "builds": [
        "Keep the number of frames fixed as the comparison begins.",
        "Contrast the cyclic scan with the repeatedly accessed hot blocks.",
        "Explain why active pins can protect even the oldest frame, then connect to Lab 2."
      ]
    }
  },
  "3": {
    "lecture-03-scene-01": {
      "idea": "The record layer turns anonymous page bytes into rows with predictable addresses.",
      "question": "What is missing from Page and Buffer when we want to find a student?",
      "answer": "They know bytes and blocks, but need a record layout to identify rows and fields.",
      "builds": [
        "Show the anonymous bytes and ask how to locate one student.",
        "Reveal the row boundary and connect it to a schema.",
        "Locate the row by its physical address."
      ]
    },
    "lecture-03-scene-02": {
      "idea": "Growing a packed record can invalidate saved byte offsets for later rows.",
      "question": "What happens to the pointer to cyd when ben's name grows?",
      "answer": "Later bytes shift, so the saved offset can stop pointing to cyd's row.",
      "builds": [
        "Identify the four tightly packed rows.",
        "Save byte 30 as cyd's address.",
        "Grow ben's name by five bytes and follow the shifted fields.",
        "Read byte 30 again and identify the addressing problem."
      ]
    },
    "lecture-03-scene-03": {
      "idea": "Fixed reservations let microdb compute a row's address without parsing earlier rows.",
      "question": "Why can a name change stay in place here?",
      "answer": "The slot already reserves capacity for the name, as long as its encoded bytes fit.",
      "builds": [
        "Show the same fixed reservation for every row.",
        "Insert ben within the reserved capacity.",
        "Rename ben without moving the following rows.",
        "Reject a value that exceeds the reservation."
      ]
    },
    "lecture-03-scene-04": {
      "idea": "The flag, field widths, and string reservation determine the slot size.",
      "question": "How many 24-byte slots fit in a 4096-byte block?",
      "answer": "170 slots, with 16 bytes left over.",
      "builds": [
        "Include the four-byte flag before the first integer.",
        "Place name at offset 8 with its length prefix and eight-byte capacity.",
        "Place GPA at offset 20 and total the slot at 24 bytes.",
        "Compute floor(4096 / 24), including the unused remainder."
      ]
    },
    "lecture-03-scene-05": {
      "idea": "Layout centralizes the offset calculation used by record readers and writers.",
      "question": "Where is GPA in slot 3 of the 24-byte layout?",
      "answer": "At byte 3 × 24 + 20 = 92 within the block.",
      "builds": [
        "Select slot 3 and compute its starting byte.",
        "Identify GPA's field offset of 20.",
        "Add the slot start and field offset to obtain 92.",
        "Give pairs a minute to compute the new schema's 28-byte layout."
      ]
    },
    "lecture-03-scene-06": {
      "idea": "String capacity is measured in encoded bytes, which may differ from character count.",
      "question": "Do eight visible characters always fit in eight bytes?",
      "answer": "No. UTF-8 characters can use multiple bytes; oversized writes must fail before changing the page.",
      "builds": [
        "Mark the eight-byte storage reservation.",
        "Fit an ASCII example and count its encoded bytes.",
        "Compare a UTF-8 example with the same character count.",
        "Reject overflow before changing either the old value or the adjacent field."
      ]
    },
    "lecture-03-scene-07": {
      "idea": "Microdb deletion frees a slot by clearing its in-use flag.",
      "question": "Does deletion erase all the old field bytes?",
      "answer": "No. It clears the four-byte flag; a later insertion must populate every field.",
      "builds": [
        "Locate the live slot and its in-use flag.",
        "Set the flag to zero.",
        "Point out that the old field contents remain.",
        "Reuse the slot and explain why every field needs a new value."
      ]
    },
    "lecture-03-scene-08": {
      "idea": "Unused string reservations reduce rows per block and increase scan work.",
      "question": "What does raising name capacity from 8 to 200 bytes cost in this schema?",
      "answer": "Slots grow from 24 to 216 bytes, reducing capacity from 170 to 18 rows per block.",
      "builds": [
        "Identify the eight-byte name reservation.",
        "Separate three used name bytes from reserved but unused space.",
        "Increase capacity to 200 and compute the 216-byte slot.",
        "Compute 556 blocks for 10,000 rows at 18 rows per block."
      ]
    },
    "lecture-03-scene-09": {
      "idea": "Missing data needs a representation distinct from ordinary values.",
      "question": "Why is treating a missing GPA as zero a problem?",
      "answer": "It turns absence into a real numeric value and can bias an average.",
      "builds": [
        "Treat zero as a valid stored number.",
        "Treat an empty string as a valid string value.",
        "Introduce missingness as a separate state; microdb currently has no NULL.",
        "Use the conceptual bitmap to distinguish absence from stored values."
      ]
    },
    "lecture-03-scene-10": {
      "idea": "Large values can be compressed or stored separately from the main row.",
      "question": "Why not reserve two megabytes in every student row for an essay?",
      "answer": "Most rows would waste space; out-of-line storage keeps the common row smaller.",
      "builds": [
        "Show a small value stored inline.",
        "Compress a value and label the illustrated ratio as hypothetical.",
        "Move a large value to separate storage.",
        "Follow the compact reference left in the main row."
      ]
    },
    "lecture-03-scene-11": {
      "idea": "An out-of-line value need only be fetched when the query requires it.",
      "question": "Does selecting name necessarily fetch the student's essay?",
      "answer": "In this example it does not; selecting the essay follows the reference to its chunks.",
      "builds": [
        "Locate the essay's separate storage and its reference in the row.",
        "Read name and identify the pages used.",
        "Read essay and follow the additional storage path.",
        "Compare the two paths and the benefit for frequently accessed small fields."
      ]
    },
    "lecture-03-scene-12": {
      "idea": "RecordPage combines one pinned block with a layout and records every modification.",
      "question": "What if a field changes but the page is never marked dirty?",
      "answer": "The change can disappear when the buffer frame is reused.",
      "builds": [
        "Pin the block that contains the record.",
        "Use the layout to find slots and fields.",
        "Change a field at its computed offset.",
        "Mark the page modified and release its hold when closing."
      ]
    },
    "lecture-03-scene-13": {
      "idea": "TableScan advances through used slots and crosses blocks until the file ends.",
      "question": "When should next return false?",
      "answer": "Only after every remaining block has been searched and no live row remains.",
      "builds": [
        "Scan the used slots in the current block.",
        "Skip an empty slot without ending the scan.",
        "Release the exhausted page and move to the next block.",
        "For insertion, search reusable slots before appending a new block."
      ]
    },
    "lecture-03-scene-14": {
      "idea": "A RID identifies a physical heap location, which can later be reused.",
      "question": "Is a RID a permanent business identifier for a student?",
      "answer": "No. After deletion, another row can occupy the same slot.",
      "builds": [
        "Locate a live row by block and slot.",
        "Update it in place while preserving its RID in microdb.",
        "Delete it and mark the location free.",
        "Reuse the location for another row and discuss stale index entries."
      ]
    },
    "lecture-03-scene-15": {
      "idea": "Persisted catalog rows reconstruct table layouts after a restart.",
      "question": "How does the engine read the catalog without already knowing every schema?",
      "answer": "A small set of hardcoded catalog layouts bootstraps the remaining metadata.",
      "builds": [
        "Identify the layout currently held in Python objects.",
        "Persist that metadata in catalog rows.",
        "Restart and reconstruct the layout from stored metadata.",
        "Explain the known layouts that make the first catalog reads possible."
      ]
    },
    "lecture-03-scene-16": {
      "idea": "Layouts, record pages, scans, and the catalog each solve a different storage problem.",
      "question": "Which objects compute offsets, own a page pin, skip empty slots, and remember schemas?",
      "answer": "Layout, RecordPage, TableScan, and the catalog, respectively.",
      "builds": [
        "Explain how Layout and RecordPage locate a field.",
        "Trace TableScan through used and empty slots.",
        "Explain how the catalog preserves the schema across restart."
      ]
    }
  },
  "4": {
    "lecture-04-scene-01": {
      "idea": "A shared scan interface lets query operators request rows from one another.",
      "question": "What starts work in the operator tower?",
      "answer": "A caller requests the next row, causing requests to travel down the tree.",
      "builds": [
        "Show the idle operator tower and ask what begins execution.",
        "Follow one caller request down to Scan.",
        "Return a matching row through the composed operators."
      ]
    },
    "lecture-04-scene-02": {
      "idea": "Streaming reduces intermediate storage, but reducing candidate work requires better plans too.",
      "question": "Does streaming a Cartesian product remove its huge number of candidate pairs?",
      "answer": "No. It avoids materializing all pairs at once but still enumerates them.",
      "builds": [
        "Show the fully materialized scan intermediate.",
        "Add a Cartesian product and ask where its result would fit.",
        "Multiply one million by one million to obtain a trillion candidate pairs.",
        "Replace stored intermediates with a row stream and distinguish memory from work."
      ]
    },
    "lecture-04-scene-03": {
      "idea": "Each operator produces its next row when its parent requests one.",
      "question": "Can one caller request cause several child requests?",
      "answer": "Yes. A filter may reject several child rows before returning one match.",
      "builds": [
        "Leave the operators idle until a caller makes a request.",
        "Send next to Project.",
        "Follow Project's request into Select.",
        "Follow Select's request into Scan.",
        "Return ada upward and explain the current-row cursor."
      ]
    },
    "lecture-04-scene-04": {
      "idea": "Rows returned and rows examined count different parts of query execution.",
      "question": "How many base rows are examined to return three matches and then report exhaustion?",
      "answer": "Six rows: one for ada, two for cyd, two for eli, and the final row for exhaustion.",
      "builds": [
        "Predict the work needed for the first result.",
        "Return ada after examining one row.",
        "Examine ben and cyd before returning cyd.",
        "Examine dee and eli before returning eli.",
        "Examine fay and return false; total six examined and three returned."
      ]
    },
    "lecture-04-scene-05": {
      "idea": "Operators compose through the same five-method scan contract.",
      "question": "Does Select require its child to be a TableScan?",
      "answer": "No. Any child implementing the scan interface can work, including a ListScan test double.",
      "builds": [
        "Introduce the common interface used by every operator.",
        "Explain before_first and next as cursor operations.",
        "Explain get_val and has_field as field access and schema inspection.",
        "Explain close as resource release, including forwarding through wrappers."
      ]
    },
    "lecture-04-scene-06": {
      "idea": "Select keeps advancing its child until a row passes or the input ends.",
      "question": "Should Select return false after the first rejected row?",
      "answer": "No. It must continue searching until it finds a match or exhausts the child.",
      "builds": [
        "Introduce the gpa > 35 filter.",
        "Pass GPA 39 and expose the child's current row.",
        "Reject GPA 31 and request another row.",
        "Pass GPA 37 and explain why accepted rows need not be copied."
      ]
    },
    "lecture-04-scene-07": {
      "idea": "Project restricts which fields callers can access through the scan.",
      "question": "What should the projected scan report for the hidden GPA field?",
      "answer": "has_field returns false, and get_val raises ValueError.",
      "builds": [
        "Show the complete row in the child scan.",
        "Allow only name through the projection.",
        "Read name and obtain ada from the child's current row.",
        "Attempt GPA access and explain the required rejection."
      ]
    },
    "lecture-04-scene-08": {
      "idea": "A predicate reads fields from the current combined row and can short-circuit AND terms.",
      "question": "Which major row matches ben's mid value of 2?",
      "answer": "The stat row with mid2 equal to 2. The suffix distinguishes field names, not numeric values.",
      "builds": [
        "Identify student mid and major mid2 in ben's combined product row.",
        "Evaluate GPA 31 > 35 and obtain false.",
        "Skip the remaining AND term after the failure.",
        "Compare ben's mid 2 with ds's mid2 1 and reject this pair."
      ]
    },
    "lecture-04-scene-09": {
      "idea": "ProductScan enumerates right rows for each current left row.",
      "question": "Which cursors move after ada has been paired with every major?",
      "answer": "The right scan rewinds, the left advances to ben, and the right advances to its first row.",
      "builds": [
        "Position the left on ada and the right before its first row.",
        "Form ada paired with ds.",
        "Advance only the right to form ada with stat.",
        "Advance right again to form ada with econ.",
        "Rewind right and advance left before forming ben's first pair."
      ]
    },
    "lecture-04-scene-10": {
      "idea": "Filtering fewer results does not necessarily reduce the product's candidate work.",
      "question": "What changes if the predicate rejects every pair?",
      "answer": "Only surviving results drop to zero; the product still enumerates all 18 candidate pairs.",
      "builds": [
        "Predict left deliveries, right deliveries, candidates, and surviving pairs.",
        "Enumerate six students times three majors.",
        "Keep six matches and compare the counts 6, 18, 18, and 6.",
        "Reject every pair and show that candidate work remains 18."
      ]
    },
    "lecture-04-scene-11": {
      "idea": "An empty or exhausted product must never invent another row.",
      "question": "What should repeated next calls return after exhaustion?",
      "answer": "False every time, until the scan is explicitly rewound.",
      "builds": [
        "Empty the left input and predict zero pairs.",
        "Empty the right input and predict zero pairs again.",
        "Restore two rows on each side and enumerate four pairs.",
        "Call next repeatedly after exhaustion and require false each time."
      ]
    },
    "lecture-04-scene-12": {
      "idea": "Closing the root must release resources throughout both branches of a product.",
      "question": "How many pins remain if only one of the two active scan branches closes?",
      "answer": "One pin remains; Product must close both children.",
      "builds": [
        "Identify the page pin held by each TableScan.",
        "Send close to the root.",
        "Follow cleanup calls into both children.",
        "Verify that no pinned frames remain."
      ]
    },
    "lecture-04-scene-13": {
      "idea": "Pushing local filters below a product can reduce candidates without changing the answer.",
      "question": "Which condition must stay above the product?",
      "answer": "mid = mid2 needs fields from both inputs, so it cannot move to either input alone.",
      "builds": [
        "Begin with local filtering after the product.",
        "Count 300 students times three majors: 900 candidates.",
        "Move each local condition to the input whose fields it uses.",
        "Count the reduced 60-by-1 product.",
        "Compare the same 20 answers and the fifteenfold reduction in candidate pairs."
      ]
    },
    "lecture-04-scene-14": {
      "idea": "A streaming interface does not guarantee that every operator uses constant state.",
      "question": "Can a sort emit the smallest row of arbitrary input before seeing the last row?",
      "answer": "Generally no. It must inspect all input and may need temporary storage.",
      "builds": [
        "Show a filter passing rows as matches arrive.",
        "Explain why sort needs to inspect the full unsorted input.",
        "Accumulate hash-aggregation state for the groups.",
        "Use already grouped input to finish one group before the whole input ends."
      ]
    },
    "lecture-04-scene-15": {
      "idea": "A join compares related fields in a combined row before projecting the requested output.",
      "question": "Does the name mid2 mean the value must be 2?",
      "answer": "No. It distinguishes the majors field from students.mid; ada's matching pair has value 1 in both.",
      "builds": [
        "Identify students.mid and majors.mid2 as major IDs.",
        "Combine ada and ds so both fields are accessible.",
        "Compare 1 with 1 and keep the pair; contrast stat's value of 2.",
        "Project the result (ada, ds) after the required comparisons."
      ]
    },
    "lecture-04-scene-16": {
      "idea": "Caller demand, candidate counts, and cleanup explain how an iterator plan behaves.",
      "question": "What can filter pushdown improve while preserving the query's answer?",
      "answer": "It can reduce input sizes and candidate work; close must still release every descendant's resources.",
      "builds": [
        "Recall the scan interface shared by every operator.",
        "Trace requests downward and successful field access upward.",
        "Compare returned rows with candidate work, then explain cleanup at the root."
      ]
    }
  },
  "6": {
    "b-trees": {
      "idea": "A separate index can find a heap row without scanning the whole table.",
      "question": "How can we keep cheap heap inserts and add a shortcut for lookup?",
      "answer": "Maintain a separate structure organized by the search key and pointing to heap records.",
      "builds": [
        "Compare the existing heap with the new index beside it.",
        "Follow the index to the same heap row the scan would find."
      ]
    },
    "one-row-every-block": {
      "idea": "An unordered heap has no shortcut to an arbitrary matching row.",
      "question": "Does caching turn a heap scan into an indexed lookup?",
      "answer": "No. It can reduce physical reads, but the scan still examines rows.",
      "builds": [
        "Request one UID from the 100,000-row heap example.",
        "Follow the scan through the first half of the heap.",
        "Finish the scan and propose a shortcut that leaves the heap in place."
      ]
    },
    "index": {
      "idea": "An index maps search keys to record locations independently of heap order.",
      "question": "Must indexes on name and GPA use the same ordering?",
      "answer": "No. Each provides a separate access path into the same heap.",
      "builds": [
        "Identify the sorted search keys.",
        "Follow one key through its RID to the heap row.",
        "Add another key ordering and discuss maintaining entries when rows change."
      ]
    },
    "four-storage-choices": {
      "idea": "Access patterns determine the tradeoffs among heaps, sorted files, hashing, and B+ trees.",
      "question": "Which structure directly supports sorted ranges while accommodating updates?",
      "answer": "A B+ tree balances ordered access with updates; hashing does not preserve range order.",
      "builds": [
        "Compare equality lookup across the four structures.",
        "Discuss the movement needed to insert into a sorted file.",
        "Walk an ordered range and compare the available access paths."
      ]
    },
    "first-four-keys": {
      "idea": "ORDER = 4 permits four keys in a node; only the fifth creates overflow.",
      "question": "Is a full four-key leaf already invalid?",
      "answer": "No. Four keys are legal; a fifth key requires a split.",
      "builds": [
        "Place 39 in the root, which is also the only leaf.",
        "Insert 31 in sorted order.",
        "Insert 37 between 31 and 39.",
        "Insert 28 and distinguish full from overflowing."
      ]
    },
    "b-tree": {
      "idea": "Internal nodes route searches, while linked equal-depth leaves hold the actual index entries.",
      "question": "Where are the actual entries in this secondary-index tree?",
      "answer": "In the leaves, together with RIDs; internal keys route to children.",
      "builds": [
        "Separate internal routing keys from leaf entries.",
        "Follow the leaf links and check that every leaf has the same depth.",
        "Follow a leaf entry's RID to its heap record."
      ]
    },
    "predict-the-next-split": {
      "idea": "A leaf split copies a separator upward while preserving its entry in the leaf.",
      "question": "What happens when 7 is inserted after 6?",
      "answer": "The right leaf overflows, 5 is copied up, and the root becomes [3, 5] without increasing height.",
      "builds": [
        "Give pairs a minute to predict insertion of 6.",
        "Fill the right leaf and explain why it remains legal.",
        "Insert 7, split, and explain why separator 5 remains in a leaf."
      ]
    },
    "a-root-splits": {
      "idea": "Splitting the root adds one level to every leaf path.",
      "question": "How does an internal split differ from copying a leaf separator?",
      "answer": "The internal routing separator moves upward; its actual data entry still remains in a leaf.",
      "builds": [
        "Show the full but legal internal root.",
        "Add the fifth separator and identify the overflow.",
        "Move 7 into a new root and compare every leaf's new depth."
      ]
    },
    "fan-out": {
      "idea": "Large fan-out keeps a page-based search tree shallow.",
      "question": "Why does larger fan-out reduce tree height?",
      "answer": "Each internal node routes to more subtrees, so fewer levels can cover the same entries.",
      "builds": [
        "Begin with binary branching and count the modeled levels.",
        "Increase branching to twenty children.",
        "Predict the shallow shape at roughly two hundred children per node."
      ]
    },
    "index-pages-and-heap-pages": {
      "idea": "Index-node visits and physical reads differ when upper levels are cached.",
      "question": "Does a four-level secondary index always mean exactly four storage reads?",
      "answer": "No. Cached nodes may need no storage read, while fetching the heap record can add one.",
      "builds": [
        "Show the cached upper levels and recall the buffer pool.",
        "Read the leaf that holds the matching entry.",
        "Follow the RID to the heap and separate index visits from physical I/O."
      ]
    },
    "the-write-bill": {
      "idea": "Every maintained index adds work to changes in the table.",
      "question": "What changes when a table has indexes on UID, name, and GPA?",
      "answer": "Inserts maintain all three; updates affect relevant entries, and deletes must remove stale entries.",
      "builds": [
        "Trace an insertion into the heap and one index.",
        "Add a second index and identify its maintenance work.",
        "Add the third and discuss whether the workload justifies it."
      ]
    },
    "when-scanning-wins": {
      "idea": "An index can lose its advantage when the query needs most of the heap.",
      "question": "Should a query matching 99% of rows automatically use the index?",
      "answer": "No. A sequential scan may avoid many scattered heap visits; caching and covering can change the choice.",
      "builds": [
        "Follow a selective lookup to a few heap rows.",
        "Increase matches and count the growing heap visits.",
        "Compare the broad lookup with reading the table once in order."
      ]
    },
    "build-and-test": {
      "idea": "Range and structural checks catch different B+ tree mistakes.",
      "question": "Which test catches a separator accidentally removed from the leaf?",
      "answer": "A range query that includes that key; occupancy and height checks catch separate structural problems.",
      "builds": [
        "Inspect the tree with a missing leaf entry.",
        "Walk a range through the gap and identify the missing key.",
        "Restore the entry and rerun the range explanation."
      ]
    },
    "exit-trace": {
      "idea": "Searches, splits, and leaf walks must preserve the tree's shared invariants.",
      "question": "What changes for every leaf when the root splits?",
      "answer": "Every leaf gains one level of depth; equal depth is preserved.",
      "builds": [
        "Start at the full leaf and locate the insertion position.",
        "Explain the split and any growth toward the root.",
        "Trace a search followed by a range walk through linked leaves."
      ]
    }
  },
  "7": {
    "money-disappears": {
      "idea": "Individually valid writes can leave a transfer only partly applied after a crash.",
      "question": "Where did the missing fifty go in this picture?",
      "answer": "Only the debit reached durable storage; the transfer is in an inconsistent intermediate state.",
      "builds": [
        "Establish the original total of 150.",
        "Apply only the debit and distinguish memory from durable storage.",
        "Interrupt the transfer and identify the missing atomicity guarantee."
      ]
    },
    "transaction": {
      "idea": "A transaction groups changes under a shared commit boundary.",
      "question": "Does atomicity alone guarantee that an application transfers to the correct account?",
      "answer": "No. It groups the changes, but the application and constraints must still specify the right changes.",
      "builds": [
        "Identify the changes belonging to one unit of work.",
        "Apply both balance changes together.",
        "Ask what a successful commit acknowledgement promises."
      ]
    },
    "two-kinds-of-unfinished": {
      "idea": "Process termination and power failure leave different storage layers intact.",
      "question": "Does killing a process prove its data would survive power loss?",
      "answer": "No. The OS cache survives process termination but does not survive loss of power.",
      "builds": [
        "Identify application memory, OS cache, and durable storage.",
        "Predict which layers survive process termination.",
        "Predict what survives power failure and explain the lab's narrower crash tests."
      ]
    },
    "durable-first": {
      "idea": "Recovery information must become durable before the changed page can become durable.",
      "question": "Where is the safety boundary before a dirty page flush?",
      "answer": "The associated recovery log information must already be durable.",
      "builds": [
        "Identify the old value before changing the page.",
        "Make its recovery information durable first.",
        "Allow the changed page to flush after that boundary."
      ]
    },
    "write-ahead-logging": {
      "idea": "WAL preserves the information needed to recover changes that reach storage.",
      "question": "What if an uncommitted page reaches disk before its undo information?",
      "answer": "The change may survive with no durable old value available to restore it.",
      "builds": [
        "Identify the lab's old-value recovery record.",
        "Mark the record's durability boundary.",
        "Require log durability before page durability, separating the general rule from this undo format."
      ]
    },
    "a-complete-transfer": {
      "idea": "The lab's FORCE commit makes changed data durable before its commit receipt.",
      "question": "Where do new balances live after each SET and before the commit flush?",
      "answer": "In buffers, until the FORCE commit flushes the changed pages.",
      "builds": [
        "Start the transfer of 40 from balances 100 and 50.",
        "Log A's old value of 100 before changing it.",
        "Log B's old value of 50 before changing it.",
        "Flush the changed data, then record durable COMMIT."
      ]
    },
    "crash-after-eviction": {
      "idea": "Evicting an uncommitted dirty page does not commit its transaction.",
      "question": "What lets recovery repair the debit from unfinished tx2?",
      "answer": "The durable SET record contains A's old value of 60.",
      "builds": [
        "Begin tx2 and change its balance in memory.",
        "Evict the dirty page so its uncommitted value reaches disk.",
        "Crash without COMMIT and identify tx2 as unfinished before starting recovery."
      ]
    },
    "read-the-log-backward": {
      "idea": "Backward recovery restores unfinished transactions while preserving committed ones.",
      "question": "Why should tx1 stay committed instead of returning to 100 and 50?",
      "answer": "Its commit record is durable, and FORCE made its changed pages durable before that record.",
      "builds": [
        "Scan backward and identify unfinished tx2.",
        "Restore its durable old value.",
        "Keep tx1's committed transfer and flush repairs before recording recovery completion."
      ]
    },
    "repair-can-crash-too": {
      "idea": "Recovery must be safe to repeat if another crash interrupts the repair.",
      "question": "Why is a rollback receipt unsafe before repaired pages are durable?",
      "answer": "A later restart could skip a repair whose completion was recorded but whose data never survived.",
      "builds": [
        "Restore the old value by assignment.",
        "Interrupt recovery before completion.",
        "Repeat the repair, flush its pages, and only then record completion."
      ]
    },
    "two-policy-decisions": {
      "idea": "Eviction and commit policies independently determine which changes may be missing or premature.",
      "question": "Which policy creates a need for undo, and which creates a need for redo?",
      "answer": "STEAL permits uncommitted data on disk; NO-FORCE permits committed changes whose data pages are not durable.",
      "builds": [
        "Separate the eviction choice from the acknowledgement choice.",
        "Allow early uncommitted page writes with STEAL and derive undo.",
        "Allow deferred committed page writes with NO-FORCE and derive redo."
      ]
    },
    "four-recovery-duties": {
      "idea": "The recovery duties follow from the combination of STEAL and FORCE policies.",
      "question": "Which combination needs both undo and redo in this model?",
      "answer": "STEAL with NO-FORCE: uncommitted changes may be present and committed changes may be absent.",
      "builds": [
        "Derive neither duty for FORCE with NO-STEAL under the simplified update model.",
        "Derive undo for FORCE with STEAL.",
        "Derive redo for NO-FORCE with NO-STEAL.",
        "Combine both duties for NO-FORCE with STEAL."
      ]
    },
    "commit-boundary": {
      "idea": "A commit reply is safe only after the engine's required durability boundary.",
      "question": "What if the connection fails after durability but before the reply arrives?",
      "answer": "The transaction may already be committed even though the client does not know its outcome.",
      "builds": [
        "Identify the required durable log writes in each policy.",
        "Place the earliest safe acknowledgement on each lane.",
        "Show how NO-FORCE defers data-page flushes and can share log costs through group commit."
      ]
    },
    "recovery-at-scale": {
      "idea": "Production recovery tracks transaction fate and durable progress beyond the simple lab protocol.",
      "question": "Is an arbitrary timestamp enough to make a safe checkpoint cutoff?",
      "answer": "No. Recovery needs state and durability guarantees that account for unfinished transactions and required data.",
      "builds": [
        "Determine which transactions completed and which remain unfinished.",
        "Explain redo progress and the role of log sequence numbers.",
        "Explain undo of losers and qualify differences from the lab and PostgreSQL."
      ]
    },
    "place-the-crash": {
      "idea": "The crash location determines what recovery must preserve or restore.",
      "question": "Does a missing commit reply prove the transaction failed?",
      "answer": "No. The durable commit may already exist; the application needs a safe way to resolve or retry the outcome.",
      "builds": [
        "Predict the outcome of a crash before durable logging.",
        "Crash after the log is durable and identify the available repair information.",
        "Crash after uncommitted data reaches disk and restore it.",
        "Crash after durable commit and preserve the transaction under FORCE."
      ]
    },
    "from-promise-to-code": {
      "idea": "The code must preserve WAL ordering during writes, commit, and recovery.",
      "question": "Which must become durable first: recovery information or the associated changed page?",
      "answer": "Recovery information. Under the lab's FORCE policy, changed pages also precede the durable commit receipt.",
      "builds": [
        "Narrate the recovery record and its sync.",
        "Change the page only after the lab's log boundary.",
        "Explain a commit and an interrupted transaction's repair without reading the script."
      ]
    }
  },
  "8": {
    "concurrency-mvcc": {
      "idea": "Correct individual transactions can interfere when they share mutable state.",
      "question": "What balance should two deposits of ten produce from 100?",
      "answer": "120 under a serial execution; an unsafe interleaving can instead leave 110.",
      "builds": [
        "Introduce the two clients and their shared account.",
        "Predict the intended result, then reveal the possibility of a lost update."
      ]
    },
    "two-deposits": {
      "idea": "Both deposits should count even when the clients run concurrently.",
      "question": "Why is 110 wrong after both ten-unit deposits complete?",
      "answer": "It reflects only one net deposit, although each transaction intended to add ten.",
      "builds": [
        "Start at 100 with both transactions ready.",
        "Apply one ten-unit deposit.",
        "Establish 120 as the expected result when both deposits count."
      ]
    },
    "schedule-the-failure": {
      "idea": "A lost update occurs when two transactions overwrite from the same stale starting value.",
      "question": "Can WAL infer and restore the missing intended deposit?",
      "answer": "No. Recovery preserves committed actions; it cannot infer application intent from an incorrect schedule.",
      "builds": [
        "Have both clients read 100.",
        "Let each compute its own value of 110.",
        "Write both values to the same row.",
        "Commit both and compare 110 with the intended 120."
      ]
    },
    "serializability": {
      "idea": "Serializable execution has the effect of some serial order, even when operations interleave.",
      "question": "Does serializability require literally running one transaction at a time?",
      "answer": "No. Interleavings are allowed when they preserve a valid serial execution's dependencies and effects.",
      "builds": [
        "Trace the first possible serial order.",
        "Reverse the order and compare dependencies.",
        "Show a valid interleaving and explain its equivalent serial order."
      ]
    },
    "anomaly-gallery": {
      "idea": "Different anomalies involve uncommitted values, changed rows, or changed predicate results.",
      "question": "How does a phantom differ from a non-repeatable read?",
      "answer": "A phantom changes which rows satisfy a predicate; a non-repeatable read changes an existing row's observed value.",
      "builds": [
        "Retell the dirty-read timeline before naming it.",
        "Retell the changed-row timeline and identify the second observation.",
        "Retell the changed-result-set timeline and identify the predicate."
      ]
    },
    "shared-and-exclusive": {
      "idea": "Shared locks permit compatible readers; exclusive locks conflict with other holders.",
      "question": "Can two shared-lock holders both upgrade immediately to exclusive access?",
      "answer": "No. Each upgrade conflicts with the other shared holder.",
      "builds": [
        "Allow the two shared readers to coexist.",
        "Request exclusive access and check compatibility with every existing holder."
      ]
    },
    "replay-with-locks": {
      "idea": "The lost-update schedule is stopped at the first conflicting exclusive-lock upgrade.",
      "question": "Where does the lab refuse the read/read/compute/compute/write schedule?",
      "answer": "At the first X-lock upgrade, because the other transaction still holds an S lock.",
      "builds": [
        "Grant both shared reads.",
        "Request the first exclusive upgrade.",
        "Raise LockAbortError and explain rollback and retry rather than waiting."
      ]
    },
    "two-phases": {
      "idea": "Two-phase locking separates acquiring locks from releasing them.",
      "question": "Can classic 2PL acquire another lock after releasing one?",
      "answer": "No. Once shrinking begins, no new lock can be acquired.",
      "builds": [
        "Acquire locks during the growing phase.",
        "Release locks during the shrinking phase.",
        "Explain the lab's stronger rule of holding all locks until completion."
      ]
    },
    "deadlock": {
      "idea": "A deadlock cycle cannot resolve merely by waiting longer.",
      "question": "What can break the cycle safely?",
      "answer": "Abort a participant and retry its transaction; a consistent acquisition order can prevent this two-resource cycle.",
      "builds": [
        "Give each transaction one resource.",
        "Have each request the other's resource and trace the cycle.",
        "Abort and retry a participant, distinguishing deadlock from ordinary blocking."
      ]
    },
    "protect-the-empty-space": {
      "idea": "Protecting existing rows alone cannot stop new rows from entering a queried range.",
      "question": "What must a locking design protect against phantoms?",
      "answer": "The relevant range or predicate, including space where a matching row could appear.",
      "builds": [
        "Lock the rows already selected by the predicate.",
        "Insert a matching row in the gap.",
        "Protect the predicate range and discuss dependency detection as an MVCC alternative."
      ]
    },
    "isolation-ladder": {
      "idea": "Isolation levels define guarantees, with important implementation differences.",
      "question": "Does PostgreSQL REPEATABLE READ prevent every serializability anomaly?",
      "answer": "No. Its transaction snapshot prevents these changing-result phantoms but can still allow write skew.",
      "builds": [
        "Introduce READ UNCOMMITTED and qualify PostgreSQL's READ COMMITTED behavior.",
        "Explain the committed-data guarantee of READ COMMITTED.",
        "Discuss transaction snapshots and the limits of REPEATABLE READ.",
        "Connect SERIALIZABLE to equivalence with a serial execution."
      ]
    },
    "versions-instead-of-waiting": {
      "idea": "MVCC lets readers and writers use different versions of a row.",
      "question": "What pays for the concurrency gained through versions?",
      "answer": "Version storage, visibility bookkeeping, and cleanup; writers can still conflict.",
      "builds": [
        "Identify the original version.",
        "Create another version for the update.",
        "Let the snapshot reader use its visible version while the writer proceeds."
      ]
    },
    "walk-the-version-chain": {
      "idea": "A snapshot selects the version visible to its reader.",
      "question": "Are transaction-number comparisons alone enough for real MVCC visibility?",
      "answer": "No. Transaction status, snapshot membership, and the reader's own writes also matter.",
      "builds": [
        "Use the toy committed ordering to read 120 after tx100.",
        "Move past tx103 and read 70.",
        "Move past tx107 and read 50, then qualify the simplified visibility model."
      ]
    },
    "the-version-bill": {
      "idea": "A valid old snapshot can prevent obsolete versions from being reclaimed.",
      "question": "Why can an idle transaction hold back cleanup?",
      "answer": "Its snapshot may still need the old versions, even while it issues no new queries.",
      "builds": [
        "Show the reader retaining an old version.",
        "Stop cleanup at the version the reader may still need.",
        "End the reader and allow eligible cleanup to proceed."
      ]
    },
    "write-skew": {
      "idea": "Snapshot isolation can allow a shared invariant to fail through writes to different rows.",
      "question": "Why does the two-doctor example have no direct write/write conflict?",
      "answer": "Each doctor changes a different row, although together their changes leave nobody on call.",
      "builds": [
        "Establish that at least one of the two doctors must remain on call.",
        "Let each snapshot show the other doctor available.",
        "Let both leave and compare the outcome with any serial execution."
      ]
    },
    "three-mechanisms-three-jobs": {
      "idea": "Pins, latches, and transaction locks protect different things.",
      "question": "Does pinning a page stop another transaction from changing its rows?",
      "answer": "No. A pin prevents eviction; transaction access requires a separate concurrency protocol.",
      "builds": [
        "Use a pin to protect a frame from eviction.",
        "Use a latch to protect a short shared-memory operation.",
        "Use transaction locks to control conflicting access across transaction work."
      ]
    },
    "exit-schedule": {
      "idea": "Crash recovery, lock conflicts, and snapshot visibility solve distinct correctness problems.",
      "question": "What anomaly can snapshot isolation still permit?",
      "answer": "Write skew, even though each transaction reads a consistent snapshot.",
      "builds": [
        "Retell the invalid lost-update schedule.",
        "Identify the first conflicting X-lock upgrade.",
        "Explain snapshot visibility and use write skew to show its limits."
      ]
    }
  },
  "9": {
    "same-answer-different-work": {
      "idea": "Equivalent plans can produce the same rows with very different intermediate work.",
      "question": "Do the pushed plan's 60 candidate pairs mean 60 final rows?",
      "answer": "No. The join still filters them; both plans return the same twenty rows.",
      "builds": [
        "Identify the predicates in both plans.",
        "Compare the candidate work before the final join checks.",
        "Confirm the same twenty results and separate candidates from output."
      ]
    },
    "optimizer": {
      "idea": "An optimizer estimates the costs of valid alternatives before choosing a plan.",
      "question": "Does an optimizer execute every candidate to discover the cheapest one?",
      "answer": "No. It uses estimates, physical properties, and a bounded search.",
      "builds": [
        "Identify the stored statistics available for estimates.",
        "Price candidate plans under the cost model.",
        "Choose a plan and distinguish optimization from the fixed Lab 5 planner."
      ]
    },
    "read-a-plan": {
      "idea": "A plan explains the chosen operators, while execution measurements reveal their actual behavior.",
      "question": "Does EXPLAIN ANALYZE merely display a plan?",
      "answer": "No. It executes the statement and reports measured behavior.",
      "builds": [
        "Read the left input and its row estimate.",
        "Read the right input and compare estimated with actual rows.",
        "Follow the join's inputs and output; treat cost units separately from milliseconds."
      ]
    },
    "selectivity": {
      "idea": "Selectivity is the fraction of input rows that survives a predicate.",
      "question": "What does a smaller selectivity fraction imply?",
      "answer": "Fewer surviving rows, which can reduce work in later operators.",
      "builds": [
        "Identify the input row count N.",
        "Count survivors and divide by N before discussing later costs."
      ]
    },
    "estimate-from-a-sketch": {
      "idea": "Cardinality estimates depend on distribution and independence assumptions.",
      "question": "What assumptions produce the approximate 142-then-47 survivor estimate?",
      "answer": "A uniform continuous range model followed by an independent one-third department filter.",
      "builds": [
        "Inspect the distribution sketch and name its assumptions.",
        "Estimate about 142 rows from the range filter.",
        "Apply the independent one-third filter to estimate about 47."
      ]
    },
    "when-estimates-fail": {
      "idea": "Skew and correlated predicates can invalidate simple estimates.",
      "question": "Will refreshing statistics automatically fix a wrong independence assumption?",
      "answer": "No. Correlation can require richer statistics or a different estimation model.",
      "builds": [
        "Make the uniform estimate explicit.",
        "Contrast it with skewed actual data.",
        "Use Charlottesville and Virginia to explain why correlated filters do not multiply independently."
      ]
    },
    "watch-the-access-path-flip": {
      "idea": "The preferred access path changes when estimated matches make index probes more costly.",
      "question": "Where is the crossover in this toy model?",
      "answer": "Around 0.997%: (1,000 − 3) / 100,000. It is not a universal index threshold.",
      "builds": [
        "Price a selective lookup as height three plus matching RIDs.",
        "Compare the index cost with 1,000 scan blocks near the crossover.",
        "Increase matches until the scan wins, then qualify the model's assumptions."
      ]
    },
    "choose-the-join-machine": {
      "idea": "Join algorithms suit different input sizes, access paths, and physical properties.",
      "question": "Why is no join algorithm always best?",
      "answer": "Probe cost, build memory, ordering, duplicates, and output size change the work required.",
      "builds": [
        "Use a tiny outer input with cheap indexed probes.",
        "Build and probe a hash for an appropriate equality join.",
        "Merge ordered inputs, producing all pairs from duplicate-key groups."
      ]
    },
    "join-order": {
      "idea": "Join order controls the size of intermediate results.",
      "question": "Which first pair lacks a connecting predicate in this example?",
      "answer": "Majors and enrollments, which form a 9,000-row cross product.",
      "builds": [
        "Join students and majors first and count the intermediate.",
        "Join students and enrollments first and compare the work.",
        "Form the unconnected pair and distinguish intermediate growth from total-work ratios."
      ]
    },
    "search-without-enumerating-everything": {
      "idea": "Optimizer search reuses subplans and can retain alternatives with useful physical properties.",
      "question": "Why retain a subplan that is not cheapest in raw local cost?",
      "answer": "Its ordering or another physical property may reduce the cost of the full plan.",
      "builds": [
        "Start with candidate plans for individual relations.",
        "Reuse the best useful plans for pairs and larger subsets.",
        "Keep alternatives whose physical properties can help later operators."
      ]
    },
    "diagnose-then-review": {
      "idea": "The earliest large estimation error often explains expensive choices higher in the plan.",
      "question": "Where should we investigate first when estimated and actual rows diverge?",
      "answer": "At the earliest substantial mismatch, checking distributions, statistics, correlations, and memory assumptions.",
      "builds": [
        "Read the estimated plan alongside measured rows.",
        "Find the earliest large divergence.",
        "Investigate its assumptions, then transition at minute 40 to the review."
      ]
    },
    "review-storage-and-memory": {
      "idea": "Durability boundaries and working-set reuse explain storage behavior better than memorized ratios.",
      "question": "Why can a repeated 50-page loop miss in a 49-frame LRU pool?",
      "answer": "Each page is evicted before its next use; one additional frame lets later passes hit.",
      "builds": [
        "Recall the difference between buffered acceptance and requested durable completion.",
        "Trace the repeated loop through 49 frames.",
        "Add the missing frame and distinguish initial misses from later hits."
      ]
    },
    "review-rows-and-pipelines": {
      "idea": "Record layout and iterator plans connect stored bytes to query work.",
      "question": "How does the example reduce 900 candidate pairs to 60?",
      "answer": "Local filters reduce the inputs before their product, while preserving the same final answer.",
      "builds": [
        "Recall slot arithmetic, UTF-8 byte capacity, and the limits of stable RIDs.",
        "Follow a caller request through the operator tree.",
        "Reconstruct the candidate reduction and identify operators that still need substantial state."
      ]
    },
    "review-recovery-and-isolation": {
      "idea": "Recovery preserves crash-safe ordering; isolation constrains concurrent schedules.",
      "question": "Can recovery infer the intended deposit lost by a bad concurrent schedule?",
      "answer": "No. Logging and recovery preserve recorded actions; isolation must prevent the invalid schedule.",
      "builds": [
        "Place durable log information before changed data and the FORCE commit receipt.",
        "Retell the lost-update schedule.",
        "Locate the lock conflict and explain why snapshots still allow write skew."
      ]
    },
    "exit-mechanism": {
      "idea": "Explaining a mechanism includes naming the failure it prevents.",
      "question": "What must a useful explanation add beyond the mechanism's name?",
      "answer": "How it works and a concrete failure or cost that appears when it is absent.",
      "builds": [
        "Ask for a twenty-second storage mechanism explanation.",
        "Ask for a query-execution mechanism and its effect on work.",
        "Ask for a transaction mechanism and the failure it prevents."
      ]
    }
  },
  "10": {
    "the-analytics-stack": {
      "idea": "The same taxi rides can be stored by row or by column. An average-fare query needs only the fares.",
      "question": "What is the average fare, and which fields can this query skip?",
      "answer": "The average is (36 + 24 + 30) / 3 = $30. Pickup and payment do not contribute; column storage keeps the fares together so the query can skip those other fields.",
      "builds": [
        "Introduce three made-up rides. Read Ride 1 aloud: JFK, card, $36. Point out that its values also appear in the column layout, under the Ride 1 labels.",
        "Follow the orange strip across Ride 1. Its pickup, payment, and fare sit together. The next strip contains Ride 2.",
        "Follow the blue outlines on the right. Each strip now holds one field across all three rides. The Ride 1, Ride 2, and Ride 3 labels preserve which values belong together.",
        "Find the six green cells: the same three fares shown once in each layout. Ask students to add 36, 24, and 30 and divide by three before advancing.",
        "Reveal $30 and compare the grouping. The result stays the same; the fare column lets the engine skip pickup and payment. Explain that these strips show groups of values, while real reads operate on pages or chunks."
      ]
    },
    "the-workload-rotates": {
      "idea": "In microdb, a slot holds a whole record. In a columnar row group, matching logical positions connect the fields of a row.",
      "question": "How do we rebuild Ride 2 from the column chunks? Does position 1 mean byte offset 1?",
      "answer": "Take logical position 1 from each chunk in the same row group: LGA, card, and $24. Position is a row ordinal, not a byte offset. Encoding, compression, and variable-length values affect how the engine locates it.",
      "builds": [
        "Use the same three rides as the opening slide. On the left, slots 0, 1, and 2 are in a toy row page. On the right, a row group holds the same rows as three separate column chunks. Define a row group as a batch of rows represented across the columns.",
        "Highlight slot 1 in block 7. RID (7, 1) identifies Ride 2, whose fields are stored together. This is the fixed-slot model from Lab 3, with status flags and headers omitted.",
        "Find position 1 in the pickup chunk. LGA enters the reconstructed row; payment and fare are still unknown. The dashed guide marks the shared logical position.",
        "Stay at position 1 and read the payment chunk. Add card. Each chunk follows the same row order; sorting the columns independently would break that correspondence.",
        "Read $24 from position 1 in the fare chunk. The rebuilt ride matches the left-hand slot. A chunk can contain several encoded pages, and page boundaries need not align across columns. Position 1 may require decoding; it is not necessarily a fixed-width physical slot."
      ]
    },
    "read-a-row-layout": {
      "idea": "An average-fare query needs three fares; row storage keeps them beside other ride fields.",
      "question": "Which values contribute to the average? What else is stored beside them?",
      "answer": "Only $36, $24, and $30 contribute. Pickup and payment values are stored beside the fares. The average is $30.",
      "builds": [
        "Use the same rides as the opening. Ask students to select the fields before advancing.",
        "Follow the three green fare cells. Orange marks unrelated neighboring fields; it does not count measured disk reads.",
        "Reveal $30. Row pages can bring along unrelated fields when a scan reaches the fares. Keep the query and data fixed for the next slide."
      ]
    },
    "read-a-column-layout": {
      "idea": "Column storage puts the needed fares together, allowing this query to skip unrelated column chunks.",
      "question": "Did we change the answer, the required fares, or the unrelated data accessed?",
      "answer": "The answer is still $30 and the same three fares contribute. The layout lets the query avoid the pickup and payment chunks.",
      "builds": [
        "Point out that only grouping has changed; all nine values are unchanged.",
        "Read the three green fares. Pickup and payment chunks stay gray because neither is needed by this query.",
        "Reveal the same $30 result. Emphasize less unrelated data, not an exact disk-read count or speed multiplier."
      ]
    },
    "the-point-lookup-reverses-it": {
      "idea": "Choose storage for the queries you run: row layouts group a record; column layouts group a field across records.",
      "question": "Why does neither layout win for every query?",
      "answer": "A complete-ride lookup benefits from fields stored together. A fare-only aggregate benefits from skipping other fields. Both layouts can answer both queries, and actual performance depends on execution.",
      "builds": [
        "Define workload as the mix of queries the database runs. Highlight only Ride 2: LGA, card, and $24. These are the fields the first request needs.",
        "Highlight fares for every ride. The second request needs many rows but only one field. The tables depict needed values, not physical page layouts.",
        "Show both highlighted patterns together. Nothing needs to rotate when a query runs. Storage design should fit the query mix; some systems keep both row and column copies."
      ]
    },
    "parquet-is-a-file-format": {
      "idea": "Parquet stores table data by column in a file. DuckDB reads the file and runs the query.",
      "question": "In this example, which part stores the rides, and which part calculates the average fare?",
      "answer": "rides.parquet stores the data. DuckDB is the query engine: it reads the fare values and calculates (36 + 24 + 30) / 3 = $30. The file format describes how the values are stored.",
      "builds": [
        "Start from the same three rides. Explain that a file format defines how values are stored in a file, just as a CSV format has rules for rows and separators. Parquet uses a binary column-oriented layout.",
        "Open the file conceptually. One row group holds these three rides as three column chunks. Read the pickup chunk, then payment, then fare. Values retain the same ride order. Metadata describes the types and where the chunks are.",
        "Introduce DuckDB as the program running AVG(fare). Highlight the fare chunk. DuckDB uses the metadata to locate the needed values; pickup and payment chunks can be skipped.",
        "Reveal $30. The file holds data and the engine computes the result. Connect the column chunks to the next slides: their values can be encoded and compressed without changing the answer."
      ]
    },
    "compression": {
      "idea": "Lossless compression saves bytes while preserving the original values exactly.",
      "question": "How can decoding still make a scan faster overall?",
      "answer": "The reduction in bytes fetched can outweigh the decoding work.",
      "builds": [
        "Connect to column storage: values of the same field often have patterns. Identify the repeated values in this example.",
        "Replace it with a compact encoding.",
        "Reconstruct the original values and compare bytes saved with decode cost."
      ]
    },
    "runs": {
      "idea": "Run-length encoding stores consecutive repetitions as value-count pairs.",
      "question": "How should eight 1s, eight 2s, and eight 3s be represented?",
      "answer": "As three runs. In this teaching byte model, 96 bytes become 24.",
      "builds": [
        "Count the twenty-four original values.",
        "Group them into three consecutive runs.",
        "Compare payload bytes and ask what alternating values would do to the runs."
      ]
    },
    "dictionary-and-deltas": {
      "idea": "Dictionary and delta encodings exploit different patterns in data.",
      "question": "Which pattern favors a dictionary, and which favors deltas?",
      "answer": "Repeated low-cardinality strings favor dictionary codes; smooth numeric sequences favor deltas.",
      "builds": [
        "Identify the two repeated string values.",
        "Replace them with codes and recover one value through the dictionary.",
        "Store a starting number plus differences and reconstruct a later value."
      ]
    },
    "batches-through-the-pipeline": {
      "idea": "Batching changes the size of a handoff between operators. It builds on the scan, filter, and projection jobs from microdb.",
      "question": "If we pass the three fares as one batch, do we still test all three against fare > 25? What work can batching reduce?",
      "answer": "Yes: 36 passes, 24 fails, and 30 passes. The same two fare values are returned. Batching reduces repeated calls between operators; it does not remove the predicate checks or imply one disk read per row.",
      "builds": [
        "Recall Labs 4 and 5: plan = ProjectScan(SelectScan(TableScan(...), predicate), fields). The caller invokes plan.next(), then plan.get_val(\"fare\"). next() returns a Boolean, not a row object. Green arrows show conceptual value flow; the request chain runs inward from ProjectScan.",
        "Walk the first successful next() through ProjectScan, SelectScan, and TableScan. Fare 36 satisfies fare > 25. get_val(\"fare\") delegates down to the current row and returns 36.",
        "The second SelectScan.next() first examines 24 and rejects it, then advances the child again to find 30. One successful call exposes one match even when several input rows are inspected. A later next() returns False at exhaustion; that final call is omitted.",
        "Introduce a hypothetical batch interface using only three rows so every value is visible. These are execution batches in memory, not disk pages or Parquet row groups. Microdb already buffers pages; its scan API is still row-at-a-time.",
        "Apply the same condition to all three fare values. A real vectorized engine can track matching positions with a selection vector. The drawing shows a keep/drop mask, not three parallel workers.",
        "Pass the matching fares together. The answer stays 36 and 30, and the predicate still runs for each input value; the repeated per-row operator-call overhead is shared. DuckDB uses column vectors grouped in DataChunks, with a default standard vector size of 2048; this toy batch is deliberately small."
      ]
    },
    "skip-a-row-group": {
      "idea": "Min/max metadata can rule out a row group without reading its values.",
      "question": "Does a surviving row group's range prove that all its rows match?",
      "answer": "No. It proves only that the group cannot yet be ruled out.",
      "builds": [
        "Inspect the min/max bounds before opening any group.",
        "Eliminate the two impossible groups.",
        "Open the possible match and evaluate its actual rows."
      ]
    },
    "skip-eleven-partitions": {
      "idea": "A partition groups rows by a value. This example stores each month in a folder of Parquet files.",
      "question": "Are a partition, a folder, and a Parquet file the same thing?",
      "answer": "A partition is a group of rows, such as all December rides. Here, the month=12 folder holds that group in Parquet files. A partition can have several files. Other database systems can manage partitions without exposing folders.",
      "builds": [
        "Define the group first: rides with the same month. Then point to its folder and the Parquet file inside. This is one year of toy data. A folder may contain several files; we draw just one.",
        "Read the folder label month=12. It tells the engine which files contain December rides, so files in the other eleven folders can be skipped. Call this partition pruning after explaining the action.",
        "Within December, read only fare chunks from the Parquet files. The month filter comes from the folder name. We have now removed unneeded months and unneeded columns; the next slide counts those two savings."
      ]
    },
    "predict-the-byte-ratio": {
      "idea": "Read fewer columns, then fewer months. These two choices shrink the data in different directions.",
      "question": "The full table fills 144 equal-size squares. December fares occupy one square. What fraction of the value data do we need?",
      "answer": "One of 144 squares: 1/144 of the full value data. Each square is 5,000 values × 8 bytes = 40 KB. All 144 squares are 5.76 MB. Keeping fare divides the data by 12; keeping December divides it by 12 again. This compares value bytes before metadata, encoding, and compression, not query speed.",
      "builds": [
        "Define every axis before calculating. The grid has twelve columns and twelve months. The toy year has 60,000 rides, exactly 5,000 per month. Every field value is eight bytes. A square represents one month of one column, not a disk page.",
        "Highlight all 144 squares as the full-table baseline. Multiply 60,000 rows × 12 columns × 8 bytes = 5,760,000 bytes, or 5.76 MB. This counts value data, not measured I/O.",
        "Keep the fare column and dim the other eleven. Twelve squares remain: 60,000 fare values × 8 bytes = 480,000 bytes, or 480 KB. This is the first division by twelve.",
        "Keep December at the bottom of the fare column. One square remains: 5,000 fare values × 8 bytes = 40,000 bytes, or 40 KB. The folder label supplies month, so no separate month column is needed.",
        "Pause for students to compare the one green square with the original 144. Ask for the fraction of data remaining before advancing. The two reductions removed columns and months, respectively.",
        "Reveal 5,760 KB / 40 KB = 144: the remaining data is 1/144 of the baseline. Two factors of twelve multiply because the choices shrink different dimensions. Real months are unequal, and actual time also includes I/O overhead, metadata, decoding, and computation. Optional extension: December with half the rides leaves 1/24, not 1/144."
      ]
    },
    "an-engine-inside-the-process": {
      "idea": "An embedded query engine executes within the application's process.",
      "question": "Does the local analytical SQL lab need a separate database server?",
      "answer": "No. The embedded engine queries files and in-process data directly.",
      "builds": [
        "Place the engine inside the application boundary.",
        "Connect its inputs to files or dataframes.",
        "Return the query result and explain how dataframe and SQL work can compose."
      ]
    },
    "storage-and-compute-separate": {
      "idea": "Separating storage from compute lets their resources scale independently.",
      "question": "What remains when a compute group stops or changes size?",
      "answer": "The durable stored data remains available for later compute.",
      "builds": [
        "Connect one compute group to durable storage.",
        "Resize compute without treating it as another full data copy.",
        "Keep the stored data and discuss independent capacity choices."
      ]
    },
    "a-table-over-files": {
      "idea": "Transactional metadata identifies the files belonging to a consistent table snapshot.",
      "question": "Why should a reader not discover a commit by simply listing a folder?",
      "answer": "It could see partially written changes; a commit protocol must publish a consistent snapshot.",
      "builds": [
        "Read the files belonging to snapshot A.",
        "Write new files for B while A remains readable.",
        "Publish B atomically while existing readers retain their snapshot."
      ]
    },
    "train-inside-the-query-engine": {
      "idea": "A SQL aggregate query learns the intercept and slope, then saves them in a model table.",
      "question": "Why does regr_intercept need both fare and distance? Which rides may influence its result?",
      "answer": "The function fits a line relating distance to fare, so it needs the paired values from the training rides. fare is the outcome (y), and distance is the input (x). regr_intercept returns one number: the fitted fare at distance zero. Here, the learned slope is 2, average distance is 2.5, and average fare is 8, so intercept = 8 - 2 × 2.5 = 3. WHERE split = train keeps the two rides reserved for checking the model out of the fit.",
      "builds": [
        "Name the input table before reading the SQL. fare_features is a prepared view of six made-up rides, with positive distances and nonnegative fares. distance is the feature; fare is the label. Define a test ride as a taxi-trip record reserved before training for checking the model afterward. Four rides teach the model; two rides check predictions on data it did not learn from. The setup is in the reading and runnable script.",
        "Follow the highlighted FROM and WHERE lines. Orange rows have split = train and enter the aggregates; the two test rows stay outside fitting. Explain this logical data flow without claiming the engine must execute clauses in their written order.",
        "Read regr_intercept(fare, distance) as: use the training rides' paired fares and distances to find the intercept of the fitted line. The arguments supply outcome y first and input x second. The aggregate uses all four pairs selected by WHERE. Both regr_intercept and regr_slope describe the same least-squares line; each returns one number from that fit. The intercept depends on how fare changes with distance, so fares alone cannot determine it. count(*) records how many training rows contributed.",
        "Highlight CREATE TABLE and read the saved row: intercept 3, slope 2, training_rows 4. SELECT * FROM fare_model lets students inspect what training produced.",
        "Turn the saved coefficients into predicted fare = 3 + 2 × distance. The intercept is the fitted value at zero miles and the slope adds two dollars per mile in this toy model. To explain why the intercept needs both columns, use intercept = average fare - slope × average distance. The four training rides have average fare 8 and average distance 2.5, giving 8 - 2 × 2.5 = 3. No training ride has distance zero; the model estimates that crossing. The fitted intercept does not establish an actual taxi base fare."
      ]
    },
    "evaluate-and-apply-the-model": {
      "idea": "SQL can apply the saved model, compare predictions with actual fares, and score a new ride.",
      "question": "Why do the test query and the new-ride query both use fare_model, but only the test needs actual fares?",
      "answer": "A test ride is a recorded trip reserved for checking the model after training. Both queries reuse the learned intercept and slope. For the 2.5-mile test ride, the model predicts $8; the recorded fare is $9, so the prediction misses by $1. The other test ride predicts $12 against $11, giving a $1 mean absolute error across both. Their actual fares did not influence training. A new 3.5-mile ride needs only distance and the saved model to predict $10; its actual fare is needed later to measure error.",
      "builds": [
        "Say 'rides reserved for checking the model' before using the shorthand 'test rides.' These are recorded trips with known distances and fares, set aside before training. Read WHERE r.split = test and find those two rows. Their fares did not help learn the coefficients. We now use each distance to predict a fare, then compare with its recorded fare. Keep the saved model fixed and leave the predictions as question marks until the class has tried the calculation.",
        "Read CROSS JOIN as pairing each test ride with the single model row. Substitute 3 and 2 into the prediction expression, and ask for the two predictions before advancing.",
        "Reveal 8 and 12. CREATE VIEW names this query held_out_predictions so the next query can use its results. A normal view stores the query definition rather than materializing a new table.",
        "Read the new SQL query: subtract prediction from actual fare, take abs so both misses count positively, then average. Both absolute errors are $1, giving a $1 MAE. The query also reports test_rows = 2 and RMSE = $1; RMSE takes the square root of the mean squared errors. Two made-up test rides cannot establish real-world accuracy.",
        "Read VALUES (7, 3.5) as one new ride with ID 7 and distance 3.5. The ID labels the result; only distance contributes to prediction. CROSS JOIN retrieves the same saved model coefficients. Ask for the new prediction before advancing.",
        "Reveal 3 + 2 × 3.5 = $10. This SELECT applies the model without calling a regression aggregate or changing fare_model. The complete runnable demo also keeps ride IDs and reports RMSE."
      ]
    },
    "performance-becomes-cost": {
      "idea": "Reducing data movement can affect query cost as well as execution time.",
      "question": "Does every warehouse charge according to the same bytes-scanned rule?",
      "answer": "No. Billing models differ, and improvements must be evaluated against the system's actual cost model.",
      "builds": [
        "Identify the bytes read by the broad query.",
        "Project one column and discuss the reduction in scanned data.",
        "Prune to one partition and distinguish byte savings from measured elapsed time."
      ]
    },
    "choose-the-shape": {
      "idea": "Choosing an access shape means matching the workload to layout and execution.",
      "question": "Which stage learns model coefficients, and which reuses them?",
      "answer": "Training aggregates learn the coefficients; inference applies the saved model without fitting it again.",
      "builds": [
        "Choose a layout for a complete-record point lookup.",
        "Explain projection, encoding, and batching for a whole-table aggregate.",
        "Add partition pruning, then connect the same operators to training and inference."
      ]
    },
    "more-models-with-duckdb": {
      "idea": "DuckDB can prepare data for a neural network and query its predictions.",
      "question": "In the core PyTorch lab, which component updates the neural-network weights?",
      "answer": "PyTorch updates the weights. DuckDB selects January–October training rows and sends batches through Arrow. During prediction, a DuckDB SQL function calls the already-trained PyTorch model. November–December rides are reserved for checking errors.",
      "builds": [
        "Start with the DuckDB + PyTorch link and then open the core Lab 8 investigation. Distinguish the official article’s pretrained linear model from the lab’s small neural network. Both use the same integration idea. Point out that the community ML extension and the SQL-only research paper are alternative approaches. Ask students to compare the neural network with the straight-line baseline on the same reserved rides. More model complexity does not guarantee lower error."
      ]
    },
    "duckdb-pytorch-fare-model": {
      "idea": "DuckDB supplies the data and calls a prediction function; PyTorch trains and runs the neural network.",
      "question": "Does SELECT predict_fare_nn(distance) train a new model for each ride? When do we use the recorded test fares?",
      "answer": "No. The SQL function calls the trained PyTorch model with fixed weights. It receives only distances. We compare its predictions with the recorded test fares afterward to measure error. Those fares never helped fit the network or its scaling.",
      "checks": [
        {
          "question": "Why sort the training rides by hash(ride_id)?",
          "answer": "It mixes rides before forming batches so they do not follow date order. It is optional, and this example repeats the same mixed order on every pass. The month filter still excludes test rides."
        },
        {
          "question": "What do 1, 16, and 1 count in the network?",
          "answer": "One input feature per ride, 16 hidden units, and one output value per ride. These numbers describe the network, not the number of rides in a batch."
        },
        {
          "question": "Why does the 5-mile ride become 1 after scaling?",
          "answer": "The training mean is 3 miles and the std is 2 miles: (5 - 3) / 2 = 1. This means one standard deviation above the training average, not a one-mile ride."
        },
        {
          "question": "The model returns 0.8. Is that an 80-cent fare?",
          "answer": "No. It is a scaled fare prediction. We first compare it with the scaled recorded fare for training, and later use the saved fare mean and std to convert it to dollars."
        },
        {
          "question": "Do the positive 0.2 error and negative 0.2 error cancel?",
          "answer": "No. MSE squares each error first. Both become 0.04, and the mean is 0.04. Squaring prevents opposite signs from canceling."
        },
        {
          "question": "What dollar prediction does 0.8 represent with fare mean $20 and std $10?",
          "answer": "0.8 times $10 plus $20 is $28. This conversion uses saved training statistics and does not require the new ride’s actual fare."
        },
        {
          "question": "Does registering predict_fare_nn train another network?",
          "answer": "No. It connects a SQL function name to a Python callback that reuses the trained model and its saved scaling statistics."
        },
        {
          "question": "Does type=\"arrow\" mean the SQL argument is a list of rides?",
          "answer": "No. SQL still supplies one DOUBLE distance per row. DuckDB groups those values into an Arrow column batch before calling Python. [\"DOUBLE\"] declares one numeric SQL argument, not an array argument or a batch size."
        },
        {
          "question": "If the input distances are [3, 5], may the callback return fares [28, 22]?",
          "answer": "Not for these illustrative predictions. Position 0 belongs to the 3-mile ride and must return 22; position 1 belongs to the 5-mile ride and must return 28. Return the same number of values in matching positions, or the fares would be attached to the wrong rides."
        },
        {
          "question": "Do these recorded test fares enter the prediction function?",
          "answer": "No. The function receives distances. The recorded fares remain available to check the predictions afterward."
        },
        {
          "question": "Can we compare the toy loss of 0.04 directly with this dollar MAE?",
          "answer": "No. The 0.04 was mean squared error on scaled fares for an invented two-ride batch. This MAE is the average absolute dollar error on 10,000 real reserved rides."
        }
      ],
      "builds": [
        "Introduce the real taxi sample, replacing the earlier six made-up rides. The month filter keeps 50,000 January–October rides for training. DuckDB selects distance and fare before sending Arrow batches of up to 1,024 rows to Python. Define Apache Arrow as a format for column data in memory that these tools can exchange. Define a tensor as a numeric array. Distances become x and fares become y. November–December rides remain reserved for testing. ORDER BY hash(ride_id) mixes the training rides so batches do not follow the file’s date order. The hash maps each ride ID to a scrambled numeric value, and sorting those values gives a repeatable mixed order within this run. Mixing is helpful for batch training but is not required by DuckDB or PyTorch. This example repeats the same mixed order on every pass. Many training pipelines reshuffle on each pass. The WHERE filter still keeps test rides out.",
        "Trace the nodes from left to right: one distance input connects to all 16 hidden nodes, and all 16 hidden nodes connect to the one fare output. Match the blue connections to nn.Linear(1, 16) and the green connections to nn.Linear(16, 1). Each line represents a learned weight. Each hidden node combines its weighted input with a learned bias, then applies ReLU. The output combines the 16 hidden values with another learned bias. The diagram omits biases and scaling for readability. The code standardizes distance and fare using training statistics, and the prediction callback converts the output back to dollars. ReLU keeps positive values and sets negative ones to zero, letting the fitted relationship bend. The network is created once. Within each batch, predict, measure error, clear old gradients, calculate new gradients with backward, and update weights with optimizer.step. PyTorch performs this learning. The excerpt omits setup and loops, which are in the lab script. x_mean, x_std, y_mean, and y_std come only from training rows.",
        "Pause at the first line. x is a batch of recorded distances, one per ride. x_mean and x_std are the average and population standard deviation of all training distances, calculated once before training. Standard deviation measures spread. Subtracting the mean centers the values; dividing by std expresses them in units of that spread. In this invented example, assume the full training set gave mean 3 miles and std 2 miles. A 3-mile ride becomes 0, and a 5-mile ride becomes 1. The displayed batch does not determine those statistics. Scaling often helps optimization by keeping typical values near zero. It does not add information or guarantee better predictions. The same training statistics are reused for later rides.",
        "Now follow both lines. model receives only the scaled distances and returns one scaled fare prediction per ride using its current weights. y contains the recorded training fares. The second line scales y using the fare mean and fare std so prediction and target have matching units. Distance and fare have separate means and standard deviations. Assume fare mean 20 dollars and std 10 dollars: recorded fares 20 and 30 become targets 0 and 1. For illustration, suppose the network outputs 0.2 and 0.8. These outputs are made up, not results from fitting the two shown rides. They are not dollar amounts. Negative scaled values are also valid: they mean below the training average. Actual fares serve as training targets; they are not inputs to model.",
        "In the script, loss_fn is nn.MSELoss with its default mean reduction. For each ride, subtract the scaled target from the prediction and square that difference. The errors are 0.2 and minus 0.2. Squaring gives 0.04 for each, and their average is 0.04. This one number scores the whole batch in squared standardized-fare units. A lower value means closer predictions on this batch. It is different from the MAE in dollars shown later. The prediction and loss lines do not change weights. optimizer.zero_grad clears previous gradients, loss.backward calculates how each weight and bias affects loss, and optimizer.step uses those gradients to update the parameters.",
        "Undo the fare scaling when returning predictions to SQL. Multiply the network output by the saved training fare std, then add the saved training fare mean. Here 0.2 times 10 plus 20 gives 22 dollars, and 0.8 times 10 plus 20 gives 28 dollars. The recorded fares were 20 and 30, so each toy prediction has a 2-dollar absolute error and their MAE is 2 dollars. The scaled training loss was 0.04, not 0.04 dollars. This conversion only needs the prediction and saved training statistics. It does not need the actual fare of a new ride. The real predict_fare callback applies this conversion to every returned batch.",
        "Define Apache Arrow as a format for column data in memory. An Arrow Python UDF is a function we provide to DuckDB that receives and returns batches in that format. UDF means user-defined function. Read the registration arguments: predict_fare_nn is the SQL name, predict_fare is the Python function itself, [DOUBLE] declares one numeric SQL input, and DOUBLE declares one numeric result per row. type=arrow selects the batch interface. The callback converts distances to tensors, applies the trained model, and returns Arrow values. The function exists on this local DuckDB connection.",
        "Follow the input table into predict_fare(distances). DuckDB gathers a batch of distance values and supplies it as a PyArrow ChunkedArray, an Arrow column that can contain multiple chunks. The drawing shows just two values from the earlier invented example. Python receives the batch in one call, rather than a separate call for every scalar distance. This reduces Python call overhead and lets the model process tensors in batches. DuckDB chooses the UDF batch sizes. The earlier to_arrow_reader(batch_size=1024) controls the training-data reader, not these SQL prediction calls. Arrow carries the values; PyTorch computes the predictions.",
        "Follow the full callback: convert Arrow values to a tensor, scale the distances, run the fixed model, restore dollar units, and package the results with pa.array. pa is the pyarrow module imported by the lab script. Reveal the illustrative outputs 22 and 28 from the previous example. Each output must occupy the same batch position as its corresponding input, and the array lengths must match. Sorting the outputs inside the callback would misassign the fares. These positional requirements do not promise any overall SQL result order. Our callback uses torch.tensor, which copies data; Arrow alone does not make the whole path free of copying. No weights change during this prediction call.",
        "Read the filter month >= 11 and the SQL function call. These are 10,000 rides the model did not train on. Read the first two example predictions from the completed lab run: 15.17 versus 20.50 dollars, then 9.50 versus 10.00 dollars. SQL sends distances to PyTorch; the recorded fares are available for comparison but do not enter the prediction function. The network weights remain fixed.",
        "The lab script saves both models’ outputs in predictions. Read avg(abs(fare - prediction)) as the average size of the dollar error. Compare 3.53 dollars for the straight line with 3.26 dollars for the network on the same reserved rides. This is one measured run, with 30 epochs and seed 6042; more complexity need not improve every distance group. Point to the optional lab for the plots, then introduce BigQuery ML as Google’s managed SQL alternative."
      ]
    },
    "managed-model-sql": {
      "idea": "BigQuery ML is Google’s cloud service for training and using machine-learning models through SQL.",
      "question": "Why does CREATE MODEL use NO_SPLIT while ML.EVALUATE still receives separate test rides?",
      "answer": "WHERE split = train already supplies only training rows. NO_SPLIT uses all those supplied rows for fitting. ML.EVALUATE receives the held-out test rows separately, while ML.PREDICT needs only a new distance.",
      "builds": [
        "Define the name before reading the code: BigQuery is Google’s cloud database for analytics, and ML means machine learning. BigQuery ML lets us train and use supported models through SQL while Google manages the computing infrastructure. This optional GoogleSQL example has demo.ml_rides already loaded in the project identified by YOUR_PROJECT. Read CREATE MODEL, input_label_cols = fare, and the training-only WHERE filter. NO_SPLIT uses the supplied training rows. The other options specify unregularized least squares. BigQuery saves a managed model object.",
        "Read ML.EVALUATE with the saved model and a SELECT for split = test. Both distance and actual fare are present because evaluation compares predictions with known outcomes. mean_absolute_error has the same meaning as the DuckDB calculation. BigQuery also returns mean_squared_error; its square root corresponds to RMSE.",
        "Read ML.PREDICT with the same saved model and SELECT 7 AS ride_id, 3.5 AS distance. The result includes predicted_fare. Point to the reading for setup, permissions, billing, and fully qualified project names; the local DuckDB demo requires no cloud account."
      ]
    }
  },
  "11": {
    "meaning-becomes-geometry": {
      "idea": "An embedding defines a geometry; an index searches that geometry.",
      "question": "Would an equality predicate on a sentence reliably find a paraphrase?",
      "answer": "Usually not. Embeddings may place related passages nearby, but proximity still needs a relevance check.",
      "builds": [
        "Ask which passages explain crash recovery.",
        "Turn the passages into vectors and explain who defines their coordinates.",
        "Retrieve nearby points and distinguish geometric proximity from useful evidence."
      ]
    },
    "embedding": {
      "idea": "Queries and stored vectors must use compatible embedding conventions.",
      "question": "Do equal vector dimensions make two different embedding models compatible?",
      "answer": "No. Model version, preprocessing, dimensions, and similarity convention must form a compatible representation.",
      "builds": [
        "Pass content into the embedding model.",
        "Inspect the toy coordinates without treating them as actual model output.",
        "Place query and stored chunks in the same compatible space."
      ]
    },
    "direction-and-normalization": {
      "idea": "Normalizing vectors separates direction-based similarity from vector length.",
      "question": "What does (3, 4) become after unit normalization?",
      "answer": "(0.6, 0.8). On unit vectors, cosine and dot product agree.",
      "builds": [
        "Compare the query direction with a differently directed vector.",
        "Rotate toward the query and predict the similarity change.",
        "Normalize both lengths and connect dot product, cosine, and squared distance rankings."
      ]
    },
    "the-exact-baseline": {
      "idea": "Exact search provides a baseline that evaluates every stored vector.",
      "question": "What can this baseline safely skip without another bound or index?",
      "answer": "None of the vectors; it scores all of them and retains the nearest results.",
      "builds": [
        "Place the query and predict the search work.",
        "Score the first twenty-four vectors.",
        "Score the next twenty-four while maintaining the best candidates.",
        "Finish all seventy-two and explain the exact top-k baseline."
      ]
    },
    "price-the-baseline": {
      "idea": "Exact-search work grows with corpus size, dimensions, and query volume.",
      "question": "Do operation counts alone establish latency or hardware limits?",
      "answer": "No. Memory traffic, batching, selection, concurrency, and the hardware also affect elapsed time.",
      "builds": [
        "Compute 4,000 × 64 = 256,000 coordinate multiplications.",
        "Increase corpus size and dimensionality.",
        "Add repeated queries and identify the latency, memory, and quality measurements needed."
      ]
    },
    "skipping-with-a-contract": {
      "idea": "Approximate search reduces candidate work at the risk of missing true neighbors.",
      "question": "Does an ANN index know all its misses while answering a query?",
      "answer": "No. Evaluation needs a separate exact baseline to identify missed neighbors.",
      "builds": [
        "Search one candidate region and point to an unevaluated nearby vector.",
        "Expand the candidate set and compare the returned neighbors.",
        "Broaden the search again and connect work to measured recall."
      ]
    },
    "build-an-ivf-index": {
      "idea": "IVF builds centroid lists before using them to narrow queries.",
      "question": "What belongs in a vector list besides its coordinates?",
      "answer": "An identifier or row reference that connects the vector to its source.",
      "builds": [
        "Choose the initial centroids.",
        "Assign vectors to their nearest centroids.",
        "Move centroids and repeat the assignment process.",
        "Create the lists used at query time, allowing for unequal list sizes."
      ]
    },
    "count-the-saved-work": {
      "idea": "IVF work includes both centroid comparisons and the vectors in probed lists.",
      "question": "What is the balanced-list estimate for n = 4,000, C = 20, and P = 4?",
      "answer": "20 + 4 × (4,000 / 20) = 820 distance evaluations, versus 4,000 exact.",
      "builds": [
        "Begin with the whole-corpus exact count.",
        "Count the twenty centroid comparisons.",
        "Estimate eight hundred candidates in four balanced lists.",
        "Add both terms and distinguish this estimate from measured uneven-list work."
      ]
    },
    "navigate-a-graph": {
      "idea": "HNSW combines long-range navigation with local refinement and a search-breadth budget.",
      "question": "Why can long links help before the local search?",
      "answer": "They cross larger regions quickly before nearby candidates are explored in more detail.",
      "builds": [
        "Start at the entry node.",
        "Follow an upper-layer hop.",
        "Use a long-range connection to cross the space.",
        "Descend to a denser layer.",
        "Refine the search with a local hop.",
        "Expand the candidate set and explain ef_search as a breadth choice."
      ]
    },
    "measure-a-miss": {
      "idea": "Recall@k measures overlap with the exact nearest-neighbor results.",
      "question": "What is recall@10 when seven exact neighbors are returned?",
      "answer": "0.70; the missing true IDs in this example are 4, 7, and 10.",
      "builds": [
        "Compare the returned lists before coloring any overlap.",
        "Count the seven shared IDs and name the three misses.",
        "Compute 7 / 10 and distinguish geometric recall from passage relevance."
      ]
    },
    "choose-an-operating-point": {
      "idea": "A measured operating point should satisfy both the quality target and the work budget.",
      "question": "Which provided probe setting clears 0.90 mean recall within 1,000 comparisons?",
      "answer": "Probe 4, with mean recall 0.9175 and a floored mean count of 924 comparisons.",
      "builds": [
        "Read the measured probe settings and comparison counts.",
        "Apply the 0.90 quality requirement.",
        "Apply the work budget and select the least-work qualifying setting."
      ]
    },
    "memory-and-update-budgets": {
      "idea": "Index comparisons must include storage, construction, and update costs.",
      "question": "Where does memory go besides the index's headline structure?",
      "answer": "Into vectors, links or lists, metadata, and runtime overhead.",
      "builds": [
        "Identify IVF centroids, list entries, and vector payloads.",
        "Identify HNSW's extra neighbor links and construction work.",
        "Compress coordinates and discuss the additional accuracy tradeoff."
      ]
    },
    "where-the-index-lives": {
      "idea": "The deployment boundary determines who provides persistence and keeps source data synchronized.",
      "question": "What changes when an index moves from a database into a library or service?",
      "answer": "Responsibility for storage, filtering, transactions, and synchronization moves between components and operators.",
      "builds": [
        "Place the index beside rows inside the database.",
        "Move it into an embedded library and identify the application's responsibilities.",
        "Move it behind a service and discuss synchronization and operational ownership."
      ]
    },
    "diagnose-the-index": {
      "idea": "Index recall and evidence relevance need different diagnostic experiments.",
      "question": "What if exact and ANN results agree but neither answers the question?",
      "answer": "Inspect representation, chunking, metadata, or ranking; more ANN probes cannot fix an unsuitable space.",
      "builds": [
        "Compare low ANN recall with the exact baseline.",
        "Increase search breadth to test the index's misses.",
        "Inspect irrelevant exact matches and move the diagnosis to representation and relevance."
      ]
    },
    "rebuild-the-retrieval-contract": {
      "idea": "A defensible retrieval configuration starts with exact results and measures what approximation loses.",
      "question": "Is high geometric recall enough to prove an answer will be useful?",
      "answer": "No. It measures agreement with exact neighbors, while evidence relevance and answer quality need separate evaluation.",
      "builds": [
        "Establish exact neighbors as the reference.",
        "Organize candidates to skip some comparison work.",
        "Measure the missed neighbors across questions.",
        "Defend a work-and-quality budget using the observed results."
      ]
    }
  },
  "12": {
    "evidence-reaches-the-answer": {
      "idea": "Retrieval supplies current source evidence to a model at question time.",
      "question": "How could a model answer from a document changed this morning?",
      "answer": "Retrieve the current passage and include it as evidence in the request.",
      "builds": [
        "Start with the changed source in the corpus.",
        "Retrieve the relevant subset with its source identifier.",
        "Generate an answer and check whether the evidence supports its claims."
      ]
    },
    "retrieval-augmented-generation": {
      "idea": "RAG separates document ingestion from retrieval and generation for each question.",
      "question": "Which work reruns when one document changes?",
      "answer": "Update its affected chunks, embeddings, and index entries; each question separately retrieves and assembles evidence.",
      "builds": [
        "Chunk documents during ingestion.",
        "Embed the chunks in the chosen representation.",
        "Store searchable vectors with source identities.",
        "At question time, retrieve the relevant evidence.",
        "Assemble context and generate; the lab mocks generation for offline checks."
      ]
    },
    "three-places-for-knowledge": {
      "idea": "Weights, full context, and retrieval provide different ways to supply information.",
      "question": "Which approach can preserve an explicit, updateable source trail?",
      "answer": "Retrieval, provided source identities and versions survive through context assembly and citation.",
      "builds": [
        "Discuss what learned weights encode and the limits of fresh fact lookup.",
        "Place the corpus in context and consider its size and evidence-use costs.",
        "Retrieve a subset with source IDs and evaluate its support for the answer."
      ]
    },
    "design-the-retrieval-record": {
      "idea": "A useful chunk preserves enough coherent context to support the intended question.",
      "question": "Why not always use the smallest possible fragment?",
      "answer": "It can split a claim from the context needed to interpret references or pronouns.",
      "builds": [
        "Identify the document's topics.",
        "Choose boundaries around the topic needed for the question.",
        "Split too finely and inspect the lost context.",
        "Add overlap and discuss its extra index and prompt cost."
      ]
    },
    "a-synonym-failure": {
      "idea": "Exact retrieval can still fail when its representation misses a paraphrase.",
      "question": "Is the buffer-pool paraphrase failure caused by ANN approximation?",
      "answer": "No. The browser searches exactly; its hashed-word representation does not bridge the vocabulary change.",
      "builds": [
        "Read the first buffer-pool question and inspect the retrieved source.",
        "Read the paraphrase and compare the result.",
        "Confirm the shared information need, then test representation changes."
      ]
    },
    "build-an-evaluation-set": {
      "idea": "Retrieval evaluation needs independently labeled evidence and questions held out from tuning.",
      "question": "Should the current system's answer decide which sources are relevant?",
      "answer": "No. Relevance needs an explicit evidence judgment independent of the system being evaluated.",
      "builds": [
        "Have pairs write a question requiring a particular passage.",
        "Ask another person to label its supporting sources.",
        "Hold out partner questions and include paraphrases, negatives, and unanswerable cases."
      ]
    },
    "presence-in-the-top-results": {
      "idea": "Hit@k asks whether any relevant source appears among the first k results.",
      "question": "Does moving a relevant result from rank three to rank one change hit@3?",
      "answer": "No. Both are hits; two of the three pictured questions hit, giving 2/3.",
      "builds": [
        "Read each ranked list.",
        "Mark independently labeled relevant items.",
        "Score whether each question hits within the first three results.",
        "Average the two hits and one miss to obtain about 0.67."
      ]
    },
    "rank-changes-the-score": {
      "idea": "Reciprocal rank rewards placing the first relevant result earlier.",
      "question": "What is the mean of reciprocal ranks 1, 1/3, and 0?",
      "answer": "4/9, approximately 0.444, for these truncated result lists.",
      "builds": [
        "Keep the same three ranked lists as the hit-rate example.",
        "Find the first relevant result in each list.",
        "Assign reciprocal ranks 1, 1/3, and 0.",
        "Average them and separate ranking quality from answer faithfulness."
      ]
    },
    "measure-chunking-instead-of-guessing": {
      "idea": "Chunking choices should be compared with the same labeled questions and retrieval setup.",
      "question": "Which supplied chunk sizes tie, and why is that result limited?",
      "answer": "60 and 90 words tie on this small corpus of already short sources; it does not establish a rule for long documents.",
      "builds": [
        "Read the 10-word result: 67 chunks, hit@3 of 0.75, and MRR@3 about 0.667.",
        "Read the 60-word result: 25 chunks, hit@3 about 0.917, and MRR@3 about 0.778.",
        "Compare 90 words: 24 chunks with the same scores, and discuss the corpus's short sources."
      ]
    },
    "context-has-a-budget": {
      "idea": "Context assembly must balance evidence coverage against cost, redundancy, and noise.",
      "question": "Does sorting the same retrieval scores again create a reranker?",
      "answer": "No. Reranking needs another relevance signal over the candidate set.",
      "builds": [
        "Inspect all retrieved candidates and identify repeated or irrelevant content.",
        "Use a new relevance signal to choose a smaller evidence set.",
        "Assemble the evidence with source IDs and deliberate ordering."
      ]
    },
    "two-retrieval-paths": {
      "idea": "Semantic retrieval and exact-token retrieval can contribute complementary candidates.",
      "question": "Why not simply add raw scores from unrelated retrievers?",
      "answer": "Their scales may differ; fusion needs a justified method and evaluation.",
      "builds": [
        "Use semantic retrieval to connect paraphrases.",
        "Use exact-token retrieval for a distinctive error code.",
        "Merge candidates with a justified fusion method.",
        "Rerank the combined set using question-passage relevance."
      ]
    },
    "filters-change-the-candidate-set": {
      "idea": "Authorization must constrain which chunks can become evidence.",
      "question": "Can access control rely on asking the model to ignore forbidden passages?",
      "answer": "No. The system must enforce authorization before unauthorized content becomes evidence.",
      "builds": [
        "Identify all stored chunks and their access metadata.",
        "Restrict candidates to the authorized subset.",
        "Retrieve top-k within the supported filtered plan and check its recall behavior."
      ]
    },
    "a-changed-source-invalidates-copies": {
      "idea": "Changing a source or embedding configuration invalidates stored derivatives.",
      "question": "What must change when the embedding model changes?",
      "answer": "Every stored vector must be regenerated compatibly; record model revision and preprocessing as well as its name.",
      "builds": [
        "Identify the source and vector versions currently in use.",
        "Change a document and locate its stale chunks.",
        "Build compatible replacement embeddings and index entries.",
        "Switch versions in a controlled way and retain citation and evaluation provenance."
      ]
    },
    "failure-diagnosis-workshop": {
      "idea": "A useful diagnosis identifies the earliest failing stage and an observable artifact.",
      "question": "What should we inspect when the answer is unsupported despite correct retrieved evidence?",
      "answer": "Context assembly and generation, including whether cited passages support the claims.",
      "builds": [
        "For missing evidence, inspect labels, chunks, representation, recall, and filters.",
        "For wrong ranking, inspect scores and a possible reranking experiment.",
        "For an unsupported claim, inspect assembled context and citation support."
      ]
    },
    "a-measurable-rag-system": {
      "idea": "A measurable RAG system keeps source identity and tests each stage separately.",
      "question": "Does a fluent answer alone reveal whether retrieval worked?",
      "answer": "No. Inspect retrieved sources, assembled context, and supported claims against labeled questions.",
      "builds": [
        "Record source identities with each chunk.",
        "Retrieve evidence for one question.",
        "Evaluate retrieval and answer quality on held-out questions.",
        "Trace the answer's citation back to its source and choose one measured improvement."
      ]
    }
  },
  "13": {
    "one-job-many-machines": {
      "idea": "Distributing a scan adds parallel capacity along with coordination and partial failures.",
      "question": "Does dividing an ideal scan time by the worker count guarantee that speedup?",
      "answer": "No. Network movement, coordination, imbalance, and failures add work beyond the capacity model.",
      "builds": [
        "Calculate the ideal single-reader time for ten terabytes.",
        "Divide the data among readers and state the hypothetical throughput assumptions.",
        "Lose a worker and identify the extra coordination and recovery requirements."
      ]
    },
    "partitioning": {
      "idea": "Partitioning assigns responsibility through a routing rule.",
      "question": "How does partitioning differ from replication?",
      "answer": "Partitions divide responsibility; replicas copy responsibility for resilience or service.",
      "builds": [
        "Identify the keys that need owners.",
        "Assign keys to four partitions using a deterministic rule.",
        "Route kim to its owner and discuss grouping equal keys correctly."
      ]
    },
    "hash-routing": {
      "idea": "Hash routing makes point ownership direct while scattering ordered ranges.",
      "question": "How can a query find dee through fay without an ordering property?",
      "answer": "It must consult all hash partitions, even though only some contain matching keys.",
      "builds": [
        "Read the names before assigning owners.",
        "Compute the toy character-sum hash modulo four.",
        "Route kim's point lookup to one owner.",
        "Query the range and explain why hashing provides no neighboring-key locality."
      ]
    },
    "range-routing": {
      "idea": "Range partitioning keeps neighboring keys together but can create uneven load.",
      "question": "Why can the d-through-f query contact fewer owners here?",
      "answer": "The relevant neighboring keys share a known ordered range.",
      "builds": [
        "Keep the same names as the hash-routing example.",
        "Assign them to sorted key ranges.",
        "Route a point lookup to its range owner.",
        "Read the d-through-f range and discuss split points and write hotspots."
      ]
    },
    "skew-creates-idle-time": {
      "idea": "One heavily used key can dominate a stage even when many workers are available.",
      "question": "Will adding workers fix a hot key that remains indivisible on one owner?",
      "answer": "No. Its owner's work still limits completion of the stage.",
      "builds": [
        "Begin with evenly distributed work.",
        "Assign forty percent to the hot key and compare the 3,800-versus-600 row loads.",
        "Increase the skew and identify waiting at the completion barrier."
      ]
    },
    "salt-and-combine": {
      "idea": "Salting can divide a hot aggregation when partial results combine correctly.",
      "question": "Can partial averages always be averaged directly?",
      "answer": "No. Preserve sum and count, then combine them; unequal bucket sizes make unweighted averages wrong.",
      "builds": [
        "Identify the overloaded key.",
        "Split it into salted subkeys.",
        "Compute the four partial counts of twenty-five.",
        "Combine them under the original key to obtain one hundred."
      ]
    },
    "map-is-local-computation": {
      "idea": "A mapper can emit zero or more key-value pairs from each input record.",
      "question": "Why does the mapper emit the word the twice?",
      "answer": "It emits one pair per occurrence; repeated words remain separate occurrences at this stage.",
      "builds": [
        "Read the four-word input document.",
        "Split it into word occurrences.",
        "Emit four pairs and identify each key's eventual destination."
      ]
    },
    "shuffle-manufactures-locality": {
      "idea": "Shuffle brings equal keys together regardless of which input produced them.",
      "question": "Where must every log pair arrive for this aggregation?",
      "answer": "At the same key owner so the complete group can be combined.",
      "builds": [
        "Inspect the scattered mapper outputs.",
        "Route pairs to their key owners.",
        "Group equal keys and name the serialization, file, and network costs behind the arrows."
      ]
    },
    "reduce-network-bytes-early": {
      "idea": "A valid local combine reduces the data sent through shuffle.",
      "question": "Can four local (log, 1) pairs travel as one (log, 4) pair?",
      "answer": "Yes for sum. The combine must preserve correct aggregation and does not replace the global reduce.",
      "builds": [
        "Count the raw pairs awaiting movement.",
        "Combine equal local keys with a sum.",
        "Send the smaller output and contrast sum with subtraction's incompatible behavior."
      ]
    },
    "a-lazy-spark-plan": {
      "idea": "Spark transformations describe dependencies; an action triggers their execution.",
      "question": "When does this lazy word-count chain need to process the data?",
      "answer": "When an action such as collect requests the result.",
      "builds": [
        "Identify the input without executing it.",
        "Describe flatMap turning lines into words.",
        "Describe map turning words into (word, 1) pairs.",
        "Add the grouping dependency for reduceByKey.",
        "Trigger the action and limit collect to results that fit at the driver."
      ]
    },
    "stages-follow-dependencies": {
      "idea": "Shuffle dependencies create stage boundaries in this simple Spark job.",
      "question": "Where does the stage boundary fall in this word-count chain?",
      "answer": "At the shuffle between map-side work and reduce-side work.",
      "builds": [
        "Pipeline the narrow, partition-local operations.",
        "Locate the shuffle dependency.",
        "Place the boundary before revealing it.",
        "Inspect the two stages and distinguish stages from a count of API calls."
      ]
    },
    "lineage-rebuilds-lost-partitions": {
      "idea": "Lineage records how to rebuild lost outputs from available dependencies.",
      "question": "Is lineage a durable transaction log for external side effects?",
      "answer": "No. It is a recomputation recipe; replayable transformations and accessible dependencies are required.",
      "builds": [
        "Identify the recorded transformation recipe.",
        "Lose one worker's output partition.",
        "Find the necessary ancestors that remain available.",
        "Recompute replacement output and discuss the limits of replay."
      ]
    },
    "launch-before-waiting": {
      "idea": "Launching independent tasks before waiting permits concurrency.",
      "question": "Which schedule permits overlap: immediate get inside the loop or get after launching all tasks?",
      "answer": "Launching first and then waiting allows overlap, subject to resources and overhead.",
      "builds": [
        "Wait after each remote call and show the serial dependency.",
        "Launch all independent calls before waiting for their results.",
        "Identify the worker state needed for each KNN search.",
        "Reuse explicit actor state across calls without reloading it each time."
      ]
    },
    "choose-the-execution-shape": {
      "idea": "The execution framework should follow the workload and its measured bottleneck.",
      "question": "What should justify paying distribution's movement and coordination costs?",
      "answer": "Evidence that the workload's size, latency, or concurrency requirements need it.",
      "builds": [
        "Consider a large joined aggregation as a relational dataflow.",
        "Consider independent Python calls as separate tasks.",
        "Consider a workload comfortably served by one local engine and justify the starting choice."
      ]
    },
    "place-move-recover": {
      "idea": "A distributed job must place data, group it, execute dependencies, and recover lost work.",
      "question": "Should changing the partition count change a correct word-count answer?",
      "answer": "No. Ownership and work distribution change, but complete grouping must preserve the totals.",
      "builds": [
        "Explain ownership and locate skew.",
        "Explain the movement needed to group equal keys.",
        "Explain the execution plan and when work starts.",
        "Explain retry or recomputation, then connect the mechanisms to the lab."
      ]
    }
  },
  "14": {
    "organize-writes-differently": {
      "idea": "LSM storage changes how writes are organized and shifts work to reads and background merging.",
      "question": "Is an LSM organization a claim that a database has no transactions?",
      "answer": "No. Storage organization and transaction guarantees are separate choices.",
      "builds": [
        "Recall scattered B+ tree page updates.",
        "Introduce sequential logging on the write path.",
        "Show sorted runs and ask where future read and merge costs arise."
      ]
    },
    "a-multidimensional-map": {
      "idea": "The original Bigtable model addresses cells by row, column, and version.",
      "question": "Why reverse a domain name in an ordered row key?",
      "answer": "Related domains then share a prefix, helping prefix-local scans.",
      "builds": [
        "Identify the row coordinate and its ordered key.",
        "Separate declared column families from qualifiers.",
        "Add the version timestamp and qualify its difference from a cross-row transaction snapshot."
      ]
    },
    "sparse-cells-and-versions": {
      "idea": "Sparse storage can omit absent cells and retain multiple versions of present cells.",
      "question": "Does a missing qualifier require a fixed-width reservation in every row?",
      "answer": "No. Sparse cells can be omitted, although metadata and stored versions still consume space.",
      "builds": [
        "Identify the absent cells in the sparse table.",
        "Add a qualifier only to the row that needs it.",
        "Add another cell version and discuss retention and the requested timestamp."
      ]
    },
    "tablets-separate-placement-from-storage": {
      "idea": "Tablet placement and durable storage ownership are separate parts of the architecture.",
      "question": "Why need a lost tablet server not mean lost durable data?",
      "answer": "In the original architecture, replicated GFS holds the logs and SSTables; reassignment and replay can rebuild service.",
      "builds": [
        "Divide the ordered keys into contiguous tablet ranges.",
        "Assign those ranges to tablet servers.",
        "Locate durable files separately from server caches and active state.",
        "Reassign a tablet and identify the recovery work that remains."
      ]
    },
    "splitting-cannot-fix-a-moving-hotspot": {
      "idea": "Splitting a range does not remove a hotspot created by ever-increasing keys.",
      "question": "Where does the next timestamp-prefixed burst go after the hot tablet splits?",
      "answer": "To the newest tail range again; the split changes size without changing incoming key direction.",
      "builds": [
        "Begin with distributed writes.",
        "Send increasing timestamps to the tail.",
        "Split the hot range.",
        "Send another burst and discuss the locality tradeoff of a hash prefix or new key order."
      ]
    },
    "the-log-protects-memory": {
      "idea": "A durable log can rebuild writes lost from the memtable after a crash.",
      "question": "What fails if the engine acknowledges only a RAM update before crashing?",
      "answer": "The acknowledged write can be lost unless its recovery information is durable elsewhere.",
      "builds": [
        "Receive a write under the engine's durability contract.",
        "Append its recovery record.",
        "Make the required log progress durable before acknowledgement.",
        "Update memory and explain how replay can reconstruct it."
      ]
    },
    "the-memtable-stays-ordered": {
      "idea": "An ordered memtable prepares incoming writes for a sequential sorted flush.",
      "question": "Why keep keys sorted in memory even if they arrive out of order?",
      "answer": "The later flush can stream them to disk in key order.",
      "builds": [
        "Show the arrival order of the keys.",
        "Insert each into the ordered memory structure.",
        "Update k2 and distinguish the simple latest-value view from snapshot version retention."
      ]
    },
    "freeze-a-sorted-file": {
      "idea": "A frozen memtable becomes an immutable sorted file while new writes use active memory.",
      "question": "Where does a later update to k2 go after this file is written?",
      "answer": "Into the active memtable, and eventually a newer file.",
      "builds": [
        "Fill the active memory structure.",
        "Freeze it while keeping its contents readable.",
        "Flush its sorted entries sequentially to a file.",
        "Accept later writes in a new active memtable."
      ]
    },
    "merge-sorted-runs": {
      "idea": "Compaction merges sorted runs while respecting version-retention rules.",
      "question": "Is merging free just because its input reads are sequential?",
      "answer": "No. It rewrites output and consumes bandwidth, and retained versions affect what may be discarded.",
      "builds": [
        "Place the two immutable sorted files side by side.",
        "Choose the next key from their merge cursors.",
        "Resolve duplicate k2 versions under the visibility and retention rules.",
        "Write the merged output and account for the background work."
      ]
    },
    "deletion-must-hide-older-values": {
      "idea": "A deletion marker prevents older stored values from reappearing.",
      "question": "Why not simply remove the newest k2 entry?",
      "answer": "A read could then discover the older k2 value; a tombstone must hide it until safe reclamation.",
      "builds": [
        "Locate the old value in an earlier file.",
        "Write a tombstone as the newer record.",
        "Stop the lookup at the tombstone.",
        "Reclaim it only when older copies and relevant snapshots are safely covered."
      ]
    },
    "a-one-sided-membership-test": {
      "idea": "A Bloom filter can prove absence, while a possible match still requires checking data.",
      "question": "What does a zero among the query's required bits prove?",
      "answer": "Definite absence under correct insertion and supported operations; all set bits indicate only possible presence.",
      "builds": [
        "Begin with empty bits.",
        "Insert k1 through k6 using the three deterministic hashes.",
        "Show the zero bit that proves k7 absent.",
        "Show a possible match whose bits are all set.",
        "Check uninserted k17 and explain the false positive's extra file lookup."
      ]
    },
    "skip-files-then-find-a-block": {
      "idea": "Filters, sparse indexes, and caches eliminate work at different levels.",
      "question": "Does a Bloom-filter match prove the key exists?",
      "answer": "No. The engine still locates the candidate block and checks its entries and visible versions.",
      "builds": [
        "Use the filter to skip a definitely absent file.",
        "Use the sparse index to locate a candidate block.",
        "Read and inspect that block.",
        "Reuse a cached block to avoid another storage read."
      ]
    },
    "the-read-write-space-budget": {
      "idea": "A storage choice needs a read, write, space, and durability budget for its workload.",
      "question": "Why is fast log append alone insufficient for sustained LSM write performance?",
      "answer": "Background compaction must keep pace, or accumulated work can constrain the system.",
      "builds": [
        "Identify B+ tree page organization and batching opportunities.",
        "Identify sorted LSM memory and files.",
        "Account for compaction's read, write, and space pressure.",
        "Choose a starting design from workload requirements and testable costs."
      ]
    },
    "a-network-partition-forces-a-choice": {
      "idea": "A partition prevents an isolated replica from knowing an unseen completed write.",
      "question": "What can replica 2 infer about v2 from silence alone?",
      "answer": "It cannot know that update. Preserving linearizability can require refusing service during the partition.",
      "builds": [
        "Begin with agreeing replicas.",
        "Write v2 at replica 1 and interrupt communication.",
        "Consider waiting or refusing the isolated request.",
        "Consider serving v1 and state the consistency consequence.",
        "Restore communication and discuss reconciliation under the system's contract."
      ]
    },
    "trace-an-acknowledged-write": {
      "idea": "An acknowledged LSM write moves through logging, memory, sorted files, and later lookup.",
      "question": "What protects the acknowledged write if its memory state is lost before flush?",
      "answer": "The durable log, under the configured acknowledgement contract.",
      "builds": [
        "Identify the durable recovery record.",
        "Place the write in ordered memory.",
        "Flush it into a sorted file and account for later compaction.",
        "Read through files using filters, indexes, caches, and visibility checks."
      ]
    }
  },
  "15": {
    "the-path-is-the-answer": {
      "idea": "A graph query can ask for the path connecting records.",
      "question": "How does ada reach fay in this example?",
      "answer": "Through cyd and eli, for a path of three directed edges.",
      "builds": [
        "Identify the familiar student records as nodes.",
        "Add directed follows relationships and ask a one-hop question.",
        "Reveal ada to cyd to eli to fay and distinguish a path from a matching row."
      ]
    },
    "property-graph": {
      "idea": "A property graph attaches named values to nodes and typed relationships.",
      "question": "Where would the fact since 2026 belong?",
      "answer": "On the Follows relationship, because it describes the connection rather than either endpoint alone.",
      "builds": [
        "Identify the nodes.",
        "Add direction and a type to the edges.",
        "Place the illustrative properties on the appropriate node or relationship."
      ]
    },
    "store-adjacency-at-write-time": {
      "idea": "Maintained adjacency makes later neighbor expansion direct.",
      "question": "How would a relational edge table find ada's neighbors?",
      "answer": "Match src using an index or scan; stored adjacency maintains the neighbor relationship for later reads.",
      "builds": [
        "Find outgoing edges in the relational edge table.",
        "Resolve endpoints while creating a relationship.",
        "Store and read the neighbor list, accounting for its write-time maintenance."
      ]
    },
    "one-hop": {
      "idea": "A one-hop query follows edges in the direction specified by the query.",
      "question": "Who does ada follow, and who follows ada?",
      "answer": "Ada follows ben and cyd; ben and fay follow ada.",
      "builds": [
        "Start at ada and predict the outgoing neighbors.",
        "Expand the outgoing edges.",
        "Return ben and cyd, then contrast the reversed-direction question."
      ]
    },
    "two-hops-with-exclusions": {
      "idea": "Two-hop paths can produce repeated endpoints that need explicit exclusions and deduplication.",
      "question": "What distinct endpoints remain after excluding ada and existing neighbors?",
      "answer": "Dee and eli. Dee is reached by two paths but is one person.",
      "builds": [
        "Enumerate dee, ada, dee, and eli as raw two-hop endpoints.",
        "Remove the starting node ada.",
        "Exclude existing neighbors and return distinct dee and eli."
      ]
    },
    "breadth-first-reachability": {
      "idea": "Breadth-first search discovers unvisited nodes in layers of increasing hop distance.",
      "question": "Which new nodes enter successive frontiers from ada?",
      "answer": "Ben and cyd, then dee and eli, then fay.",
      "builds": [
        "Begin with ada in the frontier and visited set.",
        "Discover ben and cyd at distance one.",
        "Discover dee and eli while skipping already visited nodes.",
        "Discover fay at distance three and state the equal-edge-cost assumption."
      ]
    },
    "the-query-draws-a-shape": {
      "idea": "Graph patterns and recursive SQL can both express bounded traversal.",
      "question": "How does the query remove ada and repeated endpoints?",
      "answer": "Exclude b.name equal to ada and use DISTINCT for endpoint deduplication.",
      "builds": [
        "Read the single directed relationship pattern.",
        "Extend it to one through three outgoing Follows edges.",
        "Compare a recursive SQL base case and bounded iterative join."
      ]
    },
    "find-the-shortest-path": {
      "idea": "With equal-cost edges, BFS's first target discovery gives the minimum hop count.",
      "question": "What is the shortest route from ada to fay here?",
      "answer": "Ada to cyd to eli to fay, using three edges.",
      "builds": [
        "Expand the first frontier.",
        "Expand the second frontier and retain predecessor links.",
        "Discover fay and establish the minimum hop count.",
        "Follow predecessors backward to reconstruct the path."
      ]
    },
    "a-supernode-is-skew-again": {
      "idea": "A high-degree node can dominate traversal work even with direct adjacency access.",
      "question": "Does cheap neighbor lookup make millions of neighbors cheap to expand?",
      "answer": "No. The number of neighbors still dominates; limiting expansion changes semantics and recall.",
      "builds": [
        "Expand an ordinary-degree node.",
        "Increase degree and compare the volume of work.",
        "Apply the illustrative expansion budget and discuss what it omits."
      ]
    },
    "choose-a-graph-workload": {
      "idea": "Relationship depth and computation shape help determine a suitable graph tool.",
      "question": "Does a graph engine automatically outperform relational execution on every relationship query?",
      "answer": "No. Compare equivalent semantics and include the cost of maintaining the relationships.",
      "builds": [
        "Consider a shallow department join using relational operations.",
        "Consider unknown-depth dependency paths in a graph query engine.",
        "Consider whole-graph iterative analytics in a graph-compute framework."
      ]
    },
    "connections-augment-similarity": {
      "idea": "Entity relationships can add connected evidence to similarity-based retrieval.",
      "question": "Why might a WAL-and-buffer-pool question need more than one similar passage?",
      "answer": "Its answer may depend on a relationship explained across sources, which graph expansion can help connect.",
      "builds": [
        "Retrieve nearby passages as starting evidence.",
        "Identify named entities in those passages.",
        "Follow a relevant one-hop relationship.",
        "Combine the connected and vector evidence, then check entity and edge correctness."
      ]
    },
    "does-graph-expansion-help": {
      "idea": "Graph expansion should be measured against a vector-only retrieval baseline.",
      "question": "When could expansion make retrieval worse?",
      "answer": "Ambiguous entities or high-degree hubs can introduce irrelevant evidence and extra latency.",
      "builds": [
        "Record the vector-only baseline.",
        "Add relationship neighbors and predict a helped and a harmed question.",
        "Compare support, noise, context size, and latency on the same held-out questions."
      ]
    },
    "five-mechanisms-recur": {
      "idea": "The same mechanisms recur across systems while their contracts differ.",
      "question": "Is Spark lineage the same mechanism as a write-ahead log?",
      "answer": "No. Lineage records a recomputation recipe; WAL records information for transaction durability and recovery.",
      "builds": [
        "Identify caches in buffer pools and SSTable block reads.",
        "Identify indexes in B+ trees, IVF, and adjacency.",
        "Identify durable logs and contrast them with lineage.",
        "Identify plans in iterators, Spark, and graph queries.",
        "Identify partitions in shuffle, tablets, and vector lists."
      ]
    },
    "read-a-new-system": {
      "idea": "Concrete architecture questions make an unfamiliar database easier to evaluate.",
      "question": "What evidence should follow a product's architectural claims?",
      "answer": "A workload-specific benchmark with equivalent results and measurements of the relevant costs and failures.",
      "builds": [
        "Ask what the system reads and writes in a block.",
        "Ask how it skips data for the workload.",
        "Ask what survives an acknowledged write.",
        "Ask how it turns queries into execution.",
        "Ask how it partitions data and requests, then choose a benchmark."
      ]
    },
    "finish-with-measured-decisions": {
      "idea": "A useful project explanation connects a measured result to a design decision.",
      "question": "What should each team be able to explain from its experiments?",
      "answer": "One result that changed a design choice and one failure it can demonstrate.",
      "builds": [
        "State the question the project answers.",
        "Present the evidence behind a comparison.",
        "Explain the decision changed by that evidence.",
        "Demonstrate a result or failure and connect it to the system's mechanisms."
      ]
    }
  }
};
  for (const [id, scenes] of Object.entries(notes)) {
    const deck = window.COURSE_DECKS[id];
    if (!deck) continue;
    for (const scene of deck.scenes) {
      if (scene.teaching || !scenes[scene.id]) continue;
      scene.teaching = {...scenes[scene.id], reference: scene.notes};
    }
  }
})();
