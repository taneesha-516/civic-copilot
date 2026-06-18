import { AlertTriangle, Check, Clock3, Loader2, ShieldAlert } from "lucide-react";

const badgeMap = {
  critical: {
    className: "border-current/20 bg-danger text-white",
    left: <span className="h-2 w-2 rounded-full bg-white animate-pulse" />,
  },
  high: {
    className: "border-current/20 bg-danger-light text-danger",
    left: <ShieldAlert className="h-3.5 w-3.5" />,
  },
  medium: {
    className: "border-current/20 bg-accent-50 text-accent",
    left: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  low: {
    className: "border-current/20 bg-success-light text-success",
    left: <Check className="h-3.5 w-3.5" />,
  },
  pending: {
    className: "border-current/20 bg-slate-100 text-slate-600",
    left: <Clock3 className="h-3.5 w-3.5" />,
  },
  "in-progress": {
    className: "border-current/20 bg-primary-light text-primary",
    left: <Loader2 className="h-3.5 w-3.5 animate-[spin_700ms_linear_infinite]" />,
  },
  resolved: {
    className: "border-current/20 bg-success-light text-success",
    left: <Check className="h-3.5 w-3.5" />,
  },
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Badge({ variant = "medium", children, className }) {
  const config = badgeMap[variant] ?? badgeMap.medium;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-badge border px-3 py-1",
        "text-[11px] font-semibold uppercase tracking-[0.01em]",
        config.className,
        className,
      )}
    >
      {config.left}
      {children}
    </span>
  );
}
