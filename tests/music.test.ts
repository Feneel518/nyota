import { describe, it, expect, vi } from "vitest";
import { playMusic } from "../src/features/invitations/music";
import { musicTracks } from "../src/lib/music";

describe("invitation music lifecycle", () => {
  it.each(musicTracks)(
    "plays %s only on request and closes its audio resources",
    async (track) => {
      const close = vi.fn(async () => {}),
        start = vi.fn(),
        clear = vi.fn();
      const context = vi.fn(function () {
        return {
          currentTime: 0,
          destination: {},
          resume: async () => {},
          close,
          createGain: () => ({
            gain: {
              value: 0,
              setValueAtTime: vi.fn(),
              linearRampToValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
            disconnect: vi.fn(),
          }),
          createOscillator: () => ({
            type: "sine",
            frequency: { value: 0 },
            connect: vi.fn(),
            disconnect: vi.fn(),
            start,
            stop: vi.fn(),
            onended: null,
          }),
        };
      });
      vi.stubGlobal("AudioContext", context);
      vi.stubGlobal("window", { setInterval: vi.fn(() => 123) });
      vi.stubGlobal("clearInterval", clear);
      try {
        expect(context).not.toHaveBeenCalled();
        const stop = await playMusic(track);
        expect(start).toHaveBeenCalled();
        stop();
        stop();
        expect(close).toHaveBeenCalledTimes(1);
        expect(clear).toHaveBeenCalledWith(123);
      } finally {
        vi.unstubAllGlobals();
      }
    },
  );
});
