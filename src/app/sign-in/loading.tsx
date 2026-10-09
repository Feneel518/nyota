import { LoaderCircle } from "lucide-react";
import { OwnerText } from "@/components/owner-language";

export default function Loading() {
  return (
    <main id="main" className="auth-main verify-main">
      <div role="status" className="flex items-center gap-3">
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        <OwnerText>Checking your sign-in…</OwnerText>
      </div>
    </main>
  );
}
