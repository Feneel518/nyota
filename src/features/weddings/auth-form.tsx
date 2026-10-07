"use client";
import { useUiLanguage } from "@/components/owner-language";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
export function SignInForm({
  callbackURL,
  local,
}: {
  callbackURL: string;
  local: boolean;
}) {
  const { t } = useUiLanguage();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signIn.magicLink({
        email: email.trim().toLowerCase(),
        callbackURL,
        errorCallbackURL: "/sign-in?error=expired",
      });
      if (result.error)
        throw new Error(
          result.error.message || "Could not send the sign-in link.",
        );
      setSent(true);
      setCooldown(60);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not send a link. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-form">
      <h1>{sent ? t("Check your inbox.") : t("Your story starts here.")}</h1>
      <p>
        {sent
          ? t(
              "If this address can receive email, a sign-in link is on its way. It expires in 10 minutes.",
            )
          : t(
              "Create an invitation that feels like you. Sign in with an email link — no password to remember.",
            )}
      </p>
      <form onSubmit={submit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">{t("Email address")}</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={254}
            />
            <FieldDescription>
              {t("Your drafts and guest responses stay private.")}
            </FieldDescription>
          </Field>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>{t("Could not send link")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={busy || cooldown > 0}>
            {busy
              ? t("Sending your link…")
              : cooldown
                ? `Resend in ${cooldown}s`
                : sent
                  ? t("Resend sign-in link")
                  : t("Email me a sign-in link")}
            <Mail data-icon="inline-end" />
          </Button>
        </FieldGroup>
      </form>
      {local && sent && (
        <Alert>
          <AlertTitle>{t("Local development inbox")}</AlertTitle>
          <AlertDescription>
            {t(
              "Your email is saved in the private .local/mail folder on this computer. No email was sent externally.",
            )}
          </AlertDescription>
        </Alert>
      )}
      <p className="small-note">
        {t("By continuing, you agree to the")}{" "}
        <Link className="underline" href="/terms">
          {t("terms")}
        </Link>{" "}
        {t("and")}{" "}
        <Link className="underline" href="/privacy">
          {t("privacy policy")}
        </Link>
        .
      </p>
      <Link href="/demo" className="small-note underline">
        {t("Just looking? Explore the demo")}
      </Link>
    </div>
  );
}
export function VerifyForm({
  token,
  callbackURL,
}: {
  token: string;
  callbackURL: string;
}) {
  const { t } = useUiLanguage();

  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="auth-form">
      <h1>{t("Welcome back.")}</h1>
      <p>{t("Confirm below to open your private wedding workspace.")}</p>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t("This link cannot be used")}</AlertTitle>
          <AlertDescription>
            {error} <Link href="/sign-in">{t("Request a fresh link.")}</Link>
          </AlertDescription>
        </Alert>
      )}
      <Button
        disabled={busy || !token}
        onClick={async () => {
          setBusy(true);
          try {
            const result = await authClient.magicLink.verify({
              // Request the plugin's JSON result; a followed error redirect is not a successful verification.
              query: { token, errorCallbackURL: "/sign-in?error=expired" },
            });
            if (result.error || !result.data?.session)
              throw new Error(t("It may have expired or already been used."));
            router.replace(callbackURL);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Sign-in failed.");
            setBusy(false);
          }
        }}
      >
        {busy ? t("Opening your workspace…") : t("Continue to my invitations")}
      </Button>
    </div>
  );
}
