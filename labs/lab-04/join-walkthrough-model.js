/* A replayable trace of Lab 4's SQL join, from pull calls to record bytes. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.JoinWalkthrough = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function copy(value) {
    if (Array.isArray(value)) return value.map(copy);
    if (value !== null && typeof value === 'object') {
      var result = {};
      Object.keys(value).forEach(function (key) { result[key] = copy(value[key]); });
      return result;
    }
    return value;
  }

  function freeze(value) {
    if (value !== null && typeof value === 'object') {
      Object.keys(value).forEach(function (key) { freeze(value[key]); });
      Object.freeze(value);
    }
    return value;
  }

  function student(sid, name, gpa, mid) {
    return { used: true, row: { sid: sid, name: name, gpa: gpa, mid: mid } };
  }
  function major(mid, dept) { return { used: true, row: { mid2: mid, dept: dept } }; }
  function empty() { return { used: false, row: null }; }

  // This is the physical layout produced by starter/sql_walkthrough.py.
  // A deleted slot retains its field bytes, but next_after checks only its flag.
  var tables = freeze({
    students: {
      name: 'students', slotSize: 28, blockSize: 128,
      fields: [
        { name: 'sid', offset: 4, size: 4, type: 'int' },
        { name: 'name', offset: 8, size: 12, type: 'varchar' },
        { name: 'gpa', offset: 20, size: 4, type: 'int' },
        { name: 'mid', offset: 24, size: 4, type: 'int' }
      ],
      blocks: [
        [student(1, 'ada', 39, 1), student(2, 'ben', 31, 2), student(3, 'cyd', 37, 1), student(4, 'dee', 28, 3)],
        [student(5, 'eli', 36, 2), student(6, 'fay', 34, 1),
          { used: false, deleted: true, row: { sid: 7, name: 'temp', gpa: 40, mid: 1 } }, empty()]
      ]
    },
    majors: {
      name: 'majors', slotSize: 20, blockSize: 128,
      fields: [
        { name: 'mid2', offset: 4, size: 4, type: 'int' },
        { name: 'dept', offset: 8, size: 12, type: 'varchar' }
      ],
      blocks: [[major(1, 'ds'), major(2, 'stat'), major(3, 'econ'), empty(), empty(), empty()]]
    }
  });

  function buildTrace() {
    var trace = [];
    var stack = [];
    var state = {
      left: { block: 0, slot: -1, pinned: true, row: null },
      right: { block: 0, slot: -1, pinned: true, row: null },
      pair: null,
      predicate: { join: null, gpa: null },
      counts: { pairs: 0, outputs: 0, rootCalls: 0, rewinds: 0 },
      output: [], done: false
    };
    var leftReady = false;

    function emit(event, actor, message, direction, extra) {
      trace.push(freeze(copy(Object.assign({}, state, {
        event: event, actor: actor, message: message,
        direction: direction || 'local', stack: stack,
        access: null, probe: null
      }, extra || {}))));
    }
    function enter(actor, label, message) {
      stack.push(label);
      emit('call', actor, message || label, 'down');
    }
    function leave() { stack.pop(); }
    function cursor(side) { return side === 'students' ? state.left : state.right; }
    function invalidatePair() {
      state.pair = null;
      state.predicate = { join: null, gpa: null };
    }

    function move(side, block) {
      var scan = cursor(side);
      if (scan.pinned) {
        scan.pinned = false;
        scan.row = null;
        emit('pin', side, 'RecordPage.close(): unpin ' + side + '.tbl block ' + scan.block + '.');
      }
      scan.block = block;
      scan.slot = -1;
      scan.row = null;
      scan.pinned = true;
      emit('pin', side, 'Pin ' + side + '.tbl block ' + block + '; current_slot = -1 (before slot 0).');
    }

    function beforeFirst(side) {
      enter(side, 'TableScan(' + side + ').before_first()');
      invalidatePair();
      if (side === 'majors') state.counts.rewinds += 1;
      move(side, 0);
      emit('rewind', side, side + ' is before its first slot. before_first() reopens block 0, even when it was already current.', 'up');
      leave();
    }

    function tableNext(side) {
      var scan = cursor(side);
      var table = tables[side];
      enter(side, 'TableScan(' + side + ').next()', 'Find the next USED ' + side + ' slot after current_slot = ' + scan.slot + '.');
      invalidatePair();
      while (true) {
        var slots = table.blocks[scan.block];
        var found = -1;
        stack.push('RecordPage.next_after(' + scan.slot + ')');
        for (var slot = scan.slot + 1; slot < slots.length; slot += 1) {
          var record = slots[slot];
          var description = record.used ? 'USED: return this slot.' :
            (record.deleted ? 'EMPTY: deleted row bytes remain, but skip the slot.' : 'EMPTY: skip the slot.');
          emit('probe', side, side + '.tbl block ' + scan.block + ', slot ' + slot + ': read flag at byte ' +
            slot + ' × ' + table.slotSize + ' = ' + (slot * table.slotSize) + '. ' + description, 'local', {
            probe: { side: side, block: scan.block, slot: slot, used: record.used }
          });
          if (record.used) { found = slot; break; }
        }
        leave();
        scan.slot = found;
        scan.row = found < 0 ? null : slots[found].row;
        if (found >= 0) {
          emit('table-row', side, side + '.next() → True: cursor is at block ' + scan.block + ', slot ' + found +
            '. Fields remain in the pinned page; get_val() will read them on demand.', 'up');
          leave();
          return true;
        }
        if (scan.block === table.blocks.length - 1) {
          emit('table-end', side, 'No later USED slot or block: ' + side + '.next() → False. current_slot = -1; the final block stays pinned.', 'up');
          leave();
          return false;
        }
        emit('call', side, 'next_after() → -1. Another block exists, so _move_to_block(' + (scan.block + 1) + ') advances the scan.');
        move(side, scan.block + 1);
      }
    }

    function productNext() {
      enter('product', 'ProductScan.next()', 'ProductScan.next(): hold the left cursor and advance the right cursor.');
      invalidatePair();
      if (!leftReady) { leave(); return false; }
      if (!tableNext('majors')) {
        emit('call', 'product', 'The right side ended. Rewind majors, then advance students by one row.');
        beforeFirst('majors');
        leftReady = tableNext('students');
        if (!leftReady) {
          emit('exhausted', 'product', 'The left side ended too. ProductScan.next() → False; no current pair remains.', 'up');
          leave();
          return false;
        }
        if (!tableNext('majors')) { leftReady = false; leave(); return false; }
      }
      // This object visualizes the two held cursors; ProductScan does not copy
      // or materialize rows in the actual database implementation.
      state.pair = Object.assign({}, state.left.row, state.right.row);
      state.counts.pairs += 1;
      emit('pair', 'product', 'ProductScan.next() → True: candidate ' + state.counts.pairs + ' holds ' +
        state.pair.name + ' × ' + state.pair.dept + '. The pair is two current cursors, not a copied row.', 'up');
      leave();
      return true;
    }

    function read(field, projected) {
      if (projected) {
        enter('caller', 'plan.get_val("' + field + '")', 'The caller reads projected field "' + field + '" after next() returned True.');
        enter('project', 'ProjectScan.get_val("' + field + '")', 'Projection permits "' + field + '" because it is in [name, dept].');
        enter('select', 'SelectScan.get_val("' + field + '")', 'SelectScan forwards get_val("' + field + '") to its current input row.');
      }
      var side = tables.students.fields.some(function (item) { return item.name === field; }) ? 'students' : 'majors';
      var scan = cursor(side);
      var table = tables[side];
      var layout = table.fields.find(function (item) { return item.name === field; });
      if (!layout || !scan.row) throw new Error('No current field: ' + field);
      enter('product', 'ProductScan.get_val("' + field + '")', 'has_field("' + field + '") routes the read to ' + side + ' (the left side wins field-name ties).');
      enter(side, 'TableScan(' + side + ').get_val("' + field + '")', 'The catalog layout identifies "' + field + '" as ' + layout.type + ' at slot offset ' + layout.offset + '.');
      var byteOffset = scan.slot * table.slotSize + layout.offset;
      var value = scan.row[field];
      var primitive = layout.type === 'int' ? 'get_int' : 'get_string';
      stack.push('RecordPage.' + primitive + '(' + scan.slot + ', "' + field + '")');
      var detail = layout.type === 'int' ? 'Read 4 bytes.' :
        'Read the 4-byte length prefix, then ' + value.length + ' UTF-8 bytes from the 8-byte string capacity.';
      emit('read', side, side + '.tbl block ' + scan.block + ': ' + scan.slot + ' × ' + table.slotSize + ' + ' +
        layout.offset + ' = byte ' + byteOffset + '. ' + detail + ' Return ' + JSON.stringify(value) + '.', 'up', {
        access: { side: side, block: scan.block, slot: scan.slot, field: field, offset: layout.offset,
          byteOffset: byteOffset, size: layout.size, value: value }
      });
      leave(); leave(); leave();
      if (projected) { leave(); leave(); leave(); }
      return value;
    }

    emit('start', 'caller', 'The plan wraps two open TableScans. Each constructor pins block 0 with current_slot = -1. The caller first rewinds the plan.');
    enter('caller', 'plan.before_first()');
    enter('project', 'ProjectScan.before_first()', 'Projection forwards before_first() to selection.');
    enter('select', 'SelectScan.before_first()', 'Selection forwards before_first() to the product.');
    enter('product', 'ProductScan.before_first()', 'Rewind students, advance to its first row, then rewind majors before its first row.');
    beforeFirst('students');
    leftReady = tableNext('students');
    beforeFirst('majors');
    emit('rewind', 'product', '_left_ready = True. Students is on ada; majors is before its first row. The first next() will advance majors.', 'up');
    leave(); leave(); leave(); leave();

    while (true) {
      state.counts.rootCalls += 1;
      enter('caller', 'plan.next()', 'Caller pull ' + state.counts.rootCalls + ': request one result from the root.');
      enter('project', 'ProjectScan.next()', 'Projection forwards next(); it does not inspect field values.');
      enter('select', 'SelectScan.next()', 'Selection keeps pulling candidates until both predicate terms pass.');
      var accepted = false;
      while (productNext()) {
        stack.push('Predicate.is_satisfied(ProductScan)');
        var mid = read('mid', false);
        var mid2 = read('mid2', false);
        state.predicate.join = mid === mid2;
        emit('join-check', 'select', 'Join term: mid = mid2 → ' + mid + ' = ' + mid2 + ' is ' +
          (state.predicate.join ? 'True. Evaluate the GPA term next.' : 'False. AND short-circuits; do not read gpa.'), 'local');
        if (state.predicate.join) {
          var gpa = read('gpa', false);
          state.predicate.gpa = gpa > 35;
          emit('gpa-check', 'select', 'GPA term: ' + gpa + ' > 35 is ' + (state.predicate.gpa ? 'True.' : 'False.'), 'local');
        }
        leave();
        if (state.predicate.join && state.predicate.gpa) {
          accepted = true;
          emit('select-row', 'select', 'Both terms pass. SelectScan.next() → True, preserving both cursors for field reads.', 'up');
          break;
        }
        emit('reject', 'select', 'Reject this candidate. The same root next() call continues by pulling another ProductScan pair.');
      }
      if (!accepted) {
        emit('exhausted', 'select', 'The product has no more pairs. SelectScan.next() → False.', 'up');
        leave();
        emit('exhausted', 'project', 'ProjectScan.next() → False. The caller stops the while loop at this first False.', 'up');
        leave(); leave();
        break;
      }
      leave();
      emit('select-row', 'project', 'ProjectScan.next() → True. The current matching pair remains available to get_val().', 'up');
      leave(); leave();
      var name = read('name', true);
      var dept = read('dept', true);
      state.output.push([name, dept]);
      state.counts.outputs += 1;
      emit('output', 'caller', 'The caller appends (' + name + ', ' + dept + '). Project exposes only these two fields; the scans still hold the matching pair.', 'up');
    }

    enter('caller', 'plan.close()', 'The finally block closes the root after the loop ends.');
    enter('project', 'ProjectScan.close()', 'Projection forwards close() to selection.');
    enter('select', 'SelectScan.close()', 'Selection forwards close() to the product.');
    enter('product', 'ProductScan.close()', 'ProductScan closes BOTH input scans.');
    ['students', 'majors'].forEach(function (side) {
      enter(side, 'TableScan(' + side + ').close()');
      var scan = cursor(side);
      scan.pinned = false;
      scan.row = null;
      emit('close', side, 'Unpin ' + side + '.tbl block ' + scan.block + '; TableScan.rp = None. Closing releases a pin; it does not mean the buffer is evicted.', 'up');
      leave();
    });
    leave(); leave(); leave(); leave();
    state.done = true;
    emit('close', 'caller', 'Finished: 18 candidate pairs, 3 result rows, and 4 root next() calls. Both table-scan pins are released.', 'up');
    return freeze(trace);
  }

  return freeze({ tables: tables, buildTrace: buildTrace });
}));
