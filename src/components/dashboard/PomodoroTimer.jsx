import React, { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import {
  formatPomodoroTime,
  MAX_POMODORO_MINUTES,
  MIN_POMODORO_MINUTES,
  usePomodoroStore,
} from "../../store/usePomodoroStore";

const PomodoroTimer = () => {
  const status = usePomodoroStore((state) => state.status);
  const durationMs = usePomodoroStore((state) => state.durationMs);
  const remainingMs = usePomodoroStore((state) => state.remainingMs);
  const start = usePomodoroStore((state) => state.start);
  const pause = usePomodoroStore((state) => state.pause);
  const reset = usePomodoroStore((state) => state.reset);
  const setDurationMinutes = usePomodoroStore((state) => state.setDurationMinutes);

  const isRunning = status === "running";
  const canEditLength = status === "idle" || status === "paused";
  const minutes = Math.round(durationMs / 60000);
  const [draftMinutes, setDraftMinutes] = useState(String(minutes));

  useEffect(() => {
    setDraftMinutes(String(minutes));
  }, [minutes]);

  const commitMinutes = () => {
    const parsed = Number(draftMinutes);
    if (!Number.isFinite(parsed) || parsed < MIN_POMODORO_MINUTES) {
      setDraftMinutes(String(minutes));
      return;
    }

    setDurationMinutes(parsed);
  };

  return (
    <div
      title="Pomodoro timer"
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-[#0c121c] px-2.5 text-sm text-white"
    >
      <Timer size={14} className="shrink-0 text-sky-200/80" aria-hidden="true" />
      <span className="text-[12px] font-medium tracking-[-0.01em] text-white/80">
        Pomodoro
      </span>
      <label className="inline-flex items-center gap-1 text-white/45">
        <input
          type="number"
          inputMode="numeric"
          min={MIN_POMODORO_MINUTES}
          max={MAX_POMODORO_MINUTES}
          value={draftMinutes}
          disabled={!canEditLength}
          aria-label="Pomodoro length in minutes"
          onChange={(event) => setDraftMinutes(event.target.value)}
          onBlur={commitMinutes}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className="h-6 w-12 [appearance:textfield] rounded-md border border-white/10 bg-transparent text-center font-mono text-[13px] text-white outline-none transition focus:border-sky-300/40 disabled:cursor-not-allowed disabled:opacity-60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="text-[11px]">min</span>
      </label>
      <span className="min-w-[3.4rem] text-center font-mono text-[13px] tabular-nums text-white/90">
        {formatPomodoroTime(remainingMs)}
      </span>
      <button
        type="button"
        onClick={isRunning ? pause : start}
        disabled={status === "done"}
        aria-label={isRunning ? "Pause Pomodoro timer" : "Start Pomodoro timer"}
        className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isRunning ? <Pause size={13} /> : <Play size={13} />}
      </button>
      <button
        type="button"
        onClick={reset}
        aria-label="Reset Pomodoro timer"
        className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <RotateCcw size={13} />
      </button>
    </div>
  );
};

export default PomodoroTimer;
