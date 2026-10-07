import { runJobs, maintenance } from "../src/server/jobs";
import { pool } from "../src/server/db";
async function main() {
  console.log(await runJobs(20));
  await maintenance();
  await pool().end();
}
main().catch(() => {
  console.error("Worker failed. Inspect redacted job status.");
  process.exit(1);
});
