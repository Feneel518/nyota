import { z } from "zod";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { addMonths, addDays } from "date-fns";
export function hostingDates(start: Date) {
  const local = toZonedTime(start, "Asia/Kolkata");
  const expiresAt = fromZonedTime(addMonths(local, 6), "Asia/Kolkata");
  return { expiresAt, purgeAt: addDays(expiresAt, 30) };
}
export function isActive(expiresAt: Date | string | null, now = new Date()) {
  return !!expiresAt && new Date(expiresAt).getTime() > now.getTime();
}
export const responseSchema = z
  .object({
    family: z.string().trim().min(1).max(100),
    attending: z.boolean(),
    note: z.string().trim().max(500),
    counts: z.record(z.string().uuid(), z.number().int().min(1).max(20)),
    website: z.string().max(0).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.attending && Object.keys(v.counts).length === 0)
      ctx.addIssue({
        code: "custom",
        path: ["counts"],
        message: "Choose at least one event.",
      });
    if (!v.attending && Object.keys(v.counts).length)
      ctx.addIssue({
        code: "custom",
        path: ["counts"],
        message: "A decline cannot contain attendees.",
      });
  });
export type GuestResponse = z.infer<typeof responseSchema>;
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function csv(rows: unknown[][]) {
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
export function attendanceTotals(responses: GuestResponse[], events: string[]) {
  return Object.fromEntries(
    events.map((id) => [
      id,
      responses.reduce((n, r) => n + (r.attending ? r.counts[id] || 0 : 0), 0),
    ]),
  );
}
export function safeReturn(value: string | null) {
  return value &&
    (/^\/dashboard(?:\/|$)/.test(value) || value === "/admin") &&
    !value.includes("\\")
    ? value
    : "/dashboard";
}
