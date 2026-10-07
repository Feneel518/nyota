// Read-only credential check. Never creates an order or charges a payment.
const key = process.env.RAZORPAY_KEY_ID?.trim();
const readable = (value) => value && value !== "[SENSITIVE]";
const secret = readable(process.env.RAZORPAY_KEY_SECRET?.trim())
  ? process.env.RAZORPAY_KEY_SECRET.trim()
  : undefined;
const mode = key?.startsWith("rzp_live_")
  ? "live"
  : key?.startsWith("rzp_test_")
    ? "test"
    : "missing-or-invalid";
console.log(
  JSON.stringify({
    adapter: process.env.PAYMENT_ADAPTER || "not-set",
    mode,
    keySecretPresent: !!secret,
    webhookSecretPresent: !!readable(
      process.env.RAZORPAY_WEBHOOK_SECRET?.trim(),
    ),
  }),
);
if (!secret || mode === "missing-or-invalid") {
  console.error(
    "Credential check unavailable: provide valid Razorpay credentials in this environment. Vercel Secrets may not be readable outside a deployment.",
  );
  process.exitCode = 1;
} else {
  const response = await fetch("https://api.razorpay.com/v1/orders?count=1", {
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
    },
    signal: AbortSignal.timeout(15000),
  });
  // Never log response bodies: they can contain customer/order information.
  console.log(
    JSON.stringify({
      authenticated: response.ok,
      httpStatus: response.status,
      operation: "read-only",
    }),
  );
  if (!response.ok) process.exitCode = 1;
}
