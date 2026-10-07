import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { env, localOnly } from "./env";
let transporter: Transporter | undefined;
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  key?: string,
) {
  const e = env();
  if (e.EMAIL_ADAPTER === "local") {
    localOnly();
    await mkdir(".local/mail", { recursive: true });
    await writeFile(
      `.local/mail/${Date.now()}-${crypto.randomUUID()}.json`,
      JSON.stringify({
        to,
        subject,
        text,
        createdAt: new Date().toISOString(),
      }),
    );
    return;
  }
  if (!e.SMTP_HOST || !e.SMTP_USER || !e.SMTP_PASS || !e.EMAIL_FROM)
    throw new Error("Email provider is not configured");
  transporter ??= nodemailer.createTransport({
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_SECURE ?? e.SMTP_PORT === 465,
    requireTLS: true,
    auth: { user: e.SMTP_USER, pass: e.SMTP_PASS },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  // Stable IDs help trace job retries; SMTP does not guarantee deduplication.
  const messageId = key
    ? `<${createHash("sha256").update(key).digest("hex")}@${new URL(e.APP_URL).hostname}>`
    : undefined;
  try {
    const result = await transporter.sendMail({
      from: e.EMAIL_FROM,
      to,
      subject,
      text,
      messageId,
    });
    if (!result.accepted?.length || result.rejected?.length)
      throw new Error("Email delivery failed");
  } catch {
    // Do not expose SMTP responses, credentials, or recipient addresses.
    throw new Error("Email delivery failed");
  }
}
