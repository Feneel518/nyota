"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUiLanguage } from "@/components/owner-language";
import { musicLabels, type MusicTrack } from "@/lib/music";

export function MusicPreview({ track }: { track: MusicTrack | "none" }) {
  const { t } = useUiLanguage();
  const [playing, setPlaying] = useState(false);
  const stop = useRef<(() => void) | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    const halt = () => {
      generation.current++;
      stop.current?.();
      stop.current = null;
      setPlaying(false);
    };
    const hidden = () => {
      if (document.hidden) halt();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      halt();
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [track]);
  if (track === "none") return null;
  return (
    <div className="music-preview">
      <p>{t(musicLabels[track].mood)}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={playing}
        onClick={async () => {
          if (playing) {
            generation.current++;
            stop.current?.();
            stop.current = null;
            setPlaying(false);
            return;
          }
          const current = ++generation.current;
          setPlaying(true);
          try {
            const { playMusic } = await import("@/features/invitations/music");
            const cleanup = await playMusic(track);
            if (current !== generation.current) cleanup();
            else stop.current = cleanup;
          } catch {
            if (current === generation.current) {
              setPlaying(false);
              toast.error(t("Music could not play. Please try again."));
            }
          }
        }}
      >
        {playing ? (
          <Square data-icon="inline-start" />
        ) : (
          <Play data-icon="inline-start" />
        )}
        {playing ? t("Stop preview") : t("Preview music")}
      </Button>
    </div>
  );
}
