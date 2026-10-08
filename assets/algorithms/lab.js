/* Browser views; all mathematical kernels are bundled from models/*.js. */
(() => {
  "use strict";
  const A = GutopiaMath,
    $ = (id) => document.getElementById(id),
    C = ["#78d9c0", "#ae9cff", "#ed92b0", "#82bdfa", "#f8cb72", "#dbadff"];
  const esc = (s) =>
    String(s ?? "").replace(
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
  const fmt = (x, d = 2) =>
      Number.isFinite(x) ? String(Number(x.toFixed(d))) : "Not logged",
    date = (d) => A.dateLabel(d);
  const questions = [
    [
      "timeline",
      "Explore all data through time",
      "Browse every measurement and inspect any date.",
    ],
    [
      "event-windows",
      "Could symptoms worsen soon?",
      "Estimate a high-symptom event in the next 1, 3 or 7 days.",
    ],
    [
      "dtw",
      "Have I seen this pattern before?",
      "Watch windows scan and compare the records around matches.",
    ],
    [
      "lasso",
      "How do foods and medications relate to symptoms?",
      "Fit current and earlier inputs to a later symptom.",
    ],
    [
      "correlation",
      "What changes together?",
      "Tap a heatmap square to explain a same-day relationship.",
    ],
    [
      "lagged",
      "What comes before pain?",
      "Explore symptoms, foods and medication 1, 3 or 7 days earlier.",
    ],
    [
      "kmeans",
      "Which days form similar groups?",
      "Choose a number of groups and inspect their days.",
    ],
    [
      "dbscan",
      "Which days cluster naturally?",
      "Find dense groups and days outside them.",
    ],
    [
      "scenario-execution",
      "What if an input were different?",
      "Edit a recorded input and run a model comparison.",
    ],
    [
      "triggers",
      "What follows different foods or medications?",
      "Compare later symptoms and the observed group sizes.",
    ],
  ];
  const aliases = {
    "dtw-rolling": "rolling-dtw",
    elasticnet: "elastic-net",
    "pca-elastic-horizons": "pca-elastic",
    "event-horizons": "event-windows",
    "flare-3": "three-day",
    "demo-cascade": "score-cascade",
  };
  let selected = aliases[location.hash.slice(1)] ?? location.hash.slice(1);
  if (
    !questions.some((q) => q[0] === selected) &&
    !A.algorithms.some((a) => a.id === selected)
  )
    selected = "timeline";
  let snapshot,
    descriptors = [],
    lookup,
    output = null,
    revision = 0,
    resultCache = new Map(),
    timer = null,
    scanning = false,
    pausedByUser = false,
    scanPlan = null,
    scanPosition = 0,
    scanScores = null,
    scanSweep = null,
    scanPage = "",
    mapLayout = null,
    mapRevision = 0,
    sensitivity = null;
  const opts = {
    main: "pain",
    compare: "none",
    compareLag: 0,
    group: "All",
    dateIndex: 149,
    rows: "Symptoms",
    columns: "Foods",
    pairFirst: "fiber",
    pairSecond: "pain",
    lag: 1,
    horizon: 1,
    k: 3,
    space: "full",
    radius: 1,
    map: "pca",
    axes: false,
    historyLag: 0,
    input: "dairy",
    target: "pain",
    value: 1,
    scenarioDate: "",
    regressionTarget: "pain",
    regressionLag: 1,
    regressionInputs: "foods-and-medications",
    cascadeField: "pain",
    window: 0,
    candidateWindow: 0,
    referenceStep: 1,
    zoom: 0,
    scanSpeed: 3,
    period: 0,
    contextLag: 0,
    contextFeature: "dairy",
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function choose(label, key, values) {
    return `<label>${esc(label)}<select data-option="${key}">${values
      .map((v) => {
        const [value, text] = Array.isArray(v) ? v : [v, v];
        return `<option value="${esc(value)}" ${String(opts[key]) === String(value) ? "selected" : ""}>${esc(text)}</option>`;
      })
      .join("")}</select></label>`;
  }
  function measureOptions(group = "All") {
    return descriptors
      .filter((d) => group === "All" || d.group === group)
      .map((d) => [d.key, d.label]);
  }
  function stat(value, label, note = "") {
    return `<div class="stat"><strong>${esc(value)}</strong><span>${esc(label)}</span>${note ? `<p class="muted">${esc(note)}</p>` : ""}</div>`;
  }
  function card(title, body) {
    return `<section class="card"><h3>${esc(title)}</h3>${body}</section>`;
  }
  function legend(items) {
    return `<div class="legend">${items.map(([name, color]) => `<span><i style="background:${color}"></i>${esc(name)}</span>`).join("")}</div>`;
  }
  function details(day, group = "All") {
    const row = lookup.get(day);
    return `<div class="table-wrap"><table><caption class="selected-date">Original entries · ${esc(day)}</caption><tbody>${descriptors
      .filter((d) => group === "All" || d.group === group)
      .map(
        (d) =>
          `<tr><th scope="row">${esc(d.label)}</th><td>${Number.isFinite(d.read(row)) ? `${fmt(d.read(row))} ${esc(d.unit)}` : "Not logged"}</td></tr>`,
      )
      .join("")}</tbody></table></div>`;
  }
  function svg(body, label, height = 320, width = 900) {
    // Use a narrower coordinate plane on phones while retaining chart height.
    // Text and hit points keep readable sizes; time coordinates are rescaled.
    const factor =
      width >= 800 && matchMedia("(max-width: 700px)").matches ? 0.5 : 1;
    if (factor !== 1) {
      body = body.replace(
        /\b(x|x1|x2|cx|width)="([^"]+)"/g,
        (all, key, value) =>
          Number.isFinite(Number(value))
            ? `${key}="${Number(value) * factor}"`
            : all,
      );
      body = body.replace(
        /points="([^"]+)"/g,
        (_, points) =>
          `points="${points
            .split(" ")
            .map((pair) => {
              const [x, y] = pair.split(",");
              return `${Number(x) * factor},${y}`;
            })
            .join(" ")}"`,
      );
    }
    return `<svg class="plot" viewBox="0 0 ${width * factor} ${height}" role="img" aria-label="${esc(label)}">${body}</svg>`;
  }
  function curve(rows, key, x, y, color, width = 2) {
    return A.lineSegments(rows, key, (i) => x(i), y)
      .map(
        (s) =>
          `<polyline points="${s.join(" ")}" stroke="${color}" fill="none" stroke-width="${width}"/>`,
      )
      .join("");
  }
  function graph(
    rows,
    fields,
    {
      bounds = null,
      label = "Dated measurements",
      points = true,
      height = 320,
    } = {},
  ) {
    const vals = rows
        .flatMap((r) => fields.map((f) => r[f.key]))
        .filter(Number.isFinite),
      lo = bounds?.[0] ?? Math.min(...vals, 0),
      hi = bounds?.[1] ?? Math.max(...vals, 1),
      x = (i) => 55 + (i / (rows.length - 1 || 1)) * 810,
      y = (v) => height - 50 - ((v - lo) / (hi - lo || 1)) * (height - 85);
    let body = [lo, (lo + hi) / 2, hi]
      .map(
        (v) =>
          `<line x1="55" x2="865" y1="${y(v)}" y2="${y(v)}" stroke="#2b3046"/><text x="42" y="${y(v) + 4}" text-anchor="end">${fmt(v, 1)}</text>`,
      )
      .join("");
    fields.forEach((f) => {
      body += curve(rows, f.key, x, y, f.color);
      if (points)
        body += rows
          .flatMap((r, i) =>
            Number.isFinite(r[f.key])
              ? [
                  `<circle class="dot" tabindex="0" role="button" aria-label="Inspect ${esc(r.date)} ${esc(f.label)} ${fmt(r[f.key])}" data-date-index="${i}" cx="${x(i)}" cy="${y(r[f.key])}" r="3.5" fill="${f.color}"><title>${esc(r.date)} · ${esc(f.label)} ${fmt(r[f.key])}</title></circle>`,
                ]
              : [],
          )
          .join("");
    });
    for (const i of [0, Math.floor((rows.length - 1) / 2), rows.length - 1])
      if (rows[i])
        body += `<text x="${x(i)}" y="${height - 15}" text-anchor="${i === 0 ? "start" : i === rows.length - 1 ? "end" : "middle"}">${esc(date(rows[i].date))}</text>`;
    body += `<line id="date-cursor" class="cursor" x1="${x(Math.min(opts.dateIndex, rows.length - 1))}" x2="${x(Math.min(opts.dateIndex, rows.length - 1))}" y1="25" y2="${height - 45}"/>`;
    return (
      legend(fields.map((f) => [f.label, f.color])) + svg(body, label, height)
    );
  }
  function cursor(max, label = "Inspect date") {
    return `<div class="date-control"><label>${esc(label)}</label><input aria-label="${esc(label)}" id="date-slider" type="range" min="0" max="${max}" step="1" value="${Math.min(opts.dateIndex, max)}"><output id="date-label"></output></div>`;
  }
  function calculated(value) {
    output = value;
    $("calculated-output").textContent = JSON.stringify(value, null, 2);
  }
  function download(name, value) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
    );
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  function error(e) {
    $("result-error").hidden = false;
    $("result-error").textContent = e.message ?? e;
    $("run-status").textContent = "Needs more information";
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    scanning = false;
    document.querySelector(".signal")?.classList.remove("pulse");
  }
  function loadHistory() {
    stop();
    revision++;
    mapRevision++;
    mapLayout = null;
    sensitivity = null;
    resultCache.clear();
    const seed = Math.max(
      1,
      Math.min(999999, Number($("seed-input").value) || 42),
    );
    snapshot = A.createTeachingHistory(seed, {
      sparse: $("history-type").value === "sparse",
    });
    descriptors = A.measures(snapshot);
    lookup = new Map(snapshot.rows.map((r) => [r.date, r]));
    opts.dateIndex = snapshot.rows.length - 1;
    opts.scenarioDate = snapshot.asOfDate;
    const known = snapshot.rows.filter((r) => r.pain !== null).length;
    $("dataset-summary").textContent =
      `${snapshot.rows.length} calendar days · ${known} recorded pain days · ${descriptors.length} measurement types`;
    render();
  }
  function drawer() {
    const q = questions.find((q) => q[0] === selected);
    $("question-list").innerHTML = questions
      .map(
        ([id, title, description]) =>
          `<button data-question="${id}" class="${id === selected ? "active" : ""}">${esc(title)}<small>${esc(description)}</small></button>`,
      )
      .join("");
    const search = $("algorithm-search").value.toLowerCase();
    $("advanced-list").innerHTML = A.algorithms
      .filter((a) =>
        (a.title + " " + a.explanation).toLowerCase().includes(search),
      )
      .map(
        (a) =>
          `<button data-question="${a.id}" class="${a.id === selected ? "active" : ""}">${esc(a.title)} <small class="muted">${esc(a.group)}</small></button>`,
      )
      .join("");
  }
  async function render({ preserveScan = false } = {}) {
    stop();
    const request = ++revision;
    mapRevision++;
    sensitivity = null;
    $("result-error").hidden = true;
    $("question-result").innerHTML = "";
    calculated(null);
    $("question-controls").innerHTML = "";
    $("run-status").textContent = "Calculating…";
    drawer();
    const algorithm = A.algorithms.find((a) => a.id === selected),
      q = questions.find((q) => q[0] === selected);
    $("question-title").textContent = q?.[1] ?? algorithm?.title;
    $("question-description").textContent = q?.[2] ?? algorithm?.description;
    $("question-family").textContent = q
      ? "CHOOSE A QUESTION"
      : algorithm?.group;
    $("method-explanation").textContent =
      algorithm?.explanation ??
      (selected === "timeline"
        ? "Explore measurements on their actual calendar dates. Empty dates remain empty."
        : "Compare earlier recorded measurements with the later symptom, keeping exact calendar dates.");
    $("method-implementation").textContent =
      algorithm?.implementation ??
      "Original values and missing flags remain separate. Every date is retained; pair calculations use only measurements that were both recorded.";
    await new Promise((r) => setTimeout(r, 0));
    if (request !== revision) return;
    try {
      if (selected === "timeline") renderTimeline();
      else if (selected === "correlation" || selected === "lagged")
        renderRelationships();
      else if (selected === "triggers") renderTriggers();
      else if (
        selected === "scenario-execution" ||
        selected === "scenario-generation"
      )
        renderScenarios();
      else {
        const key = JSON.stringify([
          selected,
          opts.k,
          opts.radius,
          opts.space,
          opts.regressionTarget,
          opts.regressionLag,
          opts.regressionInputs,
        ]);
        let result = resultCache.get(key);
        if (!result) {
          result = algorithm.kind === "dtw" ? await A.runDtwAsync(snapshot, { optimized: algorithm.id === "rolling-dtw", isCurrent: () => request === revision }) : algorithm.run(
            snapshot,
            selected === "kmeans"
              ? { k: opts.k, space: opts.space }
              : selected === "dbscan"
                ? { radiusScale: opts.radius, space: opts.space }
                : ["lasso", "elastic-net"].includes(selected)
                  ? {
                      target: opts.regressionTarget,
                      lag: opts.regressionLag,
                      inputs: opts.regressionInputs,
                    }
                  : {},
          );
          resultCache.set(key, result);
        }
        if (request !== revision) return;
        calculated(result);
        if (algorithm.kind === "dtw") renderDtw(result, preserveScan);
        else if (["clusters", "projection"].includes(algorithm.kind))
          renderMap(result, request);
        else if (selected === "event-windows") renderEvent(result);
        else renderPrediction(result, algorithm);
      }
      $("run-status").textContent = "Computed locally";
    } catch (e) {
      error(e);
    }
  }
  function renderTimeline() {
    $("question-controls").innerHTML =
      choose("Main measurement", "main", measureOptions()) +
      choose("Compare with", "compare", [
        ["none", "One measurement"],
        ...measureOptions().filter((v) => v[0] !== opts.main),
      ]) +
      (opts.compare !== "none"
        ? choose("Comparison timing", "compareLag", [
            [0, "Same day"],
            [1, "1 day earlier"],
            [3, "3 days earlier"],
            [7, "7 days earlier"],
          ])
        : "");
    const first = descriptors.find((d) => d.key === opts.main),
      second = descriptors.find((d) => d.key === opts.compare),
      raw = snapshot.rows.map((row) => ({
        date: row.date,
        a: first.read(row),
        b:
          second?.read(
            lookup.get(
              new Date(A.time(row.date) - opts.compareLag * A.DAY)
                .toISOString()
                .slice(0, 10),
            ),
          ) ?? null,
      }));
    const range = (k) => {
        const v = raw.map((r) => r[k]).filter(Number.isFinite);
        return [Math.min(...v), Math.max(...v)];
      },
      a = range("a"),
      b = range("b");
    const rows = raw.map((r) => ({
      ...r,
      a:
        second && Number.isFinite(r.a)
          ? (100 * (r.a - a[0])) / (a[1] - a[0] || 1)
          : r.a,
      b:
        second && Number.isFinite(r.b)
          ? (100 * (r.b - b[0])) / (b[1] - b[0] || 1)
          : r.b,
    }));
    const fields = [
      { key: "a", label: first.label, color: C[0] },
      ...(second
        ? [
            {
              key: "b",
              label:
                second.label +
                (opts.compareLag ? ` · ${opts.compareLag} days earlier` : ""),
              color: C[1],
            },
          ]
        : []),
    ];
    $("question-result").innerHTML =
      card(
        "Every calendar day stays in view",
        (second
          ? "<p>Each line uses 0–100% of its own observed range. Inspect a date for original values and units.</p>"
          : "<p>Gaps mean not logged. They are not pain zero.</p>") +
          graph(rows, fields, { bounds: second ? [0, 100] : null }) +
          cursor(rows.length - 1) +
          '<div id="day-detail"></div>',
      ) +
      card(
        "Browse all measurements",
        choose("Measurement group", "group", [
          "All",
          "Symptoms",
          "Foods",
          "Medications",
        ]) +
          '<div class="tiles">' +
          descriptors
            .filter((d) => opts.group === "All" || d.group === opts.group)
            .map((d) => {
              const vals = snapshot.rows.map((r) => ({
                  date: r.date,
                  value: d.read(r),
                })),
                known = vals.map((r) => r.value).filter(Number.isFinite),
                lo = Math.min(...known),
                hi = Math.max(...known);
              return `<button class="tile" data-main="${esc(d.key)}"><strong>${esc(d.label)}</strong>${svg(
                curve(
                  vals,
                  "value",
                  (i) => 5 + (i / (vals.length - 1)) * 230,
                  (v) => 65 - ((v - lo) / (hi - lo || 1)) * 55,
                  C[1],
                ),
                d.label + " timeline",
                75,
                240,
              )}<small>${known.length} recorded days · ${esc(d.unit || "recorded value")}</small></button>`;
            })
            .join("") +
          "</div>",
      );
    const update = () => {
      const i = Math.min(opts.dateIndex, raw.length - 1),
        row = raw[i];
      $("date-label").textContent = row.date;
      $("day-detail").innerHTML =
        `<p class="selected-date">${esc(first.label)}: ${fmt(row.a)} ${Number.isFinite(row.a) ? esc(first.unit) : ""}${second ? ` · ${esc(second.label)}${opts.compareLag ? " earlier" : ""}: ${fmt(row.b)} ${Number.isFinite(row.b) ? esc(second.unit) : ""}` : ""}</p><details><summary>See all entries on this day</summary>${details(row.date)}</details>`;
      calculated({
        measurement: first.key,
        comparison: second?.key ?? null,
        lag: opts.compareLag,
        rows: raw,
        selected: row,
      });
    };
    bindCursor(raw.length, update);
    update();
  }
  function relationshipDetail(pair) {
    const points = pair.points,
      values = points.flatMap((p) => [p.input, p.outcome]);
    let plot = "";
    if (points.length) {
      const loX = Math.min(...points.map((p) => p.input)),
        hiX = Math.max(...points.map((p) => p.input)),
        loY = Math.min(...points.map((p) => p.outcome)),
        hiY = Math.max(...points.map((p) => p.outcome));
      plot = svg(
        points
          .map(
            (p, i) =>
              `<circle tabindex="0" class="dot" role="button" data-pair-index="${i}" aria-label="Inspect pair ${esc(p.inputDate)} to ${esc(p.date)}" cx="${55 + ((p.input - loX) / (hiX - loX || 1)) * 810}" cy="${270 - ((p.outcome - loY) / (hiY - loY || 1)) * 220}" r="4" fill="${C[0]}" fill-opacity=".7"><title>${esc(p.inputDate)}: ${fmt(p.input)} → ${esc(p.date)}: ${fmt(p.outcome)}</title></circle>`,
          )
          .join("") +
          `<text x="450" y="310" text-anchor="middle">${esc(pair.first.label)} (${esc(pair.first.unit || "value")})</text><text x="12" y="25">${esc(pair.second.label)} (${esc(pair.second.unit || "value")})</text>`,
        `${pair.first.label} and ${pair.second.label}: observed date pairs`,
      );
    }
    return card(
      `${pair.first.label} → ${pair.second.label}`,
      `<p>${esc(pair.explanation)} ${pair.observations} dates had both measurements. Other changes may explain the relationship.</p><p class="muted">${esc(pair.strength)} · ${pair.lag ? pair.lag + " calendar days earlier" : "same day"}</p>${plot}<div id="pair-detail" class="selected-date">Tap a point to inspect its dates and recorded values.</div>`,
    );
  }
  function renderRelationships() {
    const lagged = selected === "lagged";
    if (lagged) {
      if (
        !descriptors.some(
          (d) => d.key === opts.pairSecond && d.group === "Symptoms",
        )
      )
        opts.pairSecond = "pain";
      $("question-controls").innerHTML =
        choose("Later symptom", "pairSecond", measureOptions("Symptoms")) +
        choose("Earlier by", "lag", [
          [1, "1 calendar day"],
          [3, "3 calendar days"],
          [7, "7 calendar days"],
        ]) +
        choose("Input group", "group", [
          "All",
          "Symptoms",
          "Foods",
          "Medications",
        ]);
      const list = descriptors
        .filter((d) => opts.group === "All" || d.group === opts.group)
        .map((d) => A.relationship(snapshot, d.key, opts.pairSecond, opts.lag))
        .sort(
          (a, b) => Math.abs(b.correlation ?? 0) - Math.abs(a.correlation ?? 0),
        );
      if (!list.some((p) => p.first.key === opts.pairFirst))
        opts.pairFirst = list[0]?.first.key ?? "pain";
      $("question-result").innerHTML = card(
        "What was recorded before the symptom?",
        `<p>Earlier measurements are matched to the exact later date. Missing pairs stay out of the calculation.</p><div class="pair-list">${list.map((p) => `<button class="pair-row" data-pair-first="${esc(p.first.key)}"><span>${esc(p.first.label)}</span><span class="bar-track"><span style="width:${Math.abs(p.correlation ?? 0) * 100}%;background:${p.correlation >= 0 ? C[1] : C[0]}"></span></span><small>${p.correlation == null ? "No estimate" : Math.abs(p.correlation) < 0.15 ? "Little relationship" : p.correlation > 0 ? "Rise together" : "Move oppositely"} · ${p.observations} pairs</small></button>`).join("")}</div>`,
      );
    } else {
      $("question-controls").innerHTML =
        choose("Rows", "rows", ["Symptoms", "Foods", "Medications", "All"]) +
        choose("Columns", "columns", [
          "Foods",
          "Symptoms",
          "Medications",
          "All",
        ]);
      const rows = descriptors.filter(
          (d) => opts.rows === "All" || d.group === opts.rows,
        ),
        columns = descriptors.filter(
          (d) => opts.columns === "All" || d.group === opts.columns,
        );
      const cells = rows
        .map(
          (first) =>
            `<span class="heat-label">${esc(first.label)}</span>` +
            columns
              .map((second) => {
                const p = A.relationship(snapshot, first.key, second.key),
                  color =
                    p.correlation == null
                      ? "#242a3b"
                      : `rgba(${p.correlation >= 0 ? "174,156,255" : "120,217,192"},${0.1 + Math.abs(p.correlation) * 0.8})`;
                return `<button style="background:${color}" class="${opts.pairFirst === first.key && opts.pairSecond === second.key ? "selected" : ""}" data-cell-first="${esc(first.key)}" data-cell-second="${esc(second.key)}" aria-label="Explain ${esc(first.label)} and ${esc(second.label)}"></button>`;
              })
              .join(""),
        )
        .join("");
      $("question-result").innerHTML = card(
        "Tap a square to understand the relationship",
        legend([
          ["Rise together", C[1]],
          ["Move oppositely", C[0]],
          ["Too few pairs / no variation", "#586074"],
        ]) +
          `<div class="heat-wrap"><div class="heatmap" style="grid-template-columns:110px repeat(${columns.length},76px)"><span></span>${columns.map((d) => `<span class="heat-label">${esc(d.label)}</span>`).join("")}${cells}</div></div>`,
      );
    }
    const pair = A.relationship(
      snapshot,
      opts.pairFirst,
      opts.pairSecond,
      lagged ? opts.lag : 0,
    );
    $("question-result").insertAdjacentHTML(
      "beforeend",
      relationshipDetail(pair),
    );
    calculated(pair);
    $("question-result")
      .querySelectorAll("[data-pair-index]")
      .forEach((node) =>
        node.addEventListener("click", () => {
          const p = pair.points[Number(node.dataset.pairIndex)];
          $("pair-detail").textContent =
            `${pair.first.label} on ${p.inputDate}: ${fmt(p.input)} ${pair.first.unit} · ${pair.second.label} on ${p.date}: ${fmt(p.outcome)} ${pair.second.unit}`;
        }),
      );
  }
  function renderTriggers() {
    const inputs = descriptors.filter(
      (d) => d.group === "Foods" || d.group === "Medications",
    );
    $("question-controls").innerHTML =
      choose(
        "Food or medication",
        "input",
        inputs.map((d) => [d.key, d.label]),
      ) +
      choose("Symptom", "target", measureOptions("Symptoms")) +
      choose("Later by", "lag", [
        [0, "Same day"],
        [1, "1 day"],
        [3, "3 days"],
        [7, "7 days"],
      ]);
    const r = A.triggerComparison(snapshot, opts.input, opts.target, opts.lag),
      difference =
        r.lowMean != null && r.highMean != null ? r.highMean - r.lowMean : null;
    $("question-result").innerHTML = card(
      "Compare observed groups",
      `<p>${esc(r.first.label)} ${opts.lag ? opts.lag + " calendar days before" : "on the same day as"} ${esc(r.second.label)}. Only pairs with both measurements contribute.</p><div class="stats">${stat(fmt(r.lowMean), r.binary ? "Input absent in logged record" : `Input ≤ ${fmt(r.cut)} ${r.first.unit}`, r.comparisonDays + " date pairs")}${stat(fmt(r.highMean), r.binary ? "Input present in logged record" : `Input > ${fmt(r.cut)} ${r.first.unit}`, r.exposedDays + " date pairs")}${stat(difference == null ? "No comparison" : fmt(difference), `Difference in ${r.second.label.toLowerCase()}`, r.second.unit + " · higher minus lower group")}</div><p>${r.points.length} pairs across ${snapshot.rows[0].date}–${snapshot.asOfDate}. These groups can differ in other ways. This does not establish what caused a symptom.</p><details><summary>Inspect all contributing dates</summary><div class="table-wrap"><table><thead><tr><th>Input date</th><th>${esc(r.first.label)}</th><th>Outcome date</th><th>${esc(r.second.label)}</th></tr></thead><tbody>${r.points.map((p) => `<tr><td>${p.inputDate}</td><td>${fmt(p.input)}</td><td>${p.date}</td><td>${fmt(p.outcome)}</td></tr>`).join("")}</tbody></table></div></details>`,
    );
    calculated(r);
  }
  function renderScenarios() {
    const input =
        descriptors.find((d) => d.key === opts.input) ?? descriptors[1],
      values = snapshot.rows.map(input.read).filter(Number.isFinite),
      lo = Math.min(...values),
      hi = Math.max(...values);
    opts.value = Math.min(hi, Math.max(lo, opts.value));
    $("question-controls").innerHTML =
      choose(
        "Input date",
        "scenarioDate",
        snapshot.rows.map((r) => [r.date, r.date]),
      ) +
      choose(
        "Input to change",
        "input",
        descriptors
          .filter((d) => d.key !== "pain")
          .map((d) => [d.key, d.label]),
      ) +
      `<label>Try a different ${esc(input.label.toLowerCase())}<input id="scenario-value" type="range" min="${lo}" max="${hi}" step="${Number.isInteger(lo) && Number.isInteger(hi) && hi <= 1 ? 1 : 0.1}" value="${opts.value}"><output id="scenario-value-label">${fmt(opts.value)} ${esc(input.unit)}</output></label><button id="run-scenario">Run comparison</button>`;
    const original = input.read(lookup.get(opts.scenarioDate));
    $("question-result").innerHTML =
      card(
        "An editable model comparison",
        `<p>Original ${esc(input.label.toLowerCase())} on ${opts.scenarioDate}: ${fmt(original)} ${Number.isFinite(original) ? esc(input.unit) : ""}. Change today's selected input while keeping its earlier history fixed. The model uses records available by this date.</p><div id="scenario-result"><p>Choose a value and run the comparison.</p></div>`,
      ) +
      card(
        "Suggested inputs to explore",
        '<div id="scenario-suggestions"></div>',
      );
    try {
      const suggestions = A.runScenarioGeneration(snapshot);
      $("scenario-suggestions").innerHTML = suggestions.scenarios
        .map(
          (s) =>
            `<button data-suggestion="${esc(s.feature)}" data-suggestion-value="${s.high}">${esc(A.measureLabel(s.feature))} · try ${fmt(s.high)}</button>`,
        )
        .join(" ");
    } catch (e) {
      $("scenario-suggestions").textContent = e.message;
    }
    calculated({
      inputDate: opts.scenarioDate,
      input: input.key,
      original,
      changedValue: opts.value,
      status: "Not run",
    });
    $("scenario-value").addEventListener("input", (e) => {
      opts.value = Number(e.target.value);
      $("scenario-value-label").textContent =
        fmt(opts.value) + " " + input.unit;
    });
    $("run-scenario").addEventListener("click", async () => {
      const request = revision;
      $("run-scenario").disabled = true;
      $("scenario-result").textContent = "Calculating…";
      await new Promise((r) => setTimeout(r, 0));
      if (request !== revision) return;
      try {
        const r = A.runScenarioExecution(snapshot, {
          inputDate: opts.scenarioDate,
          changes: { [input.key]: opts.value },
        });
        $("scenario-result").innerHTML =
          `<div class="stats">${stat(fmt(r.baselinePrediction), "Original-input estimate")}${stat(fmt(r.scenarioPrediction), "Changed-input estimate")}${stat(fmt(r.difference), "Difference in pain points")}</div><p>${r.trainingRows} recorded input/outcome pairs available through ${r.inputDate}. Forecast date: ${r.forecastDate}. This comparison explains the model's response, not the medical effect of changing a food or medication.</p>`;
        calculated(r);
      } catch (e) {
        $("scenario-result").innerHTML =
          `<p class="error">${esc(e.message)}</p>`;
      } finally {
        $("run-scenario").disabled = false;
      }
    });
  }
  function renderEvent(result) {
    const model = result.windows.find((m) => m.horizon === opts.horizon),
      series = model.estimates ?? model.series ?? [];
    $("question-controls").innerHTML = choose("Look ahead", "horizon", [
      [1, "Next day"],
      [3, "Next 3 days"],
      [7, "Next week"],
    ]);
    if (model.unavailable) {
      $("question-result").innerHTML = card(
        "More known outcomes are needed",
        `<p>${esc(model.reason)}</p><p>${model.knownOutcomes} known intervals · ${model.observedEvents ?? 0} observed events. Dates are retained; unknown outcomes are not called negative.</p>`,
      );
      calculated(model);
      return;
    }
    const rows = series.map((r) => ({
      ...r,
      probability: r.predicted * 100,
      observed: r.actual == null ? null : r.actual * 100,
    }));
    $("question-result").innerHTML =
      card(
        "Could a high-symptom day occur?",
        `<p>The defined event is at least one recorded pain rating ≥ 5 in the next ${model.horizon} calendar day(s). A positive interval has a recorded event; a negative interval needs every day recorded without one.</p><div id="event-detail"></div>` +
          graph(
            rows,
            [
              {
                key: "probability",
                label: "Estimated probability",
                color: C[1],
              },
              {
                key: "observed",
                label: "Known interval answer: 0 or 100%",
                color: C[0],
              },
            ],
            {
              bounds: [0, 100],
              label: "Historical probabilities and known interval answers",
            },
          ) +
          cursor(rows.length - 1) +
          `<p class="muted">This chart is a retrospective fit and later holdout check. Selecting a date does not refit the model using only records available on that date.</p><button id="asof-event">Calculate using history through this date</button><div id="asof-result"></div>`,
      ) +
      card(
        "How often were the later estimates wrong?",
        `<div class="stats">${stat(`${model.evaluation.wrongCalls} / ${model.evaluation.heldOutRows}`, "Wrong event calls", "Using a 50% probability cutoff")}${stat(`${fmt(model.evaluation.probabilityError, 1)} pp`, "Average probability error", "Percentage points on later held-out dates")}</div><p>Later dates were excluded from fitting. An unknown interval cannot supply an observed answer or a test score. Error is measured for this ${model.horizon}-day interval, not for a diagnosed flare.</p>`,
      );
    const update = () => {
      const row = series[Math.min(opts.dateIndex, series.length - 1)];
      $("date-label").textContent = row.date;
      $("event-detail").innerHTML =
        `<div class="stats">${stat(`${fmt(row.predicted * 100, 1)}%`, `${model.horizon}-day interval from ${row.date}`, row.phase)}</div><div class="forecast-gauge"><span style="width:${row.predicted * 100}%"></span></div><p>${row.actual == null ? "The interval answer is unknown." : row.actual ? "A qualifying event was observed in the interval." : "Every interval day was observed without a qualifying event."}</p><details><summary>See the selected day's original inputs</summary>${details(row.date)}</details>`;
      calculated({ ...model, selectedEstimate: row });
    };
    bindCursor(rows.length, update);
    update();
    $("asof-event").addEventListener("click", async () => {
      const inputDate =
          series[Math.min(opts.dateIndex, series.length - 1)].date,
        request = revision;
      $("asof-result").textContent = "Fitting earlier history…";
      await new Promise((r) => setTimeout(r, 0));
      if (request !== revision) return;
      try {
        const r = A.runFlareWindows(snapshot, { inputDate }),
          m = r.windows.find((m) => m.horizon === opts.horizon);
        $("asof-result").innerHTML = m.unavailable
          ? `<p>${esc(m.reason)}</p>`
          : `<p class="selected-date">${fmt(m.prediction * 100, 1)}% using history available through ${inputDate}.</p><p>This is a separate as-of fit. Its earlier holdout error is not a known outcome for the selected future interval.</p>`;
        calculated({ ...r, selectedHorizon: opts.horizon });
      } catch (e) {
        $("asof-result").textContent = e.message;
      }
    });
  }
  function renderMap(result, request) {
    $("question-controls").innerHTML =
      (selected === "kmeans"
        ? choose("Number of groups", "k", [
            [2, "2"],
            [3, "3"],
            [4, "4"],
            [5, "5"],
          ])
        : selected === "dbscan"
          ? choose("Neighbourhood radius", "radius", [
              [0.7, "Smaller"],
              [1, "Measured default"],
              [1.4, "Larger"],
            ])
          : "") +
      (selected === "pca"
        ? ""
        : choose("Group days using", "space", [
            ["full", "Full day and history"],
            ["pca", "Five PCA summaries"],
          ])) +
      choose("Draw the map with", "map", [
        ["pca", "PCA · explainable summaries"],
        ["umap", "UMAP · nearby days"],
      ]);
    const points =
        opts.map === "umap" && mapLayout
          ? mapLayout.map((p, i) => ({
              ...p,
              cluster: result.points[i].cluster,
            }))
          : result.points,
      loX = Math.min(...points.map((p) => p.x)),
      hiX = Math.max(...points.map((p) => p.x)),
      loY = Math.min(...points.map((p) => p.y)),
      hiY = Math.max(...points.map((p) => p.y)),
      groups = [...new Set(points.map((p) => p.cluster))].sort((a, b) => a - b),
      color = (g) => (g === -1 ? "#737d94" : C[(g ?? 0) % C.length]);
    const body =
      `<line x1="45" y1="295" x2="860" y2="295" stroke="#2b3046"/><line x1="45" y1="30" x2="45" y2="295" stroke="#2b3046"/>` +
      points
        .map(
          (p, i) =>
            `<circle class="dot" tabindex="0" role="button" data-date-index="${i}" aria-label="Inspect day ${p.date}" cx="${55 + ((p.x - loX) / (hiX - loX || 1)) * 790}" cy="${285 - ((p.y - loY) / (hiY - loY || 1)) * 240}" r="${i === opts.dateIndex ? 7 : 4.5}" fill="${color(p.cluster)}" stroke="${i === opts.dateIndex ? "white" : "none"}"><title>${p.date} · ${p.cluster === -1 ? "Outside dense groups" : p.cluster == null ? "Day" : `Group ${p.cluster + 1}`}</title></circle>`,
        )
        .join("") +
      `<text x="450" y="324" text-anchor="middle">${opts.map === "umap" && mapLayout ? "UMAP drawing coordinate" : "First PCA summary"}</text>`;
    $("question-result").innerHTML =
      card(
        "Every dot is a day and its recent history",
        `<p>Measurements from the day and 1, 3 and 7 calendar days earlier describe each dot. Changing the drawing keeps the group labels fixed.</p>${result.groupingDimensions ? `<p class="muted">Groups use ${result.groupingDimensions} ${result.groupingSpace === "pca" ? "PCA summaries" : "scaled measurements and logging flags"}.</p>` : ""}${opts.map === "umap" && !mapLayout ? '<p id="map-progress" role="status">Arranging neighbourhoods…</p>' : ""}` +
          legend(
            groups.map((g) => [
              g === -1
                ? `Outside dense groups · ${points.filter((p) => p.cluster === -1).length} days`
                : g == null
                  ? "Days"
                  : `Group ${g + 1} · ${points.filter((p) => p.cluster === g).length} days`,
              color(g),
            ]),
          ) +
          svg(
            body,
            "Selectable calendar days, coloured by their computed groups",
            335,
          ) +
          cursor(points.length - 1) +
          `<div id="map-day-summary"></div>`,
      ) +
      card(
        "What do these axes mean?",
        opts.map === "umap" && mapLayout
          ? "<p>UMAP places similar days near one another. Its axes are drawing coordinates, not symptoms. Distances and density can be distorted; gaps in this picture are not proof of separate clinical types.</p>"
          : `<p>Each axis is a weighted combination of measurements shared by all groups. It is not a symptom assigned to a particular cluster. This drawing shows two of five summaries.</p>${[
              0, 1,
            ]
              .map(
                (j) =>
                  `<details><summary>${j === 0 ? "Horizontal" : "Vertical"} summary · ${fmt(result.explainedVariance[j] * 100, 1)}% of variation</summary>${result.loadings[
                    j
                  ]
                    .map((v, i) => ({ v, name: result.features[i] }))
                    .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
                    .slice(0, 6)
                    .map(
                      (v) =>
                        `<p>${esc(A.measureLabel(v.name))}: ${v.v >= 0 ? "raises" : "lowers"} this summary</p>`,
                    )
                    .join("")}</details>`,
              )
              .join(
                "",
              )}<p>Some nearby dots have different colours because other measurements differ. Missing inputs use their observed average for distances with lightly weighted flags; original values still say not logged.</p>`,
      ) +
      card(
        "Inspect this day",
        choose("History to inspect", "historyLag", [
          [0, "Selected day"],
          [1, "1 day earlier"],
          [3, "3 days earlier"],
          [7, "7 days earlier"],
        ]) +
          choose("Entries", "group", [
            "All",
            "Symptoms",
            "Foods",
            "Medications",
          ]) +
          '<div id="map-day-detail"></div>',
      );
    const update = () => {
      const i = Math.min(opts.dateIndex, points.length - 1),
        p = points[i];
      $("date-label").textContent = p.date;
      const days = new Set(
          points.filter((x) => x.cluster === p.cluster).map((x) => x.date),
        ),
        rows = snapshot.rows.filter((r) => days.has(r.date));
      const profile = descriptors
        .map((d) => {
          const vals = rows.map(d.read).filter(Number.isFinite),
            all = snapshot.rows.map(d.read).filter(Number.isFinite),
            mean = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1),
            baseline = mean(all),
            average = mean(vals),
            spread = Math.sqrt(mean(all.map((x) => (x - baseline) ** 2)));
          return {
            d,
            average,
            baseline,
            count: vals.length,
            contrast: spread ? (average - baseline) / spread : 0,
          };
        })
        .filter((v) => v.count && Math.abs(v.contrast) > 0.2)
        .sort((a, b) => Math.abs(b.contrast) - Math.abs(a.contrast))
        .slice(0, 4);
      $("map-day-summary").innerHTML =
        `<p class="selected-date">${p.date} · ${p.cluster === -1 ? "Outside dense groups" : p.cluster == null ? "Selected day" : `Group ${p.cluster + 1}`}</p>${p.cluster != null && p.cluster >= 0 ? `<h3>What distinguishes this group?</h3>${profile.length ? profile.map((v) => `<p class="profile-item">${esc(v.d.label)}: ${fmt(v.average)} ${esc(v.d.unit)} in this group; ${fmt(v.baseline)} overall · ${v.count} logged days.</p>`).join("") : "<p>No clear difference in a single measurement. Combinations or history may drive the grouping.</p>"}` : ""}`;
      const day = new Date(A.time(p.date) - opts.historyLag * A.DAY)
        .toISOString()
        .slice(0, 10);
      $("map-day-detail").innerHTML = details(day, opts.group);
      document
        .querySelectorAll("#question-result [data-date-index]")
        .forEach((n) => {
          const chosen = Number(n.dataset.dateIndex) === i;
          n.setAttribute("r", chosen ? 7 : 4.5);
          n.setAttribute("stroke", chosen ? "white" : "none");
        });
      calculated({
        ...result,
        requestedDisplay: opts.map,
        display: opts.map === "umap" && mapLayout ? "umap" : "pca",
        displayCoordinates: points.map(({ date, x, y, cluster }) => ({
          date,
          x,
          y,
          cluster: cluster ?? null,
        })),
        selectedDay: p.date,
        selectedHistoryDay: day,
      });
    };
    bindCursor(points.length, update);
    update();
    if (opts.map === "umap" && !mapLayout) {
      const mapRequest = ++mapRevision;
      A.umapMap(snapshot, {
        isCurrent: () =>
          request === revision &&
          mapRequest === mapRevision &&
          !document.hidden,
        onProgress: (p) => {
          if ($("map-progress"))
            $("map-progress").textContent = `Arranging neighbourhoods · ${p}%`;
        },
      })
        .then((layout) => {
          if (layout && request === revision && mapRequest === mapRevision) {
            mapLayout = layout;
            renderMap(result, request);
          }
        })
        .catch((e) => {
          if (request === revision && $("map-progress"))
            $("map-progress").textContent = e.message;
        });
    }
  }
  function renderPrediction(result, algorithm) {
    if (["lasso", "elastic-net"].includes(selected))
      $("question-controls").innerHTML =
        choose(
          "Later symptom",
          "regressionTarget",
          Object.entries(snapshot.targetNames),
        ) +
        choose("Outcome timing", "regressionLag", [
          [0, "Same day"],
          [1, "1 day later"],
          [3, "3 days later"],
          [7, "7 days later"],
        ]) +
        choose("Input measures", "regressionInputs", [
          ["foods-and-medications", "Foods and medications"],
          ["all", "All symptoms, foods and medication"],
          ["foods", "Foods"],
          ["medications", "Medications"],
        ]);
    if (algorithm.kind === "cascade" && result.forecasts?.[0]?.features) {
      $("question-controls").innerHTML = choose(
        "Forecast measurement",
        "cascadeField",
        [
          ["pain", "Pain"],
          ...result.featureNames.map((name, i) => [
            String(i),
            A.measureLabel(name),
          ]),
        ],
      );
    }
    const models = result.forecasts?.[0]?.evaluation
        ? result.forecasts
        : (result.windows ?? [result]),
      model = models[0],
      binary = ["classification", "classification-horizons"].includes(
        algorithm.kind,
      ),
      rows =
        model.estimates?.map((r) => ({
          ...r,
          estimate: binary ? r.predicted * 100 : r.predicted,
          known: r.actual == null ? null : binary ? r.actual * 100 : r.actual,
        })) ??
        model.series?.map((r) => ({
          ...r,
          estimate: binary ? r.predicted * 100 : r.predicted,
          known: binary ? r.actual * 100 : r.actual,
        })) ??
        result.forecasts?.map((r) => ({
          date:
            r.date ??
            new Date(A.time(snapshot.asOfDate) + r.horizon * A.DAY)
              .toISOString()
              .slice(0, 10),
          estimate:
            algorithm.kind === "cascade" &&
            opts.cascadeField !== "pain" &&
            r.features
              ? r.features[Number(opts.cascadeField)]
              : (r.pain ?? r.predicted),
          known: null,
        })) ??
        [];
    let body = `<p>${esc(algorithm.explanation)}</p>`;
    if (models.length > 1 && models[0].evaluation)
      body += `<div class="stats">${models.map((m) => stat(binary ? `${fmt(m.prediction * 100, 1)}%` : fmt(m.prediction), `Exactly ${m.horizon} days ahead`, binary ? "Endpoint probability" : "Estimated symptom rating")).join("")}</div><p>These are separately fitted exact-date models. They do not ask whether an event occurs anywhere within the interval.</p>`;
    if (rows.length) {
      body +=
        graph(
          rows,
          [
            {
              key: "estimate",
              label: binary ? "Estimated probability (%)" : "Model estimate",
              color: C[1],
            },
            { key: "known", label: "Recorded outcome", color: C[0] },
          ],
          {
            bounds: binary ? [0, 100] : null,
            label: "Recorded outcomes and estimates on calendar dates",
          },
        ) +
        cursor(rows.length - 1) +
        '<div id="prediction-date-detail"></div>';
    }
    const evaluation = model.evaluation ?? result.evaluation;
    if (evaluation && !Array.isArray(evaluation))
      body += `<div class="stats">${binary ? stat(`${fmt(evaluation.accuracy * 100, 1)}%`, "Correct held-out calls") : stat(fmt(evaluation.mae), "Average held-out absolute error", "In outcome points")}${stat(binary ? fmt(evaluation.brier, 3) : fmt(evaluation.rmse), binary ? "Squared probability error" : "Error giving large misses more weight")}${stat(evaluation.heldOutRows ?? "—", "Later test dates")}</div><p>${esc(evaluation.method ?? evaluation.split ?? "Later held-out records were excluded from fitting.")}${algorithm.kind === "autoregressive" ? " Its one-step check used observed earlier records. The fourteen-day recursive forecast has not been separately validated." : ""}</p>`;
    if (result.forecasts && algorithm.kind === "autoregressive")
      body += card(
        "Fourteen steps beyond the last recorded date",
        graph(
          result.forecasts.map((r) => ({ date: r.date, value: r.predicted })),
          [{ key: "value", label: "Recursive forecast", color: C[1] }],
          { bounds: [0, 10] },
        ),
      );
    if (result.evaluation && Array.isArray(result.evaluation))
      body += `<div class="table-wrap"><table><thead><tr><th>State</th><th>One-step error</th><th>Average-only baseline</th></tr></thead><tbody>${result.evaluation.map((e) => `<tr><td>${esc(A.measureLabel(e.field))}</td><td>${fmt(e.rmse)}</td><td>${fmt(e.baselineRmse)}</td></tr>`).join("")}</tbody></table></div><p>${esc(result.evaluationMethod)}. Later recursive estimates reuse predictions as inputs; their error can accumulate.</p>`;
    $("question-result").innerHTML = card(
      "Follow the estimate and its error",
      body,
    );
    if (rows.length) {
      const update = () => {
        const r = rows[Math.min(opts.dateIndex, rows.length - 1)];
        $("date-label").textContent = r.date;
        $("prediction-date-detail").innerHTML =
          `<p class="selected-date">${r.date}: estimate ${fmt(r.estimate)} · ${r.known == null ? "Outcome unknown" : `recorded ${fmt(r.known)}`} ${r.phase && r.phase !== "Outcome unknown" ? "· " + esc(r.phase) : ""}</p><p class="muted">Historical curves show retrospective fitted estimates and held-out checks, not a refit using only history through every selected date.</p>`;
        calculated({ ...result, selectedEstimate: r });
      };
      bindCursor(rows.length, update);
      update();
    }
    if (model.coefficients?.length)
      $("question-result").insertAdjacentHTML(
        "beforeend",
        card(
          "Which inputs did the model use?",
          `<p>Weights apply to standardized measurements. They describe this model, not a causal food or medication effect.</p><details><summary>Inspect all ${model.coefficients.length} input weights</summary><div class="table-wrap"><table><tbody>${model.coefficients.map((c) => `<tr><th>${esc(A.measureLabel(c.feature))}</th><td>${fmt(c.value, 4)}</td></tr>`).join("")}</tbody></table></div></details>`,
        ),
      );
    if (A.supportsSensitivity(algorithm))
      $("question-result").insertAdjacentHTML(
        "beforeend",
        card(
          "Optional: explore uncertain missing inputs",
          `<p>Monte Carlo repeats the calculation with missing input values sampled from earlier observed inputs. Forty refits cost extra time. The spread depends on this sampling assumption; missing outcomes are never invented and original records are preserved.</p><button id="run-sensitivity">Run 40 missing-input comparisons</button><div id="sensitivity-result"></div>`,
        ),
      );
    $("run-sensitivity")?.addEventListener("click", async () => {
      const request = revision;
      $("run-sensitivity").disabled = true;
      try {
        const r = await A.runSensitivity(snapshot, algorithm, {
          draws: 40,
          isCurrent: () => revision === request && !document.hidden,
          onProgress: (n, total) => {
            $("sensitivity-result").textContent = `${n}/${total} calculations`;
          },
        });
        if (r && request === revision) {
          sensitivity = r;
          $("sensitivity-result").innerHTML = r.complete
            ? "<p>No missing inputs in this history. No simulations are needed.</p>"
            : `<p>Latest input date: ${snapshot.asOfDate}. This is sensitivity to sampled inputs, not a calibrated confidence interval.</p>${r.distributions.map((d) => `<p>+${d.horizon} days: lower ${fmt(d.low)}, median ${fmt(d.median)}, upper ${fmt(d.high)}.</p>`).join("")}`;
          calculated({ result, sensitivity: r });
        }
      } catch (e) {
        if (request === revision)
          $("sensitivity-result").textContent = e.message;
      } finally {
        if (request === revision) $("run-sensitivity").disabled = false;
      }
    });
  }
  function renderDtw(result, preserveScan = false) {
    $("question-controls").innerHTML =
      choose("Playback speed", "scanSpeed", [[1, "1×"], [3, "3× · faster default"], [6, "6×"]]) +
      choose("Window lengths", "window", [
        [0, "Scan 3, 5, 7 and 14 days"],
        ...result.windowSizes.map((s) => [s, s + " days"]),
      ]) +
      choose("Advance reference after a sweep", "referenceStep", [
        [1, "1 calendar day"],
        [2, "2 calendar days"],
        [3, "3 calendar days"],
        [4, "4 calendar days"],
      ]) +
      choose("Timeline panel", "zoom", [
        [35, "35-day panel"],
        [70, "70-day panel"],
        [0, "Full history"],
      ]) +
      (opts.zoom
        ? choose(
            "Start scanning from",
            "period",
            Array.from(
              { length: Math.ceil(snapshot.rows.length / opts.zoom) },
              (_, i) => {
                const start = Math.min(
                  i * opts.zoom,
                  Math.max(0, snapshot.rows.length - opts.zoom),
                );
                return [
                  start,
                  A.dateRange(
                    snapshot.rows[start].date,
                    Math.min(opts.zoom, snapshot.rows.length - start),
                  ),
                ];
              },
            ),
          )
        : "") +
      (opts.window
        ? choose("Comparison length", "candidateWindow", [
            [0, "Same length"],
            ...result.windowSizes
              .filter(
                (size) =>
                  Math.min(size, opts.window) / Math.max(size, opts.window) >=
                  0.5,
              )
              .map((size) => [size, size + " days"]),
          ])
        : "");
    const windows = result.windowSizes.flatMap((size) =>
      A.validWindows(snapshot, size, 0),
    );
    opts.period = Math.min(
      opts.period,
      Math.max(0, snapshot.rows.length - (opts.zoom || snapshot.rows.length)),
    );
    scanPlan = A.windowScanPlan(windows, {
      referenceStep: opts.referenceStep,
      referenceSize: opts.window,
      comparisonSize: opts.candidateWindow,
      sameLengthOnly: !opts.candidateWindow,
      startDate: snapshot.rows[opts.zoom ? opts.period : 0].date,
      endDate: snapshot.rows.at(-1).date,
    });
    scanPosition = preserveScan
      ? Math.min(scanPosition, Math.max(0, scanPlan.total - 1))
      : 0;
    scanScores = null;
    scanSweep = null;
    scanPage = "";
    $("question-result").innerHTML =
      card(
        "Hold the reference. Sweep forward. Advance and repeat.",
        `<p>A reference stays fixed while a later, non-overlapping window moves across the timeline. After its sweep, the reference moves ${opts.referenceStep} calendar day(s). At each reference date, the selected lengths finish their sweeps before the reference advances. Playback scans through the final date. Full history shows every date; a zoomed panel follows the comparison across the year. Ranked matches also search the entire history.</p><div class="controls"><button id="scan-play">Play scan</button><button id="scan-next">Next comparison</button><button id="scan-reference">Next reference</button><button id="scan-reset">Restart</button></div><label>Search position<input id="scan-slider" type="range" min="0" max="${Math.max(0, scanPlan.total - 1)}" step="1" value="0"></label><h3 id="fixed-reference-label"></h3><div id="fixed-reference-chart"></div><div id="scan-chart"></div><div id="scan-signal" class="signal" role="status"></div><div class="scan-labels" id="scan-labels"></div><div id="scan-values" class="stats"></div><p class="muted">Bottom rail marks unlogged days. Unknown days can form a shared logging pattern; their pain is still unknown. Scoring requires two recorded ratings in each period. Gold marks the closest 10% for the current reference, not a recurrence probability.</p>`,
      ) +
      card(
        "What surrounded these patterns?",
        choose("Earlier by", "contextLag", [
          [0, "Same days"],
          [1, "1 day"],
          [3, "3 days"],
          [7, "7 days"],
        ]) +
          choose("Measurement", "contextFeature", measureOptions()) +
          '<div id="window-context"></div>',
      ) +
      card(
        "Closest pairs found by the full search",
        `<p>${result.comparisons} eligible pairs were scored with the same calendar rules. Banded dynamic programming reuses partial alignment costs; rolling rows rank pairs, and full mode keeps paths for the five winners.</p>${result.motifs.map((m, i) => `<button data-dtw-match="${i}">${A.dateRange(m.first, m.firstSize)} (${m.firstSize} days) ↔ ${A.dateRange(m.second, m.secondSize)} (${m.secondSize} days)</button>`).join(" ")}<div id="alignment-view"></div>`,
      );
    $("scan-play").addEventListener("click", () =>
      scanning ? pauseScan() : playScan(),
    );
    $("scan-next").addEventListener("click", () => {
      pauseScan();
      scanPosition = Math.min(scanPlan.total - 1, scanPosition + 1);
      scanFrame(result);
    });
    $("scan-reference").addEventListener("click", () => {
      pauseScan();
      const f = A.scanFrame(scanPlan, scanPosition);
      const next = scanPlan.sweeps.findIndex(
        (s, i) => i > f.sweepIndex && s.reference.first > f.reference.first,
      );
      scanPosition =
        scanPlan.sweeps[next < 0 ? scanPlan.sweeps.length - 1 : next].offset;
      scanFrame(result);
    });
    $("scan-reset").addEventListener("click", () => {
      pauseScan();
      scanPosition = 0;
      scanFrame(result);
    });
    $("scan-slider").addEventListener("input", (e) => {
      pauseScan();
      scanPosition = Number(e.target.value);
      scanFrame(result);
    });
    scanFrame(result);
    if (!reduced.matches && !document.hidden && !pausedByUser) playScan();
    function pauseScan() {
      pausedByUser = true;
      stop();
      $("scan-play").textContent = "Play scan";
      scanFrame(result);
    }
    function playScan() {
      pausedByUser = false;
      stop();
      scanning = true;
      $("scan-play").textContent = "Pause scan";
      timer = setInterval(() => {
        if (document.hidden || scanPosition >= scanPlan.total - 1) {
          pauseScan();
          return;
        }
        scanPosition++;
        scanFrame(result);
      }, 450 / opts.scanSpeed);
      scanFrame(result);
    }
    document.querySelectorAll("[data-dtw-match]").forEach((node) =>
      node.addEventListener("click", () => {
        pauseScan();
        const match = result.motifs[Number(node.dataset.dtwMatch)];
        const sweep = scanPlan.sweeps.find(
          (s) =>
            s.reference.first === match.first &&
            s.reference.size === match.firstSize &&
            s.candidates.some(
              (c) => c.first === match.second && c.size === match.secondSize,
            ),
        );
        if (sweep)
          scanPosition =
            sweep.offset +
            sweep.candidates.findIndex(
              (c) => c.first === match.second && c.size === match.secondSize,
            );
        else {
          opts.window = match.firstSize;
          opts.candidateWindow =
            match.firstSize === match.secondSize ? 0 : match.secondSize;
          opts.zoom = 0;
          opts.period = 0;
          renderDtw(result);
          pauseScan();
          const target = scanPlan.sweeps.find(
            (s) =>
              s.reference.first === match.first &&
              s.reference.size === match.firstSize,
          );
          scanPosition =
            target.offset +
            target.candidates.findIndex(
              (c) => c.first === match.second && c.size === match.secondSize,
            );
        }
        scanFrame(result);
        renderAlignment(match);
      }),
    );
    function renderAlignment(match) {
      let body = "";
      const x = (i, n) => 55 + (i / (n - 1)) * 810,
        y = (v, top) => (v == null ? top + 100 : top + 85 - v * 7);
      for (const [i, j] of match.path ?? [])
        body += `<line x1="${x(i, match.firstSize)}" y1="${y(match.firstValues[i], 20)}" x2="${x(j, match.secondSize)}" y2="${y(match.secondValues[j], 170)}" stroke="#ae9cff55"/>`;
      [match.firstValues, match.secondValues].forEach((values, k) => {
        body += curve(
          values.map((pain) => ({ pain })),
          "pain",
          (i) => x(i, values.length),
          (v) => y(v, k ? 170 : 20),
          C[k],
        );
        values.forEach((v, i) => {
          body += Number.isFinite(v)
            ? `<circle cx="${x(i, values.length)}" cy="${y(v, k ? 170 : 20)}" r="4" fill="${C[k]}"/>`
            : `<rect x="${x(i, values.length) - 3}" y="${y(v, k ? 170 : 20)}" width="6" height="6" fill="none" stroke="#a7acc1"/>`;
        });
      });
      $("alignment-view").innerHTML =
        `<h3>Ordered alignment of this calculated match</h3><p>${A.dateRange(match.first, match.firstSize)} ↔ ${A.dateRange(match.second, match.secondSize)}</p>` +
        svg(
          body,
          "Two selected patterns and their calculated DTW alignment",
          315,
        ) +
        `<p>Normalized difference ${fmt(match.score, 3)}. ${result.memory === "O(window)" ? "Rolling memory returns the same score without storing the alignment path." : "Links are the minimum-cost ordered alignment. A calendar position may match more than one nearby position."}</p>`;
      calculated({ ...result, selectedMatch: match });
    }
  }
  function scanFrame(result) {
    const frame = A.scanFrame(scanPlan, scanPosition);
    if (!frame) return;
    const { reference: r, candidate: c } = frame;
    if (scanSweep !== frame.sweep) {
      scanSweep = frame.sweep;
      scanScores = frame.sweep.candidates.map((w) =>
        r.observed >= 2 && w.observed >= 2
          ? A.compareWindows(r, w, result.band, true).score
          : null,
      );
      $("fixed-reference-label").textContent =
        `Fixed ${r.size}-day reference · ${A.dateRange(r.first, r.size)}`;
      $("fixed-reference-chart").innerHTML = svg(
        curve(
          r.values.map((pain) => ({ pain })),
          "pain",
          (i) => 55 + (i / (r.size - 1)) * 810,
          (v) => 80 - v * 6,
          C[0],
          3,
        ) +
          r.values
            .map((v, i) =>
              Number.isFinite(v)
                ? `<circle cx="${55 + (i / (r.size - 1)) * 810}" cy="${80 - v * 6}" r="4" fill="${C[0]}"/>`
                : `<rect x="${52 + (i / (r.size - 1)) * 810}" y="89" width="6" height="6" stroke="#a7acc1" fill="none"/>`,
            )
            .join(""),
        "Pinned reference pattern",
        110,
      );
    }
    const scored = scanScores.filter(Number.isFinite).sort((a, b) => a - b),
      threshold = scored[Math.floor(Math.max(0, scored.length - 1) * 0.1)] ?? 0,
      score = scanScores[frame.candidateIndex],
      eligible = score != null,
      hit = eligible && score <= threshold;
    const pageSpan = Math.max(1, opts.zoom - c.size),
      focusedStart = opts.zoom ? Math.max(0, Math.min(snapshot.rows.length - opts.zoom, r.index + Math.floor(Math.max(0, c.index - r.index) / pageSpan) * pageSpan)) : 0,
      rows = snapshot.rows.slice(focusedStart, opts.zoom ? focusedStart + opts.zoom : undefined),
      x = (day) =>
        55 +
        ((A.time(day) - A.time(rows[0].date)) /
          (A.time(rows.at(-1).date) - A.time(rows[0].date) || A.DAY)) *
          810,
      y = (v) => 240 - v * 20,
      dayWidth = 810 / (rows.length - 1 || 1),
      pageKey = `${r.first}-${r.size}-${rows[0].date}-${rows.length}`;
    if (scanPage !== pageKey) {
      scanPage = pageKey;
      let body = [0, 5, 10]
        .map(
          (v) =>
            `<line x1="55" x2="865" y1="${y(v)}" y2="${y(v)}" stroke="#2b3046"/><text x="42" y="${y(v) + 4}" text-anchor="end">${v}</text>`,
        )
        .join("");
      if (r.first >= rows[0].date && r.last <= rows.at(-1).date)
        body += `<rect x="${x(r.first) - dayWidth / 2}" y="25" width="${r.size * dayWidth}" height="220" fill="#78d9c018" stroke="${C[0]}" rx="5"/>`;
      body +=
        curve(rows, "pain", (i) => x(rows[i].date), y, "#b2b6cc") +
        rows
          .map((row) =>
            Number.isFinite(row.pain)
              ? `<circle cx="${x(row.date)}" cy="${y(row.pain)}" r="3" fill="#b2b6cc"/>`
              : `<rect x="${x(row.date) - 2}" y="253" width="4" height="8" fill="#737d94"/>`,
          )
          .join("") +
        `<rect id="moving-window" class="window-highlight" x="0" y="25" width="${c.size * dayWidth}" height="220" fill="#ae9cff1a" stroke="${C[1]}" rx="5"/><text x="55" y="287">${esc(date(rows[0].date))}</text><text x="865" y="287" text-anchor="end">${esc(date(rows.at(-1).date))}</text>`;
      $("scan-chart").innerHTML = svg(
        body,
        "Dated pain history with a fixed reference and sliding comparison window",
        305,
      );
    }
    const moving = $("moving-window");
    moving.style.transitionDuration = `${(450 / opts.scanSpeed) * 0.9}ms`;
    moving.style.transform = `translateX(${((x(c.first) - dayWidth / 2) * moving.ownerSVGElement.viewBox.baseVal.width) / 900}px)`;
    moving.setAttribute("stroke", hit ? C[4] : C[1]);
    moving.setAttribute("fill", hit ? "#f8cb721a" : "#ae9cff1a");
    const signal = $("scan-signal");
    signal.className =
      "signal" +
      (hit ? " match" : "") +
      (hit && scanning && !reduced.matches ? " pulse" : "");
    signal.textContent = `${!eligible ? "Skip scoring: fewer than two recorded ratings" : hit ? "Match found · among the closest comparisons" : "Scanning"} · ${c.size}-day comparison ${A.dateRange(c.first, c.size)}`;
    $("scan-labels").innerHTML =
      `<span>Comparison ${frame.candidateIndex + 1}/${frame.sweep.candidates.length}</span><span>Reference ${frame.sweepIndex + 1}/${scanPlan.sweeps.length}</span><span>Forward-only non-overlapping windows</span>`;
    $("scan-values").innerHTML =
      stat(
        eligible ? fmt(score, 3) : "Not scored",
        "Pattern difference",
        "Lower means closer under this rule",
      ) +
      stat(
        `${r.observed}/${r.size} ↔ ${c.observed}/${c.size}`,
        "Recorded ratings",
        "Missing is not pain zero",
      );
    $("scan-slider").value = scanPosition;
    const context = A.windowContext(snapshot, r, c, opts.contextLag).find(
      (v) => v.feature === opts.contextFeature,
    );
    $("window-context").innerHTML = context
      ? `<div class="stats">${stat(fmt(context.firstMean), A.measureLabel(context.feature) + " · reference", `${context.firstCount}/${r.size} days recorded`)}${stat(fmt(context.secondMean), A.measureLabel(context.feature) + " · comparison", `${context.secondCount}/${c.size} days recorded`)}</div><p>${context.correlation == null ? "No usable association estimate." : `Association with pain: ${fmt(context.correlation)} across ${context.pairedCount} observed pairs.`} Two periods can suggest a question, not establish a cause.</p>`
      : "<p>No recorded measurements for this selection.</p>";
    calculated({
      ...result,
      currentSearch: {
        reference: r,
        candidate: c,
        eligible,
        score,
        threshold,
        comparisonIndex: frame.candidateIndex,
        referenceIndex: frame.sweepIndex,
      },
      context,
    });
  }
  function bindCursor(length, update) {
    const set = (i) => {
      opts.dateIndex = Math.max(0, Math.min(length - 1, i));
      $("date-slider").value = opts.dateIndex;
      const marker = $("date-cursor");
      if (marker) {
        marker.setAttribute(
          "x1",
          ((55 + (opts.dateIndex / (length - 1 || 1)) * 810) *
            marker.ownerSVGElement.viewBox.baseVal.width) /
            900,
        );
        marker.setAttribute(
          "x2",
          ((55 + (opts.dateIndex / (length - 1 || 1)) * 810) *
            marker.ownerSVGElement.viewBox.baseVal.width) /
            900,
        );
      }
      update();
    };
    $("date-slider").addEventListener("input", (e) =>
      set(Number(e.target.value)),
    );
    document
      .querySelectorAll("[data-date-index]")
      .forEach((node) =>
        node.addEventListener("click", () =>
          set(Number(node.dataset.dateIndex)),
        ),
      );
  }
  $("choose-question").addEventListener("click", () => {
    $("question-drawer").showModal();
  });
  $("close-drawer").addEventListener("click", () =>
    $("question-drawer").close(),
  );
  $("question-drawer").addEventListener("click", (e) => {
    if (e.target === $("question-drawer")) {
      const r = $("question-drawer").getBoundingClientRect();
      if (e.clientX > r.right) $("question-drawer").close();
    }
  });
  $("algorithm-search").addEventListener("input", drawer);
  document.addEventListener("click", (e) => {
    const question = e.target.closest("[data-question]");
    if (question) {
      selected = question.dataset.question;
      pausedByUser = false;
      opts.group = "All";
      location.hash = selected;
      $("question-drawer").close();
      mapLayout = null;
      opts.dateIndex = snapshot.rows.length - 1;
      render();
      $("workspace").focus();
      $("workspace").scrollIntoView({
        block: "start",
        behavior: reduced.matches ? "instant" : "smooth",
      });
    }
    const cell = e.target.closest("[data-cell-first]");
    if (cell) {
      opts.pairFirst = cell.dataset.cellFirst;
      opts.pairSecond = cell.dataset.cellSecond;
      render();
    }
    const pair = e.target.closest("[data-pair-first]");
    if (pair) {
      opts.pairFirst = pair.dataset.pairFirst;
      render();
    }
    const main = e.target.closest("[data-main]");
    if (main) {
      opts.main = main.dataset.main;
      opts.compare = "none";
      render();
    }
    const suggestion = e.target.closest("[data-suggestion]");
    if (suggestion) {
      opts.input = suggestion.dataset.suggestion;
      opts.value = Number(suggestion.dataset.suggestionValue);
      render();
    }
  });
  document.addEventListener("change", (e) => {
    const key = e.target.dataset.option;
    if (!key) return;
    opts[key] = [
      "compareLag",
      "lag",
      "horizon",
      "k",
      "radius",
      "historyLag",
      "regressionLag",
      "scanSpeed",
      "window",
      "candidateWindow",
      "referenceStep",
      "zoom",
      "period",
      "contextLag",
    ].includes(key)
      ? Number(e.target.value)
      : e.target.value;
    if (key === "input") {
      const d = descriptors.find((d) => d.key === opts.input),
        values = snapshot.rows.map(d.read).filter(Number.isFinite);
      opts.value = values.at(-1) ?? 0;
    }
    if (key === "zoom") opts.period = 0;
    if (key === "window") opts.candidateWindow = 0;
    if (key === "map" || key === "space") mapRevision++;
    render({ preserveScan: key === "scanSpeed" });
  });
  document.addEventListener("keydown", (e) => {
    if (
      (e.key === "Enter" || e.key === " ") &&
      e.target.matches("circle[role=button]")
    ) {
      e.preventDefault();
      e.target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
  });
  $("new-history").addEventListener("click", loadHistory);
  $("download-history").addEventListener("click", () =>
    download(`gutopia-history-${snapshot.seed}.json`, snapshot),
  );
  $("download-result").addEventListener("click", () =>
    download(`gutopia-${selected}-${snapshot.seed}.json`, output),
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
      mapRevision++;
      if ($("scan-play")) $("scan-play").textContent = "Play scan";
    }
  });
  reduced.addEventListener("change", () => {
    if (reduced.matches) {
      stop();
      if ($("scan-play")) $("scan-play").textContent = "Play scan";
    }
  });
  const compactPlots = matchMedia("(max-width: 700px)");
  compactPlots.addEventListener("change", () => render({ preserveScan: true }));
  document.addEventListener("pointerup", (event) => {
    const plot = event.target.closest?.("svg.plot");
    if (!plot || event.target.closest?.('circle[role="button"]')) return;
    const circles = [...plot.querySelectorAll('circle[role="button"]')];
    const point = plot.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const screen = plot.getScreenCTM();
    if (!screen) return;
    let closest = null,
      distance = 24;
    for (const circle of circles) {
      const p = plot.createSVGPoint();
      p.x = circle.cx.baseVal.value;
      p.y = circle.cy.baseVal.value;
      const physical = p.matrixTransform(screen),
        d = Math.hypot(physical.x - event.clientX, physical.y - event.clientY);
      if (d < distance) {
        closest = circle;
        distance = d;
      }
    }
    closest?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  loadHistory();
})();
