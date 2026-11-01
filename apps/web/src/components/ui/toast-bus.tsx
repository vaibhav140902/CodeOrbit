"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalToastEmitter: ((toast: Omit<ToastItem, "id">) => void) | null = null;

export const toast = {
  success: (message: string, title?: string) => {
    globalToastEmitter?.({ type: "success", message, title });
  },
  error: (message: string, title?: string) => {
    globalToastEmitter?.({ type: "error", message, title });
  },
  info: (message: string, title?: string) => {
    globalToastEmitter?.({ type: "info", message, title });
  },
  warning: (message: string, title?: string) => {
    globalToastEmitter?.({ type: "warning", message, title });
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const duration = item.durationMs ?? (item.type === "error" ? 6000 : 4000);
      const newToast: ToastItem = { ...item, id };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  React.useEffect(() => {
    globalToastEmitter = addToast;
    return () => {
      globalToastEmitter = null;
    };
  }, [addToast]);

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      success: (message: string, title?: string) => addToast({ type: "success", message, title }),
      error: (message: string, title?: string) => addToast({ type: "error", message, title }),
      info: (message: string, title?: string) => addToast({ type: "info", message, title }),
      warning: (message: string, title?: string) => addToast({ type: "warning", message, title }),
    }),
    [toasts, addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <aside aria-label="Notifications" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-32px)] sm:w-auto pointer-events-none">
        {toasts.map((t) => {
          const typeStyles = {
            success: "border-emerald-500/40 bg-emerald-950/90 text-emerald-100 shadow-emerald-950/50",
            error: "border-rose-500/40 bg-rose-950/90 text-rose-100 shadow-rose-950/50",
            warning: "border-amber-500/40 bg-amber-950/90 text-amber-100 shadow-amber-950/50",
            info: "border-cyan-500/40 bg-slate-900/95 text-slate-100 shadow-cyan-950/50",
          }[t.type];

          const icon = {
            success: "✓",
            error: "✕",
            warning: "⚠",
            info: "ℹ",
          }[t.type];

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${typeStyles}`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold font-mono">
                {icon}
              </span>
              <div className="flex-1 text-xs leading-relaxed">
                {t.title && <div className="font-bold text-white mb-0.5">{t.title}</div>}
                <div>{t.message}</div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-white/50 hover:text-white text-xs font-bold p-0.5"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return toast;
  }
  return ctx;
};
