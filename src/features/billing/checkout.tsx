"use client";
import { useUiLanguage } from "@/components/owner-language";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ArrowLeft, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { WeddingMotif } from "@/components/wedding-motif";
import { Brand } from "@/components/site";
import { Share } from "@/features/invitations/share";
import { api, errorMessage } from "@/lib/api";
import { eventDate, type InvitationContent } from "@/lib/content";
type Order = {
  id: string;
  providerOrderId: string | null;
  amount: number;
  paymentState: string;
  fulfillment: string;
};
type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  theme: { color: string };
  handler: (r: {
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal: { ondismiss: () => void };
};
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: "payment.failed", handler: () => void) => void;
    };
  }
}
let checkoutScript: Promise<void> | undefined;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScript) return checkoutScript;
  checkoutScript = new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      checkoutScript = undefined;
      reject(
        new Error("Checkout could not load. Check your connection and retry."),
      );
    };
    const timer = setTimeout(fail, 15000);
    script.onload = () => {
      clearTimeout(timer);
      if (window.Razorpay) resolve();
      else fail();
    };
    script.onerror = fail;
    document.body.appendChild(script);
  });
  return checkoutScript;
}
export function Checkout({
  id,
  content,
  version,
  url,
  price,
  local,
  keyId,
  initialOrder,
  firstPublishedAt,
  expiresAt,
  expectedExpiry,
  purgeAt,
}: {
  id: string;
  content: InvitationContent;
  version: number;
  slug: string;
  url: string;
  price: number;
  local: boolean;
  keyId?: string;
  initialOrder: Order | null;
  firstPublishedAt: string | null;
  expiresAt: string | null;
  expectedExpiry: string;
  purgeAt: string | null;
}) {
  const { t, language } = useUiLanguage();
  const paymentActive = useRef(false);

  const [order, setOrder] = useState(initialOrder),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [agreed, setAgreed] = useState(false);
  const [live, setLive] = useState(!!firstPublishedAt);
  const [expiry, setExpiry] = useState(expiresAt),
    [purge, setPurge] = useState(purgeAt);
  const refresh = useCallback(async () => {
    const result = await api<{ order: Order | null }>(
      `/api/weddings/${id}/order`,
    );
    setOrder(result.order);
    if (result.order?.fulfillment === "published") {
      const data = await api<{
        wedding: { expiresAt: string; purgeAt: string };
      }>(`/api/weddings/${id}/draft`);
      setLive(true);
      setExpiry(data.wedding.expiresAt);
      setPurge(data.wedding.purgeAt);
    }
  }, [id]);
  useEffect(() => {
    if (live || !order) return;
    const timer = setInterval(() => {
      void refresh().catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, [order, live, refresh]);
  async function pay() {
    if (paymentActive.current) return;
    paymentActive.current = true;
    let checkoutOpened = false;
    setBusy(true);
    setError("");
    try {
      const current =
        order || (await api<Order>(`/api/weddings/${id}/order`, { version }));
      setOrder(current);
      if (current.paymentState === "captured") {
        await api(`/api/weddings/${id}/reconcile`, {});
        await refresh();
        return;
      }
      if (!current.providerOrderId)
        throw new Error(
          "Your order is being reconciled. Check payment status in a moment; please do not start another purchase.",
        );
      if (local) {
        await api(`/api/weddings/${id}/local-payment`, {});
        await refresh();
        return;
      }
      if (!keyId)
        throw new Error("Checkout is not configured yet. Your draft is safe.");
      await loadCheckout();
      const checkout = new window.Razorpay!({
        key: keyId,
        order_id: current.providerOrderId,
        amount: current.amount,
        currency: "INR",
        name: "Nyota",
        description: "One invitation · six months hosting",
        theme: { color: "#4a1728" },
        handler: async (result) => {
          try {
            await api(`/api/weddings/${id}/verify`, {
              paymentId: result.razorpay_payment_id,
              signature: result.razorpay_signature,
            });
            await refresh();
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            paymentActive.current = false;
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            paymentActive.current = false;
            setBusy(false);
            setError(
              "Checkout closed. Your draft and reserved order are safe. You can resume the same checkout.",
            );
          },
        },
      });
      checkout.on("payment.failed", () => {
        setError(
          "Payment was not completed. Retry in the payment window or close it to check your payment status.",
        );
      });
      checkout.open();
      checkoutOpened = true;
      return;
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      if (!checkoutOpened) {
        paymentActive.current = false;
        setBusy(false);
      }
    }
  }
  const name = content.names.map((n) => n[content.defaultLanguage]).join(" & ");
  const total = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((order?.amount || price) / 100);
  const reversed =
    order?.paymentState === "refunded" || order?.paymentState === "disputed";
  return (
    <main id="main" className="workspace nyota-checkout">
      <header className="workspace-header">
        <Brand />
        <span className="checkout-secure">
          <LockKeyhole size={15} />
          {t("Secure checkout")}
        </span>
      </header>
      <div className="page-heading">
        <div>
          <Button variant="ghost" asChild>
            <Link href={`/dashboard/${id}/edit`}>
              <ArrowLeft data-icon="inline-start" />
              {t("Back to your invitation")}
            </Link>
          </Button>
          <h1 className="mt-5">
            {live ? t("Let the joy travel.") : t("Ready to invite your world?")}
          </h1>
        </div>
      </div>
      <div className="checkout-grid">
        <div
          className="checkout-invitation invitation"
          data-theme={content.theme}
        >
          <WeddingMotif kind="wedding" />
          <p>{t("Together with our families")}</p>
          <div className="display">{name}</div>
          <p>
            {eventDate(
              content.events.find((e) => e.id === content.mainEventId)?.start ||
                "",
              content.defaultLanguage,
              false,
            )}
          </p>
          <div className="checkout-celebrations">
            {content.events
              .filter((e) => !e.archived)
              .map((e) => (
                <div key={e.id}>
                  <span>{e.title[content.defaultLanguage] || e.title.en}</span>
                  <span>
                    {eventDate(e.start, content.defaultLanguage, false)}
                  </span>
                </div>
              ))}
          </div>
          <p className="checkout-domain">www.nyotaa.app</p>
        </div>
        <section className="checkout-summary">
          {live && !reversed ? (
            <>
              <Alert>
                <Check />
                <AlertTitle>{t("Your invitation is published")}</AlertTitle>
                <AlertDescription>
                  {t("Share your link and welcome your first responses.")}
                </AlertDescription>
              </Alert>
              <div className="checkout-expiry">
                <span>{t("Hosting ends")}</span>
                <strong>
                  <time dateTime={expiry!}>{eventDate(expiry!, language)}</time>
                </strong>
                <span>IST · Asia/Kolkata</span>
                <p>
                  {t("Export responses before")} {eventDate(purge!, language)}.
                </p>
              </div>
              <Field>
                <FieldLabel>{t("Public invitation")}</FieldLabel>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline break-all"
                >
                  {url}
                </a>
              </Field>
              <Share
                url={url}
                title={`${name} — You're invited`}
                qr={`/api/weddings/${id}/qr`}
              />
              <Button asChild>
                <Link href={`/dashboard/${id}/responses`}>
                  {t("View guest responses")}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <h2>{total}</h2>
              <p>{t("One-time total · six calendar months of hosting")}</p>
              <ul className="checkout-inclusions">
                {[
                  "All six invitation themes",
                  "English & Gujarati",
                  "Six original music tracks",
                  "Private RSVPs & guest export",
                  "Shareable link & QR code",
                ].map((item) => (
                  <li key={item}>
                    <Check aria-hidden="true" />
                    {t(item)}
                  </li>
                ))}
              </ul>
              <div className="checkout-expiry">
                <span>{t("Expected hosting end if published today:")}</span>
                <strong>
                  <time dateTime={expectedExpiry}>
                    {eventDate(expectedExpiry, language)}
                  </time>
                </strong>
                <span>IST · Asia/Kolkata</span>
                <p>
                  {t(
                    "Your full six-month term starts at actual publication. Responses can be exported for another 30 days.",
                  )}
                </p>
              </div>
              {content.events.some(
                (e) =>
                  !e.archived &&
                  new Date(`${e.start}+05:30`) > new Date(expectedExpiry),
              ) && (
                <Alert>
                  <AlertTitle>
                    {t("An event falls after the hosting period")}
                  </AlertTitle>
                  <AlertDescription>
                    {t(
                      "Your invitation will expire before that event. Consider publishing closer to the wedding. Renewals are not included.",
                    )}
                  </AlertDescription>
                </Alert>
              )}
              {local && (
                <Alert>
                  <AlertTitle>{t("Local test checkout")}</AlertTitle>
                  <AlertDescription>
                    {t(
                      "No money will be charged. This tests the local order, publication, and response flow.",
                    )}
                  </AlertDescription>
                </Alert>
              )}
              {order && (
                <Alert>
                  <AlertTitle>
                    {reversed
                      ? t("Payment needs support review")
                      : order.paymentState === "captured"
                        ? t("Paid — publishing in progress")
                        : !order.providerOrderId
                          ? t("Confirming your reserved order")
                          : t("Your reviewed invitation is reserved")}
                  </AlertTitle>
                  <AlertDescription>
                    {order.paymentState === "captured"
                      ? t(
                          "Your payment is recorded. We will keep retrying publication; you do not need to pay again.",
                        )
                      : t(
                          "This checkout uses the version saved when the order was first created. Later draft changes can be published after your invitation is live.",
                        )}
                  </AlertDescription>
                </Alert>
              )}
              <Field orientation="horizontal">
                <Checkbox
                  id="checkout-agree"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(!!v)}
                />
                <FieldLabel htmlFor="checkout-agree">
                  {t(
                    "I reviewed the invitation and understand the hosting term and public-link visibility.",
                  )}
                </FieldLabel>
              </Field>
              <p className="small-note">
                {t("By publishing you agree to the")}{" "}
                <Link href="/terms" className="underline">
                  {t("terms and refund process")}
                </Link>{" "}
                {t("Your invitation link:")} {url}
              </p>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>{t("Checkout update")}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                size="lg"
                disabled={busy || !agreed || reversed}
                onClick={pay}
              >
                <LockKeyhole data-icon="inline-start" />
                {busy
                  ? t("Checking your order…")
                  : order?.paymentState === "captured"
                    ? t("Check publication status")
                    : local
                      ? t("Complete local test payment")
                      : `Pay ${total} & publish`}
              </Button>
              {order && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api(`/api/weddings/${id}/reconcile`, {});
                      await refresh();
                    } catch (e) {
                      setError(errorMessage(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t("Check payment status")}
                </Button>
              )}
              <Link href="/support" className="small-note underline">
                {t("Need help with your payment?")}
              </Link>
              {!local && (
                <p className="checkout-payment-note">
                  <LockKeyhole size={14} />
                  {t("Payments secured by Razorpay")}
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
