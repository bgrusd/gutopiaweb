// Optional CI browser regression. During interactive Codex work use approved CUA.
// Supply PLAYWRIGHT_MODULE when Playwright is installed outside the deployment repo.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const url = process.env.LAB_URL || "http://127.0.0.1:8767/algorithms.html";
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
        viewport: { width: 1024, height: 768 },
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url);
    await page
      .locator("#run-status")
      .filter({ hasText: "Computed locally" })
      .waitFor();
    assert.equal(
      await page.locator("#question-title").innerText(),
      "Explore all data through time",
    );
    assert.equal(await page.locator("#question-drawer").isVisible(), false);
    const ids = [
      "timeline",
      "correlation",
      "lagged",
      "kmeans",
      "dbscan",
      "scenario-execution",
      "triggers",
      "event-windows",
      "lasso",
      "dtw",
    ];
    for (const id of ids) {
      await page.locator("#choose-question").click();
      await page.locator(`#question-list [data-question="${id}"]`).click();
      await page
        .locator("#run-status")
        .filter({ hasText: "Computed locally" })
        .waitFor();
      assert.equal(await page.locator("#result-error").isVisible(), false, id);
      assert.equal(await page.locator("#question-drawer").isVisible(), false);
    }
    await page.locator("#scan-play").click();
    const before = await page.locator("#scan-slider").inputValue();
    await page.waitForTimeout(800);
    assert.equal(await page.locator("#scan-slider").inputValue(), before);
    await page.locator('[data-option="window"]').selectOption("7");
    await page.locator("#scan-reference").click();
    await page.locator("#scan-next").click();
    const pausedScan = async () => ({
      position: await page.locator("#scan-slider").inputValue(),
      reference: await page.locator("#fixed-reference-label").innerText(),
      candidate: await page.locator("#scan-signal").innerText(),
      selectedSize: await page.locator('[data-option="window"]').inputValue(),
      action: await page.locator("#scan-play").innerText(),
    });
    const paused = await pausedScan();
    assert.equal(paused.action, "Play scan");
    for (const width of [390, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      await page.locator("#fixed-reference-label").waitFor();
      assert.deepEqual(await pausedScan(), paused);
    }
    await page.locator("#choose-question").click();
    await page.locator('[data-question="scenario-execution"]').first().click();
    await page.locator("#run-scenario").click();
    await page
      .locator("#scenario-result")
      .filter({ hasText: "Original-input estimate" })
      .waitFor();
    await page.locator("#choose-question").click();
    await page.locator('[data-question="correlation"]').first().click();
    await page
      .getByRole("button", { name: "Explain Pain and Fiber", exact: true })
      .click();
    assert(
      (await page.locator("#question-result").innerText()).includes(
        "Pain → Fiber",
      ),
    );
    for (const size of [
      { width: 390, height: 844 },
      { width: 1024, height: 768 },
    ]) {
      await page.setViewportSize(size);
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "page overflow at " + size.width,
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: question navigation, drawer closure, calculations, DTW pause, editable scenario, heatmap selection, phone/tablet page width.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
