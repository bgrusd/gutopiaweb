# ML Lab alignment

The website uses the same portable numerical modules as the app. `assets/algorithms/source-manifest.json` records the app commit, whether the exported source included uncommitted changes, every module's SHA-256 and the pinned UMAP dependency. Database and account adapters are never copied into the website.

```sh
npm ci --ignore-scripts
GUTOPIA_APP_SOURCE=/absolute/path/to/CrohnsTrackerApp npm run build
npm run check
```

Without `GUTOPIA_APP_SOURCE`, `npm run build` rebuilds the already checked-in models. The source sync copies math, dataset, day embedding, relationships, visualization, projection, workflows, catalogue and sensitivity modules plus the methodology guide. Avoid editing copies; change the app kernels and sync again. esbuild follows the whole dependency graph, including pinned `umap-js`.

The question views are platform-specific in `lab.js`; algorithms, missingness, lags, fitting, DTW plans and UMAP mathematics are shared. The website's teaching fixture has 150 exact dates and 17 measures, with complete and sparse modes. It is invented, not evidence of real food or medication effects. Sparse mode keeps unlogged dates, missing features and unknown pain distinct from measured zeros.

The main flow offers ten questions, with the 23 workflows under an optional advanced drawer. Each question has a view, optional method explanation and inspectable/downloadable calculations. Forecast timeline estimates are labelled retrospective fits or later checks. The explicit as-of calculation and editable scenario fit use only records available by the selected date. Future interval outcomes remain unknown when insufficiently recorded.

Grouping uses full standardized day/history vectors or five PCA summaries. PCA and UMAP are alternate drawings of already assigned group labels. Group summaries use original observed units and each dot opens its exact dated entries/history. UMAP is a drawing, not proof that the groups are stronger or clinically meaningful. Calculation downloads distinguish the requested map from the currently displayed map (including the PCA fallback during UMAP calculation) and include the actual displayed coordinates separately from the kernel's PCA coordinates.

Missing-input sensitivity clears unknown-input masks only inside temporary sampled snapshots, so the model receives the sampled values. Saved records, unknown outcomes and their masks remain unchanged. Sampling does not establish a calibrated confidence interval.

DTW keeps a fixed reference while later non-overlapping windows move through a dated panel. Each reference date scans 3/5/7/14-day lengths before advancing by 1–4 calendar days. The visible scan uses the same shared plan as the search. The ranked list searches the entire history; selecting a distant match opens a full-history view with the correct lengths and its calculated alignment. Missing patterns remain explicit; periods with fewer than two ratings are shown but not scored. The full and rolling modes have equal scores; only full mode retains paths.

## Verification on October 7, 2026

- Numerical check passed 46 complete-history browser/source workflow parity checks over two seeds, all 20 sparse non-cascade workflows, deterministic UMAP and unchanged labels, source hashes, exact calendar/missing flags, unique forward DTW, full/rolling equality, editable scenarios and as-of independence from future records. A real LASSO sensitivity integration check verifies that an unknown latest-day dairy input produces a nonzero prediction spread, agrees between browser and source, and leaves original records unchanged. Cascades explicitly reject incomplete outcome/state histories.
- Actual approved Chrome interaction checks covered all ten question destinations, closing drawer, clickable heatmap explanation, lagged medication view, scenario dairy 1→0 (estimate 5.76→3.81), PCA/UMAP preserving groups 87/58/5, exact February 1 day records, week as-of May 29 fit (61.2%), DBSCAN (107 grouped/43 outside), regression/error, and DTW pause/reference advance with exact adjacent starting periods.
- Phone viewport was verified through tab-specific CDP emulation at 390×844 (375 content pixels with scrollbar), tablet at 1024×768. No page-level horizontal overflow; heatmap has its own scroll area. Phone chart geometry retains vertical size and readable ticks. Viewport emulation is reset after checks.
- Optional `scripts/test-lab.cjs` was updated for CI browser regressions; it was not executed in this session. Interactive browser verification uses approved CUA instead.
- `node --check assets/algorithms/lab.js` and `git diff --check` pass. These checks do not establish a production deployment or native simulator behavior.

## Production verification on October 7, 2026

The main implementation was published by the parent agent from commit `c07319a` through the authenticated gutopiaweb Worker; version `93b86727-ec53-465e-b7e4-151b89477a4c` was confirmed active at 100%. The parent verified production asset hashes against the checkout. Live Chrome interactions verified timeline inspection, question drawer selection/closure, heatmap explanation, exact 7-day medication relationships, executed Dairy 1→0 scenario (5.76→3.81), full-day clustering and UMAP preserving groups, and week as-of calculation (61.2% using history through May 29). Console warning/error logs were empty.

The final synced sparse fixture also completed all forty missing-input comparisons in Chrome: May 30 next-day lower 5.81, median 6.41, upper 6.92. The map calculations expose 150 actual UMAP coordinates separately from the kernel PCA coordinates. These checks are numerical/UI evidence, not native-device or clinical validation.

Production responsive checking found a DTW resize defect: rebuilding the phone chart reset its reference and could label a paused scan as running. Follow-up commit `de962d2` preserves scan position across breakpoint changes and derives the playback action from actual state. Approved local Chrome verification paused a 7-day scan at position 23, reference Jan 2–8 and comparison Jan 10–16, then crossed 390↔1024 pixels; position, dates, size and “Play scan” remained unchanged. The optional CI script contains the equivalent regression case but was not executed in this session. The parent published the correction as Worker version `27c3c8ab-39c6-4cff-b15f-94eb2485e4bc`. The final post-publication resize click was blocked when browser navigation timed out and both the saved binding and a fresh Chrome tab became unavailable. Local correction verification and publication are confirmed; that final live interaction remains unverified.

The deploy target is the **gutopiaweb Cloudflare Worker**, which owns the gutopia.ai custom domain. The similarly named older Pages project is not the live site. `.assetsignore` excludes development dependencies/scripts/configuration from asset upload. Publish only after reviewing the prepared branch and browser preview; verify the Worker version and production interaction afterward.
