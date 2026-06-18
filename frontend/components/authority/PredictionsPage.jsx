"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  ArrowUp,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  Download,
  Droplets,
  Grid3X3,
  ListChecks,
  Map,
  RefreshCcw,
  Send,
  TrendingUp,
  Trash2,
  Truck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/design-system/Button";
import { NoPredictions } from "@/components/design-system/EmptyStates";
import { ToastProvider, useToast } from "@/components/design-system/ToastSystem";
import { mockPredictions } from "@/src/data/mockPredictions";
import { useCountUp } from "@/src/hooks/useCountUp";

const navItems = [
  { label: "Overview", icon: Grid3X3, href: "/dashboard" },
  { label: "Complaints", icon: ListChecks, badge: "127", href: "/dashboard" },
  { label: "Heatmap", icon: Map, href: "/dashboard" },
  { label: "Departments", icon: Building2, href: "/dashboard" },
  { label: "Predictions", icon: TrendingUp, badge: "NEW", badgeTone: "amber", href: "/predictions", active: true },
  { label: "Analytics", icon: BarChart3, href: "/predictions" },
];

const PredictionMap = dynamic(() => import("@/components/authority/PredictionMapClient"), {
  ssr: false,
  loading: () => <PredictionMapSkeleton />,
});

const recurringHotspots = [
  { location: "Chandni Chowk", count: 74 },
  { location: "Karol Bagh", count: 63 },
  { location: "Lajpat Nagar", count: 58 },
  { location: "Pitampura", count: 47 },
  { location: "Noida Sector 18", count: 41 },
];

const iconMap = {
  water: Droplets,
  streetlight: Zap,
  road: Truck,
  sanitation: Trash2,
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function departmentForPrediction(prediction) {
  const value = prediction.predicted_issue.toLowerCase();
  if (value.includes("water") || value.includes("drain")) return "Delhi Jal Board";
  if (value.includes("streetlight") || value.includes("utility")) return "Electricity Department";
  return "PWD";
}

function issueIconForPrediction(prediction) {
  const value = prediction.predicted_issue.toLowerCase();
  if (value.includes("water") || value.includes("drain")) return "water";
  if (value.includes("streetlight") || value.includes("utility")) return "streetlight";
  if (value.includes("garbage") || value.includes("waste")) return "sanitation";
  return "road";
}

function PredictionIssueIcon({ prediction, className }) {
  const iconKey = issueIconForPrediction(prediction);
  const Icon = iconMap[iconKey];
  return <Icon className={className} />;
}

function AnimatedInlineNumber({ value, suffix = "", decimals = 0 }) {
  const [observeCount, formattedValue] = useCountUp(value, 1400, 120, decimals);

  return (
    <span ref={observeCount}>
      {formattedValue}
      {suffix}
    </span>
  );
}

function locationShortName(locationName) {
  return locationName.replace(" Central Market", "").replace(" TV Tower Road", "");
}

function generateAccuracyData() {
  const today = new Date();

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - index));
    const predicted = 42 + ((index * 7) % 31) + Math.round(Math.sin(index / 2.3) * 5);
    const delta = Math.round(Math.cos(index / 3) * 6 + ((index % 4) - 1));
    const actual = Math.max(18, predicted + delta);
    const accuracy = Math.max(72, Math.round(100 - (Math.abs(predicted - actual) / actual) * 100));

    return {
      date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      predicted,
      actual,
      errorLow: Math.min(predicted, actual),
      errorBand: Math.abs(predicted - actual),
      accuracy,
      showTick: index % 5 === 0,
    };
  });
}

export default function PredictionsPage() {
  return (
    <ToastProvider>
      <PredictionsPageContent />
    </ToastProvider>
  );
}

function PredictionsPageContent() {
  return (
    <main className="min-h-screen bg-[#F1F5F9] text-text-primary">
      <Sidebar />
      <TopHeader />

      <section className="min-h-screen pl-[240px] pt-16">
        <PredictionsWorkspace />
      </section>
    </main>
  );
}

export function PredictionsWorkspace() {
  return (
    <div className="space-y-6 p-6 pb-12">
      <PageHeader />
      <PredictionMap />
      <PredictionCards />
      <AccuracyChart />
      <RecurringIssuesPanel />
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col bg-[#0F1729] text-white">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-button bg-primary shadow-[0_0_24px_rgba(27,79,216,0.35)]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-bold tracking-[-0.02em]">Civic Copilot</p>
            <p className="text-xs text-white/45">Delhi Command</p>
          </div>
        </div>
        <div className="mt-6 h-px bg-white/10" />
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.35]">
          Authority Portal
        </p>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "mb-1 flex h-11 w-full items-center gap-3 rounded-r-button px-3 text-sm font-semibold transition duration-[120ms] ease-in-out",
                item.active
                  ? "border-l-[3px] border-primary bg-primary-light/15 text-primary"
                  : "border-l-[3px] border-transparent text-white/72 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge ? (
                <span
                  className={cn(
                    "rounded-badge px-2 py-0.5 text-[10px] font-bold",
                    item.badgeTone === "amber"
                      ? "bg-accent text-white"
                      : "bg-white/10 text-white",
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="mb-5 h-px bg-white/10" />
        <div className="flex items-center gap-3">
          <span className="relative flex h-4 w-4 items-center justify-center">
            <span className="absolute h-4 w-4 animate-pulse-ring rounded-full bg-success" />
            <span className="relative h-2 w-2 rounded-full bg-success" />
          </span>
          <div>
            <p className="text-sm font-bold">Prediction Model</p>
            <p className="mt-1 text-xs text-white/45">Monitoring 90-day signals</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopHeader() {
  return (
    <header className="fixed left-[240px] right-0 top-0 z-30 h-16 border-b border-border bg-white">
      <div className="flex h-full items-center justify-between px-6">
        <div>
          <h1 className="text-lg font-bold tracking-[-0.02em] text-text-primary">Predictions</h1>
          <p className="mt-0.5 text-xs font-medium text-text-muted">
            Tuesday, 16 June 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center rounded-button border border-border bg-white text-text-secondary transition duration-150 ease-in-out hover:bg-primary-light hover:text-primary active:scale-[0.98]"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              3
            </span>
          </button>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-button border border-border bg-white text-text-secondary transition duration-150 ease-in-out hover:bg-primary-light hover:text-primary active:scale-[0.98]"
            aria-label="Refresh predictions"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function PageHeader() {
  return (
    <section className="flex items-start justify-between gap-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text-primary">
          Predictive Intelligence
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
          Civic Copilot analyzes 90 days of complaint patterns to predict areas at risk before they become critical.
        </p>
      </div>
      <div className="flex shrink-0 items-center rounded-[12px] border border-border bg-white/[0.95] px-5 py-3 shadow-card backdrop-blur-[8px]">
        <div className="pr-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
            Model Accuracy
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-[-0.02em] text-primary">
              <AnimatedInlineNumber value={84.3} suffix="%" decimals={1} />
            </span>
            <span className="inline-flex items-center gap-1 rounded-badge bg-success-light px-2 py-0.5 text-[10px] font-extrabold text-success">
              <TrendingUp className="h-3 w-3" />
              Good
            </span>
          </div>
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
            Trained on
          </p>
          <p className="mt-1 text-sm font-extrabold text-text-primary">
            <AnimatedInlineNumber value={12400} /> complaints
          </p>
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="pl-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
            Last updated
          </p>
          <p className="mt-1 inline-flex items-center gap-2 text-sm font-extrabold text-text-primary">
            2 hours ago
            <RefreshCcw className="h-3.5 w-3.5 text-text-muted" />
          </p>
        </div>
      </div>

    </section>
  );
}

function PredictionMapSkeleton() {
  return (
    <section className="relative h-[400px] overflow-hidden rounded-card bg-white shadow-card">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#F8FAFC_0%,#EEF3FF_48%,#F8FAFC_100%)]" />
      <div className="absolute left-4 top-4 h-16 w-48 rounded-card bg-white/85 shadow-card backdrop-blur-md" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger/[0.08] blur-xl" />
      <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.72)_50%,transparent_70%)] bg-[length:200%_100%]" />
    </section>
  );
}
function PredictionCards() {
  const [alerted, setAlerted] = useState({});
  const toast = useToast();

  function alertDepartment(prediction) {
    const department = departmentForPrediction(prediction);
    setAlerted((current) => ({ ...current, [prediction.id]: true }));
    toast.success(
      `${department} has been notified about ${locationShortName(prediction.location_name)} risk`,
      "Recommended action packet sent to the department queue.",
    );
  }

  function exportReport(prediction) {
    toast.info("Report exported", `${locationShortName(prediction.location_name)} prediction report is ready.`);
  }

  if (mockPredictions.length === 0) {
    return <NoPredictions />;
  }

  return (
    <section className="grid grid-cols-3 gap-6">
      {mockPredictions.map((prediction) => (
        <PredictionCard
          key={prediction.id}
          prediction={prediction}
          alerted={Boolean(alerted[prediction.id])}
          onAlert={() => alertDepartment(prediction)}
          onExport={() => exportReport(prediction)}
        />
      ))}
    </section>
  );
}

function PredictionCard({ prediction, alerted, onAlert, onExport }) {
  const department = departmentForPrediction(prediction);

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="rounded-card bg-white p-6 shadow-card transition duration-150 ease-in-out hover:shadow-elevated"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-text-primary">
          {prediction.location_name}
        </h2>
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-button bg-accent-50 text-accent">
          <PredictionIssueIcon prediction={prediction} className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <RiskGauge value={prediction.confidence_percentage} />
      </div>

      <div className="mt-5 h-px bg-border" />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-button border border-border bg-background p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.01em] text-text-muted">
            Complaints (30d)
          </p>
          <p className="mt-1 text-lg font-bold text-text-primary">
            {prediction.historical_complaint_count}
          </p>
        </div>
        <div className="rounded-button border border-border bg-background p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.01em] text-text-muted">
            Change
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-lg font-bold text-danger">
            <ArrowUp className="h-4 w-4" />
            {prediction.change_percentage}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="border-l-[3px] border-accent pl-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.01em] text-text-muted">
            Reasoning:
          </p>
          <p className="mt-2 text-[13px] italic leading-6 text-text-secondary">
            {prediction.reasoning}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.01em] text-text-muted">
            Recommended action:
          </p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {prediction.recommended_action}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          size="sm"
          variant={alerted ? "secondary" : "primary"}
          onClick={onAlert}
          leftIcon={<Send className="h-4 w-4" />}
          className={cn("w-full", alerted ? "text-success" : "")}
        >
          {alerted ? "Alerted" : `Alert ${department}`}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onExport}
          leftIcon={<Download className="h-4 w-4" />}
          className="w-full border border-border text-text-secondary hover:border-primary hover:bg-primary-light hover:text-primary"
        >
          Export Report
        </Button>
      </div>
    </motion.article>
  );
}

function riskGaugeColor(value) {
  if (value < 40) return "#16A34A";
  if (value < 70) return "#F59E0B";
  return "#DC2626";
}

function riskGaugeTextColor(value) {
  if (value < 40) return "fill-success";
  if (value < 70) return "fill-accent";
  return "fill-danger";
}

function RiskGauge({ value }) {
  const color = riskGaugeColor(value);

  return (
    <svg width="200" height="110" viewBox="0 0 200 110" role="img" aria-label={`Risk score ${value} out of 100`}>
      <path
        d="M20 90 A80 80 0 0 1 180 90"
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <motion.path
        d="M20 90 A80 80 0 0 1 180 90"
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        pathLength="100"
        initial={{ strokeDasharray: "0 100" }}
        animate={{ strokeDasharray: `${value} 100` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <text x="100" y="76" textAnchor="middle" className={`text-[32px] font-extrabold tracking-[-0.03em] ${riskGaugeTextColor(value)}`}>
        {value}
      </text>
      <text x="100" y="101" textAnchor="middle" className="fill-text-muted text-[10px] font-bold uppercase tracking-[0.08em]">
        Risk Score
      </text>
    </svg>
  );
}
function AccuracyChart() {
  const data = useMemo(() => generateAccuracyData(), []);

  return (
    <section className="rounded-card bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.02em] text-text-primary">
            Prediction Accuracy — Last 30 Days
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Daily comparison between forecasted risk and confirmed complaints
          </p>
        </div>
        <span className="rounded-badge bg-primary-light px-3 py-1 text-xs font-bold text-primary">
          Error band visible
        </span>
      </div>
      <div className="mt-6 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="accuracy-error-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1B4FD8" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#1B4FD8" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
              interval={4}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
            />
            <Tooltip content={<AccuracyTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="errorBand"
              stackId="1"
              stroke="none"
              fill="url(#accuracy-error-fill)"
              name="Prediction error range"
            />
            <Line
              type="monotone"
              dataKey="predicted"
              name="Predicted"
              stroke="#1B4FD8"
              strokeWidth={3}
              strokeDasharray="8 6"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#475569"
              strokeWidth={3}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function AccuracyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const values = Object.fromEntries(payload.map((entry) => [entry.dataKey, entry.value]));
  const accuracy = payload[0]?.payload?.accuracy;

  return (
    <div className="rounded-button border border-border bg-white p-3 shadow-elevated">
      <p className="text-sm font-bold text-text-primary">{label}</p>
      <p className="mt-2 text-xs font-semibold text-primary">Predicted: {values.predicted}</p>
      <p className="mt-1 text-xs font-semibold text-text-secondary">Actual: {values.actual}</p>
      <p className="mt-1 text-xs font-bold text-success">Accuracy: {accuracy}%</p>
    </div>
  );
}

function RecurringIssuesPanel() {
  return (
    <section className="rounded-card bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.02em] text-text-primary">
            Top 5 Recurring Hotspots — Last 90 Days
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Locations with repeated civic stress signals across departments
          </p>
        </div>
        <button className="flex h-9 items-center gap-2 rounded-button border border-border bg-white px-3 text-xs font-bold text-text-secondary transition duration-150 ease-in-out hover:bg-primary-light hover:text-primary active:scale-[0.98]">
          Sort by count
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-6 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={recurringHotspots} layout="vertical" margin={{ top: 8, right: 40, left: 32, bottom: 8 }}>
            <defs>
              <linearGradient id="recurring-bar-fill" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1B4FD8" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 4" horizontal={false} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
            />
            <YAxis
              type="category"
              dataKey="location"
              width={128}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#0F172A", fontSize: 12, fontWeight: 700 }}
            />
            <Tooltip content={<RecurringTooltip />} />
            <Bar
              dataKey="count"
              fill="url(#recurring-bar-fill)"
              radius={[0, 10, 10, 0]}
              barSize={24}
              label={{ position: "right", fill: "#0F172A", fontSize: 12, fontWeight: 800 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function RecurringTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-button border border-border bg-white p-3 shadow-elevated">
      <p className="text-sm font-bold text-text-primary">{label}</p>
      <p className="mt-2 text-xs font-semibold text-primary">
        {payload[0].value} complaints in 90 days
      </p>
    </div>
  );
}
