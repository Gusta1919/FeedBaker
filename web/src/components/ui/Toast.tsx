"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Toast = { id: number; message: string; tone: "info" | "error" | "success" };

type ToastContextValue = {
  notify: (message: string, tone?: Toast["tone"]) => void;
};

const ToastContext = createContext<ToastContextValue>({ notify: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback(
    (message: string, tone: Toast["tone"] = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 3200);
    },
    [],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 bottom-24 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-8">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`anim-pop pointer-events-none max-w-sm border px-4 py-2.5 text-sm font-medium ${
              toast.tone === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-100"
                : toast.tone === "success"
                  ? "border-mint/30 bg-mint/10 text-emerald-50"
                  : "border-line bg-surface text-paper"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
