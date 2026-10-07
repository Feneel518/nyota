"use client";
import { useState } from "react";
import { Languages } from "lucide-react";
import { useUiLanguage } from "@/components/owner-language";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { api, errorMessage } from "@/lib/api";
import {
  missingGujarati,
  type TranslationCandidate,
  type TranslationResult,
} from "@/lib/gujarati-translation";
import type { InvitationContent } from "@/lib/content";

export function GujaratiAssistant({
  id,
  content,
  scope,
  onApply,
}: {
  id: string;
  content: InvitationContent;
  scope: "couple" | "events";
  onApply: (
    items: TranslationCandidate[],
    translations: TranslationResult[],
  ) => void;
}) {
  const { t } = useUiLanguage();
  const fieldLabel = (label: string) => {
    const event = label.match(/^Function (\d+): (.+)$/);
    return event ? `${t("Function")} ${event[1]}: ${t(event[2])}` : t(label);
  };
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TranslationCandidate[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<TranslationResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const chosen = items.filter((item) => selected.includes(item.id));
  const characters = chosen.reduce((sum, item) => sum + item.text.length, 0);
  const valid = chosen.filter((item) => {
    const result = results?.find((value) => value.id === item.id);
    return !!result?.text?.trim() && result.text.length <= item.maxLength;
  });
  async function translate() {
    setBusy(true);
    setError("");
    try {
      const response = await api<{ translations: TranslationResult[] }>(
        `/api/weddings/${id}/translate`,
        { items: chosen.map(({ id, text }) => ({ id, text })) },
      );
      setResults(response.translations);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const candidates = missingGujarati(content, scope);
          setItems(candidates);
          setSelected(candidates.map((item) => item.id));
          setResults(null);
          setError("");
          setOpen(true);
        }}
      >
        <Languages />
        {t("Translate missing Gujarati")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent
          className="sm:max-w-2xl max-h-[85dvh] overflow-y-auto"
          onInteractOutside={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {t(
                results
                  ? "Review your Gujarati translations"
                  : "Translate English into Gujarati",
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Only empty Gujarati fields are filled. Review names, addresses, and wording before applying.",
              )}
            </DialogDescription>
          </DialogHeader>
          {!items.length ? (
            <p>
              {t(
                "There are no empty Gujarati fields with English text to translate.",
              )}
            </p>
          ) : (
            <>
              {!results && (
                <p className="small-note">
                  {t(
                    "Selected English text is sent to MyMemory for translation. Its free daily limit applies. Ready templates work without the service.",
                  )}
                </p>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="translation-fields">
                {(results ? chosen : items).map((item) => {
                  const result = results?.find((value) => value.id === item.id);
                  return (
                    <Field key={item.id}>
                      <div className="flex items-center gap-2">
                        {!results && (
                          <Checkbox
                            id={`translate-${item.id}`}
                            checked={selected.includes(item.id)}
                            disabled={busy}
                            onCheckedChange={(value) =>
                              setSelected((current) =>
                                value
                                  ? [...current, item.id]
                                  : current.filter((id) => id !== item.id),
                              )
                            }
                          />
                        )}
                        <FieldLabel
                          htmlFor={
                            results
                              ? `translated-${item.id}`
                              : `translate-${item.id}`
                          }
                        >
                          {fieldLabel(item.label)}
                        </FieldLabel>
                      </div>
                      <p lang="en" className="small-note whitespace-pre-wrap">
                        {item.text}
                      </p>
                      {results &&
                        (result?.text !== undefined ? (
                          <>
                            <Textarea
                              id={`translated-${item.id}`}
                              lang="gu"
                              value={result.text}
                              rows={2}
                              onChange={(event) =>
                                setResults(
                                  (current) =>
                                    current?.map((value) =>
                                      value.id === item.id
                                        ? { ...value, text: event.target.value }
                                        : value,
                                    ) || null,
                                )
                              }
                            />
                            <FieldDescription
                              className={
                                result.text.length > item.maxLength
                                  ? "text-destructive"
                                  : ""
                              }
                            >
                              {result.text.length}/{item.maxLength}
                              {result.text.length > item.maxLength &&
                                ` · ${t("Shorten this translation before applying.")}`}
                            </FieldDescription>
                          </>
                        ) : (
                          <p
                            role="status"
                            className="small-note text-destructive"
                          >
                            {t(
                              result?.error ||
                                "Translation failed. Please try again.",
                            )}
                          </p>
                        ))}
                    </Field>
                  );
                })}
              </div>
              {!results ? (
                <>
                  <p className="small-note" role="status">
                    {characters.toLocaleString()}/4,000{" "}
                    {t("English characters selected")}
                  </p>
                  {characters > 4000 && (
                    <p className="small-note text-destructive">
                      {t("Select fewer fields to continue.")}
                    </p>
                  )}
                  <Button
                    disabled={busy || !chosen.length || characters > 4000}
                    onClick={translate}
                  >
                    {t(busy ? "Translating…" : "Translate selected fields")}
                  </Button>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={!valid.length}
                    onClick={() => {
                      onApply(chosen, results);
                      setOpen(false);
                    }}
                  >
                    {t("Apply reviewed translations")} ({valid.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResults(null);
                      setError("");
                    }}
                  >
                    {t("Choose fields again")}
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
