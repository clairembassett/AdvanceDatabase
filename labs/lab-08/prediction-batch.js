/* Follow one invented Arrow UDF call. The model outputs are illustrative,
   not a second model running in the browser. SQL matches results by position. */
(() => {
  'use strict';
  const root = document.getElementById('prediction-batch-demo');
  if (!root) return;
  const stages = [
    {
      title: 'One Python call receives both distances', place: 0,
      format: 'Arrow · two chunks', values: ['[3.0]', '[5.0]'],
      labels: ['Chunk 1 · position 1', 'Chunk 2 · position 2'],
      code: 'def predict_fare(distances):',
      note: 'DuckDB sends one distance column. Here we draw two chunks inside that column. A chunk boundary does not change the row order.'
    },
    {
      title: 'Make a tensor with one distance per row', place: 1,
      format: 'Tensor · 2 rows × 1 column', values: ['[3.0]', '[5.0]'],
      labels: ['Tensor row 1', 'Tensor row 2'],
      code: 'x = torch.tensor(\n    distances.to_numpy(), dtype=torch.float32\n).reshape(-1, 1)',
      note: 'to_numpy() gives [3.0, 5.0]. torch.tensor() copies the values into PyTorch; reshape(-1, 1) makes [[3.0], [5.0]]. The two rides stay in order.'
    },
    {
      title: 'Use the same distance scale as training', place: 1,
      format: 'Scaled input · no miles', values: ['[0.0]', '[1.0]'],
      labels: ['(3 − 3) ÷ 2 = 0', '(5 − 3) ÷ 2 = 1'],
      code: '(x - x_mean) / x_std',
      note: 'Use the saved training values: x_mean = 3 miles and x_std = 2 miles. No statistics are recalculated from this prediction batch.'
    },
    {
      title: 'The saved model predicts two scaled fares', place: 1,
      format: 'Model output · not dollars yet', values: ['[0.2]', '[0.8]'],
      labels: ['Prediction for position 1', 'Prediction for position 2'],
      code: 'with torch.inference_mode():\n    # Inside the fares expression:\n    model((x - x_mean) / x_std)',
      note: 'Assume the saved network returns 0.2 and 0.8 for this example. Both rides use the same model. Inference mode skips gradient tracking; no weights are updated.'
    },
    {
      title: 'Turn the scaled predictions into dollars', place: 1,
      format: 'Fare tensor · dollars', values: ['[22.0]', '[28.0]'],
      labels: ['0.2 × $10 + $20 = $22', '0.8 × $10 + $20 = $28'],
      code: 'fares = model((x - x_mean) / x_std) * y_std + y_mean',
      note: 'Use the saved fare scale: y_std = $10 and y_mean = $20. Each scaled prediction becomes a dollar amount. The rides’ recorded fares are not needed.'
    },
    {
      title: 'Package two fares as an Arrow column', place: 1,
      format: 'Arrow · 2 values', values: ['22.0', '28.0'],
      labels: ['Returned position 1', 'Returned position 2'],
      code: 'return pa.array(\n    fares.flatten().numpy().astype(np.float64)\n)',
      note: 'flatten() changes [[22.0], [28.0]] to [22.0, 28.0]. NumPy provides 64-bit values for SQL DOUBLE; pa.array() packages them in Arrow. Return one value for each input, in the same order.'
    },
    {
      title: 'DuckDB gives each ride its prediction', place: 2,
      format: 'Returned Arrow column', values: ['22.0', '28.0'],
      labels: ['Position 1 → ride A', 'Position 2 → ride B'],
      code: 'predict_fare_nn(distance) AS predicted_fare',
      note: 'DuckDB matches by position: the first returned fare goes to the first input ride. Python received only distances, so there is no ride ID in the returned column to repair a changed order.'
    }
  ];
  const find = selector => root.querySelector(selector);
  const rows = [...root.querySelectorAll('[data-prediction-row]')];
  const previous = find('[data-prediction-prev]');
  const next = find('[data-prediction-next]');
  const reset = find('[data-prediction-reset]');
  const sort = find('[data-prediction-sort]');
  const finalStage = stages.length - 1;
  let current = 0;
  let sorted = false;

  function render() {
    const stage = stages[current];
    const finished = current === finalStage;
    find('#prediction-step').textContent = `Step ${current + 1} of ${stages.length}`;
    find('#prediction-stage-title').textContent = stage.title;
    find('#prediction-format').textContent = stage.format;
    find('#prediction-code').textContent = stage.code;
    find('#prediction-explanation').textContent = sorted
      ? 'Sorting only the fares gives [28.0, 22.0]. DuckDB still pairs by position: ride A now gets ride B’s $28, and ride B gets ride A’s $22. The count is right, but both assignments are wrong.'
      : stage.note;
    root.querySelectorAll('[data-prediction-place]').forEach((el, index) => {
      el.classList.toggle('is-current', index === stage.place);
      if (index === stage.place) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
    rows.forEach((row, index) => {
      const source = sorted ? 1 - index : index;
      row.querySelector('[data-prediction-value]').textContent = stage.values[source];
      row.querySelector('[data-prediction-label]').textContent = sorted
        ? `Position ${index + 1} · fare from ride ${source === 0 ? 'A' : 'B'}` : stage.labels[index];
      const output = row.querySelector('[data-prediction-output]');
      output.textContent = finished ? (source === 0 ? '$22' : '$28') : '—';
      row.querySelector('[data-prediction-result]').textContent = finished
        ? (sorted ? 'Wrong ride' : 'Correct ride') : 'Waiting for return';
      row.classList.toggle('is-wrong', sorted);
      row.classList.toggle('is-returned', finished);
    });
    find('.prediction-order-check').hidden = !finished;
    sort.textContent = sorted ? 'Restore the original order' : 'Sort fares: high to low';
    sort.setAttribute('aria-pressed', String(sorted));
    previous.disabled = current === 0;
    next.disabled = finished;
    reset.disabled = current === 0;
  }

  previous.addEventListener('click', () => { current = Math.max(0, current - 1); sorted = false; render(); });
  next.addEventListener('click', () => { current = Math.min(finalStage, current + 1); sorted = false; render(); });
  reset.addEventListener('click', () => { current = 0; sorted = false; render(); });
  sort.addEventListener('click', () => { sorted = !sorted; render(); });
  find('.prediction-controls').hidden = false;
  render();
})();
