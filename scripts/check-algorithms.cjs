const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
for (const file of ["kernels.js", "catalog.js"])
  vm.runInContext(
    fs.readFileSync(path.join(root, "assets/algorithms", file), "utf8"),
    context,
    { filename: file },
  );
const { GutopiaDemo: demo, GutopiaCatalog: catalog } = context.window;
assert.equal(catalog.length, 23);
assert.equal(new Set(catalog.map((x) => x.id)).size, 23);
assert.deepEqual(
  new Set(catalog.map((x) => x.handler)),
  new Set(Object.keys(demo).filter((x) => x.startsWith("run"))),
);
assert.equal(catalog.filter((x) => x.variant).length, 5);
assert.equal(new Set(catalog.map((x) => x.plainLanguage.what)).size, 23);
assert.equal(
  new Set(catalog.map((x) => x.methodology.map((p) => p[1]).join(" "))).size,
  23,
);
const dtw = catalog.find((x) => x.id === "dtw");
assert(/seven consecutive(?: recorded)? days/.test(dtw.plainLanguage.what));
assert(/three(?:-row| rows)/.test(dtw.plainLanguage.what));
assert(/sliding window/.test(dtw.plainLanguage.what));
const meaningfulArray = (result) =>
  Object.values(result).some((value) => Array.isArray(value) && value.length);
function finiteNumbers(value) {
  if (typeof value === "number") assert(Number.isFinite(value));
  else if (Array.isArray(value)) value.forEach(finiteNumbers);
  else if (value && typeof value === "object")
    Object.values(value).forEach(finiteNumbers);
}
for (const seed of [42, 137]) {
  const snapshot = demo.createCourseworkSnapshot(seed);
  for (const entry of catalog) {
    for (const field of [
      "purpose",
      "math",
      "mathNote",
      "how",
      "why",
      "archive",
      "limitations",
      "evaluation",
    ])
      assert(entry[field]?.length > 20, `${entry.id}: missing ${field}`);
    assert(
      entry.plainLanguage.what.length > 600 &&
        entry.plainLanguage.what.split(/\n\s*\n/).length === 2 &&
        entry.plainLanguage.uses.length > 30 &&
        !("analogy" in entry.plainLanguage) &&
        entry.example.length > 150,
      `${entry.id}: incomplete technical overview or example`,
    );
    assert.equal(entry.methodology.length, 4);
    for (const [title, paragraph] of entry.methodology)
      assert(
        title && paragraph.length > 100,
        `${entry.id}: incomplete methodology step`,
      );
    assert.equal(entry.steps.length, 4);
    assert(entry.source[1].startsWith("https://"));
    const result = demo[entry.handler](snapshot);
    finiteNumbers(result);
    assert(meaningfulArray(result), `${entry.id}: empty payload`);
    assert.equal(
      JSON.stringify(result),
      JSON.stringify(demo[entry.handler](demo.createCourseworkSnapshot(seed))),
      `${entry.id}: not deterministic`,
    );
    assert.throws(
      () => demo[entry.handler]({ ...snapshot, mode: "real" }),
      /demo snapshot/,
    );
  }
}
for (const name of ["math", "dataset", "workflows"]) {
  const local = require(path.join(root, "assets/algorithms/models", name));
  assert(local && Object.keys(local).length);
}
const json = (data) => JSON.stringify(data);
const source = require(path.join(root, "assets/algorithms/models/workflows"));
const dataset = require(path.join(root, "assets/algorithms/models/dataset"));
for (const row of catalog)
  assert.equal(
    json(demo[row.handler](demo.createCourseworkSnapshot(42))),
    json(source[row.handler](dataset.createCourseworkSnapshot(42))),
    `${row.id}: browser bundle differs from source`,
  );
console.log(
  "PASS: all 23 browser handlers match their source, execute finite substantive results across two seeds, remain deterministic and reject personal-mode input. All 23 explanation records are complete.",
);
