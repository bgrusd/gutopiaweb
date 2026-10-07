const { random, clamp } = require('./math');
const FEATURES = ['dairy', 'spicy', 'caffeine', 'fiber', 'medicationTaken', 'energy'];
function createSnapshot(rows, { seed = 42, source = 'Demo logs' } = {}) {
  const sorted = rows.filter(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date)).sort((a, b) => a.date.localeCompare(b.date)).slice(-180);
  const clean = sorted.map(row => Object.freeze({
    date: row.date,
    pain: row.pain == null || row.pain === '' || !Number.isFinite(Number(row.pain)) ? null : Number(row.pain),
    features: Object.freeze(FEATURES.map((_, j) => Number.isFinite(Number(row.features?.[j])) ? Number(row.features[j]) : 0)),
  }));
  return Object.freeze({ mode: 'demo', seed, source, asOfDate: clean.at(-1)?.date, featureNames: Object.freeze(FEATURES.slice()), rows: Object.freeze(clean) });
}
function createCourseworkSnapshot(seed = 42, count = 150) {
  const rng = random(seed), rows = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10);
    const features = [+(rng() > 0.5), +(rng() > 0.6), +(rng() > 0.45), rng() * 2, +(rng() > 0.2), 4 + rng() * 5];
    const previous = rows.at(-1)?.features ?? features;
    const pain = clamp(3 + 2 * previous[0] + 1.4 * previous[1] - 0.6 * previous[3] - 0.8 * previous[4] + Math.sin(i * Math.PI / 7) + (rng() - 0.5) * 0.4, 0, 10);
    rows.push({ date, features, pain });
  }
  return createSnapshot(rows, { seed, source: `Seeded coursework data (${seed})` });
}
function requireDemo(snapshot, minimum = 12) {
  if (snapshot?.mode !== 'demo') throw new Error('Coursework algorithms only accept an explicit demo snapshot.');
  if (snapshot.rows.length < minimum) throw new Error(`This demonstration needs at least ${minimum} demo days. Use the seeded coursework dataset or generate more demo logs.`);
}
function supervised(snapshot, horizon = 1) {
  requireDemo(snapshot);
  const X = [], y = [], dates = [], rowIndices = [];
  for (let i = 0; i < snapshot.rows.length - horizon; i++) {
    const next = snapshot.rows[i + horizon];
    const expected = new Date(snapshot.rows[i].date + 'T12:00:00Z'); expected.setUTCDate(expected.getUTCDate() + horizon);
    if (next.date !== expected.toISOString().slice(0, 10) || next.pain === null) continue;
    X.push(snapshot.rows[i].features.slice()); y.push(next.pain); dates.push(next.date); rowIndices.push(i);
  }
  if (X.length < 10) throw new Error('Not enough complete, consecutive demo observations for this horizon.');
  return { X, y, dates, rowIndices };
}
module.exports = { FEATURES, createSnapshot, createCourseworkSnapshot, requireDemo, supervised };
