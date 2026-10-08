const { createSnapshot, supervised } = require('./dataset');
const { random } = require('./math');

const supportsSensitivity = algorithm => ['regression', 'classification', 'horizons', 'classification-horizons'].includes(algorithm.kind);
function makeDonors(snapshot, horizon = 1, { target = 'pain', eventWindow = false, horizons = [horizon] } = {}) {
  const trainingSnapshot = target === 'pain' ? snapshot : { ...snapshot, rows: snapshot.rows.map(row => ({ ...row, pain: row.targets?.[target] ?? null })) };
  const pools = horizons.map(h => {
    const dataset = supervised(trainingSnapshot, h, eventWindow);
    const trainingEnd = Math.floor(dataset.X.length * 0.8) - h;
    if (trainingEnd < 8) throw new Error('More training observations are needed for missing-input simulation.');
    return dataset.rowIndices.slice(0, trainingEnd);
  });
  // Multi-horizon draws use only rows shared by every training partition.
  // An input from one horizon's holdout must never become another's donor.
  const indices = pools[0].filter(i => pools.every(pool => pool.includes(i)));
  if (!indices.length) throw new Error('No shared training observations for missing-input simulation.');
  const donors = snapshot.featureNames.map((_, j) => indices.map(i => snapshot.rows[i]).filter(row => !row.missingFeatures?.[j]).map(row => row.features[j]));
  const unknown = snapshot.featureNames.filter((_, j) => snapshot.rows.some(row => row.missingFeatures?.[j]) && !donors[j].length);
  if (unknown.length) throw new Error(`No observed training values for ${unknown.join(', ')}. Monte Carlo cannot estimate a sampling distribution for those inputs.`);
  return { donors, trainingRows: indices.length };
}
function drawSnapshot(snapshot, donors, rng) {
  // The sampled values are available to the temporary model. Keeping the
  // original missing mask here would make the calendar embedding discard them.
  // Only this draw changes; the saved snapshot and unknown outcomes stay intact.
  return createSnapshot(snapshot.rows.map(row => ({ ...row, features: row.features.map((value, j) => row.missingFeatures?.[j] ? donors[j][Math.floor(rng() * donors[j].length)] : value), missingFeatures: row.features.map(() => false) })), { seed: snapshot.seed, source: snapshot.source, featureNames: snapshot.featureNames, limitRows: null, targetNames: snapshot.targetNames });
}
function predictionValues(output) {
  if (output.forecasts?.[0]?.prediction != null) return output.forecasts.map(row => ({ horizon: row.horizon, value: row.prediction }));
  if (output.windows) return output.windows.filter(row => Number.isFinite(row.prediction)).map(row => ({ horizon: row.horizon, value: row.prediction }));
  return [{ horizon: output.horizon, value: output.prediction }];
}
function summarize(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) throw new Error('Simulation produced no finite predictions.');
  const quantile = p => { const n = (sorted.length - 1) * p, low = Math.floor(n); return sorted[low] + (sorted[Math.ceil(n)] - sorted[low]) * (n - low); };
  return { low: quantile(0.05), median: quantile(0.5), high: quantile(0.95), values: sorted };
}
async function runSensitivity(snapshot, algorithm, { draws = 40, seed = snapshot.seed + 901, onProgress = () => {}, isCurrent = () => true } = {}) {
  if (!supportsSensitivity(algorithm)) throw new Error('Missing-input sensitivity is available for feature-based prediction and classification models.');
  if (!snapshot.quality?.assumedFeatureValues) return { draws: 0, complete: true, distributions: [] };
  const horizon = algorithm.sensitivityHorizon ?? (algorithm.kind === 'horizons' ? 14 : algorithm.id === 'event-windows' ? 7 : algorithm.id === 'three-day' ? 3 : 1);
  const { donors, trainingRows } = makeDonors(snapshot, horizon, { target: algorithm.sensitivityTarget, eventWindow: algorithm.id === 'event-windows', horizons: algorithm.id === 'event-windows' ? [1, 3, 7] : algorithm.kind === 'horizons' ? [1, 7, 14] : [horizon] });
  const rng = random(seed), collected = new Map();
  for (let i = 0; i < draws; i++) {
    await new Promise(resolve => setTimeout(resolve, 0));
    if (!isCurrent()) return null;
    const output = algorithm.run(drawSnapshot(snapshot, donors, rng));
    predictionValues(output).forEach(({ horizon: h, value }) => {
      const values = collected.get(h) ?? []; values.push(value); collected.set(h, values);
    });
    onProgress(i + 1, draws);
  }
  return { draws, seed, trainingRows, distributions: [...collected].map(([horizon, values]) => ({ horizon, ...summarize(values) })) };
}

module.exports = { supportsSensitivity, makeDonors, drawSnapshot, predictionValues, summarize, runSensitivity };
