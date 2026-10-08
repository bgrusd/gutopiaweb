const DAY = 86400000;
const stamp = date => Date.parse(`${date}T00:00:00Z`);
const FOOD_KEYS = ['dairy', 'spicy', 'caffeine', 'fiber', 'gluten', 'calories', 'protein', 'fat', 'carbs', 'sugar', 'sodium'];
const LABELS = { pain: 'Pain', dairy: 'Dairy', spicy: 'Spicy food', caffeine: 'Caffeine', fiber: 'Fiber', medicationTaken: 'Medication taken', energy: 'Physical energy', socialEnergy: 'Social energy', moodValence: 'Mood', moodArousal: 'Mood intensity', bowelFrequency: 'Bowel movements', bowelBlood: 'Bowel blood', bowelConsistency: 'Stool consistency', appetite: 'Appetite', flatulenceAmount: 'Gas amount', flatulenceSmell: 'Gas smell', calories: 'Calories', protein: 'Protein', fat: 'Fat', carbs: 'Carbohydrates', sugar: 'Sugar', sodium: 'Sodium', gluten: 'Gluten' };
const UNITS = { fiber: 'g', calories: 'kcal', protein: 'g', fat: 'g', carbs: 'g', sugar: 'g', sodium: 'mg', bowelFrequency: 'per day', pain: '/10', energy: '/10', socialEnergy: '/10' };
const measureLabel = key => { if (!key) return 'Input'; if (key.startsWith('Unlogged: ')) return `Not logged: ${measureLabel(key.slice(10))}`; const [base, ...history] = key.split(' · '); return [LABELS[base] ?? base.replace(/^Medication: /, ''), ...history].join(' · '); };
const measureGroup = key => FOOD_KEYS.includes(key) ? 'Foods' : key === 'medicationTaken' || key.startsWith('Medication:') ? 'Medications' : 'Symptoms';
function measures(snapshot, { includePain = true, includeTargets = true } = {}) {
  const result = snapshot.featureNames.map((key, j) => ({ key, label: measureLabel(key), group: measureGroup(key), unit: UNITS[key] ?? '', read: row => row && !row.missingFeatures?.[j] ? row.features[j] : null }));
  if (includePain) result.unshift({ key: 'pain', label: snapshot.targetName ?? 'Pain', group: 'Symptoms', unit: snapshot.targetName ? '' : '/10', read: row => row?.pain ?? null });
  if (includeTargets) for (const key of Object.keys(snapshot.targetNames ?? {})) if (key !== 'pain' && !snapshot.featureNames.includes(key)) result.push({ key, label: measureLabel(key), group: 'Symptoms', unit: UNITS[key] ?? '', read: row => row?.targets?.[key] ?? null });
  return result;
}
function dayEmbedding(snapshot, { lags = [0, 1, 3, 7], includePain = true, includeTargets = true } = {}) {
  const descriptors = measures(snapshot, { includePain, includeTargets });
  const lookup = new Map(snapshot.rows.map(row => [row.date, row]));
  const columns = lags.flatMap(lag => descriptors.map(measure => ({ key: measure.key, label: measure.label, lag, name: `${measure.key}${lag ? ` · ${lag} day${lag === 1 ? '' : 's'} earlier` : ''}`, measure })));
  const values = snapshot.rows.map(row => columns.map(column => column.measure.read(lookup.get(new Date(stamp(row.date) - column.lag * DAY).toISOString().slice(0, 10)))));
  const X = values.map(row => [...row.map(value => Number.isFinite(value) ? value : 0), ...row.map(value => +!Number.isFinite(value))]);
  return { X, values, columns: columns.map(({ measure, ...column }) => column), featureNames: [...columns.map(column => column.name), ...columns.map(column => `Unlogged: ${column.name}`)], dates: snapshot.rows.map(row => row.date), lags };
}
module.exports = { DAY, stamp, FOOD_KEYS, measureLabel, measureGroup, measures, dayEmbedding };
