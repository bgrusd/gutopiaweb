const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  crypto = require("node:crypto");
const root = path.resolve(__dirname, ".."),
  ctx = { console, setTimeout, clearTimeout, TextEncoder, TextDecoder };
vm.createContext(ctx);
vm.runInContext(
  fs.readFileSync(path.join(root, "assets/algorithms/kernels.js"), "utf8"),
  ctx,
);
const A = ctx.GutopiaMath,
  source = require("../assets/algorithms/browser-entry");
const json = (x) => JSON.parse(JSON.stringify(x));
function finite(value) {
  if (typeof value === "number") assert(Number.isFinite(value));
  else if (Array.isArray(value)) value.forEach(finite);
  else if (value && typeof value === "object")
    Object.values(value).forEach(finite);
}
(async () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "assets/algorithms/source-manifest.json")),
  );
  for (const [name, hash] of Object.entries(manifest.modules))
    assert.equal(
      crypto
        .createHash("sha256")
        .update(
          fs.readFileSync(
            path.join(root, "assets/algorithms/models", name + ".js"),
          ),
        )
        .digest("hex"),
      hash,
      name + " source hash",
    );
  assert.equal(A.algorithms.length, 23);
  assert.equal(new Set(A.algorithms.map((a) => a.id)).size, 23);
  let passed = 0;
  for (const seed of [42, 93]) {
    const snapshot = A.createTeachingHistory(seed);
    assert.equal(snapshot.rows.length, 150);
    assert.equal(snapshot.featureNames.length, 16);
    for (const algorithm of A.algorithms) {
      const result = algorithm.run(snapshot);
      finite(result);
      assert.deepEqual(
        json(result),
        json(
          source.algorithms
            .find((a) => a.id === algorithm.id)
            .run(source.createTeachingHistory(seed)),
        ),
        algorithm.id + " browser/source parity",
      );
      assert.throws(() => algorithm.run({ ...snapshot, mode: "personal" }));
      passed++;
    }
  }
  const sparse = A.createTeachingHistory(42, { sparse: true });
  assert(sparse.quality.missingPainDays > 0);
  assert(sparse.rows.some((r) => r.missingFeatures.every(Boolean)));
  const embedded = A.dayEmbedding(sparse);
  assert.equal(embedded.X[0].length, 136);
  const first = A.measures(sparse)[0];
  assert.equal(first.key, "pain");
  for (let i = 7; i < sparse.rows.length; i++) {
    const column = embedded.columns.findIndex(
      (c) => c.key === "pain" && c.lag === 7,
    );
    assert.equal(embedded.values[i][column], sparse.rows[i - 7].pain);
  }
  for (const algorithm of A.algorithms.filter((a) => a.kind !== "cascade"))
    finite(algorithm.run(sparse));
  for (const a of A.algorithms.filter((a) => a.kind === "cascade"))
    assert.throws(() => a.run(sparse), /consecutive/);
  const windows = A.WINDOW_SIZES.flatMap((size) =>
      A.validWindows(sparse, size, 0),
    ),
    plan = A.windowScanPlan(windows, { referenceStep: 3 }),
    pairs = new Set();
  for (const sweep of plan.sweeps) {
    assert.equal(
      ((A.time(sweep.reference.first) - A.time(windows[0].first)) / A.DAY) % 3,
      0,
    );
    for (const c of sweep.candidates) {
      assert(c.first > sweep.reference.last);
      const key = [
        sweep.reference.first,
        sweep.reference.size,
        c.first,
        c.size,
      ].join("|");
      assert(!pairs.has(key));
      pairs.add(key);
    }
  }
  assert.equal(pairs.size, plan.total);
  assert.equal(A.scanFrame(plan, 0).candidate.first, "2025-01-04");
  const f = A.scanFrame(plan, plan.sweeps[1].offset);
  assert.equal(f.reference.first, plan.sweeps[1].reference.first);
  const reference = A.validWindows(sparse, 7)[0],
    candidate = A.validWindows(sparse, 7).find((w) => w.first > reference.last),
    full = A.compareWindows(reference, candidate, 2, false),
    rolling = A.compareWindows(reference, candidate, 2, true);
  assert.equal(full.score, rolling.score);
  assert(full.path.length);
  const relation = A.relationship(sparse, "medicationTaken", "pain", 3);
  assert(
    relation.points.every(
      (p) => (A.time(p.date) - A.time(p.inputDate)) / A.DAY === 3,
    ),
  );
  assert.equal(relation.observations, relation.points.length);
  const comparison = A.triggerComparison(sparse, "fiber", "pain", 7);
  assert.equal(
    comparison.comparisonDays + comparison.exposedDays,
    comparison.points.length,
  );
  assert(
    comparison.points.every(
      (p) => (A.time(p.date) - A.time(p.inputDate)) / A.DAY === 7,
    ),
  );
  const snapshot = A.createTeachingHistory(42),
    before = JSON.stringify(snapshot),
    date = snapshot.rows[110].date,
    scenario = A.runScenarioExecution(snapshot, {
      inputDate: date,
      changes: { dairy: 0 },
    }),
    other = A.runScenarioExecution(snapshot, {
      inputDate: date,
      changes: { dairy: 1 },
    });
  assert.notEqual(scenario.scenarioPrediction, other.scenarioPrediction);
  assert.equal(before, JSON.stringify(snapshot));
  assert.equal(scenario.inputDate, date);
  const mutated = A.createSnapshot(
    snapshot.rows.map((r) =>
      r.date > date
        ? { ...r, pain: 9, features: r.features.map(() => 999) }
        : r,
    ),
    {
      seed: snapshot.seed,
      source: snapshot.source,
      featureNames: snapshot.featureNames,
      targetNames: snapshot.targetNames,
      limitRows: null,
    },
  );
  assert.deepEqual(
    json(A.runFlareWindows(snapshot, { inputDate: date })),
    json(A.runFlareWindows(mutated, { inputDate: date })),
  );
  assert.deepEqual(
    json(
      A.runScenarioExecution(snapshot, {
        inputDate: date,
        changes: { dairy: 1 },
      }),
    ),
    json(
      A.runScenarioExecution(mutated, {
        inputDate: date,
        changes: { dairy: 1 },
      }),
    ),
  );
  const grouped = A.runKMeans(snapshot, { k: 4, space: "full" }),
    labels = json(grouped.labels);
  assert.equal(grouped.groupingDimensions, 136);
  const map = await A.umapMap(snapshot);
  assert.equal(map.length, 150);
  finite(map);
  assert.deepEqual(json(grouped.labels), labels);
  const secondMap = await source.umapMap(source.createTeachingHistory(42));
  assert.deepEqual(json(map), json(secondMap));
  const sensitivityFixture = A.createCourseworkSnapshot(),
    sensitivitySnapshot = A.createSnapshot(
      sensitivityFixture.rows.map((row, i) => ({
        ...row,
        missingFeatures: undefined,
        features: row.features.map((value, j) =>
          i === sensitivityFixture.rows.length - 1 && j === 0 ? null : value,
        ),
      })),
    ),
    sensitivityBefore = JSON.stringify(sensitivitySnapshot),
    lasso = A.algorithms.find((algorithm) => algorithm.id === "lasso"),
    sensitivity = await A.runSensitivity(sensitivitySnapshot, lasso, {
      draws: 12,
      seed: 19,
    }),
    distribution = sensitivity.distributions[0];
  assert(new Set(distribution.values).size > 1);
  assert(distribution.high - distribution.low > 0.1);
  assert.equal(JSON.stringify(sensitivitySnapshot), sensitivityBefore);
  assert.deepEqual(
    json(sensitivity),
    json(
      await source.runSensitivity(
        json(sensitivitySnapshot),
        source.algorithms.find((algorithm) => algorithm.id === "lasso"),
        { draws: 12, seed: 19 },
      ),
    ),
  );
  console.log(
    `PASS: ${passed} complete-history workflow parity checks; all 20 sparse-history non-cascade workflows; source hashes; exact calendar lags/missing flags; nested unique forward DTW and rolling/full parity; editable scenarios; as-of future isolation; deterministic UMAP with unchanged cluster labels; real LASSO missing-input sensitivity changes predictions without mutating records.`,
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
