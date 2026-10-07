// Run a local static server first. Install Playwright outside the deployed repo, then
// PLAYWRIGHT_MODULE=/tmp/gutopia-web-qa/node_modules/playwright node scripts/test-lab.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const url = process.env.LAB_URL || "http://127.0.0.1:4173/algorithms.html";
const output = process.env.LAB_QA_OUTPUT || "/tmp/gutopia-web-qa";
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_BINARY ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    });
    const errors = [],
      outgoing = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (request) =>
      outgoing.push({ url: request.url(), method: request.method() }),
    );
    await page.goto(url);
    await page.waitForFunction(
      () => window.GutopiaLabState?.selectedId === "kmeans",
    );
    const catalog = await page.evaluate(() =>
      window.GutopiaCatalog.map(({ id, handler, title }) => ({
        id,
        handler,
        title,
      })),
    );
    assert.equal(catalog.length, 23);
    for (const item of catalog) {
      await page.locator(`[data-algorithm="${item.id}"]`).click();
      await page.waitForFunction(
        (id) => window.GutopiaLabState?.selectedId === id,
        item.id,
      );
      assert.equal(
        await page.locator("#result-error").isVisible(),
        false,
        item.id,
      );
      assert.equal(await page.locator("#chart svg").count(), 1, item.id);
      assert(
        await page.locator(".plain-explainer").isVisible(),
        item.id + " plain explanation missing",
      );
      const copy = await page.evaluate(() => {
        const row = window.GutopiaCatalog.find(
          (x) => x.id === window.GutopiaLabState.selectedId,
        );
        return {
          what: row.plainLanguage.what,
          analogy: row.plainLanguage.analogy,
          uses: row.plainLanguage.uses,
        };
      });
      assert.equal(await page.locator("#plain-what").innerText(), copy.what);
      assert.equal(
        await page.locator("#plain-analogy").innerText(),
        copy.analogy,
      );
      assert.equal(await page.locator("#plain-uses").innerText(), copy.uses);
      assert(
        await page
          .locator(".plain-explainer")
          .evaluate(
            (el) =>
              !!(
                el.compareDocumentPosition(document.getElementById("chart")) &
                Node.DOCUMENT_POSITION_FOLLOWING
              ),
          ),
        item.id + " explanation is not before the chart",
      );

      assert.equal(await page.locator(".metric").count(), 4, item.id);
      assert.equal(await page.locator(".pipeline-step").count(), 4, item.id);
      const chart = await page.locator("#chart").innerHTML();
      assert(
        !/NaN|Infinity|undefined/.test(chart),
        item.id + " invalid chart coordinate",
      );
      for (const tab of ["purpose", "implementation", "methodology", "data"]) {
        await page.locator(`#tab-${tab}`).click();
        assert(
          await page.locator(`#panel-${tab}`).isVisible(),
          item.id + " " + tab,
        );
        assert(
          (await page.locator(`#panel-${tab}`).innerText()).length > 200,
          item.id + " empty explanation",
        );
      }
      await page.locator("#tab-demo").click();
    }
    await page.locator('[data-algorithm="lasso"]').click();
    await page.waitForFunction(
      () => window.GutopiaLabState.selectedId === "lasso",
    );
    const original = await page.evaluate(() =>
      JSON.stringify(window.GutopiaLabState.result),
    );
    await page.locator("#play-toggle").click();
    assert(
      await page
        .locator("#chart")
        .evaluate((x) => x.classList.contains("paused")),
    );
    await page.locator("#play-toggle").click();
    assert(
      !(await page
        .locator("#chart")
        .evaluate((x) => x.classList.contains("paused"))),
    );
    await page.locator("#replay").click();
    assert.equal(
      await page.evaluate(() => JSON.stringify(window.GutopiaLabState.result)),
      original,
      "replay changes calculations",
    );
    await page.locator("#new-seed").click();
    await page.waitForFunction(() => window.GutopiaLabState.seed === 43);
    assert.notEqual(
      await page.evaluate(() => JSON.stringify(window.GutopiaLabState.result)),
      original,
      "seed does not recompute",
    );
    await page.locator("#seed-input").fill("42");
    await page.locator("#seed-input").dispatchEvent("change");
    await page.waitForFunction(() => window.GutopiaLabState.seed === 42);
    assert.equal(
      await page.evaluate(() => JSON.stringify(window.GutopiaLabState.result)),
      original,
      "seed not reproducible",
    );
    await page.locator("#algorithm-search").fill("dtw");
    assert.equal(await page.locator("[data-algorithm]").count(), 2);
    await page.locator("#algorithm-search").fill("nothingmatches");
    assert(await page.locator(".empty-search").isVisible());
    await page.locator("#algorithm-search").fill("");
    assert.equal(await page.locator("[data-algorithm]").count(), 23);
    await page.locator("#tab-demo").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page.locator("#tab-purpose").getAttribute("aria-selected"),
      "true",
    );
    await page.keyboard.press("End");
    assert.equal(
      await page.locator("#tab-data").getAttribute("aria-selected"),
      "true",
    );
    await page.keyboard.press("Home");
    const dataDownload = page.waitForEvent("download");
    await page.locator("#tab-data").click();
    await page.locator("#download-data").click();
    assert.equal(
      (await dataDownload).suggestedFilename(),
      "gutopia-synthetic-seed-42.json",
    );
    await page.locator("#tab-demo").click();
    const resultDownload = page.waitForEvent("download");
    await page.locator("#download-result").click();
    assert.equal(
      (await resultDownload).suggestedFilename(),
      "gutopia-lasso-seed-42.json",
    );
    await page.locator('[data-algorithm="kmeans"]').click();
    await page.waitForFunction(
      () => window.GutopiaLabState.selectedId === "kmeans",
    );
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    await page.screenshot({ path: output + "/desktop.png", fullPage: true });
    await page.locator('[data-algorithm="dtw"]').click();
    await page.waitForFunction(
      () => window.GutopiaLabState.selectedId === "dtw",
    );
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    await page.screenshot({ path: output + "/dtw.png", fullPage: true });
    await page.locator('[data-algorithm="elastic-net"]').click();
    await page.waitForFunction(
      () => window.GutopiaLabState.selectedId === "elastic-net",
    );
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    await page.screenshot({ path: output + "/regression.png", fullPage: true });
    for (const width of [390, 320, 768]) {
      await page.setViewportSize({ width, height: 844 });
      for (const item of catalog) {
        await page.locator(`[data-algorithm="${item.id}"]`).click();
        await page.waitForFunction(
          (id) => window.GutopiaLabState.selectedId === id,
          item.id,
        );
        assert(
          await page
            .locator(".workspace")
            .evaluate(
              (el) => el.getBoundingClientRect().right <= window.innerWidth + 1,
            ),
          `${width}px ${item.id}: clipped workspace`,
        );
        assert(
          await page
            .locator("#chart")
            .evaluate(
              (el) => el.getBoundingClientRect().right <= window.innerWidth + 1,
            ),
          `${width}px ${item.id}: clipped chart`,
        );
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          `${width}px overflow`,
        );
        if (width <= 390) {
          const fonts = await page.evaluate(() =>
            [...document.querySelectorAll("#chart svg text")]
              .filter((el) => el.textContent.trim())
              .map((el) => {
                const matrix = el.getScreenCTM();
                return (
                  parseFloat(getComputedStyle(el).fontSize) *
                  Math.hypot(matrix.a, matrix.b)
                );
              }),
          );
          assert(
            fonts.every((size) => size >= 11.95),
            `${width}px ${item.id}: axis smaller than 12 displayed pixels: ${fonts.join(", ")}`,
          );
          assert(
            await page
              .locator("#plain-what")
              .evaluate(
                (el) => parseFloat(getComputedStyle(el).fontSize) >= 16,
              ),
            `${width}px ${item.id}: explanation too small`,
          );
          assert(
            await page
              .locator("#tab-demo")
              .evaluate((el) => el.getBoundingClientRect().height >= 44),
            `${width}px ${item.id}: tab touch target too small`,
          );
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-algorithm="kmeans"]').click();
    await page.waitForFunction(
      () => window.GutopiaLabState.selectedId === "kmeans",
    );
    await page.waitForTimeout(3000);
    await page.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    await page.screenshot({ path: output + "/mobile.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-algorithm="dtw"]').click();
    await page.waitForFunction(
      () => window.GutopiaLabState.selectedId === "dtw",
    );
    await page.locator("#tab-purpose").click();
    await page.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    await page.screenshot({
      path: output + "/dtw-idea-mobile.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.locator("#tab-methodology").click();
    await page.screenshot({
      path: output + "/dtw-methodology.png",
      fullPage: true,
    });
    // A 720 CSS-pixel layout at 2x pixel density represents a 1440-pixel screen at 200% zoom.
    const zoomed = await browser.newPage({
      viewport: { width: 720, height: 900 },
      deviceScaleFactor: 2,
    });
    await zoomed.goto(url + "#dtw");
    await zoomed.waitForFunction(
      () => window.GutopiaLabState?.selectedId === "dtw",
    );
    assert(
      await zoomed.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert(
      await zoomed
        .locator("#plain-what")
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize) >= 16),
    );
    await zoomed.locator("#tab-methodology").click();
    assert(await zoomed.locator("#panel-methodology").isVisible());
    await zoomed.close();
    const reduced = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await reduced.goto(url + "#dtw");
    await reduced.waitForFunction(
      () => window.GutopiaLabState?.selectedId === "dtw",
    );
    assert.equal(await reduced.locator("#play-toggle").innerText(), "Play");
    await reduced.locator("#replay").click();
    assert(
      (await reduced.locator("#run-status").innerText()).includes(
        "reduced-motion",
      ),
    );
    assert.equal(
      await reduced
        .locator(".animate-line")
        .first()
        .evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    assert.equal(errors.length, 0, errors.join("\n"));
    assert(
      outgoing.every((r) => r.method === "GET"),
      "unexpected POST/upload request",
    );
    const baseOrigin = new URL(url).origin;
    assert(
      outgoing.every(
        (r) =>
          new URL(r.url).origin === baseOrigin ||
          r.url.startsWith("https://fonts.googleapis.com/") ||
          r.url.startsWith("https://fonts.gstatic.com/"),
      ),
      "unexpected remote data request",
    );
    console.log(
      "PASS: all 23 algorithms calculate and render; all 92 explanation tab selections work; seed changes/reproducibility, pause/play/replay, search, keyboard tabs and JSON downloads work. All 23 layouts checked at 320/390/768px. Reduced-motion respected. No JavaScript errors or model data uploads. Screenshots: " +
        output,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
