"use client";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { Courtyard, Ornament } from "@/components/illustration";
import { Button } from "@/components/ui/button";
import {
  type InvitationContent,
  type Language,
  localizedText,
  eventCeremony,
  eventDate,
  ceremonyNames,
} from "@/lib/content";
import { messages } from "@/content/messages";
import { Photos } from "./guest";
import { CeremonyArt } from "./ceremony-art";
import { Atmosphere } from "./atmosphere";
export default function Scenes({
  content,
  language,
  onExit,
  detailsHref,
  onComplete,
  paused = false,
  transitionScene,
}: {
  content: InvitationContent;
  language: Language;
  onExit: () => void;
  detailsHref: string;
  onComplete: () => void;
  paused?: boolean;
  transitionScene: (update: () => void) => void;
}) {
  const [scene, setScene] = useState(1);
  const heading = useRef<HTMLHeadingElement>(null);
  const t = messages[language];
  const text = (v: { en: string; gu: string }) =>
    localizedText(v, language, content.defaultLanguage);
  const events = content.events.filter((event) => !event.archived);
  const finale = events.length + 2;
  const event = scene >= 2 && scene < finale ? events[scene - 2] : undefined;
  const kind = event ? eventCeremony(event) : undefined;
  const title = scene === 1 ? t.couple : event ? text(event.title) : t.invited;
  function navigate(next: number) {
    if (next === 0) {
      onExit();
      return;
    }
    if (next === scene) return;
    transitionScene(() => {
      setScene(next);
      if (next === finale) onComplete();
      requestAnimationFrame(() =>
        heading.current?.focus({ preventScroll: true }),
      );
    });
  }
  return (
    <section
      className="scene-shell immersive-scene"
      data-invitation-screen={scene}
      data-function={kind ?? "celebration"}
      aria-label={language === "gu" ? "લગ્નની સફર" : "Wedding adventure"}
    >
      <Atmosphere />
      <div className="scene-top">
        <p className="small-note">
          {language === "gu" ? "અમારી વાર્તા" : "Our little story"} ·{" "}
          {scene + 1} / {finale + 1}
        </p>
        <div className="scene-dots" aria-hidden="true">
          {Array.from({ length: finale + 1 }, (_, i) => (
            <span data-active={i <= scene} key={i} />
          ))}
        </div>
        <Button variant="ghost" asChild>
          <a href={detailsHref} onClick={onExit}>
            {t.details}
          </a>
        </Button>
      </div>
      <nav
        className="scene-chapters"
        aria-label={language === "gu" ? "સમારંભો" : "Celebration chapters"}
      >
        {events.map((item, index) => (
          <Button
            key={item.id}
            size="sm"
            variant={scene === index + 2 ? "default" : "outline"}
            aria-current={scene === index + 2 ? "step" : undefined}
            onClick={() => navigate(index + 2)}
          >
            {text(item.title) || ceremonyNames[eventCeremony(item)][language]}
          </Button>
        ))}
      </nav>
      <div className="scene-body" key={scene}>
        <div className="scene-visual">
          {kind ? (
            <CeremonyArt
              content={content}
              kind={kind}
              language={language}
              paused={paused}
              immersive
            />
          ) : scene === finale ? (
            <CeremonyArt
              content={content}
              kind="celebration"
              language={language}
              paused={paused}
              immersive
            />
          ) : (
            <Courtyard
              theme={content.theme}
              scene={scene}
              characters={content.characters}
              outfits={content.outfits}
              immersive
            />
          )}
        </div>
        <div className="scene-copy scene-enter">
          <Ornament className="ornament" />
          <h1 ref={heading} tabIndex={-1}>
            {title}
          </h1>
          {scene === 1 && (
            <>
              <p>{text(content.welcome)}</p>
              <Photos ids={content.photos.slice(0, 2)} />
            </>
          )}
          {event && (
            <>
              <p>{text(event.notes)}</p>
              <div className="scene-event-meta">
                <time
                  dateTime={event.start ? `${event.start}+05:30` : undefined}
                >
                  {eventDate(event.start, language)}
                </time>
                <strong>{text(event.venue)}</strong>
                <p>{text(event.address)}</p>
              </div>
              {event.directions && (
                <Button variant="outline" asChild>
                  <a
                    href={event.directions}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin />
                    {t.directions}
                  </a>
                </Button>
              )}
            </>
          )}
          {scene === finale && (
            <>
              <p className="display text-4xl">
                {text(content.names[0])} & {text(content.names[1])}
              </p>
              <p>{text(content.wording)}</p>
              <Button asChild>
                <a href="#rsvp" onClick={onExit}>
                  {t.rsvp}
                </a>
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="scene-navigation">
        <Button variant="outline" onClick={() => navigate(scene - 1)}>
          <ArrowLeft data-icon="inline-start" />
          {t.back}
        </Button>
        {scene < finale ? (
          <Button onClick={() => navigate(scene + 1)}>
            {scene === finale - 1 ? t.finale : t.next}
            <ArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <a href={detailsHref} onClick={onExit}>
              {t.details}
            </a>
          </Button>
        )}
      </div>
    </section>
  );
}
