"use client";

import { useMemo, useSyncExternalStore } from "react";
import { MapPin, MessageSquareText, WifiOff } from "lucide-react";
import { Card } from "@/components/design-system/Card";

const DRAFT_KEY = "civic-copilot-draft";

function subscribeToDraft(onStoreChange) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getDraftSnapshot() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(DRAFT_KEY) ?? "";
}

function parseDraft(rawDraft) {
  if (!rawDraft) return null;

  try {
    return JSON.parse(rawDraft);
  } catch {
    return null;
  }
}

export default function OfflinePage() {
  const rawDraft = useSyncExternalStore(
    subscribeToDraft,
    getDraftSnapshot,
    () => "",
  );
  const draft = useMemo(() => parseDraft(rawDraft), [rawDraft]);

  return (
    <main className="min-h-screen w-screen overflow-x-hidden bg-background text-text-primary">
      <header className="h-16 border-b border-border bg-white/95 backdrop-blur-md">
        <div className="flex h-full w-full items-center gap-3 px-4">
          <div className="flex h-10 w-10 items-end justify-center gap-0.5 rounded-button bg-primary px-1.5 pb-2 text-white shadow-card">
            <span className="h-3 w-1.5 rounded-sm bg-white/80" />
            <span className="h-5 w-1.5 rounded-sm bg-white" />
            <span className="h-4 w-1.5 rounded-sm bg-white/90" />
            <span className="h-2.5 w-1.5 rounded-sm bg-white/75" />
          </div>
          <div>
            <p className="text-base font-bold tracking-[-0.02em]">
              Civic Copilot
            </p>
            <p className="text-[11px] font-medium uppercase tracking-[0.01em] text-text-muted">
              Delhi citizen service
            </p>
          </div>
        </div>
      </header>

      <section className="mx-4 flex min-h-[calc(100svh-64px)] items-center py-8">
        <Card padding="lg" className="w-full text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-light text-danger">
            <WifiOff className="h-7 w-7" />
          </div>

          <h1 className="mt-6 text-xl font-bold tracking-[-0.02em]">
            You are offline
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-text-secondary">
            Your drafted complaint has been saved. It will submit automatically
            when you reconnect.
          </p>

          <div className="mt-8 rounded-card border border-border bg-background p-4 text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.01em] text-text-muted">
              Saved draft
            </p>

            {draft ? (
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <MessageSquareText className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <p className="line-clamp-5 text-[15px] leading-6 text-text-primary">
                    {draft.complaint || "Complaint details are saved locally."}
                  </p>
                </div>

                <div className="flex min-h-12 items-center gap-2 rounded-badge bg-primary px-4 py-2 text-[15px] font-semibold text-white">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {draft.location || draft.manualLocation || "Location saved with draft"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-[15px] leading-6 text-text-secondary">
                No active draft was found on this device. Reconnect and open
                Civic Copilot to start a fresh complaint.
              </p>
            )}
          </div>
        </Card>
      </section>
    </main>
  );
}
