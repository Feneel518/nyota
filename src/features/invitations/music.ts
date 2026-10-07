// Original two-part instrumental miniatures, composed for this project; CC0.
// AudioContext is constructed only after the guest explicitly turns sound on.
const scores = {
  courtyard: [60, 64, 67, 72, 71, 67, 64, 62, 65, 69, 72, 74, 72, 69, 65, 67],
  garden: [62, 66, 69, 73, 69, 66, 64, 62, 59, 62, 66, 69, 66, 64, 61, 62],
};
export function playMusic(track: "courtyard" | "garden") {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0.12;
  master.connect(context.destination);
  let scheduled = context.currentTime + 0.1,
    index = 0;
  const schedule = () => {
    while (scheduled < context.currentTime + 2) {
      const midi = scores[track][index % 16];
      const frequency = 440 * 2 ** ((midi - 69) / 12);
      for (const [ratio, volume] of [
        [1, 0.6],
        [2, 0.14],
        [0.5, 0.18],
      ]) {
        const osc = context.createOscillator(),
          gain = context.createGain();
        osc.type = "sine";
        osc.frequency.value = frequency * ratio;
        gain.gain.setValueAtTime(0, scheduled);
        gain.gain.linearRampToValueAtTime(volume, scheduled + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, scheduled + 1.7);
        osc.connect(gain);
        gain.connect(master);
        osc.start(scheduled);
        osc.stop(scheduled + 1.8);
      }
      scheduled += track === "courtyard" ? 0.65 : 0.8;
      index++;
    }
  };
  schedule();
  const timer = window.setInterval(schedule, 500);
  void context.resume();
  return () => {
    clearInterval(timer);
    void context.close();
  };
}
