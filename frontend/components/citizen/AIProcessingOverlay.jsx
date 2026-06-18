"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Flame,
  Gauge,
  MapPin,
  Send,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const ACTIVATION_TEXT = "AI Engine Activated";
const DEFAULT_PHOTO = "/issues/delhi-pothole-evidence.png";

const neuralLines = [
  { x2: 88, y2: 10, delay: "[animation-delay:0ms]" },
  { x2: 154, y2: 48, delay: "[animation-delay:100ms]" },
  { x2: 154, y2: 128, delay: "[animation-delay:200ms]" },
  { x2: 88, y2: 166, delay: "[animation-delay:300ms]" },
  { x2: 22, y2: 128, delay: "[animation-delay:400ms]" },
  { x2: 22, y2: 48, delay: "[animation-delay:500ms]" },
];

const neuralNodes = [
  "left-1/2 top-1 -translate-x-1/2",
  "right-4 top-10",
  "right-4 bottom-10",
  "bottom-1 left-1/2 -translate-x-1/2",
  "bottom-10 left-4",
  "left-4 top-10",
];

const phaseCopy = {
  nlp: {
    label: "STEP 1 OF 2 · TEXT ANALYSIS",
    title: "Reading your complaint...",
    bullets: [
      "Natural language parsed",
      "Issue type identified",
      "Location extracted",
    ],
  },
  vision: {
    label: "STEP 2 OF 2 · IMAGE ANALYSIS",
    title: "Scanning your photo...",
    bullets: ["Objects detected", "Issue confirmed: Pothole", "Severity calculated"],
  },
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AIProcessingOverlay({
  issueType = "Pothole",
  location = "Rajiv Chowk, New Delhi",
  urgency = "HIGH",
  department = "Public Works Department",
  severityScore = 8,
  hasPhoto = true,
  photoPreview = DEFAULT_PHOTO,
  onComplete,
}) {
  const [phase, setPhase] = useState("activation");
  const [typedCount, setTypedCount] = useState(0);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const sequence = hasPhoto
      ? [
          ["nlp", 1200],
          ["vision", 2800],
          ["results", 4200],
          ["routing", 5800],
          ["complete", 6500],
        ]
      : [
          ["nlp", 1200],
          ["results", 2800],
          ["routing", 4400],
          ["complete", 5100],
        ];

    const timers = sequence.map(([nextPhase, delay]) =>
      window.setTimeout(() => {
        if (nextPhase === "complete") {
          completeRef.current?.();
          return;
        }

        setPhase(nextPhase);
      }, delay),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [hasPhoto]);

  useEffect(() => {
    if (phase !== "activation") return undefined;

    const interval = window.setInterval(() => {
      setTypedCount((count) => {
        if (count >= ACTIVATION_TEXT.length) {
          window.clearInterval(interval);
          return count;
        }

        return count + 1;
      });
    }, 42);

    return () => window.clearInterval(interval);
  }, [phase]);

  const resultRows = useMemo(
    () => [
      {
        id: "issue",
        icon: AlertTriangle,
        iconClass: "text-accent",
        label: "ISSUE DETECTED",
        value: issueType,
      },
      {
        id: "location",
        icon: MapPin,
        iconClass: "text-primary",
        label: "LOCATION",
        value: location,
      },
      {
        id: "urgency",
        icon: Flame,
        iconClass: urgency.toUpperCase() === "HIGH" ? "text-danger" : "text-accent",
        label: "URGENCY",
        value: urgency.toUpperCase(),
        urgent: true,
      },
      {
        id: "department",
        icon: Building2,
        iconClass: "text-slate-300",
        label: "ROUTING TO",
        value: department,
      },
      ...(hasPhoto
        ? [
            {
              id: "severity",
              icon: Gauge,
              iconClass: "text-accent",
              label: "SEVERITY SCORE",
              value: <SeverityBar score={severityScore} />,
            },
          ]
        : []),
    ],
    [department, hasPhoto, issueType, location, severityScore, urgency],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[rgba(10,15,40,0.92)] p-4 text-white"
      role="status"
      aria-live="polite"
      aria-label="Civic Copilot AI processing"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.42)_1px,transparent_0)] [background-size:6px_6px] animate-grain [filter:contrast(120%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(27,79,216,0.24),transparent_34%),radial-gradient(circle_at_78%_74%,rgba(245,158,11,0.12),transparent_28%)]" />

      <motion.section
        layout
        className="relative w-full max-w-[440px] overflow-hidden rounded-modal border border-white/[0.08] bg-[#0F1729] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)] sm:p-10"
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <AnimatePresence mode="wait">
          {phase === "activation" ? (
            <motion.div
              key="activation"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex min-h-[360px] flex-col items-center justify-center text-center"
            >
              <NeuralNetwork />
              <h2 className="mt-8 min-h-8 text-2xl font-bold tracking-[-0.02em] text-white">
                {ACTIVATION_TEXT.slice(0, typedCount)}
                <span className="ml-1 inline-block h-6 w-0.5 translate-y-1 bg-primary animate-pulse" />
              </h2>
              <div className="mt-4 rounded-badge border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/50">
                Civic Copilot Intelligence v2.1
              </div>
            </motion.div>
          ) : null}

          {phase === "nlp" ? (
            <AnalysisPhase key="nlp" config={phaseCopy.nlp} />
          ) : null}

          {phase === "vision" ? (
            <AnalysisPhase
              key="vision"
              config={phaseCopy.vision}
              photoPreview={photoPreview || DEFAULT_PHOTO}
            />
          ) : null}

          {phase === "results" ? (
            <ResultsReveal key="results" rows={resultRows} />
          ) : null}

          {phase === "routing" ? <RoutingPhase key="routing" /> : null}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}

function NeuralNetwork({ compact = false }) {
  return (
    <div
      className={cn(
        "relative shrink-0",
        compact ? "h-14 w-14" : "h-44 w-44",
      )}
    >
      {!compact ? (
        <>
          <svg viewBox="0 0 176 176" className="absolute inset-0 h-full w-full">
            {neuralLines.map((line) => (
              <line
                key={`${line.x2}-${line.y2}`}
                x1="88"
                y1="88"
                x2={line.x2}
                y2={line.y2}
                stroke="#1B4FD8"
                strokeWidth="1"
                className={cn(
                  "animate-[neural-fire_1.2s_ease-in-out_infinite]",
                  line.delay,
                )}
              />
            ))}
          </svg>

          {neuralNodes.map((position, index) => (
            <span
              key={position}
              className={cn(
                "absolute h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_rgba(27,79,216,0.9)]",
                "animate-[neural-fire_1.2s_ease-in-out_infinite]",
                position,
                index === 1 && "[animation-delay:100ms]",
                index === 2 && "[animation-delay:200ms]",
                index === 3 && "[animation-delay:300ms]",
                index === 4 && "[animation-delay:400ms]",
                index === 5 && "[animation-delay:500ms]",
              )}
            />
          ))}
        </>
      ) : null}

      <div
        className={cn(
          "absolute left-1/2 top-1/2 rounded-full bg-primary shadow-[0_0_28px_rgba(27,79,216,0.92),0_0_60px_rgba(27,79,216,0.34)]",
          compact
            ? "h-8 w-8 -translate-x-1/2 -translate-y-1/2"
            : "h-12 w-12 -translate-x-1/2 -translate-y-1/2",
        )}
      >
        <span className="absolute inset-0 rounded-full bg-primary animate-pulse-ring" />
        <span className="absolute inset-[9px] rounded-full bg-white/20" />
      </div>
    </div>
  );
}

function MiniIndicator() {
  return (
    <div className="mb-8 flex justify-center">
      <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
        <NeuralNetwork compact />
      </div>
    </div>
  );
}

function AnalysisPhase({ config, photoPreview }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-[360px]"
    >
      <MiniIndicator />

      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <Label>{config.label}</Label>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-white">
            {config.title}
          </h2>
        </div>

        {photoPreview ? <ScanningThumbnail photoPreview={photoPreview} /> : null}
      </div>

      <ProgressBar />

      <div className="mt-8 space-y-3">
        {config.bullets.map((bullet, index) => (
          <CheckBullet key={bullet} delay={index * 0.2}>
            {bullet}
          </CheckBullet>
        ))}
      </div>
    </motion.div>
  );
}

function ScanningThumbnail({ photoPreview }) {
  return (
    <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-button border border-white/10 bg-white/[0.04]">
      <Image
        src={photoPreview}
        alt="Uploaded complaint evidence being scanned"
        fill
        unoptimized
        className="object-cover"
      />
      <div className="absolute inset-0 bg-primary/10" />
      <div className="absolute inset-x-0 top-0 h-0.5 bg-cyan-300/80 shadow-[0_0_18px_rgba(125,211,252,0.95)] animate-scan" />
    </div>
  );
}

function ProgressBar() {
  return (
    <div className="mt-8 h-[3px] overflow-hidden rounded-badge bg-white/10">
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className="h-full origin-left rounded-badge bg-gradient-to-r from-primary to-[#7DD3FC]"
      />
    </div>
  );
}

function CheckBullet({ children, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.28, ease: "easeOut" }}
      className="flex items-center gap-3 text-sm font-medium text-white/70"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
        <Check className="h-3.5 w-3.5" />
      </span>
      {children}
    </motion.div>
  );
}

function ResultsReveal({ rows }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-[360px]"
    >
      <div className="relative overflow-hidden rounded-card border border-success/20 bg-success/10 p-4">
        <motion.div
          initial={{ x: "-110%" }}
          animate={{ x: "130%" }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-y-0 w-20 rotate-12 bg-white/10 blur-lg"
        />
        <div className="relative flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <span className="absolute inset-0 rounded-full bg-success/20 animate-pulse-ring" />
            <CheckCircle2 className="relative h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-white">
              Analysis Complete
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Here&apos;s what our AI found:
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <InsightPill label="Confidence" value="94%" tone="text-success" />
        <InsightPill label="Route" value="Auto" tone="text-primary" />
        <InsightPill label="SLA Risk" value="High" tone="text-danger" />
      </div>

      <div className="mt-6 space-y-3">
        {rows.map((row, index) => (
          <ResultRow key={row.id} row={row} delay={0.12 + index * 0.16} />
        ))}
      </div>
    </motion.div>
  );
}

function InsightPill({ label, value, tone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06, duration: 0.24, ease: "easeOut" }}
      className="rounded-button border border-white/[0.08] bg-white/[0.045] px-3 py-2"
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-white/35">
        {label}
      </p>
      <p className={cn("mt-1 text-sm font-bold", tone)}>{value}</p>
    </motion.div>
  );
}

function ResultRow({ row, delay }) {
  const Icon = row.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ delay, duration: 0.34, ease: [0.25, 0.1, 0.25, 1] }}
      className="group relative flex items-center gap-4 overflow-hidden rounded-card border border-white/[0.08] bg-white/[0.04] p-4 transition duration-150 ease-in-out hover:border-white/15 hover:bg-white/[0.07]"
    >
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.22, ease: "easeOut" }}
        className={cn(
          "absolute inset-y-3 left-0 w-1 origin-center rounded-r-badge",
          row.urgent ? "bg-danger" : row.id === "issue" ? "bg-accent" : "bg-primary",
        )}
      />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-white/[0.06] transition duration-150 ease-in-out group-hover:scale-105">
        <Icon className={cn("h-5 w-5", row.iconClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.01em] text-white/45">
          {row.label}
        </p>
        <div className="mt-1 flex items-center gap-2 text-sm font-bold text-white">
          {row.urgent ? (
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute h-3 w-3 animate-pulse-ring rounded-full bg-danger" />
              <span className="relative h-2 w-2 rounded-full bg-danger" />
            </span>
          ) : null}
          <span className={cn("truncate", row.urgent && "text-danger")}>{row.value}</span>
        </div>
      </div>
    </motion.div>
  );
}

function SeverityBar({ score }) {
  const normalized = Math.max(0, Math.min(10, Math.round(score)));

  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-3 w-1.5 rounded-sm",
              index < normalized ? "bg-accent" : "bg-white/15",
            )}
          />
        ))}
      </span>
      <span className="font-mono text-sm text-white">{normalized}/10</span>
    </span>
  );
}

function RoutingPhase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="relative flex min-h-[360px] flex-col items-center justify-center overflow-hidden text-center"
    >
      <div className="absolute left-12 right-12 top-24 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <motion.div
        initial={{ x: -132, opacity: 0 }}
        animate={{ x: 132, opacity: [0, 1, 0] }}
        transition={{ duration: 0.62, ease: "easeIn" }}
        className="absolute top-[91px] h-2 w-2 rounded-full bg-primary shadow-[0_0_20px_rgba(27,79,216,0.9)]"
      />
      <motion.div
        initial={{ x: 0, y: 0, rotate: -12, scale: 1 }}
        animate={{ x: 140, y: -132, rotate: 28, scale: 0.7, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeIn" }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-[0_0_36px_rgba(27,79,216,0.52)]"
      >
        <Send className="h-7 w-7" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0.7, scale: 0.98 }}
        animate={{ opacity: [0.7, 1, 0.7], scale: [0.98, 1.02, 1] }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
        className="mt-8"
      >
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-white">
          Routing complaint to PWD...
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Creating the citizen ticket and notifying the responsible department.
        </p>
      </motion.div>
    </motion.div>
  );
}

function Label({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.01em] text-white/45">
      {children}
    </p>
  );
}
