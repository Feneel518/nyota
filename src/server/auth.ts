import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { headers } from "next/headers";
import { db } from "./db";
import * as schema from "./db/schema";
import { env } from "./env";
import { sendEmail } from "./email";
import { AppError } from "./security";
let instance: ReturnType<typeof createAuth> | undefined;
export function auth() {
  return (instance ??= createAuth());
}
function createAuth() {
  const e = env();
  if (!e.BETTER_AUTH_SECRET)
    throw new Error("Configure BETTER_AUTH_SECRET with pnpm setup:local.");
  return betterAuth({
    appName: "Nyota",
    baseURL: e.APP_URL,
    secret: e.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db(), { provider: "pg", schema }),
    trustedOrigins: [e.APP_URL],
    emailAndPassword: { enabled: false },
    session: { expiresIn: 60 * 60 * 24 * 7 },
    advanced: { useSecureCookies: e.APP_URL.startsWith("https://") },
    rateLimit: { enabled: true, storage: "database" },
    plugins: [
      magicLink({
        expiresIn: 600,
        storeToken: "hashed",
        sendMagicLink: async ({ email, url }) => {
          const verification = new URL(url);
          const landing = new URL("/sign-in/verify", e.APP_URL);
          for (const [key, value] of verification.searchParams)
            landing.searchParams.set(key, value);
          await sendEmail(
            email,
            "Your Nyota sign-in link",
            `Open this link to sign in. It expires in 10 minutes and works once.\n\n${landing}\n\nIf you did not request this, you can ignore it.`,
          );
        },
      }),
    ],
  });
}
export async function currentUser() {
  if (!env().DATABASE_URL || !env().BETTER_AUTH_SECRET) return null;
  return (
    (await auth().api.getSession({ headers: await headers() }))?.user ?? null
  );
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new AppError(401, "Please sign in to continue.");
  return user;
}
