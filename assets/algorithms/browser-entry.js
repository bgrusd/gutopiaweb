const D = require("./models/dataset"),
  M = require("./models/math");
const E = require("./models/dayEmbedding"),
  V = require("./models/visualization"),
  W = require("./models/workflows");
function createTeachingHistory(
  seed = 42,
  { sparse = false, count = 150 } = {},
) {
  const base = D.createCourseworkSnapshot(seed, count),
    rng = M.random(seed + 731);
  const featureNames = [
    "dairy",
    "spicy",
    "caffeine",
    "fiber",
    "medicationTaken",
    "energy",
    "socialEnergy",
    "bowelFrequency",
    "bowelBlood",
    "bowelConsistency",
    "moodValence",
    "appetite",
    "calories",
    "protein",
    "carbs",
    "Medication: Morning dose",
  ];
  const rows = base.rows.map((row, i) => {
    const pain = row.pain,
      features = [
        ...row.features.slice(0, 3),
        row.features[3] * 10,
        row.features[4],
        row.features[5],
        M.clamp(8 - pain * 0.5 + rng(), 0, 10),
        Math.round(1 + pain / 2),
        +(pain > 6),
        M.clamp(Math.round(4 + pain / 3), 1, 7),
        M.clamp(1 - pain / 12, 0, 1),
        M.clamp(8 - pain * 0.6 + rng(), 0, 10),
        1600 + rng() * 800,
        50 + rng() * 60,
        150 + rng() * 140,
        row.features[4],
      ];
    const empty = sparse && i % 13 === 4,
      missingFeatures = features.map(
        (_, j) => empty || (sparse && (i + j * 3) % 17 === 0),
      );
    return {
      date: row.date,
      pain: empty || (sparse && i % 11 === 3) ? null : pain,
      features,
      missingFeatures,
      targets: {
        energy: missingFeatures[5] ? null : features[5],
        socialEnergy: missingFeatures[6] ? null : features[6],
        bowelFrequency: missingFeatures[7] ? null : features[7],
        bowelBlood: missingFeatures[8] ? null : features[8],
        bowelConsistency: missingFeatures[9] ? null : features[9],
        moodValence: missingFeatures[10] ? null : features[10],
        appetite: missingFeatures[11] ? null : features[11],
      },
    };
  });
  return D.createSnapshot(rows, {
    seed,
    source: sparse ? "Sparse teaching history" : "Complete teaching history",
    featureNames,
    limitRows: null,
    targetNames: {
      pain: "Pain",
      energy: "Physical energy",
      socialEnergy: "Social energy",
      bowelFrequency: "Bowel movements",
      bowelBlood: "Bowel blood",
      bowelConsistency: "Stool consistency",
      moodValence: "Mood",
      appetite: "Appetite",
    },
  });
}

module.exports = {
  ...D,
  ...E,
  ...V,
  ...W,
  ...require("./models/relationships"),
  ...require("./models/projection"),
  ...require("./models/catalog"),
  ...require("./models/sensitivity"),
  createTeachingHistory,
};
