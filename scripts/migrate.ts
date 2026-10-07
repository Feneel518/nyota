import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED;
  if (!url) throw new Error("DATABASE_URL_UNPOOLED is required.");
  const direct = new URL(url);
  if (
    direct.hostname.endsWith(".neon.tech") &&
    direct.hostname.includes("-pooler")
  ) {
    direct.hostname = direct.hostname.replace("-pooler", "");
    console.log("Using the direct endpoint for this Neon migration.");
  }
  const pool = new Pool({
    connectionString: direct.toString(),
    max: 1,
    connectionTimeoutMillis: 15000,
  });
  try {
    await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
    console.log("Migrations applied.");
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Migration failed");
  process.exit(1);
});
