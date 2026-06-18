"use client";

import { useEffect } from "react";

export function PWARegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return undefined;

    let active = true;

    const registerWorker = () => {
      if (!active) return;
      navigator.serviceWorker.register("/civic-copilot-sw.js").catch(() => {
        // Offline support should never block the complaint flow.
      });
    };

    window.addEventListener("load", registerWorker);

    return () => {
      active = false;
      window.removeEventListener("load", registerWorker);
    };
  }, []);

  return null;
}
