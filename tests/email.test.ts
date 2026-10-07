import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mail = vi.hoisted(() => ({
  send: vi.fn(),
  create: vi.fn(),
}));
vi.mock("nodemailer", () => ({ default: { createTransport: mail.create } }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("APP_MODE", "test");
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("EMAIL_ADAPTER", "smtp");
  vi.stubEnv("APP_URL", "https://invite.example");
  vi.stubEnv("SMTP_HOST", "smtp.example");
  vi.stubEnv("SMTP_PORT", "587");
  vi.stubEnv("SMTP_SECURE", "false");
  vi.stubEnv("SMTP_USER", "mailer");
  vi.stubEnv("SMTP_PASS", "test-secret");
  vi.stubEnv("EMAIL_FROM", "Invitations <hello@example.test>");
  mail.create.mockReturnValue({ sendMail: mail.send });
  mail.send.mockResolvedValue({
    accepted: ["guest@example.test"],
    rejected: [],
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("Nodemailer delivery", () => {
  it("uses authenticated STARTTLS, reuses transport, and preserves Unicode and retry identity", async () => {
    const { sendEmail } = await import("../src/server/email");
    await sendEmail(
      "guest@example.test",
      "લગ્ન આમંત્રણ",
      "Your invitation link",
      "job-1",
    );
    await sendEmail(
      "guest@example.test",
      "લગ્ન આમંત્રણ",
      "Your invitation link",
      "job-1",
    );
    expect(mail.create).toHaveBeenCalledTimes(1);
    expect(mail.create).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: "mailer", pass: "test-secret" },
      }),
    );
    const first = mail.send.mock.calls[0][0];
    expect(first).toMatchObject({
      to: "guest@example.test",
      subject: "લગ્ન આમંત્રણ",
      from: "Invitations <hello@example.test>",
    });
    expect(first.messageId).toMatch(/^<[a-f0-9]{64}@invite.example>$/);
    expect(mail.send.mock.calls[1][0].messageId).toBe(first.messageId);
  });
  it("infers immediate TLS on port 465", async () => {
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("SMTP_SECURE", "");
    const { sendEmail } = await import("../src/server/email");
    await sendEmail("guest@example.test", "Welcome", "Hello");
    expect(mail.create).toHaveBeenCalledWith(
      expect.objectContaining({ port: 465, secure: true }),
    );
  });
  it("rejects missing credentials before contacting SMTP", async () => {
    vi.stubEnv("SMTP_PASS", "");
    const { sendEmail } = await import("../src/server/email");
    await expect(
      sendEmail("guest@example.test", "Welcome", "Hello"),
    ).rejects.toThrow("not configured");
    expect(mail.create).not.toHaveBeenCalled();
  });
  it.each([
    { accepted: [], rejected: ["guest@example.test"] },
    { accepted: ["one@example.test"], rejected: ["guest@example.test"] },
  ])("keeps rejected recipients retryable", async (result) => {
    mail.send.mockResolvedValue(result);
    const { sendEmail } = await import("../src/server/email");
    await expect(
      sendEmail("guest@example.test", "Welcome", "Hello"),
    ).rejects.toThrow("Email delivery failed");
  });
  it("does not leak provider errors", async () => {
    mail.send.mockRejectedValue(
      new Error("SMTP response containing private details"),
    );
    const { sendEmail } = await import("../src/server/email");
    await expect(
      sendEmail("guest@example.test", "Welcome", "Hello"),
    ).rejects.toThrow(/^Email delivery failed$/);
  });
  it("rejects malformed secure flags instead of treating false as truthy", async () => {
    vi.stubEnv("SMTP_SECURE", "no");
    const { env } = await import("../src/server/env");
    expect(() => env()).toThrow();
  });
});
