// Numerical routines shared by explicit demo workflows. No database or UI imports.
const mean = a => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const variance = a => mean(a.map(x => (x - mean(a)) ** 2));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sigmoid = x => 1 / (1 + Math.exp(-clamp(x, -35, 35)));
const distance = (a, b) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0));
function random(seed = 42) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function validateMatrix(X) {
  if (!X.length || !X[0].length || X.some(row => row.length !== X[0].length || row.some(x => !Number.isFinite(x)))) {
    throw new Error('A nonempty, rectangular, finite numeric matrix is required.');
  }
}
function standardize(X, fitted) {
  validateMatrix(X);
  const means = fitted?.means ?? X[0].map((_, j) => mean(X.map(row => row[j])));
  const scales = fitted?.scales ?? means.map((_, j) => Math.sqrt(variance(X.map(row => row[j]))) || 1);
  return { means, scales, X: X.map(row => row.map((x, j) => (x - means[j]) / scales[j])) };
}
function pearson(a, b) {
  const ma = mean(a), mb = mean(b);
  const numerator = a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0);
  const denominator = Math.sqrt(a.reduce((s, x) => s + (x - ma) ** 2, 0) * b.reduce((s, x) => s + (x - mb) ** 2, 0));
  return denominator ? clamp(numerator / denominator, -1, 1) : null;
}
// Symmetric Jacobi eigensolver for covariance PCA; bounded rotations.
function pca(X, components = 2, fitted) {
  validateMatrix(X);
  if (fitted) return { ...fitted, scores: X.map(row => fitted.loadings.map(v => dot(row.map((x, j) => x - fitted.means[j]), v))) };
  const n = X.length, p = X[0].length;
  const means = X[0].map((_, j) => mean(X.map(row => row[j])));
  const centered = X.map(row => row.map((x, j) => x - means[j]));
  const A = means.map((_, i) => means.map((__, j) => centered.reduce((s, row) => s + row[i] * row[j], 0) / Math.max(1, n - 1)));
  const V = means.map((_, i) => means.map((__, j) => +(i === j)));
  for (let iteration = 0; iteration < 100 * p * p; iteration++) {
    let a = 0, b = 0, largest = 0;
    for (let i = 0; i < p; i++) for (let j = i + 1; j < p; j++) {
      if (Math.abs(A[i][j]) > largest) { largest = Math.abs(A[i][j]); a = i; b = j; }
    }
    if (largest < 1e-10) break;
    const angle = 0.5 * Math.atan2(2 * A[a][b], A[b][b] - A[a][a]);
    const c = Math.cos(angle), s = Math.sin(angle);
    const aa = A[a][a], bb = A[b][b], ab = A[a][b];
    for (let j = 0; j < p; j++) if (j !== a && j !== b) {
      const ja = A[j][a], jb = A[j][b];
      A[j][a] = A[a][j] = c * ja - s * jb;
      A[j][b] = A[b][j] = s * ja + c * jb;
    }
    A[a][a] = c * c * aa - 2 * s * c * ab + s * s * bb;
    A[b][b] = s * s * aa + 2 * s * c * ab + c * c * bb;
    A[a][b] = A[b][a] = 0;
    for (let j = 0; j < p; j++) {
      const va = V[j][a], vb = V[j][b];
      V[j][a] = c * va - s * vb; V[j][b] = s * va + c * vb;
    }
  }
  const order = means.map((_, i) => i).sort((i, j) => A[j][j] - A[i][i]);
  const eigenvalues = order.map(i => Math.max(0, A[i][i]));
  const total = eigenvalues.reduce((s, x) => s + x, 0);
  const selected = order.slice(0, Math.min(components, p));
  const loadings = selected.map(i => V.map(row => row[i]));
  return { means, loadings, eigenvalues: eigenvalues.slice(0, selected.length), explainedVariance: eigenvalues.slice(0, selected.length).map(x => total ? x / total : 0), scores: centered.map(row => loadings.map(v => dot(row, v))) };
}
// Orthogonal power iteration on the centered covariance operator. Avoids a
// full eigendecomposition when a lagged day has hundreds of input columns.
function leadingPca(X, components = 5) {
  validateMatrix(X);
  const n = X.length, p = X[0].length;
  const means = X[0].map((_, j) => mean(X.map(row => row[j])));
  const Z = X.map(row => row.map((value, j) => value - means[j]));
  const total = Z.reduce((sum, row) => sum + dot(row, row), 0) / Math.max(1, n - 1);
  const loadings = [], eigenvalues = [], rng = random(42);
  const orthogonalize = vector => {
    for (const axis of loadings) { const projection = dot(vector, axis); vector = vector.map((value, j) => value - projection * axis[j]); }
    const norm = Math.sqrt(dot(vector, vector));
    return norm > 1e-12 ? vector.map(value => value / norm) : null;
  };
  const multiply = vector => {
    const next = Array(p).fill(0);
    for (const row of Z) { const value = dot(row, vector) / Math.max(1, n - 1); for (let j = 0; j < p; j++) next[j] += row[j] * value; }
    return next;
  };
  for (let component = 0; component < Math.min(components, p); component++) {
    let vector = orthogonalize(Array.from({ length: p }, () => rng() - 0.5));
    if (!vector) break;
    for (let iteration = 0; iteration < 250; iteration++) {
      const next = orthogonalize(multiply(vector));
      if (!next) break;
      const similarity = Math.abs(dot(vector, next)); vector = next;
      if (1 - similarity < 1e-10) break;
    }
    const eigenvalue = Math.max(0, dot(vector, multiply(vector)));
    loadings.push(vector); eigenvalues.push(eigenvalue);
  }
  return { means, loadings, eigenvalues, explainedVariance: eigenvalues.map(value => total ? value / total : 0), scores: Z.map(row => loadings.map(axis => dot(row, axis))) };
}
function regression(X, y, { lambda = 0.04, l1Ratio = 0.5, iterations = 300 } = {}) {
  validateMatrix(X);
  if (y.length !== X.length || y.some(x => !Number.isFinite(x))) throw new Error('Invalid regression targets.');
  const normalization = standardize(X), Z = normalization.X, intercept = mean(y);
  const coefficients = X[0].map(() => 0), residual = y.map(x => x - intercept);
  for (let iteration = 0; iteration < iterations; iteration++) {
    let change = 0;
    for (let j = 0; j < coefficients.length; j++) {
      const old = coefficients[j];
      const rho = mean(Z.map((row, i) => row[j] * (residual[i] + row[j] * old)));
      const norm = mean(Z.map(row => row[j] ** 2)) + lambda * (1 - l1Ratio);
      const next = norm ? Math.sign(rho) * Math.max(0, Math.abs(rho) - lambda * l1Ratio) / norm : 0;
      for (let i = 0; i < y.length; i++) residual[i] += Z[i][j] * (old - next);
      coefficients[j] = next; change = Math.max(change, Math.abs(old - next));
    }
    if (change < 1e-8) break;
  }
  const predict = rows => standardize(rows, normalization).X.map(row => intercept + dot(row, coefficients));
  return { coefficients, intercept, normalization: { means: normalization.means, scales: normalization.scales }, predict };
}
function logistic(X, y, { lambda = 0.02, iterations = 400 } = {}) {
  validateMatrix(X);
  if (y.length !== X.length || y.some(x => x !== 0 && x !== 1)) throw new Error('Binary labels must be zero or one.');
  if (!y.includes(0) || !y.includes(1)) throw new Error('Both classes are required to train a classifier.');
  const normalization = standardize(X), Z = normalization.X;
  let intercept = 0;
  const coefficients = X[0].map(() => 0), step = 0.5 / coefficients.length;
  for (let iteration = 0; iteration < iterations; iteration++) {
    const errors = Z.map((row, i) => sigmoid(intercept + dot(row, coefficients)) - y[i]);
    intercept -= step * mean(errors);
    for (let j = 0; j < coefficients.length; j++) {
      const next = coefficients[j] - step * mean(Z.map((row, i) => row[j] * errors[i]));
      coefficients[j] = Math.sign(next) * Math.max(0, Math.abs(next) - step * lambda);
    }
  }
  const predict = rows => standardize(rows, normalization).X.map(row => sigmoid(intercept + dot(row, coefficients)));
  return { coefficients, intercept, normalization: { means: normalization.means, scales: normalization.scales }, predict };
}
function gaussianNB(X, y) {
  validateMatrix(X);
  if (!y.includes(0) || !y.includes(1)) throw new Error('Both classes are required for Naive Bayes.');
  const parameters = [0, 1].map(label => {
    const rows = X.filter((_, i) => y[i] === label);
    return { prior: rows.length / X.length, means: X[0].map((_, j) => mean(rows.map(row => row[j]))), variances: X[0].map((_, j) => Math.max(1e-6, variance(rows.map(row => row[j])))) };
  });
  const predict = rows => rows.map(row => {
    const scores = parameters.map(p => Math.log(p.prior) + row.reduce((s, x, j) => s - 0.5 * (Math.log(2 * Math.PI * p.variances[j]) + (x - p.means[j]) ** 2 / p.variances[j]), 0));
    return sigmoid(scores[1] - scores[0]);
  });
  return { parameters, predict };
}
function bernoulliNB(X, y) {
  validateMatrix(X);
  if (!y.includes(0) || !y.includes(1)) throw new Error('Both classes are required for Naive Bayes.');
  const thresholds = X[0].map((_, j) => mean(X.map(row => row[j])));
  const parameters = [0, 1].map(label => {
    const rows = X.filter((_, i) => y[i] === label);
    return { prior: (rows.length + 1) / (X.length + 2), probabilities: X[0].map((_, j) => (1 + rows.filter(row => row[j] > thresholds[j]).length) / (rows.length + 2)) };
  });
  const predict = rows => rows.map(row => {
    const scores = parameters.map(p => Math.log(p.prior) + row.reduce((s, x, j) => s + Math.log(x > thresholds[j] ? p.probabilities[j] : 1 - p.probabilities[j]), 0));
    return sigmoid(scores[1] - scores[0]);
  });
  return { parameters, thresholds, predict };
}
function kmeans(X, k = 3, seed = 42) {
  validateMatrix(X);
  k = Math.min(k, X.length);
  const rng = random(seed), centers = [X[Math.floor(rng() * X.length)].slice()];
  while (centers.length < k) {
    const weights = X.map(row => Math.min(...centers.map(c => distance(row, c) ** 2)));
    let choice = rng() * weights.reduce((s, x) => s + x, 0), index = 0;
    while (index < X.length - 1 && (choice -= weights[index]) > 0) index++;
    centers.push(X[index].slice());
  }
  let labels = [];
  for (let iteration = 0; iteration < 60; iteration++) {
    const next = X.map(row => centers.reduce((best, c, j) => distance(row, c) < distance(row, centers[best]) ? j : best, 0));
    if (next.every((x, i) => x === labels[i])) break;
    labels = next;
    centers.forEach((center, j) => {
      const rows = X.filter((_, i) => labels[i] === j);
      if (rows.length) centers[j] = center.map((_, column) => mean(rows.map(row => row[column])));
    });
  }
  return { labels, centers, inertia: X.reduce((s, row, i) => s + distance(row, centers[labels[i]]) ** 2, 0) };
}
function dbscan(X, epsilon = 0.7, minPoints = 4) {
  validateMatrix(X);
  const labels = X.map(() => -2), neighbors = i => X.map((row, j) => distance(X[i], row) <= epsilon ? j : -1).filter(j => j >= 0);
  let cluster = 0;
  for (let i = 0; i < X.length; i++) {
    if (labels[i] !== -2) continue;
    const near = neighbors(i);
    if (near.length < minPoints) { labels[i] = -1; continue; }
    labels[i] = cluster;
    const queue = [...near], seen = new Set(queue);
    for (let head = 0; head < queue.length; head++) {
      const j = queue[head];
      if (labels[j] === -1) labels[j] = cluster;
      if (labels[j] !== -2) continue;
      labels[j] = cluster;
      const more = neighbors(j);
      if (more.length >= minPoints) for (const neighbor of more) if (!seen.has(neighbor)) { seen.add(neighbor); queue.push(neighbor); }
    }
    cluster++;
  }
  return { labels, clusters: cluster, noise: labels.filter(x => x === -1).length };
}
// Banded DTW with squared local costs. Rolling rows use O(m) memory.
function dtw(a, b, band = Math.max(a.length, b.length), rolling = false, localCost = (x, y) => (x - y) ** 2) {
  if (!a.length || !b.length) throw new Error('DTW requires two nonempty sequences.');
  band = Math.max(band, Math.abs(a.length - b.length));
  const D = rolling ? null : Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(Infinity));
  let previous = Array(b.length + 1).fill(Infinity); previous[0] = 0;
  if (D) D[0][0] = 0;
  for (let i = 1; i <= a.length; i++) {
    const current = Array(b.length + 1).fill(Infinity);
    for (let j = Math.max(1, i - band); j <= Math.min(b.length, i + band); j++) current[j] = localCost(a[i - 1], b[j - 1]) + Math.min(previous[j], current[j - 1], previous[j - 1]);
    if (D) D[i] = current;
    previous = current;
  }
  const path = [];
  if (D) {
    let i = a.length, j = b.length;
    while (i && j) {
      path.unshift([i - 1, j - 1]);
      const candidates = [[i - 1, j - 1], [i - 1, j], [i, j - 1]];
      const best = candidates.reduce((x, y) => D[y[0]][y[1]] < D[x[0]][x[1]] ? y : x);
      [i, j] = best;
    }
  }
  return { distance: Math.sqrt(previous[b.length]), path };
}
module.exports = { mean, variance, dot, distance, random, clamp, standardize, pearson, pca, leadingPca, regression, logistic, gaussianNB, bernoulliNB, kmeans, dbscan, dtw };
