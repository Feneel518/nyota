import { Pool } from "pg";
async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("Database URL is missing.");
  const parsed = new URL(url);
  const pool = new Pool({
    connectionString: url,
    max: 1,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
  });
  try {
    const tables = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    );
    console.log(
      JSON.stringify({
        database: parsed.hostname.endsWith(".neon.tech")
          ? "Neon"
          : "PostgreSQL",
        pooled: parsed.hostname.includes("-pooler"),
        tables: tables.rows.map((r) => r.tablename),
      }),
    );
  } finally {
    await pool.end();
  }
}
main().catch(() => {
  console.error(
    "Database inspection failed. Check connectivity and credentials.",
  );
  process.exit(1);
});
