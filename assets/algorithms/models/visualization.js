const { dtw, mean, pearson } = require('./math');
const DAY = 86400000;
const time = date => Date.parse(`${date}T00:00:00Z`);
const formatNumber = (value, digits = 2) => Number.isFinite(value) ? String(Number(value.toFixed(digits))) : '—';
function dateLabel(date) {
  if (!date || !Number.isFinite(time(date))) return date ?? '';
  return new Date(time(date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
function dateRange(start, days = 7) {
  const end = new Date(time(start) + (days - 1) * DAY).toISOString().slice(0, 10);
  return `${dateLabel(start)} – ${dateLabel(end)}`;
}
// Expand the calendar without inventing symptom observations.
function calendarRows(snapshot) {
  if (!snapshot.rows.length) return [];
  const lookup = new Map(snapshot.rows.map(row => [row.date, row]));
  const rows = [];
  for (let stamp = time(snapshot.rows[0].date); stamp <= time(snapshot.rows.at(-1).date); stamp += DAY) {
    const date = new Date(stamp).toISOString().slice(0, 10);
    rows.push(lookup.get(date) ?? { date, pain: null });
  }
  return rows;
}
const WINDOW_SIZES = [3, 5, 7, 14];
const MISSING_MISMATCH_COST = 25;
// A logging-pattern comparison: unknown/unknown costs 0, unknown/recorded
// costs 25, recorded/recorded uses squared pain difference. Never impute pain.
function missingAwareCost(a, b) {
  const observedA = Number.isFinite(a), observedB = Number.isFinite(b);
  return observedA && observedB ? (a - b) ** 2 : observedA === observedB ? 0 : MISSING_MISMATCH_COST;
}
function validWindows(snapshot, size = 7, minimumObserved = 2) {
  const calendar = calendarRows(snapshot), windows = [];
  for (let i = 0; i <= calendar.length - size; i++) {
    const rows = calendar.slice(i, i + size), values = rows.map(row => row.pain);
    const observed = values.filter(Number.isFinite).length;
    // Empty and single-observation periods cannot establish a pain shape.
    if (observed >= minimumObserved) windows.push({ index: i, first: rows[0].date, last: rows.at(-1).date, size, values, observed, missing: size - observed });
  }
  return windows;
}
function separateWindows(windows, reference) {
  return reference ? windows.filter(window => time(window.first) > time(reference.last) || time(window.last) < time(reference.first)) : [];
}
// Chronological outer reference, inner forward sweep. A pair is visited once,
// irrespective of its window lengths. The stride applies to calendar starts.
function windowScanPlan(windows, { referenceStep = 1, referenceSize = 0, comparisonSize = 0, startDate = null, endDate = null, sameLengthOnly = false } = {}) {
  const ordered = [...windows].sort((a, b) => a.first.localeCompare(b.first) || a.size - b.size);
  const origin = startDate ? time(startDate) : time(ordered[0]?.first);
  // Parse each window's dates once, rather than millions of times inside the
  // all-year pair filter. Keep the same chronological pair ordering.
  const dated = ordered.map(window => ({ window, start: time(window.first), end: time(window.last) }));
  const end = endDate ? time(endDate) : Infinity;
  const step = Math.max(1, Math.min(4, referenceStep));
  let total = 0;
  const sweeps = dated.filter(item => (!referenceSize || item.window.size === referenceSize) && item.start >= origin && Math.round((item.start - origin) / DAY) % step === 0).flatMap(item => {
    const reference = item.window;
    const candidates = dated.filter(candidate => candidate.start > item.end && candidate.end <= end && (!sameLengthOnly || candidate.window.size === reference.size) && (!comparisonSize || candidate.window.size === comparisonSize) && Math.min(reference.size, candidate.window.size) / Math.max(reference.size, candidate.window.size) >= 0.5).map(candidate => candidate.window);
    if (!candidates.length) return [];
    const sweep = { reference, candidates, offset: total };
    total += candidates.length;
    return [sweep];
  });
  return { sweeps, total };
}
function scanFrame(plan, step) {
  if (!plan.total) return null;
  const position = Math.max(0, Math.min(plan.total - 1, step));
  let lo = 0, hi = plan.sweeps.length - 1;
  while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (plan.sweeps[mid].offset <= position) lo = mid; else hi = mid - 1; }
  const sweep = plan.sweeps[lo], candidateIndex = position - sweep.offset;
  return { reference: sweep.reference, candidate: sweep.candidates[candidateIndex], sweep, sweepIndex: lo, candidateIndex };
}
function compareWindows(first, second, band = 2, rolling = false) {
  const comparison = dtw(first.values, second.values, band, rolling, missingAwareCost);
  // Same normalization in both memory modes, including different lengths.
  return { ...comparison, score: comparison.distance / Math.sqrt(Math.max(first.values.length, second.values.length)) };
}
function windowContext(snapshot, first, second, lag = 0) {
  if (!first || !second) return [];
  const lookup = new Map(snapshot.rows.map(row => [row.date, row]));
  const foods = ['dairy', 'spicy', 'caffeine', 'fiber', 'gluten', 'calories', 'protein', 'fat', 'carbs', 'sugar', 'sodium'];
  const samples = window => Array.from({ length: window.size }, (_, i) => {
    const date = time(window.first) + i * DAY;
    return { input: lookup.get(new Date(date - lag * DAY).toISOString().slice(0, 10)), pain: lookup.get(new Date(date).toISOString().slice(0, 10))?.pain };
  });
  const firstSamples = samples(first), secondSamples = samples(second);
  return snapshot.featureNames.map((feature, j) => {
    const period = entries => entries.filter(row => row.input && !row.input.missingFeatures[j]).map(row => ({ input: row.input.features[j], pain: row.pain }));
    const a = period(firstSamples), b = period(secondSamples), paired = [...a, ...b].filter(row => Number.isFinite(row.pain));
    return { feature, group: foods.includes(feature) ? 'Foods' : feature === 'medicationTaken' || feature.startsWith('Medication:') ? 'Medications' : 'Symptoms', firstMean: a.length ? mean(a.map(row => row.input)) : null, secondMean: b.length ? mean(b.map(row => row.input)) : null, firstCount: a.length, secondCount: b.length, correlation: paired.length >= 3 ? pearson(paired.map(row => row.input), paired.map(row => row.pain)) : null, pairedCount: paired.length };
  });
}
function confusion(series) {
  const counts = { truePositive: 0, trueNegative: 0, falsePositive: 0, falseNegative: 0 };
  for (const row of series) {
    const predicted = row.predicted >= 0.5, actual = row.actual === 1;
    counts[actual ? predicted ? 'truePositive' : 'falseNegative' : predicted ? 'falsePositive' : 'trueNegative']++;
  }
  return counts;
}
// Break at unknown values and missing dates; never draw imputed connecting data.
function lineSegments(values, key, x, y) {
  const segments = []; let current = [];
  values.forEach((row, i) => {
    const gap = i && row.date && values[i - 1].date && time(row.date) - time(values[i - 1].date) > DAY;
    if (gap || !Number.isFinite(row[key])) { if (current.length) segments.push(current); current = []; }
    if (Number.isFinite(row[key])) current.push(`${x(i)},${y(row[key])}`);
  });
  if (current.length) segments.push(current);
  return segments;
}
module.exports = { DAY, time, formatNumber, dateLabel, dateRange, calendarRows, WINDOW_SIZES, MISSING_MISMATCH_COST, missingAwareCost, validWindows, separateWindows, windowScanPlan, scanFrame, compareWindows, windowContext, confusion, lineSegments };
