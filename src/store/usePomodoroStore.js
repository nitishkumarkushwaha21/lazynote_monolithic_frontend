import { create } from "zustand";

export const POMODORO_DURATION_MS = 25 * 60 * 1000;

const initialState = {
  status: "idle",
  durationMs: POMODORO_DURATION_MS,
  remainingMs: POMODORO_DURATION_MS,
  endsAt: null,
};

export const MIN_POMODORO_MINUTES = 1;
export const MAX_POMODORO_MINUTES = 180;

function clampMinutes(minutes) {
  const parsed = Number(minutes);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(
    MAX_POMODORO_MINUTES,
    Math.max(MIN_POMODORO_MINUTES, Math.round(parsed)),
  );
}

let audioContext = null;

function ensureAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextCtor();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

function playCompletionBeep() {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const startAt = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.45);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + 0.45);
}

export const formatPomodoroTime = (remainingMs) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const usePomodoroStore = create((set, get) => ({
  ...initialState,

  start: () => {
    const { status, remainingMs } = get();
    if (status === "running" || status === "done") {
      return;
    }

    ensureAudioContext();
    const nextRemaining =
      remainingMs > 0 ? remainingMs : get().durationMs;

    set({
      status: "running",
      remainingMs: nextRemaining,
      endsAt: Date.now() + nextRemaining,
    });
  },

  pause: () => {
    const { status, endsAt } = get();
    if (status !== "running" || !endsAt) {
      return;
    }

    set({
      status: "paused",
      remainingMs: Math.max(0, endsAt - Date.now()),
      endsAt: null,
    });
  },

  setDurationMinutes: (minutes) => {
    const { status } = get();
    if (status === "running" || status === "done") {
      return;
    }

    const nextMinutes = clampMinutes(minutes);
    if (nextMinutes == null) {
      return;
    }

    const durationMs = nextMinutes * 60 * 1000;
    set({
      status: "idle",
      durationMs,
      remainingMs: durationMs,
      endsAt: null,
    });
  },

  reset: () => {
    const { durationMs } = get();
    set({
      status: "idle",
      durationMs,
      remainingMs: durationMs,
      endsAt: null,
    });
  },

  dismiss: () => {
    if (get().status !== "done") {
      return;
    }

    const { durationMs } = get();
    set({
      status: "idle",
      durationMs,
      remainingMs: durationMs,
      endsAt: null,
    });
  },

  startAnother: () => {
    ensureAudioContext();
    const { durationMs } = get();
    set({
      status: "running",
      durationMs,
      remainingMs: durationMs,
      endsAt: Date.now() + durationMs,
    });
  },

  tick: () => {
    const { status, endsAt } = get();
    if (status !== "running" || !endsAt) {
      return;
    }

    const remainingMs = endsAt - Date.now();
    if (remainingMs <= 0) {
      set({ status: "done", remainingMs: 0, endsAt: null });
      playCompletionBeep();
      return;
    }

    set({ remainingMs });
  },
}));
