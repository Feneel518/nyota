import { z } from "zod";
import { characterOptions, outfitOptions } from "./appearance";
import { musicTracks } from "./music";

export const languages = ["en", "gu"] as const;
export type Language = (typeof languages)[number];
export const themes = [
  "royal",
  "marigold",
  "garden",
  "rose",
  "midnight",
  "lotus",
] as const;
export const ceremonyKinds = [
  "haldi",
  "mehendi",
  "sangeet",
  "carnival",
  "pool-party",
  "grah-shanti",
  "wedding",
  "celebration",
] as const;
export type CeremonyKind = (typeof ceremonyKinds)[number];
export const ceremonyNames = {
  haldi: { en: "Haldi", gu: "હલદી" },
  mehendi: { en: "Mehendi", gu: "મહેંદી" },
  sangeet: { en: "Sangeet", gu: "સંગીત" },
  carnival: { en: "Carnival", gu: "કાર્નિવલ" },
  "pool-party": { en: "Pool Party", gu: "પૂલ પાર્ટી" },
  "grah-shanti": { en: "Grah Shanti", gu: "ગ્રહ શાંતિ" },
  wedding: { en: "Wedding · Baraat & Varmala", gu: "લગ્ન · વરઘોડો અને વરમાળા" },
  celebration: { en: "Celebration", gu: "ઉજવણી" },
};
export const themeNames = {
  royal: "Royal Maroon",
  marigold: "Marigold",
  garden: "Garden Ivory",
  rose: "Rose Blush",
  midnight: "Midnight Sapphire",
  lotus: "Lotus Lagoon",
};
const localized = (max: number) =>
  z.object({ en: z.string().max(max), gu: z.string().max(max) });
const safeLink = z
  .string()
  .max(1000)
  .refine(
    (v) =>
      !v ||
      (() => {
        try {
          const u = new URL(v);
          return u.protocol === "https:" && !u.username && !u.password;
        } catch {
          return false;
        }
      })(),
    "Use a complete HTTPS link.",
  );
const localTime = z
  .string()
  .refine(
    (v) =>
      !v ||
      (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) &&
        Number.isFinite(new Date(`${v}Z`).getTime()) &&
        new Date(`${v}Z`).toISOString().slice(0, 16) === v),
    "Enter a valid date and time.",
  );
export const eventSchema = z.object({
  id: z.string().uuid(),
  title: localized(100),
  animation: z.enum(["auto", ...ceremonyKinds]).optional(),
  start: localTime,
  end: localTime,
  venue: localized(150),
  address: localized(500),
  directions: safeLink,
  notes: localized(1000),
  archived: z.boolean(),
});
export const contentSchema = z
  .object({
    schemaVersion: z.literal(1),
    names: z.tuple([localized(80), localized(80)]),
    motherNames: z.tuple([localized(80), localized(80)]).optional(),
    families: localized(200),
    welcome: localized(1000),
    wording: localized(1000),
    languages: z.array(z.enum(languages)).min(1).max(2),
    defaultLanguage: z.enum(languages),
    theme: z.enum(themes),
    genders: z
      .tuple([z.enum(["male", "female"]), z.enum(["male", "female"])])
      .optional(),
    characters: z.tuple([
      z
        .number()
        .int()
        .min(0)
        .max(characterOptions.length - 1),
      z
        .number()
        .int()
        .min(0)
        .max(characterOptions.length - 1),
    ]),
    outfits: z.tuple([
      z
        .number()
        .int()
        .min(0)
        .max(outfitOptions.length - 1),
      z
        .number()
        .int()
        .min(0)
        .max(outfitOptions.length - 1),
    ]),
    music: z.enum(["none", ...musicTracks]),
    photos: z
      .array(z.string().uuid())
      .max(5)
      .refine((v) => new Set(v).size === v.length, "Choose each photo once."),
    events: z.array(eventSchema).max(30),
    mainEventId: z.string(),
    hosts: z
      .array(
        z.object({
          name: z.string().max(80),
          phone: z
            .string()
            .max(25)
            .regex(/^[+\d ()-]*$/),
          public: z.boolean(),
        }),
      )
      .max(2),
  })
  .superRefine((v, ctx) => {
    if (!v.languages.includes(v.defaultLanguage))
      ctx.addIssue({
        code: "custom",
        path: ["defaultLanguage"],
        message: "Enable the default language.",
      });
    if (new Set(v.languages).size !== v.languages.length)
      ctx.addIssue({
        code: "custom",
        path: ["languages"],
        message: "Choose each language once.",
      });
    if (new Set(v.events.map((e) => e.id)).size !== v.events.length)
      ctx.addIssue({
        code: "custom",
        path: ["events"],
        message: "Event IDs must be unique.",
      });
    if (v.events.filter((e) => !e.archived).length > 10)
      ctx.addIssue({
        code: "custom",
        path: ["events"],
        message: "Keep up to ten active events.",
      });
  });
export type InvitationContent = z.infer<typeof contentSchema>;
export type WeddingEvent = InvitationContent["events"][number];
// Older invitations have no animation field. Match both languages regardless
// of the guest's selected language, and allow the owner to override custom titles.
export function eventCeremony(
  event: Pick<WeddingEvent, "title" | "animation">,
): CeremonyKind {
  if (event.animation && event.animation !== "auto") return event.animation;
  const title = `${event.title.en} ${event.title.gu}`.toLowerCase();
  if (
    /grah|griha|gruh|ગ્રહ|ગૃહ/.test(title) &&
    /shanti|santak|shantak|શાંતિ|શાંતક|સાંતક/.test(title)
  )
    return "grah-shanti";
  if (/pool|પૂલ/.test(title)) return "pool-party";
  if (/carnival|mela|કાર્નિવલ|મેળો/.test(title)) return "carnival";
  if (/haldi|pithi|હલદી|હળદી|પીઠી/.test(title)) return "haldi";
  if (/meh[ae]?ndi|mah[ae]?ndi|henna|મહેંદી|મહેન્દી|મેહંદી/.test(title))
    return "mehendi";
  if (/sangeet|sangit|garba|music|સંગીત|ગરબા/.test(title)) return "sangeet";
  if (
    /wedding|shaadi|shadi|vivah|baraat|varmala|લગ્ન|વિવાહ|વરઘોડો|વરમાળા/.test(
      title,
    )
  )
    return "wedding";
  return "celebration";
}
export const publicationSchema = contentSchema.superRefine((v, ctx) => {
  const required = (s: string, path: (string | number)[]) => {
    if (!s.trim())
      ctx.addIssue({
        code: "custom",
        path,
        message: "Required before publishing.",
      });
  };
  v.names.forEach((n, i) =>
    required(n[v.defaultLanguage], ["names", i, v.defaultLanguage]),
  );
  const active = v.events.filter((e) => !e.archived);
  if (!active.length || !active.some((e) => e.id === v.mainEventId))
    ctx.addIssue({
      code: "custom",
      path: ["mainEventId"],
      message: "Choose a main wedding event.",
    });
  v.events.forEach((e, i) => {
    if (e.archived) return;
    for (const field of ["title", "venue", "address"] as const)
      required(e[field][v.defaultLanguage], ["events", i, field]);
    required(e.start, ["events", i, "start"]);
    if (e.end && e.end <= e.start)
      ctx.addIssue({
        code: "custom",
        path: ["events", i, "end"],
        message: "End time must follow the start.",
      });
  });
});
export function localizedText(
  value: { en: string; gu: string },
  language: Language,
  fallback: Language = "en",
) {
  return value[language].trim() || value[fallback].trim();
}
export function eventDate(
  value: string,
  language: Language = "en",
  full = true,
) {
  if (!value)
    return language === "gu"
      ? "તારીખ નક્કી કરવાની બાકી છે"
      : "Date to be announced";
  return new Intl.DateTimeFormat(language === "gu" ? "gu-IN" : "en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(full ? ({ hour: "numeric", minute: "2-digit" } as const) : {}),
  }).format(
    new Date(
      value.includes("Z") || /[+]\d\d:\d\d$/.test(value)
        ? value
        : `${value}+05:30`,
    ),
  );
}
export function newEvent(title = "Wedding"): WeddingEvent {
  return {
    id: crypto.randomUUID(),
    title: { en: title, gu: "" },
    start: "",
    end: "",
    venue: { en: "", gu: "" },
    address: { en: "", gu: "" },
    notes: { en: "", gu: "" },
    directions: "",
    archived: false,
  };
}
export function emptyContent(): InvitationContent {
  const event = newEvent();
  return {
    schemaVersion: 1,
    names: [
      { en: "", gu: "" },
      { en: "", gu: "" },
    ],
    motherNames: [
      { en: "", gu: "" },
      { en: "", gu: "" },
    ],
    families: { en: "", gu: "" },
    welcome: { en: "", gu: "" },
    wording: { en: "", gu: "" },
    languages: ["en"],
    defaultLanguage: "en",
    theme: "royal",
    characters: [0, 1],
    genders: ["female", "male"],
    outfits: [0, 1],
    music: "none",
    photos: [],
    events: [event],
    mainEventId: event.id,
    hosts: [],
  };
}
export const demoContent: InvitationContent = {
  schemaVersion: 1,
  names: [
    { en: "Aarya", gu: "આર્યા" },
    { en: "Dev", gu: "દેવ" },
  ],
  families: { en: "Together with our families", gu: "અમારા પરિવાર સાથે" },
  welcome: {
    en: "Some stories are meant to be celebrated. We would love you to be a part of ours.",
    gu: "અમારી ખુશીઓમાં સહભાગી થવા આપને હાર્દિક આમંત્રણ.",
  },
  wording: {
    en: "With full hearts, we invite you to join us for a little laughter, a lot of dancing, and the beginning of our forever.",
    gu: "અમારા નવા જીવનની શરૂઆતમાં આપની હાજરી અને આશીર્વાદની અપેક્ષા છે.",
  },
  languages: ["en", "gu"],
  defaultLanguage: "en",
  theme: "royal",
  characters: [0, 1],
  genders: ["female", "male"],
  outfits: [0, 1],
  music: "courtyard",
  photos: [],
  mainEventId: "00000000-0000-4000-8000-000000000002",
  hosts: [],
  events: [
    {
      id: "00000000-0000-4000-8000-000000000004",
      title: { en: "A little sunshine & Haldi", gu: "હલદીના રંગો" },
      animation: "haldi",
      start: "2027-02-13T10:00",
      end: "",
      venue: { en: "The Marigold Courtyard", gu: "મેરીગોલ્ડ કોર્ટયાર્ડ" },
      address: {
        en: "A fictional venue in Surat, Gujarat",
        gu: "સુરત, ગુજરાતમાં એક કાલ્પનિક સ્થળ",
      },
      directions: "",
      notes: {
        en: "Yellow kurtas, turmeric kisses, and a little mischief.",
        gu: "હલદીના રંગો સાથે ખુશીઓની ઉજવણી.",
      },
      archived: false,
    },
    {
      id: "00000000-0000-4000-8000-000000000005",
      title: { en: "An afternoon of Mehendi", gu: "મહેંદીની બપોર" },
      animation: "mehendi",
      start: "2027-02-13T14:00",
      end: "",
      venue: { en: "The Garden Courtyard", gu: "ગાર્ડન કોર્ટયાર્ડ" },
      address: {
        en: "A fictional venue in Surat, Gujarat",
        gu: "સુરત, ગુજરાતમાં એક કાલ્પનિક સ્થળ",
      },
      directions: "",
      notes: {
        en: "A little henna, a little gossip, and love in every detail.",
        gu: "મહેંદીના રંગોમાં પ્રેમની વાતો.",
      },
      archived: false,
    },
    {
      id: "00000000-0000-4000-8000-000000000001",
      title: { en: "An evening of music", gu: "સંગીત સંધ્યા" },
      start: "2027-02-13T18:30",
      end: "",
      venue: { en: "The Garden Courtyard", gu: "ગાર્ડન કોર્ટયાર્ડ" },
      address: {
        en: "A fictional venue in Surat, Gujarat",
        gu: "સુરત, ગુજરાતમાં એક કાલ્પનિક સ્થળ",
      },
      directions: "https://maps.google.com/?q=Surat+Gujarat",
      notes: {
        en: "Bring your dancing shoes. Festive colours welcome.",
        gu: "રંગબેરંગી પોશાકમાં પધારશો.",
      },
      archived: false,
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      title: { en: "The wedding", gu: "લગ્ન સમારંભ" },
      start: "2027-02-14T16:00",
      end: "",
      venue: { en: "The Rose Pavilion", gu: "રોઝ પેવિલિયન" },
      address: {
        en: "A fictional venue in Surat, Gujarat",
        gu: "સુરત, ગુજરાતમાં એક કાલ્પનિક સ્થળ",
      },
      directions: "https://maps.google.com/?q=Surat+Gujarat",
      notes: {
        en: "A ceremony under the evening sky, followed by dinner.",
        gu: "લગ્ન સમારંભ પછી ભોજન.",
      },
      archived: false,
    },
    {
      id: "00000000-0000-4000-8000-000000000003",
      title: { en: "A happily-ever-after dinner", gu: "સ્નેહ ભોજન" },
      start: "2027-02-14T19:30",
      end: "",
      venue: { en: "The Rose Pavilion", gu: "રોઝ પેવિલિયન" },
      address: {
        en: "A fictional venue in Surat, Gujarat",
        gu: "સુરત, ગુજરાતમાં એક કાલ્પનિક સ્થળ",
      },
      directions: "",
      notes: {
        en: "Good food. Great company. A new chapter.",
        gu: "પરિવાર અને મિત્રો સાથે આનંદમય સાંજ.",
      },
      archived: false,
    },
  ],
};
