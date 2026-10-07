import type { MusicTrack } from "@/lib/music";

// Original instrumental miniatures, composed for Nyota; CC0.
// Sound starts only after an explicit play action. No external audio requests.
export const scores: Record<
  MusicTrack,
  { notes: number[]; beat: number; voice: OscillatorType; rhythm?: boolean }
> = {
  courtyard: {
    notes: [60, 64, 67, 72, 71, 67, 64, 62, 65, 69, 72, 74, 72, 69, 65, 67],
    beat: 0.65,
    voice: "sine",
  },
  garden: {
    notes: [62, 66, 69, 73, 69, 66, 64, 62, 59, 62, 66, 69, 66, 64, 61, 62],
    beat: 0.8,
    voice: "sine",
  },
  shehnai: {
    notes: [60, 62, 64, 67, 69, 72, 74, 72, 69, 67, 64, 62, 64, 67, 62, 60],
    beat: 0.55,
    voice: "triangle",
  },
  sitar: {
    notes: [62, 64, 66, 69, 73, 74, 73, 69, 66, 64, 62, 57, 62, 66, 64, 62],
    beat: 0.72,
    voice: "triangle",
  },
  mehendi: {
    notes: [64, 67, 69, 67, 72, 69, 67, 64, 62, 64, 67, 69, 67, 64, 62, 60],
    beat: 0.43,
    voice: "sine",
    rhythm: true,
  },
  sangeet: {
    notes: [60, 67, 72, 69, 67, 64, 67, 72, 74, 72, 69, 67, 69, 67, 64, 60],
    beat: 0.32,
    voice: "triangle",
    rhythm: true,
  },
};
export async function playMusic(track: MusicTrack) {
  const context = new AudioContext();
  try {
    await context.resume();
  } catch (error) {
    void context.close();
    throw error;
  }
  const master = context.createGain();
  master.gain.value = 0.075;
  master.connect(context.destination);
  const score = scores[track];
  let scheduled = context.currentTime + 0.05,
    index = 0,
    stopped = false;
  const tone = (
    midi: number,
    at: number,
    duration: number,
    volume: number,
    voice: OscillatorType,
  ) => {
    const oscillator = context.createOscillator(),
      envelope = context.createGain();
    oscillator.type = voice;
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(volume, at + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.001, at + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  };
  const schedule = () => {
    if (stopped) return;
    while (scheduled < context.currentTime + 0.6) {
      const midi = score.notes[index % score.notes.length];
      tone(midi, scheduled, score.beat * 2.4, 0.65, score.voice);
      tone(midi + 12, scheduled, score.beat * 1.8, 0.08, "sine");
      if (index % 4 === 0)
        tone(score.notes[0] - 12, scheduled, score.beat * 4, 0.2, "sine");
      if (score.rhythm && index % 2 === 0)
        tone(index % 4 === 0 ? 38 : 50, scheduled, 0.13, 0.5, "sine");
      scheduled += score.beat;
      index++;
    }
  };
  schedule();
  const timer = window.setInterval(schedule, 150);
  return () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    void context.close();
  };
}
