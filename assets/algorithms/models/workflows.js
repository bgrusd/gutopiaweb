const M = require('./math');
const { requireDemo, supervised } = require('./dataset');
const V = require('./visualization');
const { daySpace } = require('./projection');
const { measures } = require('./dayEmbedding');
const { triggerComparison } = require('./relationships');
const DISCLAIMER = 'Educational analysis. These outputs are not validated medical predictions.';
const round = x => Number.isFinite(x) ? Math.round(x * 1000) / 1000 : null;
const result = (title, snapshot, data) => ({ title, source: snapshot.source, asOfDate: snapshot.asOfDate, disclaimer: DISCLAIMER, ...data });
function metrics(y, predictions, baseline) {
  const mse = M.mean(y.map((x, i) => (x - predictions[i]) ** 2));
  const total = y.reduce((s, x) => s + (x - M.mean(y)) ** 2, 0);
  return { mae: round(M.mean(y.map((value, i) => Math.abs(value - predictions[i])))), rmse: round(Math.sqrt(mse)), r2: total ? round(1 - mse * y.length / total) : null, baselineRmse: round(Math.sqrt(M.mean(y.map(x => (x - baseline) ** 2)))) };
}
function classificationMetrics(y, p) {
  const tp = y.filter((x, i) => x === 1 && p[i] >= 0.5).length;
  const fp = y.filter((x, i) => x === 0 && p[i] >= 0.5).length;
  const fn = y.filter((x, i) => x === 1 && p[i] < 0.5).length;
  return { accuracy: round(M.mean(y.map((x, i) => +(x === +(p[i] >= 0.5))))), precision: tp + fp ? round(tp / (tp + fp)) : null, recall: tp + fn ? round(tp / (tp + fn)) : null, brier: round(M.mean(y.map((x, i) => (x - p[i]) ** 2))) };
}
const binaryValue = (pain, kind) => kind === 'logistic' || kind === 'bayes' ? +(pain >= 5) : pain;
function fitPrediction(snapshot, { kind = 'elastic', horizon = 1, projected = false, lambda = 0.04, eventWindow = false } = {}) {
  const dataset = supervised(snapshot, horizon, eventWindow, { lagged: true });
  const split = Math.floor(dataset.X.length * 0.8), trainEnd = split - horizon;
  if (trainEnd < 8 || dataset.X.length - split < 2) throw new Error('Not enough observations for separate training and holdout periods.');
  let train = dataset.X.slice(0, trainEnd), test = dataset.X.slice(split), current = [dataset.embedding.X.at(-1)];
  let projection = null, modelProjectionNormalization = null;
  if (projected) {
    const normalization = M.standardize(train); modelProjectionNormalization = normalization;
    projection = M.leadingPca(normalization.X, Math.min(4, train[0].length));
    const transform = rows => M.pca(M.standardize(rows, normalization).X, 4, projection).scores;
    train = projection.scores; test = transform(test); current = transform(current);
  }
  const binary = kind === 'logistic' || kind === 'bayes';
  const labels = binary && !eventWindow ? dataset.y.map(x => +(x >= 5)) : dataset.y;
  const yTrain = labels.slice(0, trainEnd), yTest = labels.slice(split);
  let model;
  if (kind === 'logistic') model = M.logistic(train, yTrain, { lambda });
  else if (kind === 'bayes') model = M.bernoulliNB(train, yTrain);
  else model = M.regression(train, yTrain, { lambda, l1Ratio: kind === 'lasso' ? 1 : 0.5 });
  const allInputs = dataset.embedding.X;
  const allTransformed = projection ? M.pca(M.standardize(allInputs, modelProjectionNormalization).X, 4, projection).scores : allInputs;
  const allPredictions = model.predict(allTransformed);
  const predictions = model.predict(test), trainingPredictions = model.predict(train), currentPrediction = model.predict(current)[0];
  const predictedByDate = new Map();
  trainingPredictions.forEach((predicted, i) => predictedByDate.set(dataset.dates[i], { predicted: round(predicted), phase: 'Training fit' }));
  predictions.forEach((predicted, i) => predictedByDate.set(dataset.dates[split + i], { predicted: round(predicted), phase: 'Held-out prediction' }));
  const eventByDate = new Map(dataset.dates.map((date, i) => [date, dataset.y[i]]));
  const timelineSeries = V.calendarRows(snapshot).map(row => ({ date: row.date, actual: eventWindow ? eventByDate.get(row.date) ?? null : row.pain == null ? null : binaryValue(row.pain, kind), predicted: null, phase: 'No eligible model pair', ...predictedByDate.get(row.date) }));
  const inputDate = snapshot.rows.at(-1).date;
  const forecastDate = new Date(V.time(inputDate) + horizon * V.DAY).toISOString().slice(0, 10);
  const featureNames = projected ? train[0].map((_, j) => `PC${j + 1}`) : dataset.featureNames;
  return {
    horizon, eventWindow, embeddingLags: [0, 1, 3, 7], inputFeatureNames: dataset.featureNames, estimates: snapshot.rows.map((row, i) => { const paired = dataset.rowIndices.indexOf(i); return { date: row.date, predicted: round(allPredictions[i]), actual: paired >= 0 ? labels[paired] : null, phase: paired < 0 ? 'Outcome unknown' : paired < trainEnd ? 'Used to fit' : paired >= split ? 'Checked afterward' : 'Separation period' }; }), target: eventWindow ? `At least one recorded pain ≥ 5 day in the next ${horizon} calendar day(s)` : binary ? `Pain rating ≥ 5 exactly ${horizon} day(s) ahead` : `Pain rating exactly ${horizon} day(s) ahead`,
    evaluation: { split: 'Chronological 80/20, with a horizon-sized gap', trainingRows: trainEnd, heldOutRows: yTest.length, ...(binary ? { ...classificationMetrics(yTest, predictions), wrongCalls: yTest.filter((actual, i) => actual !== +(predictions[i] >= 0.5)).length, probabilityError: round(M.mean(yTest.map((actual, i) => Math.abs(actual - predictions[i]))) * 100) } : metrics(yTest, predictions, M.mean(yTrain))) },
    trainingMetrics: binary ? classificationMetrics(yTrain, trainingPredictions) : metrics(yTrain, trainingPredictions, M.mean(yTrain)),
    coefficients: model.coefficients?.map((coefficient, j) => ({ feature: featureNames[j], value: round(coefficient) })) ?? null,
    probabilities: binary ? predictions.map(round) : null,
    projection: projection ? { explainedVariance: projection.explainedVariance.map(round), loadings: projection.loadings } : null,
    series: yTest.map((actual, i) => ({ date: dataset.dates[split + i], actual, predicted: round(predictions[i]) })),
    timelineSeries, inputDate, forecastDate, missingInputFeatures: snapshot.featureNames.filter((_, j) => snapshot.rows.at(-1).missingFeatures[j]),
    prediction: round(currentPrediction), parameters: model.parameters ?? null,
  };
}
function symptomSnapshot(s, { target = 'pain', inputs = 'all', lag = 1 } = {}) {
  const indices = s.featureNames.map((name, j) => ({ name, j })).filter(({ name }) => {
    if (lag === 0 && name === target) return false;
    const food = ['dairy', 'spicy', 'caffeine', 'fiber', 'gluten', 'calories', 'protein', 'fat', 'carbs', 'sugar', 'sodium'].includes(name);
    const med = name === 'medicationTaken' || name.startsWith('Medication:');
    return inputs === 'all' || inputs === 'foods' && food || inputs === 'medications' && med || inputs === 'foods-and-medications' && (food || med);
  }).map(({ j }) => j);
  return { ...s, targetName: s.targetNames[target] ?? target, featureNames: indices.map(j => s.featureNames[j]), rows: s.rows.map(row => ({ ...row, pain: target === 'pain' ? row.pain : row.targets?.[target] ?? null, features: indices.map(j => row.features[j]), missingFeatures: indices.map(j => row.missingFeatures[j]) })) };
}
function runLasso(s, options = {}) { const data = symptomSnapshot(s, options); return result('Food, medication and symptom relationships', s, { ...fitPrediction(data, { kind: 'lasso', horizon: options.lag ?? 1 }), targetName: data.targetName }); }
function runElasticNet(s, options = {}) { const data = symptomSnapshot(s, options); return result('Food, medication and symptom relationships', s, { ...fitPrediction(data, { horizon: options.lag ?? 1 }), targetName: data.targetName }); }
function runLogisticLasso(s) { return result('Logistic LASSO', s, fitPrediction(s, { kind: 'logistic' })); }
function runNaiveBayes(s) { return result('Bernoulli Naive Bayes', s, fitPrediction(s, { kind: 'bayes' })); }
function runPcaLasso(s) { return result('PCA + LASSO', s, fitPrediction(s, { kind: 'lasso', projected: true })); }
function runPcaLogistic(s) { return result('PCA + logistic LASSO', s, fitPrediction(s, { kind: 'logistic', projected: true })); }
function runPca(s) {
  requireDemo(s);
  const { embedding, pca: model } = daySpace(s);
  return result('Map similar days', s, { features: embedding.featureNames, embeddingLags: embedding.lags, explainedVariance: model.explainedVariance.map(round), loadings: model.loadings, clusteringSpace: model.scores, points: model.scores.map((point, i) => ({ x: point[0], y: point[1] ?? 0, date: s.rows[i].date })) });
}
function runCorrelation(s) {
  requireDemo(s, 6);
  const lookup = new Map(s.rows.map(row => [row.date, row]));
  const pairs = [0, 1, 3, 7].flatMap(lag => s.featureNames.map((feature, j) => {
    const paired = s.rows.flatMap(row => {
      const target = lookup.get(new Date(V.time(row.date) + lag * V.DAY).toISOString().slice(0, 10));
      return !row.missingFeatures[j] && target?.pain != null ? [[row.features[j], target.pain]] : [];
    });
    return { feature, lag, correlation: round(M.pearson(paired.map(row => row[0]), paired.map(row => row[1]))), observations: paired.length };
  }));
  const matrix = s.featureNames.map((_, j) => s.featureNames.map((__, k) => {
    const paired = s.rows.filter(row => !row.missingFeatures[j] && !row.missingFeatures[k]);
    return round(M.pearson(paired.map(row => row.features[j]), paired.map(row => row.features[k])));
  }));
  return result('What occurs around symptom changes?', s, { pairs, matrix, lags: [0, 1, 3, 7] });
}
function runTriggerAnalysis(s, { input = null, target = 'pain', lag = 1 } = {}) {
  requireDemo(s);
  const inputs = input ? [input] : measures(s).filter(item => item.group === 'Foods' || item.group === 'Medications').map(item => item.key);
  return result('Recorded food and medication comparisons', s, { target, lag, comparisons: inputs.map(key => triggerComparison(s, key, target, lag)) });
}
function runKMeans(s, { k = 3, space = 'full' } = {}) {
  const projected = runPca(s), X = space === 'pca' ? projected.clusteringSpace : daySpace(s).X;
  const clusters = M.kmeans(X, k, s.seed);
  return result(`${space === 'pca' ? 'PCA summaries' : 'Full day history'} + K-means (K = ${k})`, s, { ...clusters, groupingSpace: space, groupingDimensions: X[0].length, missingFlagWeight: 0.25, explainedVariance: projected.explainedVariance, embeddingLags: projected.embeddingLags, features: projected.features, loadings: projected.loadings, points: projected.points.map((point, i) => ({ ...point, cluster: clusters.labels[i] })) });
}
function runDbscan(s, { radiusScale = 1, space = 'full' } = {}) {
  const projected = runPca(s), X = space === 'pca' ? projected.clusteringSpace : daySpace(s).X;
  const neighbors = X.map((row, i) => X.filter((_, j) => j !== i).map(other => M.distance(row, other)).sort((a, b) => a - b)[2] ?? 0).sort((a, b) => a - b);
  const epsilon = Math.max(0.01, (neighbors[Math.floor(neighbors.length * 0.5)] ?? 0.7) * radiusScale);
  const clusters = M.dbscan(X, epsilon, 4);
  return result(`${space === 'pca' ? 'PCA summaries' : 'Full day history'} + DBSCAN`, s, { ...clusters, epsilon, minPoints: 4, groupingSpace: space, groupingDimensions: X[0].length, missingFlagWeight: 0.25, explainedVariance: projected.explainedVariance, embeddingLags: projected.embeddingLags, features: projected.features, loadings: projected.loadings, points: projected.points.map((point, i) => ({ ...point, cluster: clusters.labels[i] })) });
}
function* dtwSearch(s, optimized = false) {
  requireDemo(s, 6);
  const windows = V.WINDOW_SIZES.flatMap(size => V.validWindows(s, size));
  const best = []; let comparisons = 0;
  const plan = V.windowScanPlan(windows);
  for (const sweep of plan.sweeps) {
    const a = sweep.reference;
    for (const b of sweep.candidates) {
      const alignment = V.compareWindows(a, b, 2, true); comparisons++;
      const match = { first: a.first, second: b.first, firstSize: a.size, secondSize: b.size, firstObserved: a.observed, secondObserved: b.observed, distance: round(alignment.distance), score: round(alignment.score), firstValues: a.values, secondValues: b.values };
      best.push(match); best.sort((x, y) => x.score - y.score || (y.firstObserved + y.secondObserved) - (x.firstObserved + x.secondObserved));
      if (best.length > 5) best.pop();
      if (comparisons % 128 === 0) yield { comparisons, total: plan.total };
    }
  }
  if (!best.length) throw new Error('DTW needs two separate calendar windows with at least two recorded pain values in each. Missing days stay in the pattern.');
  const motifs = best.map(match => ({ ...match, path: optimized ? [] : V.compareWindows({ values: match.firstValues }, { values: match.secondValues }, 2).path }));
  return result(optimized ? 'DTW with rolling memory' : 'Dynamic time warping', s, { windowSizes: V.WINDOW_SIZES, window: motifs[0].firstSize, band: 2, motifs, comparisons, memory: optimized ? 'O(window)' : 'O(window²)', missingMismatchCost: V.MISSING_MISMATCH_COST, scoreDefinition: 'sqrt(total squared cost / longer window length); missing/missing costs 0; missing/recorded costs 25', search: 'Hold each reference still and sweep only later non-overlapping periods. Advance the reference one calendar day and repeat, across all compatible lengths. Each unordered pair is scored once with banded dynamic programming; rolling memory ranks pairs and full mode reconstructs only the five winning paths.' });
}
function runDtw(s, optimized = false) {
  const search = dtwSearch(s, optimized);
  let next;
  do { next = search.next(); } while (!next.done);
  return next.value;
}
async function runDtwAsync(s, { optimized = false, isCurrent = () => true, onProgress = () => {} } = {}) {
  const search = dtwSearch(s, optimized);
  while (isCurrent()) {
    const started = Date.now();
    let next;
    do {
      if (!isCurrent()) return null;
      next = search.next();
      if (next.done) return next.value;
    } while (Date.now() - started < 8);
    onProgress(next.value.comparisons, next.value.total);
    // Release the JS thread so navigation, touch and scrolling can proceed.
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  return null;
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
function runFlareWindows(s, { inputDate = s.asOfDate } = {}) {
  requireDemo(s);
  const history = { ...s, rows: s.rows.filter(row => row.date <= inputDate), asOfDate: inputDate };
  if (!history.rows.some(row => row.date === inputDate)) throw new Error('Choose an input date in this history.');
  return result('Could symptoms worsen soon?', history, { trainingCutoff: inputDate, target: 'At least one pain ≥ 5 day within the next 1/3/7 calendar days; an example event, not a diagnosed flare', windows: [1, 3, 7].map(horizon => {
    try { return fitPrediction(history, { horizon, kind: 'logistic', eventWindow: true }); }
    catch (error) {
      if (!/Both classes|ten dated|Not enough|at least/.test(error.message)) throw error;
      let known = { dates: [], y: [], rowIndices: [] };
      try { known = supervised(history, horizon, true); } catch (_) { /* unknown outcomes stay unknown */ }
      const answers = new Map(known.rowIndices.map((index, i) => [history.rows[index].date, known.y[i]]));
      return { horizon, unavailable: true, series: V.calendarRows(history).map(row => ({ date: row.date, actual: answers.get(row.date) ?? null })), knownOutcomes: known.y.length, observedEvents: known.y.filter(Boolean).length, reason: /Both classes/.test(error.message) ? 'This period has only one kind of recorded outcome. The model needs examples with and without high symptoms to learn the difference.' : 'There are too few known future outcomes to fit and check this period. The dates are kept; unlogged outcomes remain unknown.' };
    }
  }) });
}
function runFlareThreeDay(s) { return result('Three-day logistic classifier', s, fitPrediction(s, { horizon: 3, kind: 'logistic' })); }
function runAutoregressive(s) {
  requireDemo(s, 30);
  const rows = V.calendarRows(s), values = rows.map(row => row.pain), lags = [1, 2, 3, 7];
  const makeFeatures = (series, i) => {
    const history = lags.map(lag => series[i - lag]);
    return [...history.map(value => Number.isFinite(value) ? value : 0), ...history.map(value => +!Number.isFinite(value)), i / rows.length, Math.sin(i * 2 * Math.PI / 7), Math.cos(i * 2 * Math.PI / 7)];
  };
  const X = [], y = [], indices = [];
  for (let i = 7; i < values.length; i++) if (Number.isFinite(values[i])) { X.push(makeFeatures(values, i)); y.push(values[i]); indices.push(i); }
  const split = Math.floor(X.length * 0.8);
  if (split < 8 || y.length - split < 2) throw new Error('Autoregression needs at least ten recorded outcomes after the first week to fit and check separately. Unlogged days remain in its history.');
  const model = M.regression(X.slice(0, split), y.slice(0, split));
  const allPredictions = model.predict(X), predictions = allPredictions.slice(split);
  const predictionsByDate = new Map(indices.map((index, i) => [rows[index].date, { predicted: round(allPredictions[i]), phase: i < split ? 'Training fit' : 'Held-out prediction' }]));
  const finalModel = M.regression(X, y), generated = values.slice(), forecasts = [];
  for (let horizon = 1; horizon <= 14; horizon++) {
    const predicted = M.clamp(finalModel.predict([makeFeatures(generated, generated.length)])[0], 0, 10);
    generated.push(predicted);
    forecasts.push({ horizon, date: new Date(V.time(s.asOfDate) + horizon * V.DAY).toISOString().slice(0, 10), predicted: round(predicted) });
  }
  return result('Pain history forecast', s, { model: 'ElasticNet with calendar lags 1/2/3/7 and four missing-history flags, trend and weekly cycle; no differencing or moving-average term', evaluation: { method: 'Chronological one-step holdout; recursive future horizons are not separately evaluated', trainingRows: split, heldOutRows: y.length - split, ...metrics(y.slice(split), predictions, M.mean(y.slice(0, split))) }, coefficients: finalModel.coefficients.map((value, j) => ({ feature: ['Pain 1 day earlier', 'Pain 2 days earlier', 'Pain 3 days earlier', 'Pain 7 days earlier', 'Unlogged pain 1 day earlier', 'Unlogged pain 2 days earlier', 'Unlogged pain 3 days earlier', 'Unlogged pain 7 days earlier', 'Time trend', 'Weekly sine', 'Weekly cosine'][j], value: round(value) })), forecasts, timelineSeries: rows.map(row => ({ date: row.date, actual: row.pain, predicted: null, phase: 'Outcome unknown', ...predictionsByDate.get(row.date) })), series: y.slice(split).map((actual, i) => ({ date: rows[indices[split + i]].date, actual, predicted: round(predictions[i]) })) });
}
function runScenarioGeneration(s) {
  const correlations = runCorrelation(s);
  return result('Hypothetical scenario generation', s, { scenarios: correlations.pairs.filter(pair => pair.lag === 1 && pair.correlation !== null).slice().sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 3).map(pair => { const j = s.featureNames.indexOf(pair.feature), observed = s.rows.filter(row => !row.missingFeatures[j]).map(row => row.features[j]); return { feature: pair.feature, low: Math.min(...observed), high: Math.max(...observed), recordedCorrelation: pair.correlation }; }), assumption: 'Select observed associations for synthetic comparisons. No causal inference.' });
}
function runScenarioExecution(s, { inputDate = s.asOfDate, changes = null } = {}) {
  if (changes) return executeEditedScenario(s, inputDate, changes);
  const { X, y } = supervised(s), model = M.regression(X, y);
  const base = [...s.rows.at(-1).features, ...s.rows.at(-1).missingFeatures.map(Number)];
  const scenarios = runScenarioGeneration(s).scenarios.map(scenario => {
    const j = s.featureNames.indexOf(scenario.feature), low = base.slice(), high = base.slice();
    low[j] = scenario.low; high[j] = scenario.high;
    // Supplying a hypothetical value resolves only that scenario input.
    low[j + s.featureNames.length] = 0; high[j + s.featureNames.length] = 0;
    const [lowPrediction, highPrediction] = model.predict([low, high]);
    return { ...scenario, lowPrediction: round(lowPrediction), highPrediction: round(highPrediction), difference: round(highPrediction - lowPrediction) };
  });
  return result('Hypothetical scenario execution', s, { scenarios, assumption: 'Model extrapolation under fixed features, not an intervention or medical recommendation.' });
}
function executeEditedScenario(s, inputDate, changes) {
  const history = { ...s, rows: s.rows.filter(row => row.date <= inputDate), asOfDate: inputDate };
  const source = history.rows.find(row => row.date === inputDate);
  if (!source) throw new Error('Choose a recorded input date.');
  const dataset = supervised(history, 1, false, { lagged: true });
  const model = M.regression(dataset.X, dataset.y);
  const baseline = dataset.embedding.X.at(-1).slice(), modified = baseline.slice(), applied = [];
  for (const [key, value] of Object.entries(changes)) {
    const j = dataset.embedding.columns.findIndex(column => column.key === key && column.lag === 0);
    if (j < 0 || !Number.isFinite(value)) throw new Error('Choose a measured input and a finite scenario value.');
    modified[j] = value; modified[j + dataset.embedding.columns.length] = 0;
    applied.push({ feature: key, value });
  }
  const [baselinePrediction, scenarioPrediction] = model.predict([baseline, modified]);
  return result('What if an input were different?', s, { inputDate, forecastDate: new Date(V.time(inputDate) + V.DAY).toISOString().slice(0, 10), baselinePrediction: round(baselinePrediction), scenarioPrediction: round(scenarioPrediction), difference: round(scenarioPrediction - baselinePrediction), changes: applied, trainingRows: dataset.y.length, assumption: 'A comparison of model estimates using history available by the selected date. It does not establish the effect of changing a food or medication.' });
}
function runCascade(s, projected = false, scoreOnly = false) {
  requireDemo(s, 40);
  const complete = s.rows.filter(row => row.pain !== null);
  if (!isConsecutive(complete)) throw new Error('This cascade needs consecutive recorded outcomes. Unlogged outcomes cannot become training labels.');
  const indices = s.featureNames.map((_, j) => j).filter(j => complete.some(row => !row.missingFeatures[j]));
  if (complete.some(row => indices.some(j => row.missingFeatures[j]))) throw new Error('This advanced cascade needs complete recorded states for the included measurements. Use complete teaching history; unknown outcomes cannot be invented.');
  const featureNames = indices.map(j => s.featureNames[j]);
  const states = complete.map(row => [row.pain, ...indices.map(j => row.features[j])]), X = states.slice(0, -1), next = states.slice(1);
  const split = Math.floor(X.length * 0.8), scaling = M.standardize(X.slice(0, split));
  const projection = projected ? M.pca(scaling.X, 4) : null;
  const transform = rows => projected ? M.pca(M.standardize(rows, scaling).X, 4, projection).scores : rows;
  const models = states[0].map((_, j) => M.regression(transform(X.slice(0, split)), next.slice(0, split).map(row => row[j])));
  const evaluation = models.map((model, j) => ({ field: j ? featureNames[j - 1] : 'pain', ...metrics(next.slice(split).map(row => row[j]), model.predict(transform(X.slice(split))), M.mean(next.slice(0, split).map(row => row[j]))) }));
  let current = states.at(-1).slice(); const forecasts = [];
  for (let horizon = 1; horizon <= 7; horizon++) {
    current = models.map(model => model.predict(transform([current]))[0]);
    // Bound all recursive states to their observed demo ranges.
    current = current.map((x, j) => M.clamp(x, Math.min(...states.map(row => row[j])), Math.max(...states.map(row => row[j]))));
    forecasts.push({ horizon, pain: round(current[0]), ...(scoreOnly ? {} : { features: current.slice(1).map(round) }) });
  }
  return result(projected ? 'PCA multivariate cascade' : scoreOnly ? 'Recursive pain cascade' : 'Recursive symptom cascade', s, { featureNames, evaluationMethod: 'Chronological one-step holdout with observed previous state; recursive seven-day forecasts are not separately evaluated', evaluation, forecasts, assumption: 'Recursive one-step state models. Later horizons compound modeling error.' });
}
function runPcaCascade(s) { return runCascade(s, true); }
function runScoreCascade(s) { return runCascade(s, false, true); }
function runSymptomCascade(s) { return runCascade(s); }
module.exports = { runLasso, runElasticNet, runLogisticLasso, runNaiveBayes, runPcaLasso, runPcaLogistic, runPca, runCorrelation, runTriggerAnalysis, runKMeans, runDbscan, runDtw, runDtwAsync, runOptimizedDtw, runPcaElasticNet, runElasticNetForecast, runFlareWindows, runFlareThreeDay, runAutoregressive, runScenarioGeneration, runScenarioExecution, runPcaCascade, runScoreCascade, runSymptomCascade };
