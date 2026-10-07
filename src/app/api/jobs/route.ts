import { env } from "@/server/env";
import { equal, endpoint, AppError, response } from "@/server/security";
import { maintenance, runJobs } from "@/server/jobs";
export const maxDuration = 60;
export async function GET(req: Request) {
  return endpoint(async () => {
    const secret = env().CRON_SECRET;
    if (
      !secret ||
      !equal(req.headers.get("authorization") || "", `Bearer ${secret}`)
    )
      throw new AppError(401, "Unauthorized.");
    const result = await runJobs(5);
    await maintenance();
    return response(result);
  });
}
