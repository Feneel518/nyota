"use client";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

const COVER_MS = 180;
const REVEAL_MS = 260;

export function useSceneTransition(paused: boolean) {
  const [sceneTurn, setSceneTurn] = useState<"cover" | "reveal" | null>(null);
  const coverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      if (coverTimer.current) clearTimeout(coverTimer.current);
      if (revealTimer.current) clearTimeout(revealTimer.current);
    },
    [],
  );

  const transitionScene = (update: () => void) => {
    const instant =
      paused ||
      document.documentElement.dataset.input === "keyboard" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (coverTimer.current) {
      pending.current = update;
      return;
    }
    if (revealTimer.current) {
      clearTimeout(revealTimer.current);
      revealTimer.current = null;
      setSceneTurn(null);
    }
    if (instant) {
      flushSync(update);
      return;
    }

    pending.current = update;
    setSceneTurn("cover");
    coverTimer.current = setTimeout(() => {
      coverTimer.current = null;
      const next = pending.current;
      pending.current = null;
      if (next) flushSync(next);
      setSceneTurn("reveal");
      revealTimer.current = setTimeout(() => {
        revealTimer.current = null;
        setSceneTurn(null);
      }, REVEAL_MS);
    }, COVER_MS);
  };
  return { transitionScene, sceneTurn };
}
