import "server-only";
import { z } from "zod";
const schema = z.object({
  APP_MODE: z.enum(["local", "test", "production"]).default("local"),
  APP_URL: z.url().default("http://127.0.0.1:3000"),
  INVITATION_DOMAIN: z
    .string()
    .trim()
    .toLowerCase()
    .max(190)
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
    )
    .refine(
      (value) =>
        URL.canParse(`https://${value}`) &&
        new URL(`https://${value}`).hostname === value &&
        !/^\d+$/.test(value.split(".").at(-1)!),
      "Use a hostname without a scheme, port, or wildcard.",
    )
    .optional(),
  DATABASE_URL: z.string().optional(),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  EMAIL_ADAPTER: z.enum(["local", "smtp"]).default("local"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  STORAGE_ADAPTER: z.enum(["local", "s3"]).default("local"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  PAYMENT_ADAPTER: z.enum(["local", "razorpay"]).default("local"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  PRICE_PAISE: z.coerce.number().int().min(100).default(199900),
  CRON_SECRET: z.string().min(32).optional(),
  HASH_SECRET: z.string().min(32).optional(),
  SUPPORT_EMAIL: z.email().optional(),
});
export type Environment = z.infer<typeof schema>;
let cached: Environment | undefined;
export function env() {
  if (cached) return cached;
  const e = schema.parse(
    Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== "")),
  );
  if (e.APP_MODE === "production" || process.env.VERCEL_ENV === "production") {
    for (const key of [
      "DATABASE_URL",
      "BETTER_AUTH_SECRET",
      "SMTP_HOST",
      "SMTP_USER",
      "SMTP_PASS",
      "EMAIL_FROM",
      "S3_ENDPOINT",
      "S3_BUCKET",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
      "RAZORPAY_KEY_ID",
      "RAZORPAY_KEY_SECRET",
      "RAZORPAY_WEBHOOK_SECRET",
      "CRON_SECRET",
      "HASH_SECRET",
      "SUPPORT_EMAIL",
    ] as const)
      if (!e[key]) throw new Error(`Missing production setting: ${key}`);
    if (
      e.APP_MODE !== "production" ||
      e.EMAIL_ADAPTER !== "smtp" ||
      e.STORAGE_ADAPTER !== "s3" ||
      e.PAYMENT_ADAPTER !== "razorpay" ||
      !e.APP_URL.startsWith("https://") ||
      !e.RAZORPAY_KEY_ID?.startsWith("rzp_live_")
    )
      throw new Error("Production requires HTTPS and live provider adapters.");
  }
  cached = e;
  return e;
}
export function localOnly() {
  const e = env();
  if (e.APP_MODE !== "local" || process.env.VERCEL)
    throw new Error("Local development adapter is disabled.");
}
