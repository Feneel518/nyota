"use client";
import { useUiLanguage } from "@/components/owner-language";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
export function NewWedding() {
  const { t } = useUiLanguage();

  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const w = await api<{ id: string }>("/api/weddings", {});
          router.push(`/dashboard/${w.id}/edit`);
        } catch (e) {
          toast.error(errorMessage(e));
          setBusy(false);
        }
      }}
    >
      <Plus data-icon="inline-start" />
      {busy ? t("Creating your draft…") : t("Create an invitation")}
    </Button>
  );
}
export function SignOut() {
  const { t } = useUiLanguage();

  const router = useRouter();
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await authClient.signOut();
        router.replace("/");
        router.refresh();
      }}
    >
      <LogOut data-icon="inline-start" />
      {t("Sign out")}
    </Button>
  );
}
export function DashboardLink() {
  const { t } = useUiLanguage();

  return (
    <Button variant="ghost" asChild>
      <Link href="/dashboard">{t("My invitations")}</Link>
    </Button>
  );
}
