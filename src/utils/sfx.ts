import * as Speech from "expo-speech";

export type SfxName =
  | "move"
  | "rotate"
  | "soft"
  | "hard"
  | "lock"
  | "line"
  | "hold"
  | "gameover";

const RATE = 1.2;
const PITCH = 1.2;

function speak(token: string) {
  // very short utterance to simulate a click/beep; respects device volume
  Speech.stop();
  Speech.speak(token, { rate: RATE, pitch: PITCH, language: "en-US" });
}

const lastPlay: Record<SfxName, number> = {
  move: 0,
  rotate: 0,
  soft: 0,
  hard: 0,
  lock: 0,
  line: 0,
  hold: 0,
  gameover: 0,
};

const MIN_INTERVAL: Partial<Record<SfxName, number>> = {
  move: 60,
  soft: 80,
};

let enabled = false;
export const setSfxEnabled = (on: boolean) => { enabled = on; };

export function playSfx(name: SfxName) {
  if (!enabled) return;
  const now = Date.now();
  const gap = MIN_INTERVAL[name] ?? 0;
  if (gap && now - lastPlay[name] < gap) return;
  lastPlay[name] = now;
  switch (name) {
    case "move": speak("t"); break;
    case "rotate": speak("ta"); break;
    case "soft": speak("ti"); break;
    case "hard": speak("tok"); break;
    case "lock": speak("tok"); break;
    case "line": speak("ting"); break;
    case "hold": speak("tah"); break;
    case "gameover": speak("bum"); break;
    default: break;
  }
}
