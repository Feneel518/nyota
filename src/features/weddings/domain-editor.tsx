"use client";
import { useEffect, useState } from "react";
import { useUiLanguage } from "@/components/owner-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { api, errorMessage } from "@/lib/api";
import { invitationSlugError, invitationUrl } from "@/lib/invitation-url";

export function DomainEditor({
  id,
  value,
  savedSlug,
  suggested,
  published,
  baseUrl,
  domain,
  onChange,
  onSave,
}: {
  id: string;
  value: string;
  savedSlug: string;
  suggested: string;
  published: boolean;
  baseUrl: string;
  domain?: string;
  onChange: (value: string) => void;
  onSave: (value: string) => Promise<boolean>;
}) {
  const { t } = useUiLanguage();
  const [checked, setChecked] = useState<{
    slug: string;
    available: boolean;
    error?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [retry, setRetry] = useState(0);
  const changed = value !== savedSlug;
  const validation = changed ? invitationSlugError(value) : "";
  const result = checked?.slug === value ? checked : null;
  useEffect(() => {
    if (!changed || validation) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await api<{ available: boolean; error?: string }>(
          `/api/weddings/${id}/domain?slug=${encodeURIComponent(value)}`,
        );
        if (!cancelled) setChecked({ slug: value, ...result });
      } catch {
        if (!cancelled)
          setChecked({
            slug: value,
            available: false,
            error: "Could not check availability. Please try again.",
          });
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id, value, changed, validation, retry]);
  function change(next: string) {
    setChecked(null);
    setSaveError("");
    onChange(next);
  }
  const error = validation || result?.error || saveError;
  return (
    <Field>
      <FieldLabel htmlFor="slug">{t("Your invitation link")}</FieldLabel>
      <Input
        id="slug"
        value={value}
        maxLength={63}
        disabled={busy}
        aria-describedby="domain-preview domain-status domain-help"
        aria-invalid={!!error}
        onChange={(event) =>
          change(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
        }
      />
      <FieldDescription id="domain-preview" className="break-all">
        {invitationUrl(baseUrl, value, domain)}
      </FieldDescription>
      <p
        id="domain-status"
        role="status"
        className={error ? "text-sm text-destructive" : "text-sm"}
      >
        {t(
          error ||
            (!changed
              ? "Your domain is saved."
              : result?.available
                ? "This domain is available."
                : "Checking domain availability…"),
        )}
      </p>
      <FieldDescription id="domain-help">
        {t(
          published
            ? "Saving a new domain changes your live link immediately. The old link will stop working; update shared links and download a new QR code."
            : "You can change your domain before or after payment. Save your domain before continuing to checkout.",
        )}
      </FieldDescription>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={busy || !changed || !!validation || !result?.available}
          onClick={async () => {
            setBusy(true);
            setSaveError("");
            try {
              if (!(await onSave(value)))
                setSaveError(
                  "Your domain was not saved. Check the save message above and try again.",
                );
            } catch (error) {
              setSaveError(errorMessage(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          {t(busy ? "Saving…" : "Save domain")}
        </Button>
        {changed && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => change(savedSlug)}
          >
            {t("Keep current domain")}
          </Button>
        )}
        {suggested && suggested !== value && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => change(suggested)}
          >
            {t("Use our names")}: {suggested}
          </Button>
        )}
        {result?.error && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => {
              setChecked(null);
              setRetry((value) => value + 1);
            }}
          >
            {t("Check again")}
          </Button>
        )}
      </div>
    </Field>
  );
}
