import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { env } from "@/server/env";
import { safeReturn } from "@/lib/domain";
import { Brand } from "@/components/site";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { WeddingMotif } from "@/components/wedding-motif";
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
        <div className="auth-stationery" aria-hidden="true">
          <WeddingMotif kind="wedding" />
          <p>With love & a little magic</p>
          <div className="auth-sample-names">
            Aarav <span>&</span> Meera
          </div>
          <p>Two hearts. A whole world of celebration.</p>
          <div className="auth-sample-date">14 February 2027</div>
        </div>
        <div className="auth-art-copy">
          <h2>
            It starts with
            <br />a beautiful invitation.
          </h2>
          <p>Made for your traditions. Shared with your favourite people.</p>
        </div>
      </aside>
      <main id="main" className="auth-main">
        <Link href="/" className="auth-back">
          <ArrowLeft size={16} /> Back to Nyota
        </Link>
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
        <div className="auth-benefits">
          <span>
            <Check /> English & Gujarati
          </span>
          <span>
            <Check /> Private guest RSVPs
          </span>
          <span>
            <Check /> Make it your own
          </span>
        </div>
      </main>
    </div>
  );
}
