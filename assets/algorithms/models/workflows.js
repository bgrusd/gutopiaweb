const M = require('./math');
const { requireDemo, supervised } = require('./dataset');
const DISCLAIMER = 'Coursework demonstration on demo data. These outputs are not validated medical predictions.';
const round = x => Number.isFinite(x) ? Math.round(x * 1000) / 1000 : null;
const result = (title, snapshot, data) => ({ title, source: snapshot.source, asOfDate: snapshot.asOfDate, disclaimer: DISCLAIMER, ...data });
function metrics(y, predictions, baseline) {
  const mse = M.mean(y.map((x, i) => (x - predictions[i]) ** 2));
  const total = y.reduce((s, x) => s + (x - M.mean(y)) ** 2, 0);
  return { rmse: round(Math.sqrt(mse)), r2: total ? round(1 - mse * y.length / total) : null, baselineRmse: round(Math.sqrt(M.mean(y.map(x => (x - baseline) ** 2)))) };
}
function classificationMetrics(y, p) {
  const tp = y.filter((x, i) => x === 1 && p[i] >= 0.5).length;
  const fp = y.filter((x, i) => x === 0 && p[i] >= 0.5).length;
  const fn = y.filter((x, i) => x === 1 && p[i] < 0.5).length;
  return { accuracy: round(M.mean(y.map((x, i) => +(x === +(p[i] >= 0.5))))), precision: tp + fp ? round(tp / (tp + fp)) : null, recall: tp + fn ? round(tp / (tp + fn)) : null, brier: round(M.mean(y.map((x, i) => (x - p[i]) ** 2))) };
}
function fitPrediction(snapshot, { kind = 'elastic', horizon = 1, projected = false, lambda = 0.04 } = {}) {
  const dataset = supervised(snapshot, horizon);
  const split = Math.floor(dataset.X.length * 0.8), trainEnd = split - horizon;
  if (trainEnd < 8 || dataset.X.length - split < 2) throw new Error('Not enough demo observations for separate training and holdout periods.');
  let train = dataset.X.slice(0, trainEnd), test = dataset.X.slice(split), current = [snapshot.rows.at(-1).features.slice()];
  let projection = null;
  if (projected) {
    const normalization = M.standardize(train);
    projection = M.pca(normalization.X, Math.min(4, train[0].length));
    const transform = rows => M.pca(M.standardize(rows, normalization).X, 4, projection).scores;
    train = projection.scores; test = transform(test); current = transform(current);
  }
  const binary = kind === 'logistic' || kind === 'bayes';
  const labels = binary ? dataset.y.map(x => +(x >= 5)) : dataset.y;
  const yTrain = labels.slice(0, trainEnd), yTest = labels.slice(split);
  let model;
  if (kind === 'logistic') model = M.logistic(train, yTrain, { lambda });
  else if (kind === 'bayes') model = M.bernoulliNB(train, yTrain);
  else model = M.regression(train, yTrain, { lambda, l1Ratio: kind === 'lasso' ? 1 : 0.5 });
  const predictions = model.predict(test), currentPrediction = model.predict(current)[0];
  const featureNames = projected ? train[0].map((_, j) => `PC${j + 1}`) : snapshot.featureNames;
  return {
    horizon, target: binary ? `Demo label: pain rating ≥ 5 exactly ${horizon} day(s) ahead` : `Demo pain rating exactly ${horizon} day(s) ahead`,
    evaluation: { split: 'Chronological 80/20, with a horizon-sized gap', trainingRows: trainEnd, heldOutRows: yTest.length, ...(binary ? classificationMetrics(yTest, predictions) : metrics(yTest, predictions, M.mean(yTrain))) },
    trainingMetrics: binary ? classificationMetrics(yTrain, model.predict(train)) : metrics(yTrain, model.predict(train), M.mean(yTrain)),
    coefficients: model.coefficients?.map((coefficient, j) => ({ feature: featureNames[j], value: round(coefficient) })) ?? null,
    probabilities: binary ? predictions.map(round) : null,
    projection: projection ? { explainedVariance: projection.explainedVariance.map(round), loadings: projection.loadings } : null,
    series: yTest.map((actual, i) => ({ date: dataset.dates[split + i], actual, predicted: round(predictions[i]) })),
    prediction: round(currentPrediction), parameters: model.parameters ?? null,
  };
}
function runLasso(s) { return result('LASSO regression', s, fitPrediction(s, { kind: 'lasso' })); }
function runElasticNet(s) { return result('ElasticNet regression', s, fitPrediction(s)); }
function runLogisticLasso(s) { return result('Logistic LASSO', s, fitPrediction(s, { kind: 'logistic' })); }
function runNaiveBayes(s) { return result('Bernoulli Naive Bayes', s, fitPrediction(s, { kind: 'bayes' })); }
function runPcaLasso(s) { return result('PCA + LASSO', s, fitPrediction(s, { kind: 'lasso', projected: true })); }
function runPcaLogistic(s) { return result('PCA + logistic LASSO', s, fitPrediction(s, { kind: 'logistic', projected: true })); }
function runPca(s) {
  requireDemo(s);
  const normalized = M.standardize(s.rows.map(row => row.features));
  const model = M.pca(normalized.X, 3);
  return result('Principal component analysis', s, { features: s.featureNames, explainedVariance: model.explainedVariance.map(round), loadings: model.loadings, points: model.scores.map((point, i) => ({ x: point[0], y: point[1] ?? 0, date: s.rows[i].date })) });
}
function runCorrelation(s) {
  const { X, y } = supervised(s);
  return result('Lagged Pearson correlations', s, { pairs: s.featureNames.map((feature, j) => ({ feature, correlation: round(M.pearson(X.map(row => row[j]), y)), observations: y.length })), matrix: s.featureNames.map((_, j) => s.featureNames.map((__, k) => round(M.pearson(X.map(row => row[j]), X.map(row => row[k]))))) });
}
function runTriggerAnalysis(s) {
  const { X, y } = supervised(s);
  return result('Recorded trigger comparisons', s, { comparisons: s.featureNames.slice(0, 3).map((feature, j) => {
    const exposed = y.filter((_, i) => X[i][j] > 0), comparison = y.filter((_, i) => X[i][j] === 0);
    return { feature, exposedDays: exposed.length, comparisonDays: comparison.length, difference: exposed.length && comparison.length ? round(M.mean(exposed) - M.mean(comparison)) : null };
  }) });
}
function runKMeans(s) {
  const projected = runPca(s), X = projected.points.map(p => [p.x, p.y]);
  const clusters = M.kmeans(X, 3, s.seed);
  return result('PCA + K-means (K = 3)', s, { ...clusters, points: projected.points.map((point, i) => ({ ...point, cluster: clusters.labels[i] })) });
}
function runDbscan(s) {
  const projected = runPca(s), X = projected.points.map(p => [p.x, p.y]);
  const clusters = M.dbscan(X, 0.7, 4);
  return result('PCA + DBSCAN', s, { ...clusters, epsilon: 0.7, minPoints: 4, points: projected.points.map((point, i) => ({ ...point, cluster: clusters.labels[i] })) });
}
function runDtw(s, optimized = false) {
  requireDemo(s, 21);
  const rows = s.rows.filter(row => row.pain !== null), window = 7, motifs = [];
  for (let i = 0; i <= rows.length - 2 * window; i += 3) {
    const a = rows.slice(i, i + window);
    if (!isConsecutive(a)) continue;
    for (let j = i + window; j <= rows.length - window; j += 3) {
      const b = rows.slice(j, j + window);
      if (!isConsecutive(b)) continue;
      const aligned = M.dtw(a.map(row => row.pain), b.map(row => row.pain), 2, optimized);
      motifs.push({ first: a[0].date, second: b[0].date, distance: round(aligned.distance), path: aligned.path, firstValues: a.map(row => row.pain), secondValues: b.map(row => row.pain) });
    }
  }
  motifs.sort((a, b) => a.distance - b.distance);
  if (!motifs.length) throw new Error('DTW needs two separate consecutive seven-day windows with pain recorded.');
  return result(optimized ? 'DTW with rolling memory' : 'Dynamic time warping', s, { window, band: 2, motifs: motifs.slice(0, 5), comparisons: motifs.length, memory: optimized ? 'O(window)' : 'O(window²)' });
}
function runOptimizedDtw(s) { return runDtw(s, true); }
function isConsecutive(rows) {
  return rows.every((row, i) => !i || new Date(row.date + 'T00:00:00Z') - new Date(rows[i - 1].date + 'T00:00:00Z') === 86400000);
}
function runForecast(s, projected = false) {
  const forecasts = [1, 7, 14].map(horizon => fitPrediction(s, { horizon, projected }));
  return result(projected ? 'PCA + ElasticNet horizon models' : 'ElasticNet horizon models', s, { forecasts, series: forecasts[0].series });
}
function runPcaElasticNet(s) { return runForecast(s, true); }
function runElasticNetForecast(s) { return runForecast(s); }
function runFlareWindows(s) {
  return result('Demo event classification across 3/7/14-day horizons', s, { target: 'Synthetic/demo pain ≥ 5, not a clinical flare label', windows: [3, 7, 14].map(horizon => fitPrediction(s, { horizon, kind: 'logistic', projected: true })) });
}
function runFlareThreeDay(s) { return result('Three-day logistic classifier', s, fitPrediction(s, { horizon: 3, kind: 'logistic' })); }
function runAutoregressive(s) {
  requireDemo(s, 30);
  const rows = s.rows.filter(row => row.pain !== null);
  if (!isConsecutive(rows)) throw new Error('Autoregression needs consecutive demo pain observations.');
  const values = rows.map(row => row.pain);
  const makeFeatures = (series, i) => [series[i - 1], series[i - 2], series[i - 3], series[i - 7], i / rows.length, Math.sin(i * 2 * Math.PI / 7), Math.cos(i * 2 * Math.PI / 7)];
  const X = [], y = [];
  for (let i = 7; i < values.length; i++) { X.push(makeFeatures(values, i)); y.push(values[i]); }
  const split = Math.floor(X.length * 0.8);
  const model = M.regression(X.slice(0, split), y.slice(0, split));
  const predictions = model.predict(X.slice(split));
  // Refit on observed demo history only after recording held-out evaluation.
  const finalModel = M.regression(X, y), generated = values.slice(), forecasts = [];
  for (let horizon = 1; horizon <= 14; horizon++) {
    const predicted = M.clamp(finalModel.predict([makeFeatures(generated, generated.length)])[0], 0, 10);
    generated.push(predicted);
    const date = new Date(s.asOfDate + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + horizon);
    forecasts.push({ horizon, date: date.toISOString().slice(0, 10), predicted: round(predicted) });
  }
  return result('Autoregression with weekly features', s, { model: 'ElasticNet AR lags 1/2/3/7 + trend + weekly sine/cosine; no differencing or moving-average term', evaluation: { method: 'Chronological one-step holdout; recursive future horizons are not separately evaluated', trainingRows: split, heldOutRows: y.length - split, ...metrics(y.slice(split), predictions, M.mean(y.slice(0, split))) }, coefficients: finalModel.coefficients.map(round), forecasts, series: y.slice(split).map((actual, i) => ({ actual, predicted: round(predictions[i]) })) });
}
function runScenarioGeneration(s) {
  const correlations = runCorrelation(s);
  return result('Hypothetical scenario generation', s, { scenarios: correlations.pairs.filter(pair => pair.correlation !== null).slice().sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 3).map(pair => ({ feature: pair.feature, low: 0, high: pair.feature === 'energy' ? 10 : 1, recordedCorrelation: pair.correlation })), assumption: 'Select observed associations for synthetic comparisons. No causal inference.' });
}
function runScenarioExecution(s) {
  const { X, y } = supervised(s), model = M.regression(X, y);
  const base = s.rows.at(-1).features.slice();
  const scenarios = runScenarioGeneration(s).scenarios.map(scenario => {
    const j = s.featureNames.indexOf(scenario.feature), low = base.slice(), high = base.slice();
    low[j] = scenario.low; high[j] = scenario.high;
    const [lowPrediction, highPrediction] = model.predict([low, high]);
    return { ...scenario, lowPrediction: round(lowPrediction), highPrediction: round(highPrediction), difference: round(highPrediction - lowPrediction) };
  });
  return result('Hypothetical scenario execution', s, { scenarios, assumption: 'Model extrapolation under fixed features, not an intervention or medical recommendation.' });
}
function runCascade(s, projected = false, scoreOnly = false) {
  requireDemo(s, 40);
  const complete = s.rows.filter(row => row.pain !== null);
  if (!isConsecutive(complete)) throw new Error('Cascades need consecutive demo observations.');
  const states = complete.map(row => [row.pain, ...row.features]), X = states.slice(0, -1), next = states.slice(1);
  const split = Math.floor(X.length * 0.8), scaling = M.standardize(X.slice(0, split));
  const projection = projected ? M.pca(scaling.X, 4) : null;
  const transform = rows => projected ? M.pca(M.standardize(rows, scaling).X, 4, projection).scores : rows;
  const models = states[0].map((_, j) => M.regression(transform(X.slice(0, split)), next.slice(0, split).map(row => row[j])));
  const evaluation = models.map((model, j) => ({ field: j ? s.featureNames[j - 1] : 'demoPain', ...metrics(next.slice(split).map(row => row[j]), model.predict(transform(X.slice(split))), M.mean(next.slice(0, split).map(row => row[j]))) }));
  let current = states.at(-1).slice(); const forecasts = [];
  for (let horizon = 1; horizon <= 7; horizon++) {
    current = models.map(model => model.predict(transform([current]))[0]);
    // Bound all recursive states to their observed demo ranges.
    current = current.map((x, j) => M.clamp(x, Math.min(...states.map(row => row[j])), Math.max(...states.map(row => row[j]))));
    forecasts.push({ horizon, pain: round(current[0]), ...(scoreOnly ? {} : { features: current.slice(1).map(round) }) });
  }
  return result(projected ? 'PCA multivariate cascade' : scoreOnly ? 'Autoregressive demo score cascade' : 'Autoregressive symptom cascade', s, { evaluationMethod: 'Chronological one-step holdout with observed previous state; recursive seven-day forecasts are not separately evaluated', evaluation, forecasts, assumption: 'Recursive one-step state models. Later horizons compound modeling error.' });
}
function runPcaCascade(s) { return runCascade(s, true); }
function runScoreCascade(s) { return runCascade(s, false, true); }
function runSymptomCascade(s) { return runCascade(s); }
module.exports = { runLasso, runElasticNet, runLogisticLasso, runNaiveBayes, runPcaLasso, runPcaLogistic, runPca, runCorrelation, runTriggerAnalysis, runKMeans, runDbscan, runDtw, runOptimizedDtw, runPcaElasticNet, runElasticNetForecast, runFlareWindows, runFlareThreeDay, runAutoregressive, runScenarioGeneration, runScenarioExecution, runPcaCascade, runScoreCascade, runSymptomCascade };
