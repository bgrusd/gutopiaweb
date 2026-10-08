const { pearson, mean } = require('./math');
const { measures, stamp, DAY } = require('./dayEmbedding');
function relationship(snapshot, firstKey, secondKey, lag = 0) {
  const descriptors = measures(snapshot), first = descriptors.find(item => item.key === firstKey), second = descriptors.find(item => item.key === secondKey);
  const lookup = new Map(snapshot.rows.map(row => [row.date, row]));
  const points = first && second ? snapshot.rows.flatMap(row => {
    const inputDate = new Date(stamp(row.date) - lag * DAY).toISOString().slice(0, 10);
    const input = first.read(lookup.get(inputDate)), outcome = second.read(row);
    return Number.isFinite(input) && Number.isFinite(outcome) ? [{ date: row.date, inputDate, input, outcome }] : [];
  }) : [];
  const r = points.length >= 3 ? pearson(points.map(row => row.input), points.map(row => row.outcome)) : null;
  const strength = r == null ? 'No measurable pattern' : Math.abs(r) >= 0.7 ? 'Strong pattern' : Math.abs(r) >= 0.4 ? 'Moderate pattern' : 'Weak pattern';
  const timing = lag ? `${lag} calendar day${lag === 1 ? '' : 's'} earlier` : 'on the same day';
  const explanation = firstKey === secondKey && !lag ? 'This compares the measurement with itself. Pick a different square to explore a relationship.' : r == null ? `There are too few recorded pairs, or one measurement did not change. Missing entries are excluded from this comparison.` : Math.abs(r) < 0.15 ? `There is little straight-line relationship between ${first.label.toLowerCase()} ${timing} and ${second.label.toLowerCase()} in these records.` : `Higher ${first.label.toLowerCase()} ${timing} tended to accompany ${r >= 0 ? 'higher' : 'lower'} ${second.label.toLowerCase()}.`;
  return { first: first ? { key: first.key, label: first.label, unit: first.unit } : null, second: second ? { key: second.key, label: second.label, unit: second.unit } : null, lag, correlation: r, observations: points.length, points, strength, explanation };
}
function triggerComparison(snapshot, input, target = 'pain', lag = 1) {
  const relation = relationship(snapshot, input, target, lag);
  const levels = relation.points.map(row => row.input).sort((a, b) => a - b);
  const binary = levels.every(value => value === 0 || value === 1);
  const cut = binary ? 0 : levels[Math.floor(levels.length / 2)] ?? null;
  const lower = relation.points.filter(row => row.input <= cut), higher = relation.points.filter(row => row.input > cut);
  const lowMean = lower.length ? mean(lower.map(row => row.outcome)) : null, highMean = higher.length ? mean(higher.map(row => row.outcome)) : null;
  return { ...relation, feature: input, target, binary, cut, lower, higher, lowMean, highMean, exposedDays: higher.length, comparisonDays: lower.length, difference: lowMean != null && highMean != null ? highMean - lowMean : null };
}
module.exports = { relationship, triggerComparison };
