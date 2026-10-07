# Gutopia Algorithm Lab

The interactive page is **algorithms.html**. The existing home page links to it. It uses the same navy/violet palette, Sora typography and app icon as the existing site.

## What runs

All **23 direct demo handlers** are selectable: 18 main workflows and five variants. Inputs are the deterministic **150-day synthetic coursework fixture**. Computation happens in browser memory. There is no Supabase client, account connection, app database adapter or model-data upload.

The page provides:

- Grouped algorithm buttons, search, shareable URL fragments and responsive navigation.
- Actual calculated charts for regression, binary classification, PCA, K-means, DBSCAN, DTW, correlations, exposure comparisons, direct-horizon forecasts, recursive AR/cascades and scenario construction/execution.
- Play/pause/replay of result reveals, with reduced-motion support. The reveal is explicitly distinguished from an optimizer's iteration history.
- Seed controls that regenerate data and recompute the selected algorithm, with deterministic reproduction.
- Five tabs: interactive demo, the idea, under the hood, methodology and the data. Every entry documents its target, purpose, formula, numerical method, evaluation, limits and differences from the coursework archive.
- Downloadable calculated-result JSON, complete synthetic-input JSON and the full Markdown methodology guide.

Cluster colors and point coordinates, fitted weights, predictions, metric cards and sequence alignments come from the real returned result. No chart substitutes a hardcoded model output. The rolling-memory DTW view deliberately omits alignment links because that variant does not retain a path. Cascade feature traces are normalized only for presentation; the JSON retains raw values. Direct-horizon bars are separate endpoint estimates, not a continuous future trajectory or a calibrated interval.

## Source layout

| File                                                 | Purpose                                                |
| ---------------------------------------------------- | ------------------------------------------------------ |
| algorithms.html                                      | Accessible page structure                              |
| assets/algorithms/lab.css                            | Responsive presentation and reveal animation           |
| assets/algorithms/catalog.js                         | Complete 23-entry explanatory catalog                  |
| assets/algorithms/lab.js                             | Selection, computation, charts, tabs and downloads     |
| assets/algorithms/models/{math,dataset,workflows}.js | Unchanged pure kernels copied from the app             |
| assets/algorithms/kernels.js                         | Browser bundle generated from those three source files |
| assets/algorithms/ML_ALGORITHMS_AND_METHODOLOGY.md   | Downloadable full implementation guide                 |

These sources originate in `CrohnsTrackerApp/demoAlgorithms`. They are the streamlined direct demos, **not** a byte-for-byte restoration of the older analytics engine. The catalog and guide explain deliberate changes to targets, horizons, clustering geometry, DTW optimizations and cascade states.

To sync after app kernel changes, copy the three pure source files into `assets/algorithms/models/`, update the guide, then rebuild and verify:

```sh
node scripts/build-algorithms.cjs
node scripts/check-algorithms.cjs
```

## Local preview and browser checks

No app development server on port 8081 is required. Serve this repository on a separate local port:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/algorithms.html`. For browser automation, install Playwright outside the deployed repository and use an available local Chrome binary:

```sh
npm install --prefix /tmp/gutopia-web-qa playwright
PLAYWRIGHT_MODULE=/tmp/gutopia-web-qa/node_modules/playwright node scripts/test-lab.cjs
```

The runner defaults to macOS Google Chrome. Override `CHROME_BINARY`, `LAB_URL` and `LAB_QA_OUTPUT` as needed.

Verified October 6, 2026:

- Every bundled handler exactly matches its corresponding source output, produces finite substantive results across seeds 42/137, is reproducible and rejects personal-mode snapshots.
- All 23 algorithms render actual charts, summary metrics and pipeline steps in the browser.
- All 92 explanation-tab selections, search/no-result behavior, keyboard tab navigation, pause/play/replay, seed changes and both JSON downloads pass.
- All 23 demo layouts fit 320, 390 and 768-pixel widths without clipped workspaces or page overflow.
- Reduced-motion preferences remove animation; no JavaScript page errors or unexpected non-font remote requests occur. Model computation makes no uploads.
- Desktop, mobile, DTW and regression screenshots were visually reviewed.

These are website/numerical demonstrations, not clinical validation or mobile-device release verification.

## Existing site copy

The home/about pages separate local tracking from the synthetic ML demo and remove unsupported flare-prediction claims. Privacy and terms retain their structure while correcting inaccurate promises that food analysis is anonymous, metadata-free or has guaranteed no provider retention. Current food analysis sends consented selected content through an account-authenticated Supabase proxy to Google Gemini; account-linked usage metadata is described. The Algorithm Lab has no account/data connection.

## Hosting

The existing `wrangler.jsonc` serves this repository as static assets, so the new HTML and assets fit the current deployment structure. GitHub-to-Cloudflare automatic deployment settings have **not** been verified from the local configuration alone. This page needs no separate app, service, worker backend, API key or environment variable. Confirm the public `algorithms.html` page and assets after the repository's existing deployment runs.
