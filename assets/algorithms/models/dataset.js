const { random, clamp } = require('./math');
const FEATURES = ['dairy', 'spicy', 'caffeine', 'fiber', 'medicationTaken', 'energy'];
function createSnapshot(rows, { seed = 42, source = 'Demo logs', featureNames = FEATURES, limitRows = 180, targetNames = { pain: 'Recorded pain', energy: 'Physical energy', bowelFrequency: 'Bowel movements', moodValence: 'Mood valence' } } = {}) {
  const sorted = rows.filter(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date)).sort((a, b) => a.date.localeCompare(b.date)).slice(limitRows == null ? 0 : -limitRows);
  const clean = sorted.map(row => Object.freeze({
    date: row.date,
    targets: Object.freeze(Object.fromEntries(Object.entries({ ...(row.targets ?? {}), pain: row.pain }).map(([key, value]) => [key, value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value)]))),
    pain: row.pain == null || row.pain === '' || !Number.isFinite(Number(row.pain)) ? null : Number(row.pain),
    features: Object.freeze(featureNames.map((_, j) => Number.isFinite(Number(row.features?.[j])) ? Number(row.features[j]) : 0)),
    missingFeatures: Object.freeze(featureNames.map((_, j) => row.missingFeatures?.[j] ?? (row.features?.[j] == null || row.features[j] === '' || !Number.isFinite(Number(row.features[j]))))),
  }));
  const missingFeatureCounts = Object.freeze(featureNames.map((_, j) => clean.filter(row => row.missingFeatures[j]).length));
  return Object.freeze({ mode: 'demo', seed, source, asOfDate: clean.at(-1)?.date, featureNames: Object.freeze(featureNames.slice()), targetNames: Object.freeze({ ...targetNames }), rows: Object.freeze(clean), quality: Object.freeze({ missingPainDays: clean.filter(row => row.pain === null).length, missingFeatureCounts, assumedFeatureValues: missingFeatureCounts.reduce((a, b) => a + b, 0) }) });
}
function createCourseworkSnapshot(seed = 42, count = 150) {
  const rng = random(seed), rows = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10);
    const features = [+(rng() > 0.5), +(rng() > 0.6), +(rng() > 0.45), rng() * 2, +(rng() > 0.2), 4 + rng() * 5];
    const previous = rows.at(-1)?.features ?? features;
    const pain = clamp(3 + 2 * previous[0] + 1.4 * previous[1] - 0.6 * previous[3] - 0.8 * previous[4] + Math.sin(i * Math.PI / 7) + (rng() - 0.5) * 0.4, 0, 10);
    rows.push({ date, features, pain, targets: { pain, energy: features[5], bowelFrequency: Math.round(1 + pain / 2), moodValence: clamp(1 - pain / 12, 0, 1) } });
  }
  return createSnapshot(rows, { seed, source: `Seeded coursework data (${seed})` });
}
function requireDemo(snapshot, minimum = 12) {
  if (snapshot?.mode !== 'demo') throw new Error('Coursework algorithms only accept an explicit demo snapshot.');
  if (snapshot.rows.length < minimum) throw new Error(`This method needs at least ${minimum} calendar days. Use complete teaching history or add more logs.`);
}
function supervised(snapshot, horizon = 1, eventWindow = false, { lagged = false } = {}) {
  requireDemo(snapshot);
  const X = [], y = [], dates = [], rowIndices = [];
  const embedding = lagged ? require('./dayEmbedding').dayEmbedding(snapshot, { includePain: horizon > 0, includeTargets: false }) : null;
  const lookup = new Map(snapshot.rows.map(row => [row.date, row]));
  for (let i = 0; i < snapshot.rows.length; i++) {
    const date = new Date(snapshot.rows[i].date + 'T00:00:00Z');
    const future = Array.from({ length: eventWindow ? horizon : 1 }, (_, j) => {
      const target = new Date(date); target.setUTCDate(target.getUTCDate() + (eventWindow ? j + 1 : horizon));
      return lookup.get(target.toISOString().slice(0, 10));
    });
    let target;
    if (eventWindow) {
      target = future.some(row => row?.pain != null && row.pain >= 5) ? 1 : future.every(row => row?.pain != null) ? 0 : null;
    } else target = future[0]?.pain ?? null;
    if (target === null) continue;
    // Missingness is a model input, never a replacement target observation.
    X.push(embedding ? embedding.X[i] : [...snapshot.rows[i].features, ...snapshot.rows[i].missingFeatures.map(Number)]);
    y.push(target);
    const end = new Date(date); end.setUTCDate(end.getUTCDate() + horizon);
    dates.push(end.toISOString().slice(0, 10)); rowIndices.push(i);
  }
  if (X.length < 10) throw new Error('This question needs ten dated input/outcome pairs. Dates with an unknown outcome stay on the chart, but cannot teach the model an answer.');
  return { X, y, dates, rowIndices, embedding, featureNames: embedding?.featureNames ?? [...snapshot.featureNames, ...snapshot.featureNames.map(name => `Unlogged: ${name}`)] };
}
module.exports = { FEATURES, createSnapshot, createCourseworkSnapshot, requireDemo, supervised };
