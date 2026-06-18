import { Button } from "@/components/design-system/Button";

function EmptyStateShell({ illustration, title, description, action }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-card border border-dashed border-border bg-background px-6 py-10 text-center">
      {illustration}
      <h3 className="mt-5 text-base font-semibold tracking-[-0.01em] text-text-primary">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function NoComplaintsFound({ onClearFilters }) {
  return (
    <EmptyStateShell
      title="No complaints found"
      description="Try adjusting your filters or search terms"
      illustration={
        <svg width="140" height="100" viewBox="0 0 140 100" fill="none" aria-hidden="true">
          <rect x="24" y="18" width="64" height="70" rx="10" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
          <path d="M38 35H73M38 48H77M38 61H63" stroke="#E2E8F0" strokeWidth="5" strokeLinecap="round" />
          <circle cx="88" cy="54" r="21" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="4" />
          <path d="M103 69L118 84" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
          <path d="M81 54H95" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
        </svg>
      }
      action={
        <Button
          size="sm"
          variant="ghost"
          className="text-primary hover:bg-primary-light"
          onClick={onClearFilters}
        >
          Clear all filters
        </Button>
      }
    />
  );
}

export function NoPredictions() {
  return (
    <EmptyStateShell
      title="Not enough data yet"
      description="Predictions are generated after 100+ complaints are logged. Currently: 43 complaints."
      illustration={
        <svg width="140" height="100" viewBox="0 0 140 100" fill="none" aria-hidden="true">
          <rect x="18" y="18" width="94" height="64" rx="12" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
          <path d="M33 66L50 52L65 59L88 35" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M34 74H101" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" />
          <circle cx="101" cy="29" r="17" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="3" />
          <path d="M96 26C97 20 107 21 107 28C107 34 100 34 100 39" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="46" r="2.5" fill="#94A3B8" />
        </svg>
      }
      action={
        <div className="w-56">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
            <span>Data readiness</span>
            <span>43/100</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-badge bg-slate-200">
            <div className="h-full w-[43%] rounded-badge bg-primary transition-[width] duration-500" />
          </div>
        </div>
      }
    />
  );
}

export function MapNoData({ category = "issues", onShowAll }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-7 text-center">
      <svg width="140" height="100" viewBox="0 0 140 100" fill="none" aria-hidden="true">
        <path d="M20 25L47 17L76 25L110 17V76L78 85L48 77L20 86V25Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M47 17V77M76 25V85" stroke="#E2E8F0" strokeWidth="2.5" />
        <path d="M34 42C44 37 50 46 60 41C70 36 77 44 86 39C96 34 101 41 108 38" stroke="#E2E8F0" strokeWidth="5" strokeLinecap="round" />
        <circle cx="69" cy="54" r="15" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="3" />
        <path d="M62 54H76" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <h3 className="mt-4 text-base font-semibold tracking-[-0.01em] text-text-primary">
        No {category} in this area
      </h3>
      <p className="mt-2 max-w-[240px] text-sm leading-6 text-text-secondary">
        Try selecting a wider area or a different category.
      </p>
      {onShowAll ? (
        <Button
          size="sm"
          variant="ghost"
          className="mt-5 text-primary hover:bg-primary-light"
          onClick={onShowAll}
        >
          Show all categories
        </Button>
      ) : null}
    </div>
  );
}
