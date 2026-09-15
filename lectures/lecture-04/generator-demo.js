/* Two lazy generators: source rows → GPA filter → caller's next(matches). */
(function () {
  'use strict';

  const rows = Object.freeze([
    { name: 'ada', gpa: 39 }, { name: 'ben', gpa: 31 },
    { name: 'cyd', gpa: 37 }, { name: 'dee', gpa: 28 },
    { name: 'eli', gpa: 36 }, { name: 'fay', gpa: 34 },
  ].map(Object.freeze));

  function createDemo() {
    let matches, rowsRead, rowsReturned, done, latest, inspected, events, statuses;

    function* studentRows() {
      for (const row of rows) {
        rowsRead += 1;
        inspected.push(row.name);
        events.push(`student_rows() reads ${row.name} (gpa ${row.gpa}), yields that row, and pauses.`);
        yield row;
        events.push(`student_rows() resumes after yielding ${row.name}.`);
      }
      events.push('student_rows() reaches the end of its source.');
    }

    function* highGpa(source) {
      while (true) {
        events.push('high_gpa(rows) requests the next source row.');
        const input = source.next();
        if (input.done) {
          events.push('high_gpa(rows) has no more source rows and finishes.');
          return;
        }
        const row = input.value;
        if (row.gpa > 35) {
          statuses[rowsRead - 1] = 'returned';
          events.push(`high_gpa(rows) tests ${row.gpa} > 35: True. It yields ${row.name} and pauses.`);
          yield row;
          events.push(`high_gpa(rows) resumes after yielding ${row.name}.`);
        } else {
          statuses[rowsRead - 1] = 'rejected';
          events.push(`high_gpa(rows) tests ${row.gpa} > 35: False. It skips ${row.name} and continues looking.`);
        }
      }
    }

    function snapshot() {
      return {
        rowsRead, rowsReturned, remaining: rows.length - rowsRead, done,
        latest: latest ? { ...latest } : null,
        inspected: [...inspected], events: [...events], statuses: [...statuses],
      };
    }

    function reset() {
      rowsRead = 0;
      rowsReturned = 0;
      done = false;
      latest = null;
      inspected = [];
      events = [];
      statuses = rows.map(() => 'unread');
      // Calling a generator function creates an iterator without running its body.
      matches = highGpa(studentRows());
      return snapshot();
    }

    function next() {
      inspected = [];
      events = [];
      latest = null;
      if (done) {
        events.push('The generators are exhausted. Another next(matches) would raise StopIteration without reading a row.');
        return snapshot();
      }
      events.push('The caller requests one matching row with next(matches).');
      const result = matches.next();
      done = result.done;
      if (done) {
        events.push('The caller receives no row. In Python, next(matches) raises StopIteration.');
      } else {
        latest = result.value;
        rowsReturned += 1;
        events.push(`The caller receives ${latest.name}. Both generators are paused at yield until another request.`);
      }
      return snapshot();
    }

    reset();
    return { next, reset };
  }

  if (typeof module === 'object' && module.exports) module.exports = { createDemo, rows };
  if (typeof document === 'undefined') return;
  const root = document.getElementById('viz-generators');
  if (!root || root.dataset.generatorDemoInitialized) return;
  root.dataset.generatorDemoInitialized = 'true';
  const get = id => root.querySelector('#gen-' + id);
  const label = row => `${row.name} · gpa ${row.gpa}`;
  const demo = createDemo();

  function render(state) {
    get('read').textContent = state.rowsRead;
    get('returned').textContent = state.rowsReturned;
    get('remaining').textContent = state.remaining;
    const lastSource = state.rowsRead ? rows[state.rowsRead - 1] : null;
    get('source').textContent = lastSource
      ? label(lastSource) + (state.done ? ' · source exhausted' : ' · paused at yield row')
      : 'not started';
    get('filter').textContent = state.done
      ? 'no more source rows · generator finished'
      : state.latest ? `${state.latest.gpa} > 35 → True · paused at yield row` : 'waiting for a request';
    get('caller').textContent = state.done ? 'StopIteration' : state.latest ? label(state.latest) : 'no row requested';
    get('msg').textContent = state.done
      ? 'No more matches: Python would raise StopIteration. Reset to create fresh generators.'
      : state.latest
        ? `This request read ${state.inspected.length} source ${state.inspected.length === 1 ? 'row' : 'rows'} and returned ${state.latest.name}. Both generators pause until you call next(matches) again.`
        : 'Creating the generators reads no rows. Call next(matches) to request the first matching row.';
    get('rows').replaceChildren(...rows.map((row, index) => {
      const chip = document.createElement('span');
      chip.setAttribute('role', 'group');
      const inspectedNow = state.inspected.includes(row.name);
      chip.className = `gen-row is-${state.statuses[index]}${inspectedNow ? ' is-inspected' : ''}`;
      const rowLabel = document.createElement('span');
      rowLabel.textContent = label(row);
      const status = document.createElement('small');
      status.textContent = state.statuses[index];
      chip.replaceChildren(rowLabel, status);
      chip.setAttribute('aria-label', `${label(row)}: ${state.statuses[index]}${inspectedNow ? '; inspected during this request' : ''}`);
      return chip;
    }));
    get('events').replaceChildren(...state.events.map(message => {
      const item = document.createElement('li');
      item.textContent = message;
      return item;
    }));
  }

  // Keep native button keys inside the widget when the lecture is presenting.
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape' && event.target.closest('button')) event.stopPropagation();
  });
  get('next').addEventListener('click', () => render(demo.next()));
  get('reset').addEventListener('click', () => render(demo.reset()));
  render(demo.reset());
})();
