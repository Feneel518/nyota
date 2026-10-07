import EmbeddedPostgres from "embedded-postgres";
import { readFile, access } from "node:fs/promises";
async function main() {
  const password = (await readFile(".local/postgres-password", "utf8")).trim();
  const pg = new EmbeddedPostgres({
    databaseDir: ".local/postgres",
    user: "wedding",
    password,
    port: 55432,
    persistent: true,
    authMethod: "scram-sha-256",
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    postgresFlags: ["-h", "127.0.0.1"],
    onLog: () => {},
    onError: () => {},
  });
  try {
    await access(".local/postgres/PG_VERSION");
  } catch {
    await pg.initialise();
  }
  await pg.start();
  const client = pg.getPgClient();
  await client.connect();
  const result = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = 'wedding'",
  );
  if (!result.rowCount)
    await client.query(
      "CREATE DATABASE wedding TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'",
    );
  await client.end();
  console.log(
    "PostgreSQL is listening on 127.0.0.1:55432. Data persists in .local/postgres. Ctrl+C stops it.",
  );
  const keepAlive = setInterval(() => {}, 30000);
  const stop = async () => {
    clearInterval(keepAlive);
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Database startup failed");
  process.exit(1);
});
