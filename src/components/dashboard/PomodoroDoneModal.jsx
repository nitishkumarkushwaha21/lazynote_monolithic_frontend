import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { usePomodoroStore } from "../../store/usePomodoroStore";

const PomodoroDoneModal = () => {
  const status = usePomodoroStore((state) => state.status);
  const durationMs = usePomodoroStore((state) => state.durationMs);
  const dismiss = usePomodoroStore((state) => state.dismiss);
  const startAnother = usePomodoroStore((state) => state.startAnother);
  const isOpen = status === "done";
  const minutes = Math.max(1, Math.round(durationMs / 60000));

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        dismiss();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, dismiss]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={dismiss}
        >
          <Motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pomodoro-done-title"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-96 rounded-[24px] border border-white/16 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(8,12,22,0.98))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.46)]"
          >
            <h2
              id="pomodoro-done-title"
              className="mb-2 font-mono text-[1.35rem] font-semibold tracking-[-0.03em] text-white"
            >
              Pomodoro complete
            </h2>
            <p className="mb-6 text-sm text-white/42">
              Your {minutes}-minute Pomodoro timer is finished.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={dismiss}
                className="px-4 py-2 text-white/46 transition-colors hover:text-white"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={startAnother}
                className="rounded-xl border border-white/18 bg-white/[0.10] px-4 py-2 font-medium text-white transition-colors hover:bg-white/[0.16]"
              >
                Start another
              </button>
            </div>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default PomodoroDoneModal;
