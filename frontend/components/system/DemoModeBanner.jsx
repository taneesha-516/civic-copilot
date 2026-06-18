"use client";

import { motion } from "framer-motion";
import { CONFIG } from "@/src/services/api";

export function DemoModeBanner() {
  if (!CONFIG.MOCK_MODE) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] flex justify-center px-4 pb-2">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.45, duration: 0.25, ease: "easeOut" }}
        className="flex items-center gap-2 rounded-badge border border-white/10 bg-slate-950/92 px-3 py-2 text-[11px] font-semibold text-white/90 shadow-modal backdrop-blur-md"
      >
        <span className="relative flex h-4 w-4 items-center justify-center">
          <span className="absolute h-4 w-4 animate-pulse-ring rounded-full bg-accent" />
          <span className="relative h-2 w-2 rounded-full bg-accent" />
        </span>
        <span className="font-bold">Demo Mode</span>
        <span className="h-3 w-px bg-white/20" />
        <span className="text-white/62">Seeded Delhi data</span>
      </motion.div>
    </div>
  );
}
