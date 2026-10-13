/* A small, invented query result shows how both columns keep the same row order.
   The complete first batch remains readable without JavaScript. */
(() => {
  const root = document.getElementById('arrow-batch-demo');
  if (!root) return;
  const rows = [...root.querySelectorAll('[data-arrow-ride]')];
  const buttons = [...root.querySelectorAll('[data-arrow-batch]')];
  const labels = [...root.querySelectorAll('[data-arrow-label]')];
  const distances = [...root.querySelectorAll('[data-arrow-distance]')];
  const fares = [...root.querySelectorAll('[data-arrow-fare]')];
  const batchSize = distances.length;

  function showBatch(index) {
    const start = index * batchSize;
    const batch = rows.slice(start, start + batchSize);
    rows.forEach((row, rowIndex) => {
      row.classList.toggle('is-in-batch', rowIndex >= start && rowIndex < start + batchSize);
    });
    batch.forEach((row, position) => {
      const { arrowRide, distance, fare } = row.dataset;
      labels[position].textContent = arrowRide;
      distances[position].textContent = distance;
      fares[position].textContent = fare;
      [distances[position], fares[position]].forEach(value => {
        value.parentElement.querySelector('[data-arrow-ride-name]').textContent = `Ride ${arrowRide}: `;
      });
    });
    buttons.forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.arrowBatch) === index));
    });
    root.querySelector('#arrow-batch-label').textContent = `Batch ${index + 1}`;
    const first = batch[0].dataset;
    root.querySelector('#arrow-pairing-detail').textContent =
      `In batch ${index + 1}, the first distance (${first.distance} miles) and first fare ($${first.fare}) both belong to ride ${first.arrowRide}.`;
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => showBatch(Number(button.dataset.arrowBatch)));
  });
  root.querySelector('.arrow-controls').hidden = false;
})();
