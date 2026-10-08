const M = require('./math');
const { dayEmbedding } = require('./dayEmbedding');
const { requireDemo } = require('./dataset');
const cache = new WeakMap();
function daySpace(snapshot) {
  requireDemo(snapshot);
  if (cache.has(snapshot)) return cache.get(snapshot);
  const embedding = dayEmbedding(snapshot);
  // A missing measurement sits at the observed mean after scaling, with a
  // separate low-weight flag. It is never treated as a measured zero.
  const means = embedding.columns.map((_, j) => M.mean(embedding.values.map(row => row[j]).filter(Number.isFinite)));
  const scales = means.map((mean, j) => Math.sqrt(M.mean(embedding.values.map(row => row[j]).filter(Number.isFinite).map(value => (value - mean) ** 2))) || 1);
  const X = embedding.values.map(row => [...row.map((value, j) => Number.isFinite(value) ? (value - means[j]) / scales[j] : 0), ...row.map(value => Number.isFinite(value) ? 0 : 0.25)]);
  const pca = M.leadingPca(X, 5);
  const value = { embedding, X, pca };
  cache.set(snapshot, value);
  return value;
}
// UMAP is a display of the input neighbourhoods, never a source of cluster
// labels. Epoch batches yield so navigation can cancel the layout.
async function umapMap(snapshot, { isCurrent = () => true, onProgress = () => {} } = {}) {
  const { UMAP } = require('umap-js');
  const { X } = daySpace(snapshot);
  if (X.length < 4) throw new Error('The neighbourhood map needs at least four days.');
  const model = new UMAP({ nComponents: 2, nNeighbors: Math.min(15, X.length - 1), minDist: 0.2, nEpochs: 180, random: M.random(snapshot.seed ?? 42) });
  if (!isCurrent()) return null;
  const epochs = model.initializeFit(X);
  for (let epoch = 0; epoch < epochs; epoch++) {
    if (!isCurrent()) return null;
    model.step();
    if (epoch % 8 === 0) { onProgress(Math.round((epoch + 1) / epochs * 100)); await new Promise(resolve => setTimeout(resolve, 0)); }
  }
  if (!isCurrent()) return null;
  onProgress(100);
  return model.getEmbedding().map((point, i) => ({ x: point[0], y: point[1], date: snapshot.rows[i].date }));
}
module.exports = { daySpace, umapMap };
