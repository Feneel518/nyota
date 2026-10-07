"use client";
/* eslint-disable @next/next/no-img-element -- Pre-sized private media must bypass a shared image optimizer to respect invitation expiry. */
import Link from "next/link";
import Adventure from "./scenes";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  MapPin,
  Clock3,
  Pause,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import {
  type InvitationContent,
  type Language,
  eventDate,
  localizedText,
  eventCeremony,
  ceremonyNames,
} from "@/lib/content";
import { messages } from "@/content/messages";
import { Courtyard, Ornament } from "@/components/illustration";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RsvpForm } from "@/features/rsvp/form";
import { Share } from "./share";
import { api } from "@/lib/api";
import { Atmosphere } from "./atmosphere";
import "./immersive.css";
import { useSceneTransition } from "./use-scene-transition";
import { FamilyBlessings } from "./family-blessings";
import { WeddingMotif } from "@/components/wedding-motif";
import { brand } from "@/lib/brand";
export function Guest({
  content,
  slug = "demo",
  mode = "public",
  detailsOnly = false,
  canonicalUrl = "",
  invitationPath,
}: {
  content: InvitationContent;
  slug?: string;
  mode?: "demo" | "preview" | "public";
  detailsOnly?: boolean;
  canonicalUrl?: string;
  invitationPath?: string;
}) {
  const [language, setLanguage] = useState<Language>(content.defaultLanguage);
  const [exploring, setExploring] = useState(false);
  const [sound, setSound] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const { transitionScene, sceneTurn } = useSceneTransition(motionPaused);
  const stopMusic = useRef<(() => void) | null>(null);
  const musicGeneration = useRef(0);
  const visit = useRef("");
  const t = messages[language];
  const publicPath = invitationPath || `/w/${slug}`;
  const text = (value: { en: string; gu: string }) =>
    localizedText(value, language, content.defaultLanguage);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`language:${slug}`) as Language;
      if (content.languages.includes(saved)) {
        queueMicrotask(() => setLanguage(saved));
      }
    } catch {}
  }, [slug, content.languages]);
  useEffect(() => {
    if (mode === "public") {
      visit.current ||= crypto.randomUUID();
      void api(`/api/public/${slug}/analytics`, {
        kind: "invitation_opened",
        key: visit.current,
      }).catch(() => {});
    }
  }, [slug, mode]);
  useEffect(
    () => () => {
      musicGeneration.current++;
      stopMusic.current?.();
      stopMusic.current = null;
      setSound(false);
    },
    [content.music],
  );
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        musicGeneration.current++;
        stopMusic.current?.();
        stopMusic.current = null;
        setSound(false);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  async function toggleSound() {
    if (sound) {
      musicGeneration.current++;
      stopMusic.current?.();
      stopMusic.current = null;
      setSound(false);
      return;
    }
    if (content.music === "none") return;
    const generation = ++musicGeneration.current;
    setSound(true);
    try {
      const { playMusic } = await import("./music");
      const stop = await playMusic(content.music);
      if (generation !== musicGeneration.current) stop();
      else stopMusic.current = stop;
    } catch {
      if (generation === musicGeneration.current) {
        setSound(false);
        toast.error(t.soundUnavailable);
      }
    }
  }
  const mainEvent = content.events.find((e) => e.id === content.mainEventId);
  const base =
    mode === "demo"
      ? `/demo?theme=${content.theme}`
      : mode === "preview"
        ? "#details"
        : `${publicPath.replace(/\/$/, "")}/details`;
  const detailsHref = detailsOnly || mode !== "public" ? "#details" : base;
  function start() {
    transitionScene(() => setExploring(true));
    window.scrollTo({ top: 0, behavior: "instant" });
    if (mode === "public")
      void api(`/api/public/${slug}/analytics`, {
        kind: "adventure_started",
        key: visit.current || crypto.randomUUID(),
      }).catch(() => {});
  }
  return (
    <div
      className="invitation"
      data-scene-turn={sceneTurn ?? undefined}
      data-theme={content.theme}
      data-motion-paused={motionPaused}
      data-immersive={!detailsOnly}
      data-exploring={exploring}
      lang={language}
    >
      <header className="guest-toolbar">
        <Link
          href={mode === "public" ? publicPath : "/"}
          className="guest-brand"
        >
          {text(content.names[0]) || "Your name"} &{" "}
          {text(content.names[1]) || "Your name"}
        </Link>
        <div className="guest-tools">
          {!detailsOnly && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                language === "gu"
                  ? motionPaused
                    ? "એનિમેશન ચાલુ કરો"
                    : "એનિમેશન થોભાવો"
                  : motionPaused
                    ? "Play animations"
                    : "Pause animations"
              }
              aria-pressed={motionPaused}
              onClick={() => setMotionPaused((value) => !value)}
            >
              {motionPaused ? <Play /> : <Pause />}
            </Button>
          )}
          {content.languages.length > 1 && (
            <ToggleGroup
              aria-label={t.language}
              type="single"
              value={language}
              onValueChange={(v) => {
                if (v) {
                  setLanguage(v as Language);
                  try {
                    sessionStorage.setItem(`language:${slug}`, v);
                  } catch {}
                }
              }}
            >
              <ToggleGroupItem value="en" aria-label="English">
                EN
              </ToggleGroupItem>
              <ToggleGroupItem value="gu" aria-label="ગુજરાતી">
                ગુ
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          {content.music !== "none" && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={sound ? t.musicOff : t.musicOn}
              onClick={toggleSound}
            >
              {sound ? <Volume2 /> : <VolumeX />}
            </Button>
          )}
          <Button variant="ghost" asChild>
            <a href={detailsHref} onClick={() => setExploring(false)}>
              {t.details}
            </a>
          </Button>
        </div>
      </header>
      {mode !== "public" && (
        <div className={`guest-notice${mode === "demo" ? " demo-notice" : ""}`}>
          <span>{mode === "demo" ? t.demo : t.preview}</span>
          {mode === "demo" && (
            <Link href="/sign-in" className="demo-create-link">
              {language === "gu"
                ? "તમારું આમંત્રણ બનાવો"
                : "Create your invitation"}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
      {!detailsOnly && (
        <div className="invitation-curtain" aria-hidden="true">
          <span />
        </div>
      )}
      <main id="main">
        {!detailsOnly && !exploring && (
          <section
            className="invitation-cover immersive-cover"
            data-invitation-screen="cover"
          >
            <Atmosphere />
            <div className="cover-top">
              <span className="invitation-seal" aria-hidden="true">
                ✺
              </span>
              <Ornament className="ornament" />
              <p className="invitation-blessing">
                {language === "gu" ? "શુભ લગ્ન" : "Shubh Vivah"}
              </p>
              <p>{text(content.families) || t.invited}</p>
              <h1 className="couple-names">
                {text(content.names[0]) || "Your name"} &{" "}
                {text(content.names[1]) || "Your name"}
              </h1>
              <FamilyBlessings content={content} language={language} />
              <p>{mainEvent && eventDate(mainEvent.start, language, false)}</p>
            </div>
            <div className="cover-art">
              <Courtyard
                theme={content.theme}
                characters={content.characters}
                outfits={content.outfits}
                immersive
              />
            </div>
            <div className="cover-actions">
              <Button size="lg" onClick={start}>
                {t.explore}
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={detailsHref}>{t.details}</a>
              </Button>
            </div>
          </section>
        )}
        {exploring && (
          <Adventure
            transitionScene={transitionScene}
            paused={motionPaused}
            content={content}
            language={language}
            onExit={() => transitionScene(() => setExploring(false))}
            detailsHref={detailsHref}
            onComplete={() => {
              if (mode === "public")
                void api(`/api/public/${slug}/analytics`, {
                  kind: "adventure_completed",
                  key: visit.current || crypto.randomUUID(),
                }).catch(() => {});
            }}
          />
        )}
        <section id="details" className="guest-details">
          <div className="details-intro">
            <WeddingMotif className="details-motif" kind="wedding" />
            <p className="details-blessing">
              {language === "gu" ? "શુભ વિવાહ" : "Shubh Vivah"}
            </p>
            {detailsOnly ? (
              <h1 className="couple-names">
                {text(content.names[0])} & {text(content.names[1])}
              </h1>
            ) : (
              <h2>{t.invited}</h2>
            )}
            {!detailsOnly && (
              <p className="details-couple">
                {text(content.names[0])} <span>&</span> {text(content.names[1])}
              </p>
            )}
            <p>{text(content.wording) || text(content.welcome)}</p>
            <FamilyBlessings content={content} language={language} />
            {mainEvent?.start && (
              <p className="details-date">
                {eventDate(mainEvent.start, language, false)}
              </p>
            )}
            <Ornament className="details-divider" />
            {detailsOnly && (
              <Button variant="outline" asChild>
                <Link href={publicPath}>
                  <ArrowLeft data-icon="inline-start" />
                  {t.explore}
                </Link>
              </Button>
            )}
          </div>
          <div className="celebrations-heading">
            <h2>
              {language === "gu"
                ? "આપણી ઉજવણી"
                : "A celebration in every colour"}
            </h2>
            <p>
              {language === "gu"
                ? "દરેક પ્રસંગે આપની હાજરીની પ્રતીક્ષા."
                : "Join us for the moments that become memories."}
            </p>
          </div>
          <EventList content={content} language={language} />
          {content.hosts
            .filter((h) => h.public)
            .map((h, i) => (
              <p key={i} className="mt-5">
                {h.name} ·{" "}
                <a href={`tel:${h.phone.replace(/[^+\d]/g, "")}`}>{h.phone}</a>
              </p>
            ))}
          <Photos ids={content.photos} />
          <RsvpForm
            content={content}
            language={language}
            slug={slug}
            disabled={mode !== "public"}
          />
          {mode === "public" && (
            <div className="mt-8 flex justify-center">
              <Share
                language={language}
                url={canonicalUrl}
                title={`${text(content.names[0])} & ${text(content.names[1])}`}
                label={t.share}
              />
            </div>
          )}
        </section>
      </main>
      <footer className="guest-attribution">
        <a href={brand.url}>Made with Nyota</a>
        {mode !== "preview" && (
          <a
            className="invitation-referral"
            href={
              mode === "demo"
                ? "/sign-in"
                : `${brand.url}/?utm_source=invitation&utm_medium=referral&utm_campaign=guest_footer`
            }
          >
            {language === "gu"
              ? "તમારું આમંત્રણ બનાવો"
              : "Create your wedding invitation"}
            <ArrowRight size={14} aria-hidden="true" />
          </a>
        )}
      </footer>
    </div>
  );
}
export function EventList({
  content,
  language,
}: {
  content: InvitationContent;
  language: Language;
}) {
  const t = messages[language],
    text = (v: { en: string; gu: string }) =>
      localizedText(v, language, content.defaultLanguage);
  return (
    <div className="ceremony-cards">
      {content.events
        .filter((e) => !e.archived)
        .map((e) => (
          <article
            className="ceremony-card"
            data-card-ceremony={eventCeremony(e)}
            key={e.id}
          >
            <div className="ceremony-card-art">
              <WeddingMotif kind={eventCeremony(e)} />
              <span>{ceremonyNames[eventCeremony(e)][language]}</span>
            </div>
            <div className="event-info">
              <h3>{text(e.title) || t.noEvents}</h3>
              <time
                className="ceremony-date"
                dateTime={e.start ? `${e.start}+05:30` : undefined}
              >
                <Clock3 aria-hidden="true" />
                {eventDate(e.start, language)}
              </time>
              <div className="ceremony-venue">
                <MapPin aria-hidden="true" />
                <div>
                  <strong>{text(e.venue)}</strong>
                  <p>{text(e.address)}</p>
                </div>
              </div>
              {e.end && (
                <p>
                  {language === "gu" ? "સમાપ્તિ" : "Until"}:{" "}
                  {eventDate(e.end, language)}
                </p>
              )}
              {text(e.notes) && (
                <p className="ceremony-note">{text(e.notes)}</p>
              )}
              {e.directions && (
                <Button variant="outline" asChild>
                  <a
                    href={e.directions}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin data-icon="inline-start" />
                    {t.directions}
                  </a>
                </Button>
              )}
            </div>
          </article>
        ))}
    </div>
  );
}
export function Photos({ ids }: { ids: string[] }) {
  const [failed, setFailed] = useState<string[]>([]);
  return (
    <div className="photo-strip">
      {ids
        .filter((id) => !failed.includes(id))
        .map((id, i) => (
          <img
            key={id}
            src={`/api/media/${id}`}
            srcSet={`/api/media/${id} 480w, /api/media/${id}?width=1200 1200w`}
            sizes="160px"
            width={160}
            height={180}
            alt={`A memory shared by the couple, photo ${i + 1}`}
            loading="lazy"
            onError={() => setFailed((v) => [...v, id])}
          />
        ))}
    </div>
  );
}
