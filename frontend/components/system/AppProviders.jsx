"use client";

import { ComplaintsProvider } from "@/src/contexts/ComplaintsContext";

export function AppProviders({ children }) {
  return <ComplaintsProvider>{children}</ComplaintsProvider>;
}
