export const musicTracks = [
  "courtyard",
  "garden",
  "shehnai",
  "sitar",
  "mehendi",
  "sangeet",
] as const;
export type MusicTrack = (typeof musicTracks)[number];
export const musicLabels: Record<MusicTrack, { name: string; mood: string }> = {
  courtyard: {
    name: "Courtyard melody",
    mood: "Gentle bells & a warm welcome",
  },
  garden: { name: "Garden at dusk", mood: "Soft keys for a quiet evening" },
  shehnai: {
    name: "Shaadi morning",
    mood: "A festive, shehnai-inspired melody",
  },
  sitar: {
    name: "Sitar serenade",
    mood: "Delicate strings & a drifting drone",
  },
  mehendi: {
    name: "Mehendi afternoon",
    mood: "Playful plucks & a light rhythm",
  },
  sangeet: {
    name: "Sangeet under the stars",
    mood: "Bright notes & a celebratory beat",
  },
};
