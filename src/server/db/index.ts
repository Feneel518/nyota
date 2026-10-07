import "server-only";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { env } from "../env";
const globalDb = globalThis as unknown as { weddingPool?: Pool };
export function pool() {
  const url = env().DATABASE_URL;
  if (!url)
    throw new Error("Database is not configured. Run pnpm setup:local.");
  return (globalDb.weddingPool ??= new Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
    statement_timeout: 15000,
  }));
}
export function db() {
  return drizzle(pool(), { schema });
}
export type Database = ReturnType<typeof db>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
