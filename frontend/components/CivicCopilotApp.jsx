"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import AuthorityDashboard from "@/components/authority/AuthorityDashboard";
import ComplaintSubmission from "@/components/citizen/ComplaintSubmission";

export default function CivicCopilotApp() {
  const [view, setView] = useState("citizen");

  return (
    <AnimatePresence mode="wait">
      {view === "citizen" ? (
        <motion.div
          key="citizen"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <ComplaintSubmission onAuthorityLogin={() => setView("dashboard")} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <AuthorityDashboard />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
