import { env } from "@/server/env";
import { pool } from "@/server/db";
export async function GET() {
  try {
    env();
    await pool().query("SELECT 1");
    return Response.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
