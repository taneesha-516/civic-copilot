"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const steps = [
  "Submitted",
  "Under Review",
  "Department Assigned",
  "Resolved",
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function StatusTimeline({ currentStep = 1, timestamps = {} }) {
  return (
    <div className="w-full">
      <div className="hidden items-start md:grid md:grid-cols-4">
        {steps.map((label, index) => {
          const completed = index < currentStep;
          const current = index === currentStep;

          return (
            <div
              key={label}
              className="relative flex flex-col items-center text-center"
            >
              {index < steps.length - 1 ? (
                <div className="absolute left-1/2 top-4 h-0.5 w-full bg-border">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: index < currentStep ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full origin-left bg-gradient-to-r from-primary to-border"
                  />
                </div>
              ) : null}

              <StepNode completed={completed} current={current} />

              <p
                className={cn(
                  "mt-3 text-sm",
                  completed || current
                    ? "font-bold text-text-primary"
                    : "font-medium text-text-muted",
                )}
              >
                {label}
              </p>

              {current && timestamps[label] ? (
                <p className="mt-1 font-mono text-xs text-text-secondary">
                  {timestamps[label]}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="space-y-0 md:hidden">
        {steps.map((label, index) => {
          const completed = index < currentStep;
          const current = index === currentStep;

          return (
            <div key={label} className="relative flex gap-4 pb-8 last:pb-0">
              {index < steps.length - 1 ? (
                <div className="absolute left-4 top-8 h-full w-0.5 bg-border">
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: index < currentStep ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full origin-top bg-gradient-to-b from-primary to-border"
                  />
                </div>
              ) : null}

              <StepNode completed={completed} current={current} />

              <div>
                <p
                  className={cn(
                    "text-sm",
                    completed || current
                      ? "font-bold text-text-primary"
                      : "font-medium text-text-muted",
                  )}
                >
                  {label}
                </p>

                {current && timestamps[label] ? (
                  <p className="mt-1 font-mono text-xs text-text-secondary">
                    {timestamps[label]}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepNode({ completed, current }) {
  if (completed) {
    return (
      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-card">
        <Check className="h-4 w-4" />
      </div>
    );
  }

  if (current) {
    return (
      <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
        <span className="absolute inset-0 rounded-full bg-primary animate-pulse-ring" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
      </div>
    );
  }

  return (
    <div className="relative z-10 h-8 w-8 rounded-full border-2 border-dashed border-border bg-background" />
  );
}
