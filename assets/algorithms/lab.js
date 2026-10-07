(() => {
  "use strict";
  const catalog = window.GutopiaCatalog,
    kernels = window.GutopiaDemo;
  const $ = (id) => document.getElementById(id);
  const escape = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const paragraphs = (text, className = "") =>
    String(text || "")
      .split(/\n\s*\n/)
      .filter((part) => part.trim())
      .map(
        (part) =>
          `<p${className ? ` class="${className}"` : ""}>${escape(part)}</p>`,
      )
      .join("");
  const colors = [
    "#a292ff",
    "#70e0cb",
    "#f3a1cb",
    "#eacb87",
    "#8caefa",
    "#e18f82",
    "#9ba78d",
  ];
  const feature = (name) =>
    ({
      medicationTaken: "Medication",
      dairy: "Dairy",
      spicy: "Spicy",
      caffeine: "Caffeine",
      fiber: "Fiber",
      energy: "Energy",
      demoPain: "Demo pain",
    })[name] || name;
  const fmt = (v, digits = 2) =>
    Number.isFinite(v) ? Number(v).toFixed(digits) : "Undefined";
  const percent = (value) =>
    Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "Undefined";
  const safeSeed = (value) =>
    Math.min(999999, Math.max(1, Math.floor(Number(value) || 42)));
  let selected =
    catalog.find((x) => x.id === location.hash.slice(1)) ||
    catalog.find((x) => x.id === "kmeans");
  let seed = 42,
    snapshot,
    result,
    playing = !matchMedia("(prefers-reduced-motion: reduce)").matches,
    currentTab = "demo",
    runToken = 0;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const compactChart = () => matchMedia("(max-width:560px)").matches;
  const chartHeight = () => (compactChart() ? 510 : 350);
  function svg(content, label, height = chartHeight(), width = 800) {
    return `<svg role="img" aria-label="${escape(label)}" viewBox="0 0 ${width} ${height}"><title>${escape(label)}</title>${content}</svg>`;
  }
  function range(values, fallback = [0, 1], padding = 0.12) {
    const finite = values.filter(Number.isFinite);
    if (!finite.length) return fallback;
    let lo = Math.min(...finite),
      hi = Math.max(...finite);
    if (lo === hi) {
      lo -= 1;
      hi += 1;
    }
    return [lo - (hi - lo) * padding, hi + (hi - lo) * padding];
  }
  function frame({
    xr = [0, 1],
    yr = [0, 10],
    xTitle = "",
    yTitle = "",
    xLabels = null,
    width = 800,
    height = chartHeight(),
    margin = compactChart()
      ? { left: 110, top: 45, right: 85, bottom: 85 }
      : { left: 60, top: 22, right: 40, bottom: 48 },
  } = {}) {
    const left = margin.left,
      top = margin.top,
      right = width - margin.right,
      bottom = height - margin.bottom;
    const x = (v) =>
        left + ((v - xr[0]) / (xr[1] - xr[0] || 1)) * (right - left),
      y = (v) => bottom - ((v - yr[0]) / (yr[1] - yr[0] || 1)) * (bottom - top);
    let markup = "";
    for (let i = 0; i <= 4; i++) {
      const value = yr[0] + ((yr[1] - yr[0]) * i) / 4;
      markup += `<path class="chart-grid" d="M${left} ${y(value)}H${right}"/><text class="chart-axis" x="${left - 12}" y="${y(value) + 3}" text-anchor="end">${fmt(value, yr[1] <= 1 ? 2 : 1)}</text>`;
    }
    const labels =
      xLabels ||
      Array.from({ length: 5 }, (_, i) => ({
        value: xr[0] + ((xr[1] - xr[0]) * i) / 4,
        label: fmt(xr[0] + ((xr[1] - xr[0]) * i) / 4, 1),
      }));
    for (const tick of labels)
      markup += `<text class="chart-axis" x="${x(tick.value)}" y="${bottom + (compactChart() ? 42 : 23)}" text-anchor="middle">${escape(tick.label)}</text>`;
    if (xTitle)
      markup += `<text class="chart-axis-title" x="${(left + right) / 2}" y="${height - 2}" text-anchor="middle">${escape(xTitle)}</text>`;
    if (yTitle)
      markup += `<text class="chart-axis-title" x="${left}" y="${top - 5}">${escape(yTitle)}</text>`;
    return { x, y, markup, left, top, right, bottom };
  }
  function polyline(
    values,
    f,
    key = "predicted",
    color = colors[0],
    xValue = (_, i) => i,
    animate = true,
    dashed = false,
  ) {
    const points = values
      .filter((row) => Number.isFinite(row[key]))
      .map(
        (row) => `${f.x(xValue(row, values.indexOf(row)))} ${f.y(row[key])}`,
      );
    if (!points.length) return "";
    return `<polyline points="${points.join(" ")}" class="chart-line ${animate ? "animate-line" : ""}" stroke="${color}" ${dashed ? 'stroke-dasharray="5 5"' : ""}/>`;
  }
  function circles(points, f, getColor = () => colors[0], radius = 3.5) {
    return points
      .map(
        (p, i) =>
          `<circle class="chart-point animate-point" style="--delay:${Math.min(i * 0.007, 1).toFixed(3)}s" cx="${f.x(p.x)}" cy="${f.y(p.y)}" r="${radius}" fill="${getColor(p)}"><title>${escape(p.label || `${fmt(p.x)}, ${fmt(p.y)}`)}</title></circle>`,
      )
      .join("");
  }
  function legend(entries) {
    $("chart-legend").innerHTML = entries
      .map(
        ([name, color]) =>
          `<span class="legend-entry"><span class="legend-swatch" style="--color:${color}"></span>${escape(name)}</span>`,
      )
      .join("");
  }
  function chartHead(title, subtitle, entries, footnote) {
    $("chart-title").textContent = title;
    $("chart-subtitle").textContent = subtitle;
    $("chart-footnote").textContent = footnote;
    legend(entries);
    $("chart-extra").innerHTML = "";
  }
  function metrics(items) {
    $("metrics").innerHTML = items
      .map(
        ([value, label, detail, mint]) =>
          `<div class="metric"><div class="metric-value${mint ? " mint" : ""}">${escape(value)}</div><div class="metric-label">${escape(label)}</div><div class="metric-detail">${escape(detail || "")}</div></div>`,
      )
      .join("");
  }
  function coefficientBars(coefficients) {
    if (!coefficients?.length) return "";
    const rows =
      typeof coefficients[0] === "number"
        ? coefficients.map((value, i) => ({
            feature: [
              "Lag 1",
              "Lag 2",
              "Lag 3",
              "Lag 7",
              "Trend",
              "Weekly sin",
              "Weekly cos",
            ][i],
            value,
          }))
        : coefficients;
    const max = Math.max(0.001, ...rows.map((row) => Math.abs(row.value)));
    return `<div class="coefficient-heading"><span>Fitted coefficients</span><span>Coefficients use standardized inputs · mint means negative</span></div><div class="coefficient-grid">${rows.map((row) => `<div class="coefficient-row"><span>${escape(feature(row.feature))}</span><div class="coefficient-track"><div class="coefficient-fill${row.value < 0 ? " negative" : ""}" style="width:${(Math.abs(row.value) / max) * 100}%"></div></div><span>${fmt(row.value)}</span></div>`).join("")}</div>`;
  }
  function evaluationMetrics(e, classification = false) {
    if (classification)
      metrics([
        [
          percent(e.accuracy),
          "Held-out accuracy",
          "Positive prediction at probability ≥ 0.5",
          true,
        ],
        [
          fmt(e.brier, 3),
          "Held-out Brier score",
          "Lower means fewer probability mistakes",
        ],
        [
          e.heldOutRows,
          "Held-out test examples",
          `${e.trainingRows} earlier training examples`,
        ],
        [
          percent(e.recall),
          "Recall: actual positives detected",
          `Precision: positive predictions correct: ${percent(e.precision)}`,
        ],
      ]);
    else
      metrics([
        [
          fmt(e.rmse, 3),
          "Held-out RMSE (pain points)",
          "Root mean squared error; lower is better",
          true,
        ],
        [
          fmt(e.baselineRmse, 3),
          "Training-mean baseline RMSE",
          "Predict the training target mean on every test row",
        ],
        [
          fmt(e.r2, 3),
          "Variation explained (R²)",
          "Can be negative when the fit is poor",
        ],
        [
          e.heldOutRows,
          "Held-out test examples",
          `${e.trainingRows} earlier training examples`,
        ],
      ]);
  }
  function renderPrediction() {
    const binary = selected.type === "classification",
      rows = result.series,
      dates = [0, Math.floor((rows.length - 1) / 2), rows.length - 1];
    const f = frame({
      xr: [0, rows.length - 1],
      yr: binary
        ? [0, 1]
        : range(
            rows.flatMap((r) => [r.actual, r.predicted]),
            [0, 10],
            0.05,
          ),
      xLabels: dates.map((i) => ({ value: i, label: rows[i].date.slice(5) })),
      xTitle: "Held-out target dates",
    });
    chartHead(
      binary
        ? "Predicted probabilities vs. observed binary labels"
        : "Predicted vs. observed pain on held-out dates",
      `${result.horizon}-day endpoint · chronological training/test split · ${rows.length} observations`,
      binary
        ? [
            ["Model probability", colors[0]],
            ["Observed binary label", colors[1]],
          ]
        : [
            ["Model prediction", colors[0]],
            ["Actual simulated pain", colors[1]],
          ],
      binary
        ? "Observed binary label: simulated pain ≥ 5. Probability is not a clinical risk estimate."
        : "These pain values are generated. The plotted days were saved for checking, not used to teach the model.",
    );
    let markup = f.markup;
    if (binary) {
      markup += `<path d="M${f.left} ${f.y(0.5)}H${f.right}" stroke="#eacb8744" stroke-dasharray="5 5"/><text x="${f.right}" y="${f.y(0.5) - 7}" text-anchor="end" class="chart-axis">Class threshold: 0.5</text>`;
      markup += polyline(rows, f, "predicted", colors[0]);
      markup += circles(
        rows.map((r, i) => ({
          x: i,
          y: r.actual,
          label: `${r.date}: class ${r.actual}, probability ${r.predicted}`,
        })),
        f,
        () => colors[1],
        4,
      );
    } else {
      markup += polyline(rows, f, "actual", colors[1]);
      markup += polyline(rows, f);
      markup += circles(
        rows.map((r, i) => ({
          x: i,
          y: r.predicted,
          label: `${r.date}: actual ${fmt(r.actual)}, predicted ${fmt(r.predicted)}`,
        })),
        f,
      );
    }
    $("chart").innerHTML = svg(
      markup,
      binary
        ? "Model probabilities and actual yes/no answers on saved test days"
        : "Model estimates and actual generated pain on saved test days",
    );
    $("chart-extra").innerHTML = coefficientBars(result.coefficients);
    evaluationMetrics(result.evaluation, binary);
    $("result-takeaway").textContent = binary
      ? `The line shows probabilities for the defined binary target and mint dots show actual held-out labels. The current-input probability is ${percent(result.prediction)}. Brier score measures squared probability error on test rows. The pain threshold is an explicit demo target, not a validated medical event.`
      : `Held-out RMSE is ${fmt(result.evaluation.rmse, 3)} pain-scale points, compared with ${fmt(result.evaluation.baselineRmse, 3)} for the training-mean baseline, which predicts the same average on every test row. The current-input prediction is ${fmt(result.prediction)}. Coefficients refer to standardized features; they describe the fitted model, not causal intervention effects.`;
  }
  function renderScatter() {
    const points = result.points,
      clustered = selected.id !== "pca";
    const xr = range(points.map((p) => p.x)),
      yr = range(points.map((p) => p.y));
    const f = frame({
      xr,
      yr,
      xTitle: "Principal component 1",
      yTitle: "PC2",
    });
    const labels = [...new Set(points.map((p) => p.cluster))].sort(
      (a, b) => a - b,
    );
    const clusterColor = (p) =>
      p.cluster === -1 ? "#6d7392" : colors[(p.cluster ?? 0) % colors.length];
    const entries = clustered
      ? labels.map((label) => [
          label === -1 ? "Noise" : `Group ${label + 1}`,
          label === -1 ? "#6d7392" : colors[label % colors.length],
        ])
      : [["Each dot = one synthetic day", colors[0]]];
    chartHead(
      clustered
        ? selected.id === "kmeans"
          ? "One dataset. Three geometric groups."
          : "Density, neighborhoods, and the noise between."
        : "Six inputs, seen in two dimensions.",
      "Standardized inputs → PCA plane · 150 synthetic observations",
      entries,
      selected.id === "dbscan"
        ? "ε = 0.7 · minPoints = 4 including the point itself · label −1 denotes noise."
        : selected.id === "kmeans"
          ? "K = 3 · seeded initialization · Euclidean clustering in the first two PCA coordinates."
          : "This view uses inputs without learning from pain scores. Retained spread is not forecast accuracy.",
    );
    let markup =
      f.markup +
      `<path d="M${f.x(0)} ${f.top}V${f.bottom}M${f.left} ${f.y(0)}H${f.right}" stroke="#a292ff20" stroke-dasharray="4 4"/>`;
    markup += circles(
      points.map((p) => ({
        ...p,
        label: `${p.date} · PC1 ${fmt(p.x)}, PC2 ${fmt(p.y)}${clustered ? ` · ${p.cluster === -1 ? "noise" : `group ${p.cluster + 1}`}` : ""}`,
      })),
      f,
      clusterColor,
      4.5,
    );
    if (result.centers)
      markup += result.centers
        .map(
          (center, i) =>
            `<path d="M${f.x(center[0]) - 6} ${f.y(center[1]) - 6}l12 12m0-12l-12 12" stroke="${colors[i]}" stroke-width="3"><title>Center of group ${i + 1}</title></path>`,
        )
        .join("");
    $("chart").innerHTML = svg(
      markup,
      `${selected.title}: ${points.length} synthetic observations in principal component coordinates`,
    );
    if (selected.id === "pca") {
      $("chart-extra").innerHTML =
        `<div class="coefficient-heading"><span>Explained variance by component</span><span>Three retained principal components</span></div><div class="coefficient-grid">${result.explainedVariance.map((v, i) => `<div class="coefficient-row"><span>PC${i + 1}</span><div class="coefficient-track"><div class="coefficient-fill" style="width:${v * 100}%"></div></div><span>${(v * 100).toFixed(0)}%</span></div>`).join("")}</div>`;
      metrics([
        [
          percent(result.explainedVariance[0]),
          "Variance explained by PC1",
          "Fraction of standardized input variance",
          true,
        ],
        [
          percent(
            result.explainedVariance.slice(0, 2).reduce((a, b) => a + b, 0),
          ),
          "Variance explained by PC1 + PC2",
          "Variance retained in the plotted PCA projection",
        ],
        [
          "6 → 3",
          "Original features → retained components",
          "Three components retained; first two plotted",
        ],
        [
          points.length,
          "Synthetic observations",
          "One dot for each generated day",
        ],
      ]);
      $("result-takeaway").textContent =
        `The first two principal components explain ${percent(result.explainedVariance[0] + result.explainedVariance[1])} of standardized input variance. PCA is fitted to the six input features without pain targets. That percentage measures variance retained in the projection, not predictive accuracy.`;
    } else if (selected.id === "kmeans") {
      metrics([
        [labels.length, "Occupied clusters", "Fixed requested K = 3", true],
        [
          fmt(result.inertia, 1),
          "Within-cluster sum of squared distances",
          "K-means fitting objective in the PCA plane",
        ],
        [
          points.length,
          "Assigned observations",
          "Every point is assigned to its nearest centroid",
        ],
        [
          "2 PCs",
          "Clustering representation",
          "Euclidean distance in the PCA projection",
        ],
      ]);
      $("result-takeaway").textContent =
        "Colors show the nearest-centroid cluster assignments; crosses mark the learned centroids. K-means assigns every point to a cluster in this two-component PCA representation. Compare DBSCAN on the same seed to inspect density-based clusters and explicitly unassigned noise points.";
    } else {
      metrics([
        [
          result.clusters,
          "Density-connected clusters",
          "Clusters expand from DBSCAN core points",
          true,
        ],
        [
          result.noise,
          "Noise observations",
          "Unassigned points retain label −1",
        ],
        [
          result.epsilon,
          "Neighborhood radius ε",
          "Euclidean radius in PCA coordinates",
        ],
        [
          result.minPoints,
          "Minimum neighborhood count",
          "Includes the point itself",
        ],
      ]);
      $("result-takeaway").textContent =
        `With ε = ${result.epsilon} and minPoints = ${result.minPoints}, this seed produces ${result.clusters} density-connected cluster(s) and ${result.noise} noise points. Connected core neighborhoods can form one large cluster; a single cluster is a valid result, not a fallback illustration.`;
    }
  }
  function horizontalBars(
    rows,
    {
      valueKey = "value",
      labelKey = "label",
      xr = [-1, 1],
      subtitleKey = null,
    } = {},
  ) {
    const left = compactChart() ? 230 : 145,
      right = 740,
      top = 34,
      rowH = compactChart() ? 54 : Math.min(42, 252 / Math.max(1, rows.length)),
      x = (value) =>
        left + ((value - xr[0]) / (xr[1] - xr[0])) * (right - left),
      zero = x(0);
    let markup = Array.from({ length: 5 }, (_, i) => {
      const v = xr[0] + ((xr[1] - xr[0]) * i) / 4;
      return `<path class="chart-grid" d="M${x(v)} 20V${top + rows.length * rowH}"/><text class="chart-axis" x="${x(v)}" y="${top + rows.length * rowH + 20}" text-anchor="middle">${fmt(v, 1)}</text>`;
    }).join("");
    rows.forEach((r, i) => {
      const value = r[valueKey],
        y = top + i * rowH;
      markup += `<text class="chart-axis-title" x="${left - 13}" y="${y + (compactChart() ? 25 : 17)}" text-anchor="end">${escape(r[labelKey])}</text>`;
      if (Number.isFinite(value))
        markup += `<rect class="animate-bar" style="--delay:${i * 0.1}s" x="${Math.min(zero, x(value))}" y="${y}" width="${Math.max(1, Math.abs(x(value) - zero))}" height="21" rx="3" fill="${value < 0 ? colors[1] : colors[0]}"><title>${escape(r[labelKey])}: ${fmt(value, 3)}</title></rect><text class="chart-axis" x="${value >= 0 ? x(value) + 8 : x(value) - 8}" y="${y + (compactChart() ? 25 : 17)}" text-anchor="${value >= 0 ? "start" : "end"}">${fmt(value, 3)}</text>`;
      else
        markup += `<text class="chart-axis" x="${zero + 8}" y="${y + (compactChart() ? 25 : 17)}">Undefined</text>`;
      if (subtitleKey && !compactChart())
        markup += `<text class="chart-axis" x="${left}" y="${y + 33}">${escape(r[subtitleKey])}</text>`;
    });
    return svg(
      markup,
      "Signed calculated association or comparison values",
      Math.max(350, top + rows.length * rowH + 75),
    );
  }
  function renderCorrelation() {
    chartHead(
      "The planted lag, before a predictive model.",
      "Today’s six inputs versus next-day simulated pain",
      [
        ["Positive correlation", colors[0]],
        ["Negative correlation", colors[1]],
      ],
      `${result.pairs[0].observations} exact one-day pairs · Pearson r (linear association) · no significance test or causal claim.`,
    );
    $("chart").innerHTML = horizontalBars(
      result.pairs.map((p) => ({
        label: feature(p.feature),
        value: p.correlation,
      })),
    );
    const cell = 36,
      x0 = 130,
      y0 = 35;
    let grid = "";
    result.matrix.forEach((row, i) =>
      row.forEach((value, j) => {
        const color = value < 0 ? "112,224,203" : "162,146,255";
        grid += `<rect x="${x0 + j * cell}" y="${y0 + i * cell}" width="${cell - 2}" height="${cell - 2}" rx="3" fill="rgba(${color},${Number.isFinite(value) ? 0.06 + Math.abs(value) * 0.65 : 0})"/><text x="${x0 + j * cell + 15}" y="${y0 + i * cell + 19}" text-anchor="middle" fill="#d5d4ee" font-size="18">${Number.isFinite(value) ? value.toFixed(1) : "—"}</text>`;
      }),
    );
    snapshot.featureNames.forEach((name, i) => {
      grid += `<text class="heatmap-label" x="${x0 - 8}" y="${y0 + i * cell + 18}" text-anchor="end" style="font-size:18px">${escape(feature(name))}</text><text class="heatmap-label" x="${x0 + i * cell + 15}" y="${y0 - 8}" text-anchor="middle" style="font-size:18px">${i + 1}</text>`;
    });
    $("chart-extra").innerHTML =
      `<div class="coefficient-heading"><span>Input correlation matrix</span><span>1–6: dairy, spicy, caffeine, fiber, medication, energy</span></div><div style="max-width:360px">${svg(grid, "Pairwise correlations between the six synthetic inputs", 275, 360)}</div>`;
    const top = result.pairs
      .slice()
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))[0];
    metrics([
      [
        fmt(top.correlation, 3),
        "Largest absolute correlation",
        feature(top.feature),
        true,
      ],
      [
        result.pairs[0].observations,
        "Complete one-day calendar pairs",
        "Current features paired with next-day pain",
      ],
      [
        "−1…+1",
        "Pearson correlation range",
        "Linear association; no causal inference",
      ],
      [6, "Compared inputs", "All comparisons shown"],
    ]);
    $("result-takeaway").textContent =
      `For this seed, ${feature(top.feature).toLowerCase()} has the strongest next-day association by magnitude (${fmt(top.correlation, 3)}). The generator deliberately plants a one-day relationship. The colored input grid shows which features also move together, helping explain why model weights can share information.`;
  }
  function renderDtw() {
    const motif = result.motifs[0],
      rolling = selected.id === "dtw-rolling";
    chartHead(
      rolling
        ? "Same distance. Less memory. No stored path."
        : "Two shapes, connected by their best alignment.",
      `${motif.first} and ${motif.second} · best matching seven-day pair`,
      [
        ["First window", colors[0]],
        ["Second window", colors[1]],
        ...(!rolling ? [["Alignment links", "#6d7392"]] : []),
      ],
      `Timing stretch limited to ${result.band} positions · ${result.comparisons} separate clip pairs checked. Distance combines squared value differences along the matching path.`,
    );
    const left = 70,
      right = 745,
      x = (i) => left + (i / 6) * (right - left),
      yr = range([...motif.firstValues, ...motif.secondValues], [0, 10], 0.2),
      y = (value, top) => top + 75 - ((value - yr[0]) / (yr[1] - yr[0])) * 75;
    let markup = `<text class="chart-axis" x="${left}" y="14">First clip · pain</text><text class="chart-axis" x="${left}" y="174">Second clip · pain</text>`;
    for (let i = 0; i < 7; i++) {
      markup += `<path class="chart-grid" d="M${x(i)} 25V277"/><text class="chart-axis" x="${x(i)}" y="297" text-anchor="middle">Day ${i + 1}</text>`;
    }
    if (!rolling)
      markup += motif.path
        .map(
          ([i, j], index) =>
            `<line class="animate-fill" x1="${x(i)}" y1="${y(motif.firstValues[i], 25)}" x2="${x(j)}" y2="${y(motif.secondValues[j], 185)}" stroke="#a292ff30" stroke-width="1.2" style="animation-delay:${index * 0.08}s"/>`,
        )
        .join("");
    [motif.firstValues, motif.secondValues].forEach((values, row) => {
      markup += `<polyline class="chart-line animate-line" points="${values.map((value, i) => `${x(i)} ${y(value, row ? 185 : 25)}`).join(" ")}" stroke="${colors[row]}"/>`;
      markup += values
        .map(
          (value, i) =>
            `<circle class="chart-point animate-point" cx="${x(i)}" cy="${y(value, row ? 185 : 25)}" r="4" fill="${colors[row]}" style="--delay:${i * 0.1}s"><title>Window ${row + 1}, day ${i + 1}: simulated pain ${fmt(value)}</title></circle>`,
        )
        .join("");
    });
    $("chart").innerHTML = svg(
      markup,
      rolling
        ? "Two matched seven-day pain clips; the memory-saving version keeps no alignment path"
        : "Two seven-day pain clips with their calculated best matching links",
      330,
    );
    $("chart-extra").innerHTML =
      `<div class="coefficient-heading"><span>Next closest matches</span><span>Calculated matches, nearest first</span></div><div class="coefficient-grid">${result.motifs
        .slice(1, 4)
        .map(
          (m) =>
            `<div style="font-size:14px;color:var(--muted)">${m.first.slice(5)} ↔ ${m.second.slice(5)} <strong style="color:var(--fg);margin-left:8px">${fmt(m.distance, 3)}</strong></div>`,
        )
        .join("")}</div>`;
    metrics([
      [
        fmt(motif.distance, 3),
        "Best constrained DTW distance",
        "Square root of accumulated squared alignment cost",
        true,
      ],
      [
        result.comparisons,
        "Eligible seven-day window comparisons",
        "Non-overlapping windows; gaps excluded",
      ],
      [
        rolling ? "O(m)" : "O(n·m)",
        "Cost-matrix memory complexity",
        rolling
          ? "Rolling rows; exact distance without a path"
          : "Full matrix with backtracked alignment path",
      ],
      [
        rolling ? "None" : motif.path.length,
        "Alignment path positions",
        rolling
          ? "Not retained by the rolling-memory variant"
          : "Links come from the cheapest path",
      ],
    ]);
    $("result-takeaway").textContent = rolling
      ? "These are the closest seven-day clips found by the search. This memory-saving version gives the same distance as full DTW, but does not keep the grid needed to draw the matching path. Open full DTW on this seed to see the links between positions."
      : "Links show the returned minimum-cost ordered alignment. A position can correspond to multiple positions in the other sequence, with their indices at most two apart. The sliding-window search uses seven consecutive days, three-row candidate steps and non-overlapping pairs, then ranks the five nearest distances. Similarity under this rule is not recurrence prediction.";
  }
  function renderHorizons() {
    const binary = selected.type === "event-horizon",
      models = binary ? result.windows : result.forecasts,
      values = models.map((m) => ({
        horizon: m.horizon,
        predicted: m.prediction,
      }));
    const f = frame({
      xr: [0, 15],
      yr: binary
        ? [0, 1]
        : range([0, ...values.map((v) => v.predicted)], [0, 10], 0.06),
      xLabels: models.map((m) => ({
        value: m.horizon,
        label: `+${m.horizon} days`,
      })),
      xTitle: "Future endpoint",
    });
    chartHead(
      binary
        ? "One demo event, three separate endpoints."
        : "Independent direct-horizon regression models",
      binary
        ? "Probability of synthetic pain ≥ 5 at the endpoint"
        : "Current-input predictions from separately fitted horizon models",
      [
        [
          binary
            ? "Chance at that future date"
            : "Estimate at that future date",
          colors[0],
        ],
      ],
      "Each value is a separate endpoint prediction. No daily interpolation or calibrated prediction interval is computed.",
    );
    let markup = f.markup;
    if (binary)
      markup += `<path d="M${f.left} ${f.y(0.5)}H${f.right}" stroke="#eacb8744" stroke-dasharray="5 5"/>`;
    values.forEach((value, i) => {
      markup += `<rect class="animate-bar" style="--delay:${i * 0.18}s" x="${f.x(value.horizon) - 25}" y="${Math.min(f.y(value.predicted), f.y(0))}" width="50" height="${Math.abs(f.y(0) - f.y(value.predicted))}" rx="5" fill="${colors[i]}" fill-opacity=".7"/><text class="chart-axis-title" x="${f.x(value.horizon)}" y="${f.y(value.predicted) - 10}" text-anchor="middle">${binary ? percent(value.predicted) : fmt(value.predicted)}</text>`;
    });
    $("chart").innerHTML = svg(
      markup,
      binary
        ? "Computed synthetic event probabilities at 3, 7 and 14-day endpoints"
        : "Computed current-input pain estimates at 1, 7 and 14-day endpoints",
    );
    $("chart-extra").innerHTML =
      `<div class="data-table-wrap"><table class="data-table"><caption class="sr-only">Scores on saved examples for each future-date model</caption><thead><tr><th>Horizon</th><th>${binary ? "Probability error (Brier)" : "RMSE"}</th><th>${binary ? "Accuracy" : "Training-mean baseline RMSE"}</th><th>Training / held-out test examples</th></tr></thead><tbody>${models.map((m) => `<tr><td>+${m.horizon} days</td><td>${fmt(binary ? m.evaluation.brier : m.evaluation.rmse, 3)}</td><td>${binary ? percent(m.evaluation.accuracy) : fmt(m.evaluation.baselineRmse, 3)}</td><td>${m.evaluation.trainingRows} / ${m.evaluation.heldOutRows}</td></tr>`).join("")}</tbody></table></div>`;
    metrics([
      [
        3,
        "Independent horizon models",
        "Separate target pairing and regression/classification fit",
        true,
      ],
      [
        binary ? "3 / 7 / 14" : "1 / 7 / 14",
        "Days ahead",
        "Exact calendar endpoints, not interval labels",
      ],
      [
        selected.id === "elastic-horizons" ? "6 inputs" : "4 PCs",
        "Predictor representation",
        "Training-fitted standardization and any PCA",
      ],
      [
        binary ? "0.5" : "RMSE",
        binary
          ? "Classification decision threshold"
          : "Error checked separately at each date",
        binary
          ? "Not a clinical event definition"
          : "See the held-out evaluation table",
      ],
    ]);
    $("result-takeaway").textContent = binary
      ? "Each bar is the latest example’s probability of simulated pain reaching five at that exact future date. The table checks each question against its own held-out later examples. This is not the chance of any event during the intervening days, or a Crohn’s flare-risk estimate."
      : "Each bar answers a separate future-date question with a separately learned model. The table shows how each did on saved later days. Today’s features can work well for tomorrow but offer little help a week later; the generator does not guarantee longer-term signal.";
  }
  function renderRecursive() {
    const history = snapshot.rows.slice(-28),
      rows = history
        .map((r) => ({ actual: r.pain }))
        .concat(result.forecasts.map((r) => ({ predicted: r.predicted }))),
      boundary = history.length - 1;
    rows[boundary].predicted = rows[boundary].actual;
    const f = frame({
      xr: [0, rows.length - 1],
      yr: [0, 10],
      xLabels: [
        { value: 0, label: history[0].date.slice(5) },
        { value: boundary, label: "Last observed" },
        { value: rows.length - 1, label: "+14 days" },
      ],
      xTitle: "Observed history → recursive forecast",
    });
    chartHead(
      "Yesterday becomes a feature. Then predictions do.",
      "Observed synthetic history and a 14-step recursive forecast",
      [
        ["Actual simulated pain", colors[1]],
        ["Recursive future prediction", colors[0]],
      ],
      "Recursive predictions are bounded to 0–10. One-step holdout metrics do not evaluate the complete 14-step trajectory.",
    );
    let markup =
      f.markup +
      `<rect x="${f.x(boundary)}" y="${f.top}" width="${f.right - f.x(boundary)}" height="${f.bottom - f.top}" fill="#a292ff07"/><path d="M${f.x(boundary)} ${f.top}V${f.bottom}" stroke="#a292ff55" stroke-dasharray="4 4"/>` +
      polyline(rows, f, "actual", colors[1]) +
      polyline(rows, f);
    markup += circles(
      result.forecasts.map((r, i) => ({
        x: boundary + i + 1,
        y: r.predicted,
        label: `${r.date}: recursive prediction ${fmt(r.predicted)}`,
      })),
      f,
    );
    $("chart").innerHTML = svg(
      markup,
      "28 days of observed synthetic pain followed by the actual computed 14-day recursive forecast",
    );
    $("chart-extra").innerHTML = coefficientBars(result.coefficients);
    evaluationMetrics(result.evaluation);
    $("result-takeaway").textContent =
      `Mint is observed synthetic pain; violet is the recursive forecast from a final model refitted after recording the holdout evaluation. Later inputs include preceding predictions. The one-step holdout RMSE of ${fmt(result.evaluation.rmse, 3)} uses observed lag values and does not measure this entire multi-step forecast.`;
  }
  function renderCascade() {
    const f = frame({
      xr: [0, 7],
      yr: [0, 10],
      xLabels: [0, 1, 3, 5, 7].map((h) => ({
        value: h,
        label: h ? `+${h}d` : "Latest",
      })),
      xTitle: "Future step",
    });
    const painRows = [
      { horizon: 0, predicted: snapshot.rows.at(-1).pain },
      ...result.forecasts.map((r) => ({
        horizon: r.horizon,
        predicted: r.pain,
      })),
    ];
    const hasFeatures = !!result.forecasts[0].features;
    chartHead(
      "Predict the state. Feed it back. Repeat.",
      hasFeatures
        ? "Pain and six features from recursively predicted states"
        : "Same seven-quantity model, showing only pain",
      [
        ["Demo pain", colors[0]],
        ...(hasFeatures
          ? [["Feature trajectories (range-normalized for display)", colors[1]]]
          : []),
      ],
      "One-step holdout inputs are observed predecessor states. The seven-step future instead reuses predicted states, bounded to observed field ranges.",
    );
    let markup =
      f.markup +
      polyline(painRows, f, "predicted", colors[0], (r) => r.horizon);
    if (hasFeatures)
      snapshot.featureNames.forEach((name, j) => {
        const values = snapshot.rows.map((r) => r.features[j]),
          lo = Math.min(...values),
          hi = Math.max(...values),
          scale = (v) => ((v - lo) / (hi - lo || 1)) * 10;
        const traces = [
          { horizon: 0, predicted: scale(snapshot.rows.at(-1).features[j]) },
          ...result.forecasts.map((r) => ({
            horizon: r.horizon,
            predicted: scale(r.features[j]),
          })),
        ];
        markup += polyline(
          traces,
          f,
          "predicted",
          colors[(j + 1) % colors.length],
          (r) => r.horizon,
          true,
        );
      });
    markup += circles(
      painRows.map((r) => ({
        x: r.horizon,
        y: r.predicted,
        label: `Step ${r.horizon}: simulated pain ${fmt(r.predicted)}`,
      })),
      f,
    );
    $("chart").innerHTML = svg(
      markup,
      "Actual recursively computed seven-step state cascade, with pain and optional range-normalized feature trajectories",
    );
    $("chart-extra").innerHTML =
      `<div class="data-table-wrap"><table class="data-table"><caption class="sr-only">One-step holdout errors for each modeled state variable</caption><thead><tr><th>State field</th><th>One-step RMSE</th><th>Training-mean baseline RMSE</th><th>R²</th></tr></thead><tbody>${result.evaluation.map((e) => `<tr><td>${escape(feature(e.field))}</td><td>${fmt(e.rmse, 3)}</td><td>${fmt(e.baselineRmse, 3)}</td><td>${fmt(e.r2, 3)}</td></tr>`).join("")}</tbody></table></div>`;
    metrics([
      [
        7,
        "Recursive forecast horizons",
        "Predicted states become later model inputs",
        true,
      ],
      [
        7,
        "Internally modeled state variables",
        "Pain plus six generated input fields",
      ],
      [
        fmt(result.evaluation[0].rmse, 3),
        "Pain one-step holdout RMSE",
        "Evaluation uses observed predecessor states",
      ],
      [
        selected.id === "pca-cascade" ? "4 PCs" : "7 fields",
        "How the model sees the state",
        "Learned from the earlier period only",
      ],
    ]);
    $("result-takeaway").textContent = hasFeatures
      ? "Violet is predicted simulated pain. Feature trajectories are range-normalized to 0–10 only for display; downloads retain raw values. Each full predicted state becomes the next input, allowing errors to propagate across fields. Smooth trajectories do not establish accurate future exposures or outcomes."
      : "This output view returns the pain trajectory while still modeling all seven state fields internally. Predicted feature fields affect later recursive inputs. The symptom cascade exposes those additional trajectories; the scalar display is not a separate clinical score model.";
  }
  function renderComparisons() {
    const rows = result.comparisons.map((r) => ({
      label: feature(r.feature),
      value: r.difference,
      detail: `${r.exposedDays} exposed · ${r.comparisonDays} comparison days`,
    }));
    const max = Math.max(0.5, ...rows.map((r) => Math.abs(r.value ?? 0))) * 1.3;
    chartHead(
      "A mean difference, with its denominators.",
      "Mean next-day pain after exposed and comparison days",
      [
        ["Higher exposed mean", colors[0]],
        ["Lower exposed mean", colors[1]],
      ],
      "Average after days with the feature, minus average after days without it · one-day delay · a recorded difference, not a proven effect.",
    );
    $("chart").innerHTML = horizontalBars(rows, {
      xr: [-max, max],
      subtitleKey: "detail",
    });
    $("chart-extra").innerHTML =
      `<div class="data-table-wrap"><table class="data-table"><caption class="sr-only">Sizes of the groups being compared</caption><thead><tr><th>Input feature</th><th>Days with it</th><th>Days without it</th><th>Mean difference</th></tr></thead><tbody>${result.comparisons.map((row) => `<tr><td>${escape(feature(row.feature))}</td><td>${row.exposedDays}</td><td>${row.comparisonDays}</td><td>${fmt(row.difference, 3)}</td></tr>`).join("")}</tbody></table></div>`;
    const biggest = rows
      .slice()
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
    metrics([
      [
        fmt(biggest.value, 3),
        "Largest average difference by magnitude",
        biggest.label,
        true,
      ],
      [3, "Binary exposure indicators compared", "Dairy, spicy and caffeine"],
      [
        1,
        "Days between feature and outcome",
        "Matched to the next calendar day",
      ],
      [
        "Both",
        "Sizes of both comparison groups",
        "Days with the feature, and days without it",
      ],
    ]);
    $("result-takeaway").textContent =
      "Each bar compares tomorrow’s average pain after generated days with the feature against days without it. Read both group sizes in the table. The simulator deliberately includes some input relationships; these recorded differences do not prove what changing a real food would do.";
  }
  function renderScenarios() {
    const execution = selected.type === "scenario-execution";
    chartHead(
      execution
        ? "Evaluate low/high values of one feature at a time"
        : "Which inputs should the what-if model inspect?",
      execution
        ? "One feature changed; all other coordinates held fixed"
        : "Three strongest next-day linear associations, positive or negative",
      execution
        ? [
            ["Low-setting prediction", colors[1]],
            ["High-setting prediction", colors[0]],
          ]
        : [
            ["Positive association", colors[0]],
            ["Negative association", colors[1]],
          ],
      execution
        ? "The model learns from all complete date pairs. These what-if answers are not separately tested intervention outcomes."
        : "The recorded associations choose three features; their low/high settings are stated example values.",
    );
    if (!execution) {
      $("chart").innerHTML = horizontalBars(
        result.scenarios.map((s) => ({
          label: feature(s.feature),
          value: s.recordedCorrelation,
          detail: `Case values: low ${s.low}, high ${s.high}`,
        })),
        { subtitleKey: "detail" },
      );
    } else {
      const max =
          Math.max(
            1,
            ...result.scenarios.flatMap((s) => [
              s.lowPrediction,
              s.highPrediction,
            ]),
          ) * 1.2,
        min = Math.min(
          0,
          ...result.scenarios.flatMap((s) => [
            s.lowPrediction,
            s.highPrediction,
          ]),
        );
      const f = frame({
        xr: [-0.5, 2.5],
        yr: [min, max],
        xLabels: result.scenarios.map((s, i) => ({
          value: i,
          label: feature(s.feature),
        })),
        xTitle: "One feature varied at a time",
      });
      let markup = f.markup;
      result.scenarios.forEach((s, i) => {
        [s.lowPrediction, s.highPrediction].forEach((v, j) => {
          const x = f.x(i) + (j ? -5 : -38);
          markup += `<rect class="animate-bar" style="--delay:${i * 0.15 + j * 0.1}s" x="${x}" y="${Math.min(f.y(v), f.y(0))}" width="32" height="${Math.abs(f.y(0) - f.y(v))}" rx="4" fill="${j ? colors[0] : colors[1]}" fill-opacity=".8"/><text class="chart-axis" x="${x + 16}" y="${f.y(v) - 9}" text-anchor="middle">${fmt(v)}</text>`;
        });
      });
      $("chart").innerHTML = svg(
        markup,
        "Model answers for the low and high setting of each chosen feature",
      );
    }
    $("chart-extra").innerHTML =
      `<div class="data-table-wrap"><table class="data-table"><caption class="sr-only">Selected scenarios and their declared input bounds</caption><thead><tr><th>Selected input</th><th>Low / high input</th><th>${execution ? "Prediction difference" : "Recorded correlation"}</th></tr></thead><tbody>${result.scenarios.map((s) => `<tr><td>${escape(feature(s.feature))}</td><td>${s.low} / ${s.high}</td><td>${fmt(execution ? s.difference : s.recordedCorrelation, 3)}</td></tr>`).join("")}</tbody></table></div>`;
    metrics([
      [3, "Selected synthetic cases", "Ranked by absolute correlation", true],
      [
        execution ? "Fixed" : "0 / high",
        execution ? "Other input values" : "Declared case bounds",
        execution
          ? "Latest fixture row as baseline"
          : "Energy high 10; others high 1",
      ],
      [
        execution ? "ElasticNet" : "Pearson r (linear association)",
        execution ? "Fitted prediction model" : "Scenario-selection rule",
        execution
          ? "Uses all complete generated date pairs"
          : "Exactly matched next-day examples",
      ],
      [
        "None",
        "Proof of an intervention effect",
        "None: this shows the model’s response",
      ],
    ]);
    $("result-takeaway").textContent = execution
      ? "The paired bars come from two copies of the same latest input row. One selected feature is set low or high while all other values stay fixed. This shows how the fitted model responds to that feature; it does not show outcomes actually observed after a real intervention."
      : "This step chooses three features and two settings for each. The bars show the recorded associations used to choose them; no scenario outcome is predicted yet. Open “Execute scenarios” on the same seed to apply these explicit cases to a fitted model.";
  }
  function renderReadings() {
    $("panel-purpose").innerHTML =
      `<p class="eyebrow">DEFINITION, MECHANISM AND EXAMPLE</p><h3>Understanding ${escape(selected.title)}</h3>${paragraphs(selected.plainLanguage.what, "lead")}<p class="inline-note">${escape(selected.plainLanguage.uses)}</p><h4>A concrete example</h4>${paragraphs(selected.example)}<h4>The calculation in this demo</h4><ol class="idea-steps">${selected.steps.map(([title, description]) => `<li><strong>${escape(title)}.</strong> ${escape(description)}</li>`).join("")}</ol><div class="reading-cards"><div class="reading-card"><h4>Why use this approach?</h4>${paragraphs(selected.why)}</div><div class="reading-card"><h4>Limits of the result</h4>${paragraphs(selected.limitations)}</div></div>`;
    $("panel-implementation").innerHTML =
      `<p class="eyebrow">THE EQUATION, THEN THE IMPLEMENTATION</p><h3>The mathematics and the code</h3><div class="formula-card">${escape(selected.math)}</div>${paragraphs(selected.mathNote)}<h4>How the code performs the calculation</h4><span class="code-name">${escape(selected.handler)}(demoSnapshot)</span>${paragraphs(selected.how)}<h4>What changed from the coursework version</h4>${paragraphs(selected.archive)}<div class="reading-card"><h4>From the input snapshot to calculated results</h4><p>A fixed copy of the generated days goes into the selected function. Shared JavaScript routines do the mathematics and return the numbers you see. The charts are drawn from those actual results. The calculation stays in this browser and does not read your app’s health logs or call a prediction service.</p></div><div class="source-links"><a href="assets/algorithms/models/workflows.js" target="_blank" rel="noopener noreferrer">Read workflow source ↗</a><a href="assets/algorithms/models/math.js" target="_blank" rel="noopener noreferrer">Read numerical kernels ↗</a><a href="${escape(selected.source[1])}" target="_blank" rel="noopener noreferrer">${escape(selected.source[0])} ↗</a></div>`;
    $("panel-methodology").innerHTML =
      `<p class="eyebrow">FROM THE QUESTION TO A FAIR CHECK</p><h3>How we use and check this algorithm</h3>${selected.methodology.map(([title, text]) => `<h4>${escape(title)}</h4><p>${escape(text)}</p>`).join("")}<h4>What the animation means</h4><p>The chart reveals the result already calculated by the code. It does not replay recorded learning iterations or show a live stream of health data. Pause and replay change the presentation. Changing the seed really creates new input data and recalculates the selected model.</p><div class="source-links"><a href="assets/algorithms/ML_ALGORITHMS_AND_METHODOLOGY.md" download>Read the complete implementation guide ↓</a><a href="https://scikit-learn.org/stable/common_pitfalls.html" target="_blank" rel="noopener noreferrer">Why the test data stays separate ↗</a></div>`;
    const rows = snapshot.rows.slice(-12);
    $("panel-data").innerHTML =
      `<p class="eyebrow">REPRODUCIBLE BY DESIGN</p><h3>Know the invented recipe behind the data</h3><p class="lead">Seed ${seed} generates 150 complete synthetic daily observations, from ${snapshot.rows[0].date} through ${snapshot.asOfDate}. The generator is the same pure function used by the app’s coursework demo. Changing the seed changes the data; the same seed reproduces the same results.</p><div class="formula-card">painₜ = clamp(3 + 2·dairyₜ₋₁ + 1.4·spicyₜ₋₁\n        − 0.6·fiberₜ₋₁ − 0.8·medicationₜ₋₁\n        + sin(tπ/7) + seeded noise, 0, 10)</div><p>The relationship above is invented for coursework. It does not encode known food or medication effects in Crohn’s disease. Caffeine and energy have no planted direct coefficient. Fiber is a generated 0–2 input, not an actual dietary recommendation or measurement in grams.</p><h4>A peek at the last 12 generated rows</h4><div class="data-table-wrap"><table class="data-table"><caption class="sr-only">The last twelve synthetic days and the six numerical input fields</caption><thead><tr><th>Date</th><th>Pain</th>${snapshot.featureNames.map((n) => `<th>${escape(feature(n))}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr><td>${r.date}</td><td>${fmt(r.pain)}</td>${r.features.map((v) => `<td>${fmt(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="inline-note"><p><strong>Never your personal logs.</strong> This website has no account connection or database adapter. Data is generated in browser memory; the computations make no data-upload requests. External font loading is part of the website presentation, separate from these calculations.</p></div><div class="source-links"><button id="download-data" class="text-button">Download all 150 synthetic rows ↓</button><a href="assets/algorithms/models/dataset.js" target="_blank" rel="noopener noreferrer">Inspect the generator source ↗</a></div>`;
    $("download-data").addEventListener("click", () =>
      download(`gutopia-synthetic-seed-${seed}.json`, {
        provenance: "Synthetic coursework fixture; not clinical evidence",
        ...snapshot,
      }),
    );
  }
  function setTab(name, focus = false) {
    currentTab = name;
    document.querySelectorAll("[role=tab]").forEach((button) => {
      const active = button.dataset.tab === name;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
    document.querySelectorAll("[role=tabpanel]").forEach((panel) => {
      panel.hidden = panel.id !== `panel-${name}`;
    });
  }
  function renderList() {
    const query = $("algorithm-search").value.trim().toLowerCase();
    const filtered = catalog.filter((item) =>
      `${item.title} ${item.group} ${item.handler} ${item.variant ? "variant" : ""}`
        .toLowerCase()
        .includes(query),
    );
    $("algorithm-count").textContent = query ? `${filtered.length} / 23` : "23";
    let group = "";
    $("algorithm-list").innerHTML =
      filtered
        .map((item) => {
          let label = "";
          if (item.group !== group) {
            group = item.group;
            label = `<h3 class="family-label">${escape(group)}</h3>`;
          }
          return `${label}<button class="algorithm-option" data-algorithm="${item.id}" aria-pressed="${item.id === selected.id}" ${item.id === selected.id ? 'aria-current="true"' : ""}><span class="option-mark" aria-hidden="true">${escape(item.icon)}</span><span class="option-name">${escape(item.short)}</span>${item.variant ? '<span class="variant-dot" title="Earlier coursework variant">◇</span>' : ""}</button>`;
        })
        .join("") ||
      '<p class="empty-search">No matching algorithms. Try “PCA”, “DTW”, or “forecast”.</p>';
    const activeOption = $("algorithm-list").querySelector(
      "[aria-pressed=true]",
    );
    if (activeOption && matchMedia("(max-width:800px)").matches)
      $("algorithm-list").scrollLeft =
        activeOption.offsetLeft -
        $("algorithm-list").offsetLeft -
        ($("algorithm-list").clientWidth - activeOption.clientWidth) / 2;
    $("algorithm-list")
      .querySelectorAll("button")
      .forEach((button) =>
        button.addEventListener("click", () => {
          selected = catalog.find((x) => x.id === button.dataset.algorithm);
          history.replaceState(null, "", `#${selected.id}`);
          renderList();
          setTab("demo");
          compute();
        }),
      );
  }
  function applyPlayback() {
    $("chart").classList.toggle("paused", !playing);
    $("play-toggle").textContent = playing ? "Pause" : "Play";
    $("play-toggle").setAttribute("aria-pressed", String(playing));
  }
  function renderResult() {
    switch (selected.type) {
      case "regression":
      case "classification":
        renderPrediction();
        break;
      case "scatter":
        renderScatter();
        break;
      case "correlation":
        renderCorrelation();
        break;
      case "dtw":
        renderDtw();
        break;
      case "horizon":
      case "event-horizon":
        renderHorizons();
        break;
      case "recursive":
        renderRecursive();
        break;
      case "cascade":
        renderCascade();
        break;
      case "comparison":
        renderComparisons();
        break;
      case "scenario-generation":
      case "scenario-execution":
        renderScenarios();
        break;
      default:
        throw new Error("No chart for this workflow.");
    }
    $("pipeline").innerHTML = selected.steps
      .map(
        ([title, description], index) =>
          `<div class="pipeline-step"><span class="step-index">0${index + 1}</span><h4>${escape(title)}</h4><p>${escape(description)}</p></div>`,
      )
      .join("");
    applyPlayback();
    renderReadings();
    setTab(currentTab);
  }
  async function compute() {
    const token = ++runToken;
    $("algorithm-family").textContent =
      selected.group.toUpperCase() +
      (selected.variant ? " · EARLIER VARIANT" : "");
    $("algorithm-title").textContent = selected.title;
    $("algorithm-description").textContent = selected.description;
    $("plain-what").innerHTML = paragraphs(selected.plainLanguage.what);
    $("plain-uses").textContent = selected.plainLanguage.uses;
    $("algorithm-number").textContent =
      `${String(selected.number).padStart(2, "0")} / 23`;
    $("run-status").textContent = "Computing from synthetic data…";
    $("result-error").hidden = true;
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (token !== runToken) return;
    try {
      snapshot = kernels.createCourseworkSnapshot(seed);
      const start = performance.now();
      result = kernels[selected.handler](snapshot);
      const elapsed = performance.now() - start;
      $("computation-time").textContent =
        `· ${elapsed < 1 ? "<1" : Math.round(elapsed)} ms`;
      $("chart-card").hidden = false;
      $("metrics").hidden = false;
      renderResult();
      $("run-status").textContent =
        `${selected.title} · seed ${seed} · 150 synthetic days`;
      window.GutopiaLabState = {
        selectedId: selected.id,
        seed,
        result,
        snapshot,
      };
    } catch (error) {
      result = null;
      $("result-error").textContent =
        `This demo couldn’t calculate a result: ${error.message}. Try another seed or algorithm.`;
      $("result-error").hidden = false;
      $("chart-card").hidden = true;
      $("metrics").hidden = true;
      $("run-status").textContent =
        "Calculation failed; other algorithms remain available.";
    }
  }
  function download(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $("choose-another").addEventListener("click", () => {
    $("algorithm-search").focus({ preventScroll: true });
    $("algorithm-list").scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "center",
    });
  });
  $("algorithm-search").addEventListener("input", renderList);
  $("seed-input").addEventListener("change", () => {
    seed = safeSeed($("seed-input").value);
    $("seed-input").value = seed;
    compute();
  });
  $("new-seed").addEventListener("click", () => {
    seed = seed >= 999999 ? 1 : seed + 1;
    $("seed-input").value = seed;
    compute();
  });
  $("play-toggle").addEventListener("click", () => {
    playing = !playing;
    applyPlayback();
  });
  $("replay").addEventListener("click", () => {
    if (!result) return;
    playing = !reducedMotion.matches;
    renderResult();
    $("run-status").textContent = reducedMotion.matches
      ? "Results redrawn; reduced-motion preference respected."
      : `Replaying calculated results · seed ${seed}`;
  });
  $("download-result").addEventListener("click", () => {
    if (result)
      download(`gutopia-${selected.id}-seed-${seed}.json`, {
        workflow: selected.handler,
        seed,
        synthetic: true,
        ...result,
      });
  });
  document.querySelectorAll("[role=tab]").forEach((button, index) => {
    button.addEventListener("click", () => setTab(button.dataset.tab));
    button.addEventListener("keydown", (event) => {
      const tabs = [...document.querySelectorAll("[role=tab]")];
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft")
        next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      setTab(tabs[next].dataset.tab, true);
    });
  });
  window.addEventListener("hashchange", () => {
    const item = catalog.find((x) => x.id === location.hash.slice(1));
    if (item && item.id !== selected.id) {
      selected = item;
      renderList();
      setTab("demo");
      compute();
    }
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      playing = false;
      applyPlayback();
    }
  });
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (result && window.GutopiaLabState?.selectedId === selected.id)
        renderResult();
    }, 100);
  });
  $("year").textContent = new Date().getFullYear();
  renderList();
  compute();
})();
