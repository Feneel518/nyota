import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const browser = await chromium.launch();
const results = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", {
    rate: Number(process.env.PERF_CPU || 1),
  });
  await cdp.send("Performance.enable");
  await page.goto(`${process.env.PERF_ORIGIN || "http://127.0.0.1:3001"}/demo`);
  await page
    .getByRole("button", { name: "Open the invitation", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Celebration chapters" })
    .getByRole("button", { name: "An evening of music", exact: true })
    .click();
  await page.locator("[data-disco-stage]").waitFor();
  // Measure steady motion after the chapter snapshot and first rasterization.
  await page.waitForTimeout(1500);
  const variants = process.env.PERF_PROBES
    ? [
        ["baseline", ""],
        [
          "no-stage-motion",
          "[data-ceremony] > svg > .ceremony-cast > g > g { animation: none !important; }",
        ],
        [
          "no-svg-motion",
          "[data-ceremony] svg * { animation: none !important; }",
        ],
        [
          "no-micro-motion",
          ".dress-sparkle, [class*='mirrorTile'], [class*='floorLight'], [class*='discoGlimmer'], .canopy-blossom, .hanging-lamp { animation: none !important; }",
        ],
        ["no-mask", ".scene-visual > * { mask-image: none !important; }"],
        [
          "no-atmosphere",
          ".invitation-atmosphere { display: none !important; }",
        ],
        [
          "promoted",
          "[data-perf-animated] { will-change: transform, opacity; }",
        ],
        [
          "paused",
          ".invitation * { animation-play-state: paused !important; }",
        ],
      ]
    : [[process.env.PERF_LABEL || "baseline", ""]];
  for (const [label, css] of variants) {
    await page.evaluate(() =>
      document.getAnimations().forEach((a) => {
        const target = a.effect?.target;
        if (target instanceof Element)
          target.setAttribute("data-perf-animated", "");
      }),
    );
    const style = await page.addStyleTag({ content: css || "/* baseline */" });
    const before = await cdp.send("Performance.getMetrics");
    const frames = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const deltas = [];
          let start;
          let previous;
          function frame(now) {
            start ??= now;
            if (previous) deltas.push(now - previous);
            previous = now;
            if (now - start < 4000) requestAnimationFrame(frame);
            else {
              deltas.sort((a, b) => a - b);
              resolve({
                frames: deltas.length,
                p95ms: +deltas[Math.floor(deltas.length * 0.95)].toFixed(1),
                over33ms: deltas.filter((v) => v > 33.5).length,
                animations: document.getAnimations().length,
              });
            }
          }
          requestAnimationFrame(frame);
        }),
    );
    const after = await cdp.send("Performance.getMetrics");
    const delta = (name) =>
      +(
        (after.metrics.find((m) => m.name === name).value -
          before.metrics.find((m) => m.name === name).value) *
        1000
      ).toFixed(1);
    results.push({
      label,
      ...frames,
      taskMs: delta("TaskDuration"),
      layoutMs: delta("LayoutDuration"),
      styleMs: delta("RecalcStyleDuration"),
    });
    await style.evaluate((element) => element.remove());
  }
  await mkdir("docs/evidence", { recursive: true });
  await writeFile(
    `docs/evidence/animation-${process.env.PERF_LABEL || "baseline"}.json`,
    JSON.stringify(
      {
        profile: `Chromium, 1280x720, ${process.env.PERF_CPU || 1}x CPU slowdown, 4 seconds Sangeet after warmup`,
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results));
  if (results[0].p95ms > 34) process.exitCode = 1;
} finally {
  await browser.close();
}
