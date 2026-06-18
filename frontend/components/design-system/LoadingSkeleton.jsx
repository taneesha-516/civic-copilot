const widths = {
  full: "w-full",
  "3/4": "w-3/4",
  "1/2": "w-1/2",
  "1/3": "w-1/3",
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SkeletonBlock({ className }) {
  return (
    <div className={cn("relative overflow-hidden rounded bg-slate-100", className)}>
      <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
    </div>
  );
}

export function SkeletonText({ width = "full", className }) {
  return <SkeletonBlock className={cn("h-4", widths[width], className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="w-full space-y-3">
          <SkeletonText width="1/2" className="h-3" />
          <SkeletonText width="3/4" className="h-6" />
        </div>
        <SkeletonBlock className="h-7 w-24 rounded-badge" />
      </div>

      <div className="mt-6 space-y-3">
        <SkeletonText width="full" />
        <SkeletonText width="3/4" />
        <SkeletonText width="1/2" />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <SkeletonBlock className="h-10 rounded-button" />
        <SkeletonBlock className="h-10 rounded-button" />
        <SkeletonBlock className="h-10 rounded-button" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-12 w-12 rounded-card" />
        <SkeletonBlock className="h-4 w-10 rounded-badge" />
      </div>

      <div className="mt-6 space-y-3">
        <SkeletonText width="1/2" className="h-3" />
        <SkeletonText width="3/4" className="h-8" />
        <SkeletonText width="full" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="grid grid-cols-4 gap-4 border-b border-border bg-background p-4">
        <SkeletonText width="1/2" className="h-3" />
        <SkeletonText width="1/2" className="h-3" />
        <SkeletonText width="1/2" className="h-3" />
        <SkeletonText width="1/2" className="h-3" />
      </div>

      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-4 gap-4 border-b border-border p-4 last:border-b-0"
        >
          <SkeletonText width="3/4" />
          <SkeletonText width="full" />
          <SkeletonText width="1/2" />
          <SkeletonBlock className="h-6 w-20 rounded-badge" />
        </div>
      ))}
    </div>
  );
}
