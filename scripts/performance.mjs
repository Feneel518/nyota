import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const origin = process.env.PERF_ORIGIN || "http://127.0.0.1:3001";
const journey = JSON.parse(await readFile(".local/last-journey.json", "utf8"));
const path =
  process.env.PERF_PATH || `${new URL(journey.publicUrl).pathname}/details`;
const browser = await chromium.launch();
const results = [];
try {
  for (let run = 1; run <= 3; run++) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: 1_600_000 / 8,
      uploadThroughput: 750_000 / 8,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      window.__vitals = { lcp: 0, cls: 0 };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__vitals.lcp = e.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (!e.hadRecentInput) window.__vitals.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { level: 1 }).waitFor();
    results.push(
      await page.evaluate(
        (run) => ({
          run,
          ...window.__vitals,
          javascriptTransferBytes: performance
            .getEntriesByType("resource")
            .filter((r) => r.name.includes(".js"))
            .reduce((sum, r) => sum + r.transferSize, 0),
          totalTransferBytes: [
            ...performance.getEntriesByType("resource"),
            ...performance.getEntriesByType("navigation"),
          ].reduce((sum, r) => sum + r.transferSize, 0),
        }),
        run,
      ),
    );
    await context.close();
  }
  await mkdir("docs/evidence", { recursive: true });
  await writeFile(
    "docs/evidence/performance.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        environment:
          "Local production build, Chromium emulation; not field data or INP measurement",
        profile:
          "390x844, cold contexts, 4x CPU, 150ms latency, 1.6Mbps down / 750Kbps up",
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
