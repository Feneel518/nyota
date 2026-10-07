import { safeReturn } from "@/lib/domain";
import { VerifyForm } from "@/features/weddings/auth-form";
import { Brand } from "@/components/site";
export const metadata = {
  title: "Confirm sign-in",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function Verify({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; callbackURL?: string }>;
}) {
  const q = await searchParams;
  return (
    <main id="main" className="auth-main verify-main">
      <div className="verify-brand">
        <Brand />
      </div>
      <VerifyForm
        token={q.token || ""}
        callbackURL={safeReturn(q.callbackURL || null)}
      />
    </main>
  );
}
