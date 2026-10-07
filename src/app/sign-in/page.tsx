import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { env } from "@/server/env";
import { safeReturn } from "@/lib/domain";
import { Brand } from "@/components/site";
import { Courtyard } from "@/components/illustration";
import { SignInForm } from "@/features/weddings/auth-form";
export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const query = await searchParams;
  const callbackURL = safeReturn(query.next || null);
  if (await currentUser()) redirect(callbackURL);
  return (
    <div className="auth-layout">
      <aside className="auth-art">
        <Brand />
        <h2>
          A little world.
          <br />A lifetime of memories.
        </h2>
        <Courtyard />
      </aside>
      <main id="main" className="auth-main">
        {query.error && (
          <p role="alert" className="mb-6">
            That sign-in link expired or was already used. Request a new one
            below.
          </p>
        )}
        <SignInForm
          callbackURL={callbackURL}
          local={env().EMAIL_ADAPTER === "local"}
        />
      </main>
    </div>
  );
}
