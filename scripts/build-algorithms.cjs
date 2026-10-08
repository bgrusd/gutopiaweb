// Copy portable modules only when an explicit app path is supplied; record the source.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  cp = require("node:child_process");
const root = path.resolve(__dirname, ".."),
  source = process.env.GUTOPIA_APP_SOURCE;
const names = [
  "math",
  "dataset",
  "dayEmbedding",
  "relationships",
  "visualization",
  "projection",
  "workflows",
  "catalog",
  "sensitivity",
];
if (source) {
  for (const name of names)
    fs.copyFileSync(
      path.join(source, "demoAlgorithms", name + ".js"),
      path.join(root, "assets/algorithms/models", name + ".js"),
    );
  fs.copyFileSync(
    path.join(source, "docs/ML_ALGORITHMS_AND_METHODOLOGY.md"),
    path.join(root, "assets/algorithms/ML_ALGORITHMS_AND_METHODOLOGY.md"),
  );
  const hashes = Object.fromEntries(
    names.map((name) => [
      name,
      crypto
        .createHash("sha256")
        .update(
          fs.readFileSync(
            path.join(root, "assets/algorithms/models", name + ".js"),
          ),
        )
        .digest("hex"),
    ]),
  );
  const commit = cp
    .execFileSync("git", ["-C", source, "rev-parse", "HEAD"], {
      encoding: "utf8",
    })
    .trim();
  fs.writeFileSync(
    path.join(root, "assets/algorithms/source-manifest.json"),
    JSON.stringify(
      {
        appCommit: commit,
        workingTree: !!cp
          .execFileSync("git", ["-C", source, "status", "--porcelain"], {
            encoding: "utf8",
          })
          .trim(),
        modules: hashes,
        umapVersion: "1.4.0",
      },
      null,
      2,
    ) + "\n",
  );
}
require("esbuild").buildSync({
  entryPoints: [path.join(root, "assets/algorithms/browser-entry.js")],
  outfile: path.join(root, "assets/algorithms/kernels.js"),
  bundle: true,
  platform: "browser",
  format: "iife",
  globalName: "GutopiaMath",
  target: ["es2020"],
  minify: true,
  legalComments: "eof",
});
