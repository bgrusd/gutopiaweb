// All Auth responses are mocked inside the page before its first script runs.
// No real user credential, Supabase request, email or account mutation is used.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const root =
  process.env.CONFIRMATION_URL ||
  "http://127.0.0.1:4173/account-confirmed.html";
const output = process.env.LAB_QA_OUTPUT || "/tmp/gutopia-web-qa";
const fakeToken = "testheader.testpayload.testsignature";
const cases = [
  {
    name: "direct",
    suffix: "",
    mode: "confirmed",
    expected: "neutral",
    requests: 0,
  },
  {
    name: "confirmed",
    suffix:
      "#access_token=" + fakeToken + "&refresh_token=not-real&type=signup",
    mode: "confirmed",
    expected: "confirmed",
    requests: 1,
  },
  {
    name: "unconfirmed",
    suffix: "#access_token=" + fakeToken,
    mode: "unconfirmed",
    expected: "unconfirmed",
    requests: 1,
  },
  {
    name: "expired",
    suffix: "#access_token=" + fakeToken,
    mode: "expired",
    expected: "rejected",
    requests: 1,
  },
  {
    name: "link-error",
    suffix:
      "#error=access_denied&error_code=otp_expired&error_description=%3Cscript%3Edanger%3C%2Fscript%3E",
    mode: "confirmed",
    expected: "link-error",
    requests: 0,
  },
  {
    name: "query-error",
    suffix: "?error=access_denied&error_description=" + fakeToken,
    mode: "confirmed",
    expected: "link-error",
    requests: 0,
  },
  {
    name: "malformed",
    suffix: "#access_token=not-a-session",
    mode: "confirmed",
    expected: "malformed",
    requests: 0,
  },
  {
    name: "empty-token",
    suffix: "#access_token=",
    mode: "confirmed",
    expected: "malformed",
    requests: 0,
  },
  {
    name: "code",
    suffix: "?code=unhandled-code",
    mode: "confirmed",
    expected: "unsupported",
    requests: 0,
  },
  {
    name: "token-hash",
    suffix: "#token_hash=unhandled-hash",
    mode: "confirmed",
    expected: "unsupported",
    requests: 0,
  },
  {
    name: "query-token",
    suffix: "?access_token=" + fakeToken,
    mode: "confirmed",
    expected: "unsupported",
    requests: 0,
  },
  {
    name: "offline",
    suffix: "#access_token=" + fakeToken,
    mode: "offline",
    expected: "offline",
    requests: 1,
  },
  {
    name: "timeout",
    suffix: "#access_token=" + fakeToken,
    mode: "timeout",
    expected: "timeout",
    requests: 1,
  },
];
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROME_BINARY ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  try {
    for (const test of cases) {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
      });
      const errors = [],
        logs = [],
        network = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (message) => logs.push(message.text()));
      page.on("request", (request) =>
        network.push({
          url: request.url(),
          resource: request.resourceType(),
          headers: request.headers(),
        }),
      );
      await page.route("**/*.supabase.co/**", (route) => route.abort()); // Safety backstop: no real Auth networking.
      await page.addInitScript(
        ({ mode }) => {
          window.confirmationTest = { requests: [], storageCalls: 0 };
          for (const key of ["localStorage", "sessionStorage", "indexedDB"]) {
            Object.defineProperty(window, key, {
              configurable: true,
              get() {
                window.confirmationTest.storageCalls++;
                throw new Error("Confirmation page touched persistent storage");
              },
            });
          }
          const originalFetch = window.fetch.bind(window);
          window.fetch = (url, options) => {
            if (
              String(url) !==
              "https://mbgcmhqeymxmhzaeburk.supabase.co/auth/v1/user"
            )
              return originalFetch(url, options);
            window.confirmationTest.requests.push({
              url,
              options: {
                method: options.method,
                credentials: options.credentials,
                cache: options.cache,
                referrerPolicy: options.referrerPolicy,
                headers: options.headers,
              },
              locationAtRequest: location.href,
            });
            if (mode === "offline")
              return Promise.reject(new TypeError("Mocked offline failure"));
            if (mode === "timeout")
              return new Promise((resolve, reject) =>
                options.signal.addEventListener(
                  "abort",
                  () => reject(new DOMException("Aborted", "AbortError")),
                  { once: true },
                ),
              );
            if (mode === "expired")
              return Promise.resolve(
                new Response(JSON.stringify({ message: "Mock expired" }), {
                  status: 401,
                }),
              );
            const user = {
              id: "00000000-0000-0000-0000-000000000001",
              email: "private@example.invalid",
              email_confirmed_at:
                mode === "confirmed" ? "2026-10-06T20:00:00Z" : null,
            };
            return Promise.resolve(
              new Response(JSON.stringify(user), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }),
            );
          };
        },
        { mode: test.mode },
      );
      if (test.mode === "timeout") await page.clock.install();
      await page.goto(root + test.suffix);
      if (test.mode === "timeout") {
        await page.waitForFunction(
          () =>
            document.getElementById("confirmation-card").dataset.state ===
            "verifying",
        );
        await page.clock.fastForward(15001);
      }
      await page.waitForFunction(
        (expected) =>
          document.getElementById("confirmation-card").dataset.state ===
          expected,
        test.expected,
      );
      const state = await page.evaluate(() => ({
        href: location.href,
        requests: window.confirmationTest.requests,
        storageCalls: window.confirmationTest.storageCalls,
        text: document.body.innerText,
        links: [...document.querySelectorAll("a")].map((a) =>
          a.getAttribute("href"),
        ),
        html: document.documentElement.outerHTML,
      }));
      assert.equal(
        state.href,
        root,
        test.name + ": callback credentials remained in URL",
      );
      assert.equal(
        state.requests.length,
        test.requests,
        test.name + ": wrong verification request count",
      );
      assert.equal(
        state.storageCalls,
        0,
        test.name + ": persisted/accessed a session",
      );
      assert(
        !state.text.includes("private@example.invalid"),
        test.name + ": exposed account email",
      );
      assert(
        !state.html.includes(fakeToken),
        test.name + ": exposed token in DOM",
      );
      assert(state.links.includes("gutopia://auth/confirmed"));
      assert(
        state.links.every(
          (link) =>
            !link.includes(fakeToken) &&
            !link.includes("access_token") &&
            !link.includes("refresh_token"),
        ),
      );
      for (const request of state.requests) {
        assert.equal(request.locationAtRequest, root);
        assert.equal(request.options.method, "GET");
        assert.equal(request.options.credentials, "omit");
        assert.equal(request.options.cache, "no-store");
        assert.equal(request.options.referrerPolicy, "no-referrer");
        assert.equal(
          request.options.headers.Authorization,
          "Bearer " + fakeToken,
        );
      }
      assert.equal(errors.length, 0, errors.join("\n"));
      assert(
        logs.every(
          (log) =>
            !log.includes(fakeToken) &&
            !log.includes("private@example.invalid"),
        ),
        test.name + ": logged credentials",
      );
      assert(
        network.every((request) => !request.url.includes("supabase.co")),
        test.name + ": real Auth request escaped the mock",
      );
      assert(
        network
          .filter((request) => request.resource !== "document")
          .every(
            (request) =>
              !request.url.includes(fakeToken) &&
              !String(request.headers.referer).includes(fakeToken),
          ),
        test.name + ": credential leaked to asset request",
      );
      assert.equal(
        await page.locator("#confirmation-card").getAttribute("aria-busy"),
        "false",
      );
      if (test.expected === "confirmed") {
        await page.screenshot({
          path: output + "/account-confirmed-desktop.png",
          fullPage: true,
        });
        for (const width of [390, 320]) {
          await page.setViewportSize({ width, height: 844 });
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          );
          await page.screenshot({
            path: output + "/account-confirmed-" + width + ".png",
            fullPage: true,
          });
        }
      }
      await page.close();
    }
    console.log(
      "PASS: 13 mocked confirmation states, immediate URL cleanup, verification before confirmed status, expiry/error/offline/15-second timeout, unsupported-flow refusal, no storage/credential leakage/real Auth requests, clean app-return link, and 320/390px layouts.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
