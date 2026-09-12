"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { IconAlert, IconCheck, IconClose } from "@/components/icons";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type ToastContextValue = {
  toast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current.slice(-2), { id, kind, message }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-8"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 text-sm shadow-[var(--shadow-lift)] animate-[var(--animate-pop)] ${
              t.kind === "success"
                ? "bg-mint-600 text-white"
                : t.kind === "error"
                  ? "bg-tandoor-600 text-white"
                  : "bg-ink-900 text-paper"
            }`}
          >
            <span className="mt-0.5 shrink-0">
              {t.kind === "error" ? <IconAlert className="h-4 w-4" /> : <IconCheck className="h-4 w-4" />}
            </span>
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-full p-1 opacity-70 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <IconClose className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: () => {} };
  return ctx;
}
