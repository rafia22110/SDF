/* Web-Audio sound effects + Hebrew speech synthesis & recognition helpers. */

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}
export function isMuted() {
  return muted;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function tone(
  freq: number,
  dur = 0.15,
  type: OscillatorType = "sine",
  vol = 0.16,
  when = 0,
) {
  if (muted) return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime + when;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sfx = {
  click: () => tone(660, 0.07, "triangle", 0.08),
  pop: () => {
    tone(880, 0.06, "square", 0.06);
    tone(1320, 0.09, "sine", 0.08, 0.04);
  },
  correct: () => {
    tone(523.25, 0.12, "sine", 0.14);
    tone(659.25, 0.12, "sine", 0.14, 0.09);
    tone(783.99, 0.2, "sine", 0.14, 0.18);
  },
  wrong: () => {
    tone(220, 0.18, "sawtooth", 0.07);
    tone(174, 0.22, "sawtooth", 0.06, 0.1);
  },
  win: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(f, 0.22, "triangle", 0.14, i * 0.12),
    );
    tone(1318.5, 0.4, "sine", 0.12, 0.5);
  },
  flip: () => tone(440, 0.06, "triangle", 0.07),
  place: () => tone(330, 0.05, "square", 0.05),
  whoosh: () => tone(180, 0.25, "sine", 0.06),
};

/* ---------- Hebrew speech ---------- */

let heVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window))
    return null;
  if (heVoice) return heVoice;
  const voices = window.speechSynthesis.getVoices();
  heVoice =
    voices.find((v) => v.lang === "he-IL") ||
    voices.find((v) => v.lang.startsWith("he")) ||
    null;
  return heVoice;
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, rate = 0.85) {
  if (!canSpeak() || muted) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "he-IL";
    u.rate = rate;
    const v = pickVoice();
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech not available — silently ignore */
  }
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    heVoice = null;
    pickVoice();
  };
}

/* ---------- Hebrew speech recognition (optional, graceful fallback) ---------- */

interface SRResult {
  transcript: string;
  confidence: number;
}

export function canListen(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function listenOnce(timeoutMs = 9000): Promise<SRResult | null> {
  return new Promise((resolve) => {
    if (!canListen()) return resolve(null);
    try {
      const w = window as unknown as Record<string, unknown>;
      const SRC = (w.SpeechRecognition || w.webkitSpeechRecognition) as new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        start: () => void;
        stop: () => void;
        onresult: ((e: unknown) => void) | null;
        onerror: ((e: unknown) => void) | null;
        onend: (() => void) | null;
      };
      const rec = new SRC();
      rec.lang = "he-IL";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      let settled = false;
      const done = (r: SRResult | null) => {
        if (settled) return;
        settled = true;
        resolve(r);
      };
      const timer = setTimeout(() => {
        try {
          rec.stop();
        } catch {}
        done(null);
      }, timeoutMs);
      rec.onresult = (e: unknown) => {
        clearTimeout(timer);
        const ev = e as {
          results: Array<Array<{ transcript: string; confidence: number }>>;
        };
        const r = ev.results?.[0]?.[0];
        done(r ? { transcript: r.transcript, confidence: r.confidence } : null);
      };
      rec.onerror = () => {
        clearTimeout(timer);
        done(null);
      };
      rec.onend = () => {
        clearTimeout(timer);
        done(null);
      };
      rec.start();
    } catch {
      resolve(null);
    }
  });
}

/* Normalize Hebrew text for comparison: strip nikud, punctuation, spaces. */
export function normalizeHe(s: string): string {
  return s
    .replace(/[֑-ׇ]/g, "")
    .replace(/[^\u0590-\u05FFa-zA-Z0-9]/g, "")
    .toLowerCase();
}
