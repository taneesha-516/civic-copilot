"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

const ToastContext = createContext(null);
const TOAST_LIFETIME = 4000;

const variants = {
  success: {
    accent: "border-l-success",
    iconColor: "text-success",
    progress: "bg-success",
    Icon: CheckCircle2,
  },
  error: {
    accent: "border-l-danger",
    iconColor: "text-danger",
    progress: "bg-danger",
    Icon: XCircle,
  },
  warning: {
    accent: "border-l-accent",
    iconColor: "text-accent",
    progress: "bg-accent",
    Icon: AlertTriangle,
  },
  info: {
    accent: "border-l-primary",
    iconColor: "text-primary",
    progress: "bg-primary",
    Icon: Info,
  },
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function createToastId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((items) => items.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);

    if (timer) {
      window.clearTimeout(timer);
    }

    timers.current.delete(id);
  }, []);

  const addToast = useCallback(
    (type, title, description) => {
      const id = createToastId();

      setToasts((items) => {
        const next = [...items, { id, type, title, description }];
        const visible = next.slice(-4);
        const visibleIds = new Set(visible.map((toast) => toast.id));

        next.forEach((toast) => {
          if (!visibleIds.has(toast.id)) {
            const timer = timers.current.get(toast.id);
            if (timer) {
              window.clearTimeout(timer);
            }
            timers.current.delete(toast.id);
          }
        });

        return visible;
      });

      const timer = window.setTimeout(() => dismiss(id), TOAST_LIFETIME);
      timers.current.set(id, timer);

      return id;
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      success: (title, description) => addToast("success", title, description),
      error: (title, description) => addToast("error", title, description),
      warning: (title, description) => addToast("warning", title, description),
      info: (title, description) => addToast("info", title, description),
      dismiss,
    }),
    [addToast, dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div className="fixed right-4 top-4 z-50 flex w-[calc(100vw-32px)] max-w-sm flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((item) => (
            <ToastCard
              key={item.id}
              toast={item}
              onDismiss={() => dismiss(item.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }) {
  const config = variants[toast.type] ?? variants.info;
  const Icon = config.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 32 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-card border border-l-4 border-border bg-surface shadow-card",
        config.accent,
      )}
    >
      <div className="flex gap-3 p-4">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.iconColor)} />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-text-primary">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              {toast.description}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-button text-text-muted transition duration-150 ease-in-out hover:bg-background hover:text-text-primary active:scale-[0.98]"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 4, ease: "linear" }}
        className={cn("absolute bottom-0 left-0 h-0.5 w-full origin-left", config.progress)}
      />
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
