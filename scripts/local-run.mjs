import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
const password = readFileSync(".local/postgres-password", "utf8").trim();
if (!existsSync(".local/test-secrets.json"))
  writeFileSync(
    ".local/test-secrets.json",
    JSON.stringify({
      auth: randomBytes(32).toString("hex"),
      hash: randomBytes(32).toString("hex"),
      cron: randomBytes(32).toString("hex"),
    }),
  );
const secrets = JSON.parse(readFileSync(".local/test-secrets.json", "utf8"));
const localEnv = {
  ...process.env,
  APP_MODE: "local",
  APP_URL: "http://127.0.0.1:3001",
  DATABASE_URL: `postgresql://wedding:${password}@127.0.0.1:55432/wedding`,
  DATABASE_URL_UNPOOLED: `postgresql://wedding:${password}@127.0.0.1:55432/wedding`,
  BETTER_AUTH_SECRET: secrets.auth,
  HASH_SECRET: secrets.hash,
  CRON_SECRET: secrets.cron,
  EMAIL_ADAPTER: "local",
  STORAGE_ADAPTER: "local",
  PAYMENT_ADAPTER: "local",
  PRICE_PAISE: "199900",
  LOCAL_TEST: "true",
};
for (const key of [
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "S3_ENDPOINT",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "SUPPORT_EMAIL",
])
  delete localEnv[key];
const [command, ...args] = process.argv.slice(2);
const scripts = {
  dev: [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3001",
  ],
  start: [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3001",
  ],
  build: ["node_modules/next/dist/bin/next", "build"],
  migrate: ["--import", "tsx", "scripts/migrate.ts"],
  test: ["node_modules/vitest/vitest.mjs", "run"],
  e2e: ["node_modules/@playwright/test/cli.js", "test"],
  jobs: ["--conditions=react-server", "--import", "tsx", "scripts/jobs.ts"],
};
if (!scripts[command])
  throw new Error("Choose dev, start, build, migrate, test, e2e, or jobs.");
const child = spawn(process.execPath, [...scripts[command], ...args], {
  stdio: "inherit",
  env: localEnv,
  windowsHide: true,
});
child.on("exit", (code) => process.exit(code || 0));
