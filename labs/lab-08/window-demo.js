/* Inspect a three-row SQL frame. The output is complete from the start;
   stepping highlights a calculation, not the engine's execution order. */
(() => {
  const root = document.getElementById('viz-window');
  if (!root) return;
  const rows = [...root.querySelectorAll('[data-window-row]')];
  const results = [...root.querySelectorAll('[data-window-result]')];
  const choices = [...root.querySelectorAll('[data-window-select]')];
  const fares = rows.map(row => Number(row.dataset.fare));
  const previous = root.querySelector('#window-prev');
  const next = root.querySelector('#window-next');
  const reset = root.querySelector('#window-reset');
  const money = value => '$' + Number(value.toFixed(2));
  const frameFor = index => fares.slice(Math.max(0, index - 2), index + 1);
  const average = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  let current = 2;

  function render() {
    const start = Math.max(0, current - 2);
    const frame = frameFor(current);
    rows.forEach((row, index) => {
      const included = index >= start && index <= current;
      row.classList.toggle('in-frame', included);
      row.classList.toggle('is-current', index === current);
      row.querySelector('.window-use').textContent = index === current ? 'Current' : included ? 'Included' : 'Outside';
      choices[index].setAttribute('aria-pressed', String(index === current));
      results[index].classList.toggle('is-current', index === current);
      results[index].lastElementChild.textContent = money(average(frameFor(index)));
    });
    root.querySelector('#window-current-label').textContent = `Calculate the average for ride ${current + 1}`;
    root.querySelector('#window-equation').textContent = `(${frame.map(money).join(' + ')}) ÷ ${frame.length} = ${money(average(frame))}`;
    root.querySelector('#window-explanation').textContent = [
      'There are no earlier rides. Use ride 1 alone; divide by 1, not by 3.',
      'Only one earlier ride exists. Use rides 1 and 2; divide by 2.',
      'Use rides 1, 2, and 3. Ride 4 comes later, so it is outside this frame.',
      'Use rides 2, 3, and 4. Ride 1 is now too far back, so it leaves the frame.'
    ][current];
    previous.disabled = current === 0;
    next.disabled = current === rows.length - 1;
    reset.disabled = current === 0;
  }

  previous.addEventListener('click', () => { current = Math.max(0, current - 1); render(); });
  next.addEventListener('click', () => { current = Math.min(rows.length - 1, current + 1); render(); });
  reset.addEventListener('click', () => { current = 0; render(); });
  choices.forEach((button, index) => {
    button.disabled = false;
    button.addEventListener('click', () => { current = index; render(); });
  });
  root.querySelector('.window-controls').hidden = false;
  render();
})();
