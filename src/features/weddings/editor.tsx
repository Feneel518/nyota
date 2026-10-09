"use client";
import { useUiLanguage } from "@/components/owner-language";
/* eslint-disable @next/next/no-img-element -- Owner-authorized private previews use the lifecycle-aware media route. */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Eye,
  Plus,
  Trash2,
  Upload,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  publicationSchema,
  newEvent,
  ceremonyKinds,
  ceremonyNames,
  themes,
  themeNames,
  type InvitationContent,
  type Language,
  type WeddingEvent,
} from "@/lib/content";
import { api, errorMessage } from "@/lib/api";
import { characterOptions, outfitOptions } from "@/lib/appearance";
import { useAutosave } from "./use-autosave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Courtyard, Character } from "@/components/illustration";
import { Badge } from "@/components/ui/badge";
import {
  familyTemplates,
  invitationTemplates,
  functionSuggestions,
} from "@/content/invitation-templates";
import { WordingTemplates } from "./wording-templates";
import { GujaratiAssistant } from "./gujarati-assistant";
import { applyGujarati } from "@/lib/gujarati-translation";
import { suggestedCoupleSlug } from "@/lib/invitation-url";
import { DomainEditor } from "./domain-editor";
import { musicTracks, musicLabels } from "@/lib/music";
import { MusicPreview } from "./music-preview";
import { BrandMark } from "@/components/site";
import { Guest } from "@/features/invitations/guest";
const stepNames = ["Couple", "Functions", "Appearance", "Review"];
export function Editor({
  id,
  initial,
  initialVersion,
  initialSlug,
  published,
  invitationBaseUrl,
  invitationDomain,
}: {
  id: string;
  initial: InvitationContent;
  initialVersion: number;
  initialSlug: string;
  published: boolean;
  invitationBaseUrl: string;
  invitationDomain?: string;
}) {
  const { t } = useUiLanguage();

  const state = useAutosave(id, initial, initialSlug, initialVersion);
  const [domainDraft, setDomainDraft] = useState(initialSlug);
  const c = state.content;
  const [step, setStep] = useState(0),
    [language, setLanguage] = useState<Language>(c.defaultLanguage),
    [preview, setPreview] = useState(false),
    [uploading, setUploading] = useState(false),
    [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<{
    content: InvitationContent;
    wedding: { version: number; slug: string };
  } | null>(null);
  const router = useRouter();
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(c);
  const navigating = useRef(false);
  const [changingStep, setChangingStep] = useState(false);
  useEffect(() => {
    latest.current = c;
    frame.current?.contentWindow?.postMessage(
      { type: "invitation-preview", content: c },
      location.origin,
    );
  }, [c, preview]);
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.data?.type !== "preview-ready")
        return;
      if (e.source === frame.current?.contentWindow)
        (e.source as Window).postMessage(
          { type: "invitation-preview", content: latest.current },
          location.origin,
        );
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  function update<K extends keyof InvitationContent>(
    key: K,
    value: InvitationContent[K],
  ) {
    state.update({ ...c, [key]: value });
  }
  function localized(key: "families" | "welcome" | "wording", value: string) {
    update(key, { ...c[key], [language]: value });
  }
  function eventChange(eventId: string, partial: Partial<WeddingEvent>) {
    update(
      "events",
      c.events.map((e) => (e.id === eventId ? { ...e, ...partial } : e)),
    );
  }
  async function go(next: number) {
    if (navigating.current) return;
    navigating.current = true;
    setChangingStep(true);
    try {
      await state.flush();
      // Steps share the same in-memory draft. A failed save must not trap the
      // owner on one step; leaving the editor still requires a successful save.
      setStep(next);
    } finally {
      navigating.current = false;
      setChangingStep(false);
    }
  }
  async function upload(file: File) {
    if (!(await state.flush())) return;
    setUploading(true);
    try {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 10 * 1024 * 1024
      )
        throw new Error("Choose a JPEG, PNG, or WebP photo under 10 MB.");
      const intent = await api<{ id: string; url: string }>(
        `/api/weddings/${id}/upload-intent`,
        { type: file.type, bytes: file.size },
      );
      const result = await fetch(intent.url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok)
        throw new Error(
          "Photo upload failed. Your draft is safe; please retry.",
        );
      await api(`/api/weddings/${id}/upload-finalize`, { assetId: intent.id });
      let ready = false;
      for (let i = 0; i < 40; i++) {
        const rows = await api<
          { id: string; status: string; error: string | null }[]
        >(`/api/weddings/${id}/assets`);
        const a = rows.find((a) => a.id === intent.id);
        if (a?.status === "rejected")
          throw new Error(a.error || "This photo was rejected.");
        if (a?.status === "ready") {
          ready = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!ready)
        throw new Error(
          "Your photo is still processing. Reopen Appearance in a moment to recover it.",
        );
      state.update({
        ...latest.current,
        photos: [...latest.current.photos, intent.id],
      });
      toast.success("Photo added");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading(false);
    }
  }
  const publication = publicationSchema.safeParse(c);
  const issues = publication.success ? [] : publication.error.issues;
  const field = (
    key: "families" | "welcome" | "wording",
    label: string,
    max: number,
    multiline = false,
  ) => (
    <Field key={key}>
      <FieldLabel htmlFor={key}>{label}</FieldLabel>
      {multiline ? (
        <Textarea
          id={key}
          value={c[key][language]}
          maxLength={max}
          rows={4}
          onChange={(e) => localized(key, e.target.value)}
        />
      ) : (
        <Input
          id={key}
          value={c[key][language]}
          maxLength={max}
          onChange={(e) => localized(key, e.target.value)}
        />
      )}
      <FieldDescription>
        {c[key][language].length}/{max}
        {language !== c.defaultLanguage && !c[key][language]
          ? " · Uses your default-language wording until translated."
          : ""}
      </FieldDescription>
      {(key === "families" || key === "wording") && (
        <WordingTemplates
          kind={key}
          templates={key === "families" ? familyTemplates : invitationTemplates}
          language={language}
          onApply={(text, both) => {
            update(
              key,
              both ? text : { ...c[key], [language]: text[language] },
            );
            toast.success(t("Template applied. You can edit the wording."));
          }}
        />
      )}
    </Field>
  );
  return (
    <>
      <header className="editor-header">
        <div className="editor-title">
          <span className="editor-brand" aria-label="Nyota">
            <BrandMark />
            <span>nyota.</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("Back to invitations")}
            onClick={async () => {
              if (await state.flush()) router.push("/dashboard");
            }}
          >
            <ArrowLeft />
          </Button>
          <span className="truncate max-w-52">
            {c.names
              .map((n) => n[c.defaultLanguage] || t("Your name"))
              .join(" & ")}
          </span>
          <span className="save-status" role="status">
            {t(state.status)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreview(true)}>
            <Eye data-icon="inline-start" />
            {t("Preview")}
          </Button>
          <Button onClick={() => go(3)}>{t("Review")}</Button>
        </div>
      </header>
      <main id="main" className="editor-grid">
        <nav className="editor-nav" aria-label={t("Invitation setup")}>
          {stepNames.map((name, i) => (
            <Button
              key={name}
              variant={step === i ? "secondary" : "ghost"}
              aria-current={step === i ? "step" : undefined}
              onClick={() => go(i)}
            >
              {i + 1}. {t(name)}
            </Button>
          ))}
        </nav>
        <section className="editor-form">
          {state.error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>{t("Your latest changes are not saved")}</AlertTitle>
              <AlertDescription>
                {state.error}
                <div className="flex gap-2 mt-3">
                  {state.status === "Conflict" ? (
                    <Button
                      variant="outline"
                      onClick={() =>
                        api<{
                          content: InvitationContent;
                          wedding: { version: number; slug: string };
                        }>(`/api/weddings/${id}/draft`)
                          .then(setConflict)
                          .catch((e) => toast.error(errorMessage(e)))
                      }
                    >
                      {t("Review saved version")}
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => state.flush()}>
                      {t("Retry saving")}
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
          <h1>
            {
              [
                t("The two of you."),
                t("Every celebration."),
                t("Make it feel like you."),
                t("One last look."),
              ][step]
            }
          </h1>
          <p className="intro">
            {
              [
                t("The names, the people, and the words that make this yours."),
                t(
                  "From an intimate gathering to the big day. Add up to ten events.",
                ),
                t("Choose an illustrated world and add your personal touches."),
                t(
                  "Your changes are private until you publish. Check the details before sharing.",
                ),
              ][step]
            }
          </p>
          {(step === 0 || step === 1) && (
            <div className="mb-7">
              <FieldLabel>{t("Content language")}</FieldLabel>
              <ToggleGroup
                className="mt-2"
                type="single"
                variant="outline"
                value={language}
                onValueChange={(v) => {
                  if (v) setLanguage(v as Language);
                }}
              >
                <ToggleGroupItem value="en">{t("English")}</ToggleGroupItem>
                <ToggleGroupItem value="gu">ગુજરાતી</ToggleGroupItem>
              </ToggleGroup>
              <div className="mt-3">
                <GujaratiAssistant
                  key={step}
                  id={id}
                  content={c}
                  scope={step === 0 ? "couple" : "events"}
                  onApply={(items, translations) => {
                    state.update(
                      applyGujarati(latest.current, items, translations),
                    );
                    setLanguage("gu");
                    toast.success(
                      t(
                        "Gujarati translations applied. You can edit them below.",
                      ),
                    );
                  }}
                />
              </div>
            </div>
          )}
          {step === 0 && (
            <FieldGroup>
              <div className="two-fields">
                {c.names.map((n, i) => (
                  <Field key={i}>
                    <FieldLabel htmlFor={`partner-${i}`}>
                      {t("Partner")} {i + 1}
                      {t("’s name")}
                    </FieldLabel>
                    <Input
                      id={`partner-${i}`}
                      value={n[language]}
                      maxLength={80}
                      onChange={(e) => {
                        const names = [
                          ...c.names,
                        ] as InvitationContent["names"];
                        names[i] = { ...n, [language]: e.target.value };
                        update("names", names);
                      }}
                    />
                    <FieldDescription>{n[language].length}/80</FieldDescription>
                  </Field>
                ))}
              </div>
              <FieldSet>
                <FieldLegend>
                  {t("Mothers’ names")}{" "}
                  <span className="small-note">{t("Optional")}</span>
                </FieldLegend>
                <p className="small-note">
                  {t(
                    "Add each partner’s mother’s name. These appear with the family’s blessings on your invitation.",
                  )}
                </p>
                <div className="two-fields">
                  {[0, 1].map((i) => {
                    const name = c.motherNames?.[i] || { en: "", gu: "" };
                    return (
                      <Field key={i}>
                        <FieldLabel htmlFor={`mother-${i}`}>
                          {t(`Partner ${i + 1}’s mother’s name`)}
                        </FieldLabel>
                        <Input
                          id={`mother-${i}`}
                          lang={language}
                          value={name[language]}
                          maxLength={80}
                          onChange={(event) => {
                            const mothers: NonNullable<
                              InvitationContent["motherNames"]
                            > = c.motherNames
                              ? [...c.motherNames]
                              : [
                                  { en: "", gu: "" },
                                  { en: "", gu: "" },
                                ];
                            mothers[i] = {
                              ...name,
                              [language]: event.target.value,
                            };
                            update("motherNames", mothers);
                          }}
                        />
                        <FieldDescription>
                          {name[language].length}/80
                        </FieldDescription>
                      </Field>
                    );
                  })}
                </div>
              </FieldSet>
              {field("families", t("Family line"), 200)}
              {field("welcome", t("Your welcome message"), 1000, true)}
              {field("wording", t("Invitation wording"), 1000, true)}
              <Field>
                <FieldLabel>{t("Guest languages")}</FieldLabel>
                <ToggleGroup
                  type="multiple"
                  variant="outline"
                  value={c.languages}
                  onValueChange={(v) => {
                    if (v.length) {
                      const languages = v as Language[];
                      state.update({
                        ...c,
                        languages,
                        defaultLanguage: languages.includes(c.defaultLanguage)
                          ? c.defaultLanguage
                          : languages[0],
                      });
                    }
                  }}
                >
                  <ToggleGroupItem value="en">{t("English")}</ToggleGroupItem>
                  <ToggleGroupItem value="gu">ગુજરાતી</ToggleGroupItem>
                </ToggleGroup>
                <FieldDescription>
                  {t(
                    "Translate from English, use bilingual templates, or write your own Gujarati. Missing translations use the default language.",
                  )}
                </FieldDescription>
                {!c.languages.includes("gu") &&
                  (c.families.gu.trim() ||
                    c.wording.gu.trim() ||
                    c.welcome.gu.trim()) && (
                    <Button
                      className="self-start"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        update("languages", [...c.languages, "gu"])
                      }
                    >
                      {t("Offer Gujarati to guests")}
                    </Button>
                  )}
              </Field>
              <Field>
                <FieldLabel>{t("Default language")}</FieldLabel>
                <Select
                  value={c.defaultLanguage}
                  onValueChange={(v) =>
                    update("defaultLanguage", v as Language)
                  }
                >
                  <SelectTrigger aria-label={t("Default language")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {c.languages.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l === "en" ? t("English") : "ગુજરાતી"}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <FieldSet>
                <FieldLegend>
                  {t("Host contacts")}
                  <span className="small-note">{t("Optional")}</span>
                </FieldLegend>
                {c.hosts.map((host, i) => (
                  <FieldGroup key={i}>
                    <Field>
                      <FieldLabel htmlFor={`host-name-${i}`}>
                        {t("Host name")}
                      </FieldLabel>
                      <Input
                        id={`host-name-${i}`}
                        value={host.name}
                        maxLength={80}
                        onChange={(e) =>
                          update(
                            "hosts",
                            c.hosts.map((h, j) =>
                              i === j ? { ...h, name: e.target.value } : h,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`host-phone-${i}`}>
                        {t("Phone")}
                      </FieldLabel>
                      <Input
                        id={`host-phone-${i}`}
                        type="tel"
                        value={host.phone}
                        maxLength={25}
                        onChange={(e) =>
                          update(
                            "hosts",
                            c.hosts.map((h, j) =>
                              i === j ? { ...h, phone: e.target.value } : h,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field orientation="horizontal">
                      <Checkbox
                        id={`host-public-${i}`}
                        checked={host.public}
                        onCheckedChange={(v) =>
                          update(
                            "hosts",
                            c.hosts.map((h, j) =>
                              i === j ? { ...h, public: !!v } : h,
                            ),
                          )
                        }
                      />
                      <FieldLabel htmlFor={`host-public-${i}`}>
                        {t(
                          "Show this contact publicly to anyone with the link",
                        )}
                      </FieldLabel>
                    </Field>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        update(
                          "hosts",
                          c.hosts.filter((_, j) => j !== i),
                        )
                      }
                    >
                      {t("Remove contact")}
                    </Button>
                  </FieldGroup>
                ))}
                {c.hosts.length < 2 && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      update("hosts", [
                        ...c.hosts,
                        { name: "", phone: "", public: false },
                      ])
                    }
                  >
                    <Plus data-icon="inline-start" />
                    {t("Add host contact")}
                  </Button>
                )}
              </FieldSet>
            </FieldGroup>
          )}
          {step === 1 && (
            <FieldGroup>
              <div className="function-suggestions">
                <strong>{t("Suggested functions")}</strong>
                <p className="small-note">
                  {t(
                    "Choose a function to add its name in both languages. Add your dates and venue next.",
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {functionSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion.title.en}
                      variant="outline"
                      size="sm"
                      disabled={
                        c.events.filter((event) => !event.archived).length >=
                          10 || c.events.length >= 30
                      }
                      onClick={() =>
                        update("events", [
                          ...c.events,
                          {
                            ...newEvent(),
                            title: { ...suggestion.title },
                            animation: suggestion.animation,
                          },
                        ])
                      }
                    >
                      <Plus />
                      {suggestion.title[language]}
                    </Button>
                  ))}
                </div>
              </div>
              {c.events.map((event, index) => (
                <div className="event-editor" key={event.id}>
                  <div className="event-editor-head">
                    <strong>
                      {event.title[language] || `Event ${index + 1}`}
                    </strong>
                    <div className="flex gap-1">
                      {event.archived && (
                        <Badge variant="secondary">{t("Archived")}</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("Move event up")}
                        disabled={index === 0}
                        onClick={() => {
                          const events = [...c.events];
                          [events[index - 1], events[index]] = [
                            events[index],
                            events[index - 1],
                          ];
                          update("events", events);
                        }}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("Move event down")}
                        disabled={index === c.events.length - 1}
                        onClick={() => {
                          const events = [...c.events];
                          [events[index + 1], events[index]] = [
                            events[index],
                            events[index + 1],
                          ];
                          update("events", events);
                        }}
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                  </div>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor={`title-${event.id}`}>
                        {t("Event title")}
                      </FieldLabel>
                      <Input
                        id={`title-${event.id}`}
                        maxLength={100}
                        value={event.title[language]}
                        onChange={(e) =>
                          eventChange(event.id, {
                            title: {
                              ...event.title,
                              [language]: e.target.value,
                            },
                          })
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`animation-${event.id}`}>
                        {language === "gu"
                          ? "સમારંભનું એનિમેશન"
                          : "Ceremony animation"}
                      </FieldLabel>
                      <Select
                        value={event.animation ?? "auto"}
                        onValueChange={(value) =>
                          eventChange(event.id, {
                            animation: value as WeddingEvent["animation"],
                          })
                        }
                      >
                        <SelectTrigger id={`animation-${event.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="auto">
                              {language === "gu"
                                ? "નામ પરથી આપમેળે"
                                : "Automatic from event name"}
                            </SelectItem>
                            {ceremonyKinds.map((kind) => (
                              <SelectItem value={kind} key={kind}>
                                {ceremonyNames[kind][language]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        {language === "gu"
                          ? "તમારા સમારંભને અનુરૂપ દૃશ્ય પસંદ કરો."
                          : "Choose the scene guests will see for this function."}
                      </FieldDescription>
                    </Field>
                    <div className="two-fields">
                      <Field>
                        <FieldLabel htmlFor={`start-${event.id}`}>
                          {t("Starts · Asia/Kolkata")}
                        </FieldLabel>
                        <Input
                          id={`start-${event.id}`}
                          type="datetime-local"
                          value={event.start}
                          onChange={(e) =>
                            eventChange(event.id, { start: e.target.value })
                          }
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`end-${event.id}`}>
                          {t("Ends · optional")}
                        </FieldLabel>
                        <Input
                          id={`end-${event.id}`}
                          type="datetime-local"
                          value={event.end}
                          onChange={(e) =>
                            eventChange(event.id, { end: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                    {event.start &&
                      new Date(`${event.start}+05:30`) < new Date() && (
                        <p className="small-note">
                          {t(
                            "This event is in the past. You can still correct its details.",
                          )}
                        </p>
                      )}
                    {c.events
                      .slice(0, index)
                      .some(
                        (source) =>
                          !source.archived &&
                          (source.venue.en.trim() ||
                            source.venue.gu.trim() ||
                            source.address.en.trim() ||
                            source.address.gu.trim()),
                      ) && (
                      <Field>
                        <FieldLabel htmlFor={`reuse-venue-${event.id}`}>
                          {t("Use venue from an earlier function")}
                        </FieldLabel>
                        <Select
                          value=""
                          onValueChange={(value) => {
                            const source = c.events
                              .slice(0, index)
                              .find(
                                (source) =>
                                  source.id === value && !source.archived,
                              );
                            if (!source) return;
                            eventChange(event.id, {
                              venue: { ...source.venue },
                              address: { ...source.address },
                              directions: source.directions,
                            });
                            toast.success(
                              t(
                                "Venue, address, and directions copied in both languages.",
                              ),
                            );
                          }}
                        >
                          <SelectTrigger
                            id={`reuse-venue-${event.id}`}
                            className="w-full"
                          >
                            <SelectValue
                              placeholder={t("Choose an earlier function")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {c.events
                                .slice(0, index)
                                .filter(
                                  (source) =>
                                    !source.archived &&
                                    (source.venue.en.trim() ||
                                      source.venue.gu.trim() ||
                                      source.address.en.trim() ||
                                      source.address.gu.trim()),
                                )
                                .map((source, sourceIndex) => (
                                  <SelectItem key={source.id} value={source.id}>
                                    {source.title[language] ||
                                      source.title[c.defaultLanguage] ||
                                      `Function ${sourceIndex + 1}`}{" "}
                                    —{" "}
                                    {source.venue[language] ||
                                      source.venue[c.defaultLanguage] ||
                                      t("Address")}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          {t(
                            "Copies venue, address, and directions in both languages. You can edit this function’s location afterwards.",
                          )}
                        </FieldDescription>
                      </Field>
                    )}
                    {(["venue", "address", "notes"] as const).map((key) => (
                      <Field key={key}>
                        <FieldLabel htmlFor={`${key}-${event.id}`}>
                          {key === "venue"
                            ? t("Venue name")
                            : key === "address"
                              ? t("Address")
                              : t("Event notes · optional")}
                        </FieldLabel>
                        <Input
                          id={`${key}-${event.id}`}
                          maxLength={
                            key === "venue"
                              ? 150
                              : key === "address"
                                ? 500
                                : 1000
                          }
                          value={event[key][language]}
                          onChange={(e) =>
                            eventChange(event.id, {
                              [key]: {
                                ...event[key],
                                [language]: e.target.value,
                              },
                            })
                          }
                        />
                      </Field>
                    ))}
                    <Field>
                      <FieldLabel htmlFor={`directions-${event.id}`}>
                        {t("Directions link · optional")}
                      </FieldLabel>
                      <Input
                        id={`directions-${event.id}`}
                        type="url"
                        placeholder="https://maps.google.com/…"
                        value={event.directions}
                        onChange={(e) =>
                          eventChange(event.id, { directions: e.target.value })
                        }
                      />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={
                          c.mainEventId === event.id ? "secondary" : "outline"
                        }
                        disabled={event.archived}
                        onClick={() => update("mainEventId", event.id)}
                      >
                        {c.mainEventId === event.id ? (
                          <>
                            <Check data-icon="inline-start" />
                            {t("Main wedding event")}
                          </>
                        ) : (
                          t("Make main event")
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() =>
                          eventChange(event.id, { archived: !event.archived })
                        }
                      >
                        {event.archived
                          ? t("Restore event")
                          : t("Archive event")}
                      </Button>
                    </div>
                  </FieldGroup>
                </div>
              ))}
              <Button
                variant="outline"
                disabled={
                  c.events.filter((e) => !e.archived).length >= 10 ||
                  c.events.length >= 30
                }
                onClick={() =>
                  update("events", [...c.events, newEvent("New celebration")])
                }
              >
                <Plus data-icon="inline-start" />
                {t("Add celebration")}
              </Button>
              <p className="small-note">
                {t(
                  "Archiving hides an event from future invitations. Historical responses stay available.",
                )}
              </p>
            </FieldGroup>
          )}
          {step === 2 && (
            <FieldGroup>
              <Field>
                <FieldLabel>{t("Your invitation theme")}</FieldLabel>
                <ToggleGroup
                  type="single"
                  value={c.theme}
                  onValueChange={(v) => {
                    if (v) update("theme", v as InvitationContent["theme"]);
                  }}
                  variant="outline"
                  className="theme-choice"
                  aria-label={t("Your invitation theme")}
                >
                  {themes.map((theme) => (
                    <ToggleGroupItem
                      key={theme}
                      value={theme}
                      aria-label={t(themeNames[theme])}
                    >
                      <Courtyard theme={theme} />
                      <span>{t(themeNames[theme])}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
              {[0, 1].map((i) => (
                <FieldSet key={i}>
                  <FieldLegend>
                    {c.names[i][c.defaultLanguage] || `Partner ${i + 1}`}
                    {t("’s character")}
                  </FieldLegend>
                  <FieldLabel>{t("Gender")}</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    aria-label={`${c.names[i][c.defaultLanguage] || `Partner ${i + 1}`} — ${t("Gender")}`}
                    value={(c.genders ?? ["female", "male"])[i]}
                    onValueChange={(value) => {
                      if (value !== "male" && value !== "female") return;
                      const genders: ["male" | "female", "male" | "female"] = [
                        ...(c.genders ?? ["female", "male"]),
                      ];
                      genders[i] = value;
                      update("genders", genders);
                    }}
                  >
                    <ToggleGroupItem value="male">{t("Male")}</ToggleGroupItem>
                    <ToggleGroupItem value="female">
                      {t("Female")}
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <FieldDescription>
                    {t(
                      "The male partner arrives on horseback and the female partner waits. If both match, the second partner arrives.",
                    )}
                  </FieldDescription>
                  <ToggleGroup
                    type="single"
                    className="appearance-options"
                    aria-label={t("Character appearance")}
                    value={String(c.characters[i])}
                    variant="outline"
                    onValueChange={(v) => {
                      if (v) {
                        const values = [...c.characters] as [number, number];
                        values[i] = Number(v);
                        update("characters", values);
                      }
                    }}
                  >
                    {characterOptions.map((look, n) => (
                      <ToggleGroupItem
                        className="character-choice"
                        key={n}
                        value={String(n)}
                        aria-label={t(look.name)}
                      >
                        <svg viewBox="-35 -30 70 140" aria-hidden="true">
                          <Character appearance={n} outfit={c.outfits[i]} />
                        </svg>
                        <span>{t(look.name)}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <FieldLabel>{t("Clothes")}</FieldLabel>
                  <ToggleGroup
                    type="single"
                    className="appearance-options"
                    aria-label={t("Clothes")}
                    value={String(c.outfits[i])}
                    variant="outline"
                    onValueChange={(v) => {
                      if (v) {
                        const values = [...c.outfits] as [number, number];
                        values[i] = Number(v);
                        update("outfits", values);
                      }
                    }}
                  >
                    {outfitOptions.map((outfit, n) => (
                      <ToggleGroupItem
                        className="character-choice"
                        key={n}
                        value={String(n)}
                        aria-label={t(outfit.name)}
                      >
                        <svg viewBox="-35 -30 70 140" aria-hidden="true">
                          <Character appearance={c.characters[i]} outfit={n} />
                        </svg>
                        <span>{t(outfit.name)}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FieldSet>
              ))}
              <Field>
                <FieldLabel>{t("Music")}</FieldLabel>
                <Select
                  value={c.music}
                  onValueChange={(v) =>
                    update("music", v as InvitationContent["music"])
                  }
                >
                  <SelectTrigger aria-label={t("Music")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">{t("No music")}</SelectItem>
                      {musicTracks.map((track) => (
                        <SelectItem key={track} value={track}>
                          {t(musicLabels[track].name)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {t(
                    "Six original instrumental tracks. Guests choose when to turn sound on.",
                  )}
                </FieldDescription>
                <MusicPreview key={c.music} track={c.music} />
              </Field>
              <Field>
                <FieldLabel htmlFor="photos">
                  {t("Your photos ·")}
                  {c.photos.length}/5
                </FieldLabel>
                <Input
                  id="photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading || c.photos.length >= 5}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(file);
                    e.target.value = "";
                  }}
                />
                <FieldDescription>
                  {uploading
                    ? t("Uploading and preparing your photo…")
                    : t(
                        "Up to five photos. JPEG, PNG, or WebP, under 10 MB each.",
                      )}
                </FieldDescription>
                <div className="photo-strip">
                  {c.photos.map((photo, i) => (
                    <div key={photo}>
                      <img
                        src={`/api/media/${photo}`}
                        width={160}
                        height={180}
                        alt={`Your photo ${i + 1}`}
                      />
                      <Button
                        variant="ghost"
                        onClick={() => {
                          update(
                            "photos",
                            c.photos.filter((p) => p !== photo),
                          );
                        }}
                      >
                        <Trash2 data-icon="inline-start" />
                        {t("Remove")}
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    try {
                      const rows = await api<{ id: string; status: string }[]>(
                        `/api/weddings/${id}/assets`,
                      );
                      const available = rows.filter(
                        (a) => a.status === "ready" && !c.photos.includes(a.id),
                      );
                      if (!available.length) {
                        toast.info("No completed photos to recover.");
                        return;
                      }
                      update(
                        "photos",
                        [...c.photos, ...available.map((a) => a.id)].slice(
                          0,
                          5,
                        ),
                      );
                    } catch (e) {
                      toast.error(errorMessage(e));
                    }
                  }}
                >
                  <Upload data-icon="inline-start" />
                  {t("Recover completed uploads")}
                </Button>
              </Field>
            </FieldGroup>
          )}
          {step === 3 && (
            <FieldGroup>
              <DomainEditor
                id={id}
                value={domainDraft}
                savedSlug={state.savedSlug}
                suggested={suggestedCoupleSlug(c.names)}
                published={published}
                baseUrl={invitationBaseUrl}
                domain={invitationDomain}
                onChange={setDomainDraft}
                onSave={async (slug) => {
                  if (!(await state.flush())) return false;
                  state.updateSlug(slug);
                  return state.flush();
                }}
              />
              {issues.length ? (
                <Alert variant="destructive">
                  <AlertTitle>{t("A few details still need you")}</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4">
                      {issues.map((issue, i) => (
                        <li key={i}>
                          {issue.path.join(" → ")}: {issue.message}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Check />
                  <AlertTitle>{t("Ready for your final preview")}</AlertTitle>
                  <AlertDescription>
                    {c.events.filter((e) => !e.archived).length}{" "}
                    {t("celebrations ·")} {themeNames[c.theme]} ·{" "}
                    {c.languages.length === 2
                      ? t("English & Gujarati")
                      : c.defaultLanguage === "en"
                        ? t("English")
                        : t("Gujarati")}
                  </AlertDescription>
                </Alert>
              )}
              {!c.photos.length && (
                <p className="small-note">
                  {t(
                    "No photos added. Your invitation will use the original illustrated couple.",
                  )}
                </p>
              )}
              {c.languages.length === 2 && (
                <p className="small-note">
                  {t(
                    "Untranslated names or event details use your default language. Review both languages in the preview.",
                  )}
                </p>
              )}
              <Alert>
                <AlertTitle>
                  {t("Your invitation will be public by link")}
                </AlertTitle>
                <AlertDescription>
                  {t(
                    "Anyone with the link can see published names, photos, venues, and contacts you marked public. Guest responses stay private.",
                  )}
                </AlertDescription>
              </Alert>
              <Button variant="outline" onClick={() => setPreview(true)}>
                <Eye data-icon="inline-start" />
                {t("Preview the complete invitation")}
              </Button>
              <Button
                disabled={
                  busy || issues.length > 0 || domainDraft !== state.savedSlug
                }
                onClick={async () => {
                  setBusy(true);
                  try {
                    if (!(await state.flush())) return;
                    if (published) {
                      await api(`/api/weddings/${id}/publish`, {
                        version: state.version.current,
                      });
                      toast.success("Your invitation updates are published");
                    } else router.push(`/dashboard/${id}/checkout`);
                  } catch (e) {
                    toast.error(errorMessage(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy
                  ? t("Preparing…")
                  : published
                    ? t("Publish updates")
                    : t("Continue to checkout")}
                <ArrowRight data-icon="inline-end" />
              </Button>
              <p className="small-note">
                {t(
                  "Six calendar months of hosting begin when your first payment is verified and your invitation is published.",
                )}
              </p>
            </FieldGroup>
          )}
          <div className="editor-footer">
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => go(step - 1)}
            >
              <ArrowLeft data-icon="inline-start" />
              {t("Back")}
            </Button>
            {step < 3 && (
              <Button disabled={changingStep} onClick={() => go(step + 1)}>
                {t("Continue")}
                <ArrowRight data-icon="inline-end" />
              </Button>
            )}
          </div>
        </section>
        <aside className="editor-preview">
          <div className="preview-sticky">
            <p className="small-note">
              {t("Your guest’s first impression · live preview")}
            </p>
            <iframe
              ref={frame}
              title={t("Live invitation preview")}
              src={`/dashboard/${id}/preview`}
            />
            <p className="small-note">
              {t("Changes appear here as you type. Only you can see this.")}
            </p>
          </div>
        </aside>
      </main>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="sm:max-w-5xl h-[90svh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("Your private preview")}</DialogTitle>
            <DialogDescription>
              {t(
                "This is how your guests will see the invitation. Responses are disabled.",
              )}
            </DialogDescription>
          </DialogHeader>
          <div
            className="full-invitation-preview"
            aria-label={t("Full invitation preview")}
          >
            <Guest content={c} mode="preview" />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!conflict}
        onOpenChange={(v) => {
          if (!v) setConflict(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Review the newer saved draft")}</DialogTitle>
            <DialogDescription>
              {t(
                "Your current edits have been kept. Choose which version to continue with.",
              )}
            </DialogDescription>
          </DialogHeader>
          {conflict && (
            <>
              <p>
                {t("Saved version")}
                {conflict.wedding.version}:{" "}
                {conflict.content.names
                  .map(
                    (n) => n[conflict.content.defaultLanguage] || t("Unnamed"),
                  )
                  .join(" & ")}
                , {conflict.content.events.length}
                {t("events.")}
              </p>
              <a
                href={`/dashboard/${id}/preview`}
                target="_blank"
                rel="noopener"
                className="underline"
              >
                {t("Open the saved version for review")}
              </a>
              <Button
                variant="outline"
                onClick={() => {
                  state.resolve(conflict.wedding.version, {
                    content: conflict.content,
                    slug: conflict.wedding.slug,
                  });
                  setDomainDraft(conflict.wedding.slug);
                  setConflict(null);
                }}
              >
                {t("Use the saved version")}
              </Button>
              <Button
                onClick={() => {
                  state.resolve(conflict.wedding.version);
                  setConflict(null);
                }}
              >
                {t("Replace saved draft with my edits")}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
