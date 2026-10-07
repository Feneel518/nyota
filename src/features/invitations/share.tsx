"use client";
import "./share.css";
import { useId, useState } from "react";
import { Check, Copy, Download, MessageCircle, Share2 } from "lucide-react";
import { WeddingMotif } from "@/components/wedding-motif";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { copyText } from "@/lib/api";
import { useUiLanguage } from "@/components/ui-language-context";
import type { Language } from "@/lib/content";
const gu: Record<string, string> = {
  "Share invitation": "આમંત્રણ શેર કરો",
  "Share a little joy": "ખુશીઓ વહેંચો",
  "Anyone with this link can view the invitation. Your guest responses stay private.":
    "લિંક ધરાવનાર આમંત્રણ જોઈ શકશે. મહેમાનોના પ્રતિસાદ ખાનગી રહેશે.",
  "Invitation link": "આમંત્રણની લિંક",
  "Link copied": "લિંક કૉપિ થઈ",
  "Select and copy the link above.": "ઉપરની લિંક પસંદ કરીને કૉપિ કરો.",
  "Copy link": "લિંક કૉપિ કરો",
  "More options": "વધુ વિકલ્પો",
  "Ready for your favourite people": "તમારા પ્રિયજનો માટે તૈયાર",
  "Send it their way": "તમારા પ્રિયજનોને મોકલો",
  "A little invitation. A beautiful celebration.":
    "એક નાનકડું આમંત્રણ. એક સુંદર ઉજવણી.",
  "Scan to open the invitation": "આમંત્રણ ખોલવા સ્કેન કરો",
  "Invitation QR code": "આમંત્રણનો QR કોડ",
  "Download QR": "QR ડાઉનલોડ કરો",
  "Use Copy link or WhatsApp on this browser.":
    "આ બ્રાઉઝરમાં લિંક કૉપિ કરો અથવા WhatsApp વાપરો.",
  "Messaging apps may keep an earlier preview after you publish changes.":
    "ફેરફારો પ્રકાશિત કર્યા પછી પણ મેસેજિંગ એપમાં જૂનું પૂર્વાવલોકન દેખાઈ શકે છે.",
};
export function Share({
  url,
  title = "Our wedding invitation",
  label = "Share invitation",
  qr,
  language,
}: {
  url: string;
  title?: string;
  label?: string;
  qr?: string;
  language?: Language;
}) {
  const ui = useUiLanguage();
  const t = (text: string) =>
    (language || ui.language) === "gu" ? gu[text] || text : text;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputId = useId();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 data-icon="inline-start" />
          {t(label)}
        </Button>
      </DialogTrigger>
      <DialogContent className="share-dialog">
        <div className="share-keepsake">
          <WeddingMotif kind="wedding" />
          <span>{t("Ready for your favourite people")}</span>
          <p className="display">{title}</p>
          {qr ? (
            <figure>
              {/* This authenticated QR endpoint must bypass the public image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt={t("Invitation QR code")}
                width={152}
                height={152}
              />
              <figcaption>{t("Scan to open the invitation")}</figcaption>
            </figure>
          ) : (
            <p>{t("A little invitation. A beautiful celebration.")}</p>
          )}
        </div>
        <div className="share-controls">
          <DialogHeader>
            <span className="share-eyebrow">{t("Send it their way")}</span>
            <DialogTitle>{t("Share a little joy")}</DialogTitle>
            <DialogDescription>
              {t(
                "Anyone with this link can view the invitation. Your guest responses stay private.",
              )}
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor={inputId}>{t("Invitation link")}</FieldLabel>
            <Input
              id={inputId}
              value={url}
              readOnly
              onFocus={(e) => e.target.select()}
            />
          </Field>
          <div className="share-actions">
            <Button
              onClick={() =>
                copyText(url)
                  .then(() => {
                    setCopied(true);
                    toast.success(t("Link copied"));
                  })
                  .catch(() =>
                    toast.error(t("Select and copy the link above.")),
                  )
              }
            >
              {copied ? (
                <Check data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              {t(copied ? "Link copied" : "Copy link")}
            </Button>
            <Button variant="outline" asChild>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle data-icon="inline-start" />
                WhatsApp
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({ title, url });
                  } catch {}
                } else {
                  toast.info(t("Use Copy link or WhatsApp on this browser."));
                }
              }}
            >
              <Share2 data-icon="inline-start" />
              {t("More options")}
            </Button>
            {qr && (
              <Button variant="outline" asChild>
                <a href={qr} download>
                  <Download data-icon="inline-start" />
                  {t("Download QR")}
                </a>
              </Button>
            )}
          </div>
          <p className="small-note">
            {t(
              "Messaging apps may keep an earlier preview after you publish changes.",
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
