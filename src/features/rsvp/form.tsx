"use client";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { responseSchema, type GuestResponse } from "@/lib/domain";
import {
  localizedText,
  type InvitationContent,
  type Language,
} from "@/lib/content";
import { messages } from "@/content/messages";
import { api, copyText, errorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
export function RsvpForm({
  content,
  language,
  slug,
  disabled = false,
  editing,
}: {
  content: InvitationContent;
  language: Language;
  slug: string;
  disabled?: boolean;
  editing?: GuestResponse & { version: number };
}) {
  const t = messages[language];
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [link, setLink] = useState("");
  const capability = useRef("");
  const attempt = useRef({ key: "", payload: "" });
  const form = useForm<GuestResponse>({
    resolver: zodResolver(responseSchema),
    defaultValues: editing || {
      family: "",
      attending: true,
      counts: {},
      note: "",
      website: "",
    },
  });
  const values = useWatch({ control: form.control });
  const counts = values.counts || {};
  async function submit(data: GuestResponse) {
    setError("");
    if (disabled) return;
    try {
      if (!capability.current) {
        const bytes = crypto.getRandomValues(new Uint8Array(32));
        capability.current = Array.from(bytes, (b) =>
          b.toString(16).padStart(2, "0"),
        ).join("");
      }
      const payload = JSON.stringify(data);
      if (attempt.current.payload !== payload)
        attempt.current = { key: crypto.randomUUID(), payload };
      if (editing)
        await api("/api/rsvp/edit", {
          response: data,
          key: attempt.current.key,
          version: editing.version,
        });
      else {
        await api(`/api/public/${slug}/rsvp`, {
          response: data,
          key: attempt.current.key,
          token: capability.current,
        });
        const editLink = `${location.origin}/rsvp/edit#${capability.current}`;
        setLink(editLink);
        try {
          localStorage.setItem(`wedding-response:${slug}`, editLink);
        } catch {}
      }
      setSaved(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  if (saved)
    return (
      <section id="rsvp" className="rsvp-section" aria-live="polite">
        <Alert>
          <Check />
          <AlertTitle>{t.saved}</AlertTitle>
          <AlertDescription>{t.thanks}</AlertDescription>
        </Alert>
        {link && (
          <FieldGroup className="mt-6">
            <Field>
              <FieldLabel htmlFor="edit-link">{t.edit}</FieldLabel>
              <Input
                id="edit-link"
                value={link}
                readOnly
                onFocus={(e) => e.target.select()}
              />
              <FieldDescription>
                {language === "gu"
                  ? "આ ખાનગી લિંક ધરાવનાર તમારો પ્રતિસાદ બદલી શકે છે. તેને સુરક્ષિત જગ્યાએ રાખો."
                  : "Anyone with this private link can edit your response. Keep it somewhere safe."}
              </FieldDescription>
            </Field>
            <Button
              onClick={() =>
                copyText(link)
                  .then(() =>
                    toast.success(
                      language === "gu"
                        ? "ફેરફારની લિંક કૉપિ થઈ"
                        : "Edit link copied",
                    ),
                  )
                  .catch(() =>
                    toast.error(
                      language === "gu"
                        ? "ઉપરની લિંક પસંદ કરીને કૉપિ કરો."
                        : "Select and copy the link above.",
                    ),
                  )
              }
            >
              <Copy data-icon="inline-start" />
              {t.edit}
            </Button>
          </FieldGroup>
        )}
      </section>
    );
  return (
    <section id="rsvp" className="rsvp-section">
      <div className="rsvp-heading">
        <h2>{t.rsvp}</h2>
        <p>{t.private}</p>
      </div>
      {disabled ? (
        <Alert>
          <AlertTitle>{t.demo}</AlertTitle>
          <AlertDescription>
            {language === "gu"
              ? "તમારા પ્રકાશિત આમંત્રણ પર મહેમાનો અહીં જવાબ આપી શકશે."
              : "On your published invitation, guests can respond here without creating an account."}
          </AlertDescription>
        </Alert>
      ) : (
        <form
          onSubmit={(event) => void form.handleSubmit(submit)(event)}
          noValidate
        >
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.family}>
              <FieldLabel htmlFor="family">{t.family}</FieldLabel>
              <Input
                id="family"
                autoComplete="name"
                maxLength={100}
                aria-invalid={!!form.formState.errors.family}
                {...form.register("family")}
              />
              <FieldError>{form.formState.errors.family?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel>{t.rsvp}</FieldLabel>
              <ToggleGroup
                type="single"
                value={values.attending ? "yes" : "no"}
                onValueChange={(v) => {
                  if (!v) return;
                  form.setValue("attending", v === "yes");
                  if (v === "no") form.setValue("counts", {});
                }}
                variant="outline"
                className="flex-wrap"
              >
                <ToggleGroupItem value="yes">{t.attending}</ToggleGroupItem>
                <ToggleGroupItem value="no">{t.decline}</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            {values.attending && (
              <FieldSet>
                <FieldLegend>
                  {language === "gu"
                    ? "સમારંભો પસંદ કરો"
                    : "Which celebrations will you join?"}
                </FieldLegend>
                {content.events
                  .filter((e) => !e.archived)
                  .map((e) => (
                    <div className="rsvp-event" key={e.id}>
                      <Checkbox
                        id={`event-${e.id}`}
                        checked={!!counts[e.id]}
                        onCheckedChange={(checked) => {
                          const next = { ...form.getValues("counts") };
                          if (checked) next[e.id] = 1;
                          else delete next[e.id];
                          form.setValue("counts", next, {
                            shouldValidate: true,
                          });
                        }}
                      />
                      <label htmlFor={`event-${e.id}`}>
                        {localizedText(
                          e.title,
                          language,
                          content.defaultLanguage,
                        )}
                      </label>
                      {counts[e.id] && (
                        <Input
                          aria-label={`${t.people}: ${localizedText(e.title, language, content.defaultLanguage)}`}
                          type="number"
                          min={1}
                          max={20}
                          value={counts[e.id]}
                          onChange={(event) =>
                            form.setValue(
                              `counts.${e.id}`,
                              Number(event.target.value),
                              { shouldValidate: true },
                            )
                          }
                        />
                      )}
                    </div>
                  ))}
                <FieldError>
                  {form.formState.errors.counts
                    ? "Choose at least one event, with a headcount between 1 and 20."
                    : ""}
                </FieldError>
              </FieldSet>
            )}
            <Field data-invalid={!!form.formState.errors.note}>
              <FieldLabel htmlFor="note">{t.note}</FieldLabel>
              <Textarea
                id="note"
                maxLength={500}
                rows={3}
                {...form.register("note")}
              />
              <FieldDescription>
                {values.note?.length || 0}/500
              </FieldDescription>
              <FieldError>{form.formState.errors.note?.message}</FieldError>
            </Field>
            <div hidden aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                tabIndex={-1}
                autoComplete="off"
                {...form.register("website")}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Response not saved</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? language === "gu"
                  ? "સાચવી રહ્યા છીએ…"
                  : "Saving response…"
                : t.send}
            </Button>
          </FieldGroup>
        </form>
      )}
    </section>
  );
}
