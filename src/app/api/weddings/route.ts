import { requireUser } from "@/server/auth";
import { createWedding, listWeddings } from "@/server/weddings";
import {
  checkOrigin,
  endpoint,
  rateLimitRequest,
  response,
} from "@/server/security";
export async function GET() {
  return endpoint(async () =>
    response(await listWeddings((await requireUser()).id)),
  );
}
export async function POST(req: Request) {
  return endpoint(async () => {
    checkOrigin(req);
    const user = await requireUser();
    await rateLimitRequest(req, "create-wedding", 10, user.id);
    return response(await createWedding(user.id), 201);
  });
}
