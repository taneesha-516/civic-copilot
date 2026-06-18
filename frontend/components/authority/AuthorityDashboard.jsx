"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  ArrowUp,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Compass,
  Construction,
  Copy,
  Download,
  Droplets,
  ExternalLink,
  FileText,
  Grid3X3,
  Lightbulb,
  ListChecks,
  Map,
  MapPin,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  Truck,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/design-system/Badge";
import { Button } from "@/components/design-system/Button";
import { NoComplaintsFound } from "@/components/design-system/EmptyStates";
import { ToastProvider, useToast } from "@/components/design-system/ToastSystem";
import { PredictionsWorkspace } from "@/components/authority/PredictionsPage";
import ComplaintSubmission from "@/components/citizen/ComplaintSubmission";
import { useComplaints } from "@/src/contexts/ComplaintsContext";
import { useCountUp } from "@/src/hooks/useCountUp";

const navItems = [
  { label: "Overview", page: "overview", icon: Grid3X3 },
  { label: "Complaints", page: "complaints", icon: ListChecks, badge: "127" },
  { label: "Heatmap", page: "heatmap", icon: Map },
  { label: "Departments", page: "departments", icon: Building2 },
  { label: "Predictions", page: "predictions", icon: TrendingUp, badge: "NEW", badgeTone: "amber" },
  { label: "Analytics", page: "analytics", icon: BarChart3 },
];

const pageTitles = {
  overview: "Overview",
  complaints: "Complaints",
  heatmap: "Heatmap",
  departments: "Departments",
  predictions: "Predictions",
  analytics: "Analytics",
};

const DelhiHeatMap = dynamic(() => import("@/components/authority/DelhiHeatMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

const sparklineData = [
  { day: "Wed", total: 88, critical: 9, resolved: 31, response: 4.3 },
  { day: "Thu", total: 96, critical: 11, resolved: 34, response: 4.1 },
  { day: "Fri", total: 104, critical: 12, resolved: 38, response: 3.9 },
  { day: "Sat", total: 81, critical: 8, resolved: 29, response: 3.7 },
  { day: "Sun", total: 72, critical: 7, resolved: 24, response: 3.6 },
  { day: "Mon", total: 113, critical: 13, resolved: 39, response: 3.4 },
  { day: "Tue", total: 127, critical: 14, resolved: 43, response: 3.2 },
];

const departments = [
  {
    id: "PWD",
    name: "PWD (Roads)",
    count: 43,
    critical: 8,
    icon: Truck,
    color: "text-primary",
    bar: "bg-primary",
  },
  {
    id: "Water Dept",
    name: "Water Dept",
    count: 28,
    critical: 3,
    icon: Droplets,
    color: "text-cyan-500",
    bar: "bg-cyan-500",
  },
  {
    id: "Utility Dept",
    name: "Utility Dept",
    count: 19,
    critical: 2,
    icon: Zap,
    color: "text-accent",
    bar: "bg-accent",
  },
  {
    id: "Municipal",
    name: "Municipal (Sanitation)",
    count: 37,
    critical: 1,
    icon: Trash2,
    color: "text-success",
    bar: "bg-success",
  },
];

const complaints = [
  {
    rank: 1,
    ticket: "CCP-2847",
    issue: "Pothole",
    type: "roads",
    department: "PWD",
    location: "Rajiv Chowk, Connaught Place",
    severity: "critical",
    priorityScore: 94,
    submitted: "08:42",
    status: "Under Review",
    urgency: "HIGH",
    lat: 28.6328,
    lng: 77.2197,
    photo: "/issues/delhi-pothole-evidence.png",
    text: "There is a large pothole near Rajiv Chowk metro exit gate 4. Motorcycles are swerving dangerously and rainwater has collected inside it.",
  },
  {
    rank: 2,
    ticket: "CCP-2841",
    issue: "Garbage overflow",
    type: "sanitation",
    department: "Municipal",
    location: "Chandni Chowk, Town Hall",
    severity: "critical",
    priorityScore: 91,
    submitted: "09:08",
    status: "Department Assigned",
    urgency: "HIGH",
    lat: 28.6559,
    lng: 77.2310,
    photo: "/issues/delhi-pothole-evidence.png",
    text: "Waste has overflowed beside the market lane and is blocking pedestrian access near Town Hall.",
  },
  {
    rank: 3,
    ticket: "CCP-2836",
    issue: "Water leakage",
    type: "water",
    department: "Water Dept",
    location: "Lajpat Nagar II Market",
    severity: "high",
    priorityScore: 86,
    submitted: "09:31",
    status: "Under Review",
    urgency: "HIGH",
    lat: 28.5678,
    lng: 77.2435,
    photo: "/issues/delhi-pothole-evidence.png",
    text: "Continuous water leakage from the main line near the market entrance is flooding the road.",
  },
  {
    rank: 4,
    ticket: "CCP-2829",
    issue: "Streetlight outage",
    type: "electricity",
    department: "Utility Dept",
    location: "Dwarka Sector 10",
    severity: "high",
    priorityScore: 79,
    submitted: "10:02",
    status: "Open",
    urgency: "MEDIUM",
    lat: 28.5811,
    lng: 77.0570,
    photo: "/issues/delhi-pothole-evidence.png",
    text: "Three streetlights are not working on the service road near the metro station.",
  },
  {
    rank: 5,
    ticket: "CCP-2823",
    issue: "Broken drain cover",
    type: "roads",
    department: "PWD",
    location: "Karol Bagh, Ajmal Khan Road",
    severity: "medium",
    priorityScore: 71,
    submitted: "10:19",
    status: "Field Team Notified",
    urgency: "MEDIUM",
    lat: 28.6517,
    lng: 77.1907,
    photo: "/issues/delhi-pothole-evidence.png",
    text: "Drain cover is broken near a busy pedestrian crossing and could injure people.",
  },
  {
    rank: 6,
    ticket: "CCP-2818",
    issue: "Sewage smell",
    type: "water",
    department: "Water Dept",
    location: "Saket, PVR Anupam",
    severity: "medium",
    priorityScore: 62,
    submitted: "10:47",
    status: "Open",
    urgency: "LOW",
    lat: 28.5244,
    lng: 77.2066,
    photo: "/issues/delhi-pothole-evidence.png",
    text: "Strong sewage smell from an open utility chamber beside the main lane.",
  },
  {
    rank: 7,
    ticket: "CCP-2812",
    issue: "Illegal dumping",
    type: "sanitation",
    department: "Municipal",
    location: "Rohini Sector 7",
    severity: "low",
    priorityScore: 48,
    submitted: "11:12",
    status: "Resolved",
    urgency: "LOW",
    lat: 28.7115,
    lng: 77.1171,
    photo: "/issues/delhi-pothole-evidence.png",
    text: "Construction debris was dumped beside the park wall overnight.",
  },
  {
    rank: 8,
    ticket: "CCP-2806",
    issue: "Power box exposed",
    type: "electricity",
    department: "Utility Dept",
    location: "Noida Sector 18 Border",
    severity: "critical",
    priorityScore: 89,
    submitted: "11:28",
    status: "Department Assigned",
    urgency: "HIGH",
    lat: 28.5700,
    lng: 77.3260,
    photo: "/issues/delhi-pothole-evidence.png",
    text: "Electrical junction box is open near the crossing and wires are visible.",
  },
];

const departmentNameToId = {
  "Public Works Department": "PWD",
  "Delhi Jal Board": "Water Dept",
  "Electricity Department": "Utility Dept",
  "Municipal Sanitation Department": "Municipal",
};

function normalizeMockComplaint(complaint, index) {
  const departmentId = departmentNameToId[complaint.department] ?? complaint.department;
  const priorityScore = Math.max(1, Math.min(96, Math.round(complaint.priority_score ?? complaint.priorityScore ?? 50)));

  return {
    ...complaint,
    rank: index + 1,
    ticket: complaint.ticket ?? complaint.ticket_id,
    issue: complaint.issue ?? complaint.issue_type,
    type: complaint.type === "electrical" ? "electricity" : complaint.type,
    department: departmentId,
    departmentName: complaint.department,
    location: complaint.location ?? complaint.location_name,
    lat: complaint.lat ?? complaint.latitude,
    lng: complaint.lng ?? complaint.longitude,
    photo: complaint.photo ?? complaint.photo_url,
    text: complaint.text ?? complaint.description,
    formalComplaint: complaint.formal_complaint,
    priorityScore,
    severityScore: complaint.severity_score,
    confidence: complaint.ai_analysis?.confidence_score
      ? Math.round(complaint.ai_analysis.confidence_score * 100)
      : undefined,
  };
}

function normalizeComplaintsForDashboard(sourceComplaints) {
  return sourceComplaints
    .map(normalizeMockComplaint)
    .sort((first, second) => second.priorityScore - first.priorityScore)
    .map((complaint, index) => ({ ...complaint, rank: index + 1 }));
}

const issueIconMap = {
  roads: {
    icon: Construction,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  water: {
    icon: Droplets,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  electricity: {
    icon: Lightbulb,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  sanitation: {
    icon: Trash2,
    color: "text-success",
    bg: "bg-success-light",
  },
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const percentWidthClassMap = {
  15: "w-[15%]",
  22: "w-[22%]",
  28: "w-[28%]",
  29: "w-[29%]",
  34: "w-[34%]",
  48: "w-[48%]",
  62: "w-[62%]",
  71: "w-[71%]",
  79: "w-[79%]",
  84: "w-[84%]",
  86: "w-[86%]",
  89: "w-[89%]",
  91: "w-[91%]",
  94: "w-[94%]",
  96: "w-[96%]",
};

function percentWidthClass(value) {
  return percentWidthClassMap[value] ?? "w-full";
}

function Sparkline({ dataKey, color }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="h-9 w-20">
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <XAxis dataKey="day" hide />
            <YAxis hide />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full w-full rounded-button bg-slate-100" />
      )}
    </div>
  );
}

function AnimatedStatValue({ value, suffix = "", decimals = 0, className, delay = 0 }) {
  const [observeCount, formattedValue] = useCountUp(value, 1500, delay, decimals);

  return (
    <span ref={observeCount} className={className}>
      {formattedValue}
      {suffix}
    </span>
  );
}

export default function AuthorityDashboard({ onNewComplaint }) {
  return (
    <ToastProvider>
      <AuthorityDashboardContent onNewComplaint={onNewComplaint} />
    </ToastProvider>
  );
}

function AuthorityDashboardContent({ onNewComplaint }) {
  const { complaints: sharedComplaints, totalComplaints } = useComplaints();
  const [activePage, setActivePage] = useState("overview");
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [focusedComplaint, setFocusedComplaint] = useState(null);
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => setDashboardLoading(false), 1050);
    return () => window.clearTimeout(timer);
  }, []);

  const allComplaints = useMemo(() => {
    const normalized = normalizeComplaintsForDashboard(sharedComplaints);
    return normalized.length > 0 ? normalized : complaints;
  }, [sharedComplaints]);

  const filteredComplaints = useMemo(() => {
    const pool =
      departmentFilter === "All"
        ? allComplaints
        : allComplaints.filter((complaint) => complaint.department === departmentFilter);
    return pool.slice(0, 10);
  }, [allComplaints, departmentFilter]);

  function refreshData() {
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      toast.info(`${pageTitles[activePage]} refreshed`, "Latest Delhi complaint feed is synced.");
    }, 900);
  }

  function openComplaintsForDepartment(departmentId) {
    setDepartmentFilter(departmentId);
    setActivePage("complaints");
  }

  return (
    <main className="min-h-screen bg-[#F1F5F9] text-text-primary">
      <Sidebar
        activePage={activePage}
        totalComplaints={totalComplaints}
        onPageChange={setActivePage}
      />
      <TopHeader
        title={pageTitles[activePage]}
        refreshing={refreshing}
        onRefresh={refreshData}
        onNewComplaint={onNewComplaint ?? (() => setSubmissionOpen(true))}
      />

      <section className="min-h-screen pl-[240px] pt-[68px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {dashboardLoading && activePage === "overview" ? (
              <div className="space-y-6 p-6">
                <DashboardLoadingState />
              </div>
            ) : (
              <DashboardPageRenderer
                activePage={activePage}
                complaints={filteredComplaints}
                allComplaints={allComplaints}
                departmentFilter={departmentFilter}
                onDepartmentFilter={setDepartmentFilter}
                onDepartmentDrilldown={openComplaintsForDepartment}
                onFocusComplaint={setFocusedComplaint}
                onOpenComplaint={setSelectedComplaint}
                focusedComplaint={focusedComplaint}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {selectedComplaint ? (
          <ComplaintDetailModal
            complaint={selectedComplaint}
            onClose={() => setSelectedComplaint(null)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {submissionOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/[0.72] p-4 backdrop-blur-[4px]"
          >
            <ComplaintSubmission
              embedded
              onClose={() => setSubmissionOpen(false)}
              onSubmitted={() => {
                setActivePage("complaints");
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function DashboardPageRenderer({
  activePage,
  complaints: visibleComplaints,
  allComplaints,
  departmentFilter,
  onDepartmentFilter,
  onDepartmentDrilldown,
  onFocusComplaint,
  onOpenComplaint,
  focusedComplaint,
}) {
  if (activePage === "complaints") {
    return (
      <ComplaintsPage
        complaints={allComplaints}
        onOpenComplaint={onOpenComplaint}
      />
    );
  }

  if (activePage === "heatmap") {
    return (
      <HeatmapPage
        focusedComplaint={focusedComplaint}
        complaints={allComplaints}
      />
    );
  }

  if (activePage === "departments") {
    return <DepartmentsPage onDepartmentDrilldown={onDepartmentDrilldown} />;
  }

  if (activePage === "predictions") {
    return <PredictionsWorkspace />;
  }

  if (activePage === "analytics") {
    return <AnalyticsPage />;
  }

  return (
    <OverviewPage
      complaints={visibleComplaints}
      departmentFilter={departmentFilter}
      onDepartmentFilter={onDepartmentFilter}
      onDepartmentDrilldown={onDepartmentDrilldown}
      onFocusComplaint={onFocusComplaint}
      onOpenComplaint={onOpenComplaint}
      focusedComplaint={focusedComplaint}
      allComplaints={allComplaints}
    />
  );
}

function OverviewPage({
  complaints: visibleComplaints,
  allComplaints,
  departmentFilter,
  onDepartmentFilter,
  onDepartmentDrilldown,
  onFocusComplaint,
  onOpenComplaint,
  focusedComplaint,
}) {
  return (
    <div className="space-y-6 p-6">
      <StatsGrid totalComplaints={allComplaints.length} />

      <section className="grid h-[480px] grid-cols-[minmax(0,60fr)_minmax(360px,40fr)] gap-6">
        <DelhiHeatMap focusedComplaint={focusedComplaint} complaintPoints={allComplaints} />
        <DepartmentPanel onFilter={onDepartmentDrilldown} />
      </section>

      <PriorityQueue
        complaints={visibleComplaints}
        departmentFilter={departmentFilter}
        onDepartmentFilter={onDepartmentFilter}
        onFocusComplaint={onFocusComplaint}
        onOpenComplaint={onOpenComplaint}
      />
    </div>
  );
}

function ComplaintsPage({ complaints: allComplaints, onOpenComplaint }) {
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [dateRange, setDateRange] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const toast = useToast();
  const perPage = 10;

  const departmentOptions = [
    { value: "All", label: "All departments" },
    ...departments.map((department) => ({
      value: department.id,
      label: department.name,
    })),
  ];

  const statusOptions = [
    { value: "All", label: "All statuses" },
    { value: "Pending", label: "Pending" },
    { value: "In Progress", label: "In Progress" },
    { value: "Resolved", label: "Resolved" },
  ];

  const severityOptions = [
    { value: "All", label: "All severity" },
    { value: "critical", label: "Critical" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const dateRangeOptions = [
    { value: "all", label: "All dates" },
    { value: "24h", label: "Last 24 hours" },
    { value: "3d", label: "Last 3 days" },
    { value: "7d", label: "Last 7 days" },
  ];

  const filteredComplaints = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return allComplaints.filter((complaint) => {
      const matchesDepartment =
        departmentFilter === "All" || complaint.department === departmentFilter;
      const matchesStatus = statusFilter === "All" || complaint.status === statusFilter;
      const matchesSeverity =
        severityFilter === "All" || complaint.severity === severityFilter;
      const matchesDate = complaintWithinDateRange(complaint, dateRange);
      const searchableText = [
        complaint.ticket,
        complaint.issue,
        complaint.location,
        complaint.departmentName,
        complaint.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0 || searchableText.includes(normalizedSearch);

      return matchesDepartment && matchesStatus && matchesSeverity && matchesDate && matchesSearch;
    });
  }, [allComplaints, dateRange, departmentFilter, searchTerm, severityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / perPage));
  const pageStart = (currentPage - 1) * perPage;
  const visibleRows = filteredComplaints.slice(pageStart, pageStart + perPage);
  const visibleTickets = visibleRows.map((complaint) => complaint.ticket);
  const selectedOnPage = visibleTickets.filter((ticket) => selectedTickets.includes(ticket));
  const pageFullySelected = visibleRows.length > 0 && selectedOnPage.length === visibleRows.length;

  function resetTablePosition() {
    setCurrentPage(1);
    setSelectedTickets([]);
  }

  function updateDepartmentFilter(value) {
    setDepartmentFilter(value);
    resetTablePosition();
  }

  function updateStatusFilter(value) {
    setStatusFilter(value);
    resetTablePosition();
  }

  function updateSeverityFilter(value) {
    setSeverityFilter(value);
    resetTablePosition();
  }

  function updateDateRange(value) {
    setDateRange(value);
    resetTablePosition();
  }

  function updateSearchTerm(value) {
    setSearchTerm(value);
    resetTablePosition();
  }

  function clearFilters() {
    setDepartmentFilter("All");
    setStatusFilter("All");
    setSeverityFilter("All");
    setDateRange("all");
    setSearchTerm("");
  }

  function toggleTicket(ticket) {
    setSelectedTickets((current) =>
      current.includes(ticket)
        ? current.filter((item) => item !== ticket)
        : [...current, ticket],
    );
  }

  function toggleCurrentPage() {
    setSelectedTickets((current) => {
      if (pageFullySelected) {
        return current.filter((ticket) => !visibleTickets.includes(ticket));
      }

      return Array.from(new Set([...current, ...visibleTickets]));
    });
  }

  function exportRows(rows, filename) {
    const headers = ["Ticket", "Issue", "Location", "Department", "Severity", "Priority", "Submitted", "Status"];
    const csvRows = rows.map((complaint) => [
      complaint.ticket,
      complaint.issue,
      complaint.location,
      departmentDisplayName(complaint),
      complaint.severity,
      complaint.priorityScore,
      complaint.submitted,
      complaint.status,
    ]);
    const csv = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportFiltered() {
    exportRows(filteredComplaints, "civic-copilot-all-complaints.csv");
    toast.success("Export ready", `${filteredComplaints.length} filtered complaints exported.`);
  }

  function bulkAction(action) {
    const selectedRows = allComplaints.filter((complaint) =>
      selectedTickets.includes(complaint.ticket),
    );

    if (action === "Export") {
      exportRows(selectedRows, "civic-copilot-selected-complaints.csv");
      toast.success("Selected export ready", `${selectedRows.length} complaints exported.`);
      return;
    }

    toast.success(action, `${selectedRows.length} complaints queued for ${action.toLowerCase()}.`);
  }

  return (
    <DashboardPageShell
      title="All Complaints"
      description="Search, filter, inspect, and bulk-manage every seeded Civic Copilot complaint across Delhi."
      action={
        <span className="rounded-badge bg-primary-light px-3 py-1 text-xs font-extrabold text-primary">
          {allComplaints.length} complaints
        </span>
      }
    >
      <article className="rounded-card bg-white shadow-card">
        <div className="border-b border-border p-6">
          <div className="grid grid-cols-[172px_156px_148px_156px_minmax(220px,1fr)_auto] gap-3">
            <CustomDropdown
              value={departmentFilter}
              options={departmentOptions}
              onChange={updateDepartmentFilter}
              widthClass="w-full"
            />
            <CustomDropdown
              value={statusFilter}
              options={statusOptions}
              onChange={updateStatusFilter}
              widthClass="w-full"
            />
            <CustomDropdown
              value={severityFilter}
              options={severityOptions}
              onChange={updateSeverityFilter}
              widthClass="w-full"
            />
            <CustomDropdown
              value={dateRange}
              options={dateRangeOptions}
              onChange={updateDateRange}
              widthClass="w-full"
            />
            <label className="group relative flex h-10 items-center gap-2 rounded-button border border-border bg-white px-3 transition duration-150 ease-in-out focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(27,79,216,0.15)]">
              <Search className="h-4 w-4 text-text-muted transition duration-150 group-focus-within:text-primary" />
              <input
                value={searchTerm}
                onChange={(event) => updateSearchTerm(event.target.value)}
                placeholder="Search ticket, issue, location..."
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-muted"
              />
            </label>
            <Button
              variant="ghost"
              size="md"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={exportFiltered}
            >
              Export
            </Button>
          </div>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className="p-6">
            <NoComplaintsFound onClearFilters={clearFilters} />
          </div>
        ) : (
          <>
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="h-10 bg-background">
                  <th className="h-10 w-12 border-b-2 border-border pl-6 pr-2 text-left">
                    <input
                      type="checkbox"
                      checked={pageFullySelected}
                      onChange={toggleCurrentPage}
                      className="h-4 w-4 rounded border-border text-primary accent-primary"
                      aria-label="Select visible complaints"
                    />
                  </th>
                  {[
                    "#",
                    "Ticket ID",
                    "Issue Type",
                    "Location",
                    "Severity",
                    "Priority Score",
                    "Submitted",
                    "Status",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className={cn(
                        "h-10 border-b-2 border-border px-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted",
                        header === "Actions" && "pr-6 text-right",
                      )}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((complaint, index) => (
                  <AllComplaintRow
                    key={complaint.ticket}
                    complaint={complaint}
                    striped={index % 2 === 1}
                    selected={selectedTickets.includes(complaint.ticket)}
                    onToggleSelected={() => toggleTicket(complaint.ticket)}
                    onOpen={() => onOpenComplaint(complaint)}
                  />
                ))}
              </tbody>
            </table>
            <ComplaintsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={filteredComplaints.length}
              pageStart={pageStart}
              visibleCount={visibleRows.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </article>

      <AnimatePresence>
        {selectedTickets.length > 0 ? (
          <BulkActionBar
            count={selectedTickets.length}
            onAssign={() => bulkAction("Assign")}
            onResolve={() => bulkAction("Mark Resolved")}
            onExport={() => bulkAction("Export")}
          />
        ) : null}
      </AnimatePresence>
    </DashboardPageShell>
  );
}

function AllComplaintRow({
  complaint,
  striped,
  selected,
  onToggleSelected,
  onOpen,
}) {
  const iconConfig = issueIconMap[complaint.type] ?? {
    icon: AlertTriangle,
    color: "text-text-muted",
    bg: "bg-slate-100",
  };
  const Icon = iconConfig.icon;
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!copied) return undefined;

    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyTicket(event) {
    event.stopPropagation();
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(complaint.ticket);
      setCopied(true);
    } catch {
      toast.error("Copy failed", "Ticket ID could not be copied from this browser.");
    }
  }

  function handleMenuAction(action, event) {
    event.stopPropagation();
    event.currentTarget.closest("details")?.removeAttribute("open");

    if (action === "Copy Ticket ID") {
      copyTicket(event);
      return;
    }

    toast.info(action, `${complaint.ticket} queued for ${action.toLowerCase()}.`);
  }

  return (
    <tr
      onClick={onOpen}
      className={cn(
        "group h-16 cursor-pointer transition duration-150 ease-in-out hover:bg-primary-light",
        selected ? "bg-primary-light/70" : striped ? "bg-[#FAFBFC]" : "bg-white",
      )}
    >
      <td
        className={cn(
          "border-b border-[#F1F5F9] border-l-[3px] border-l-transparent pl-6 pr-2 transition duration-[120ms] ease-in-out",
          severityBorderClass(complaint.severity),
        )}
      >
        <input
          type="checkbox"
          checked={selected}
          onClick={(event) => event.stopPropagation()}
          onChange={onToggleSelected}
          className="h-4 w-4 rounded border-border text-primary accent-primary"
          aria-label={`Select ${complaint.ticket}`}
        />
      </td>
      <td className="border-b border-[#F1F5F9] px-4">
        <RankBadge rank={complaint.rank} />
      </td>
      <td className="border-b border-[#F1F5F9] px-4">
        <div className="relative inline-flex">
          <button
            type="button"
            onClick={copyTicket}
            className="font-mono text-sm font-extrabold text-primary underline-offset-4 transition duration-150 ease-in-out hover:underline"
          >
            {complaint.ticket}
          </button>
          <span
            className={cn(
              "pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-button bg-text-primary px-2 py-1 text-[10px] font-bold text-white shadow-card transition duration-150 ease-in-out",
              copied ? "opacity-100" : "opacity-0",
            )}
          >
            Copied!
          </span>
        </div>
      </td>
      <td className="border-b border-[#F1F5F9] px-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span className={cn("grid h-8 w-8 place-items-center rounded-button", iconConfig.bg)}>
            <Icon className={cn("h-4 w-4", iconConfig.color)} />
          </span>
          {complaint.issue}
        </div>
      </td>
      <td className="max-w-[240px] truncate border-b border-[#F1F5F9] px-4 text-sm font-medium text-text-secondary">
        {complaint.location}
      </td>
      <td className="border-b border-[#F1F5F9] px-4">
        <Badge variant={complaint.severity} className="capitalize">
          {complaint.severity}
        </Badge>
      </td>
      <td className="border-b border-[#F1F5F9] px-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-badge bg-[#F1F5F9]">
            <div
              className={cn(
                "h-full rounded-badge bg-gradient-to-r",
                priorityGradientClass(complaint.severity),
                priorityScoreWidthClass(complaint.priorityScore),
              )}
            />
          </div>
          <span className="w-7 text-xs font-extrabold text-text-secondary">
            {(complaint.priorityScore / 10).toFixed(1)}
          </span>
        </div>
      </td>
      <td className="border-b border-[#F1F5F9] px-4 text-sm font-semibold text-text-secondary">
        {complaint.submitted}
      </td>
      <td className="border-b border-[#F1F5F9] px-4">
        <StatusPill status={complaint.status} />
      </td>
      <td className="border-b border-[#F1F5F9] px-6">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            className="inline-flex h-8 items-center gap-1 rounded-button px-2 text-xs font-extrabold text-primary opacity-0 transition duration-150 ease-in-out hover:bg-primary-light group-hover:opacity-100"
          >
            View
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <details className="relative" onClick={(event) => event.stopPropagation()}>
            <summary className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-button text-text-muted opacity-40 transition duration-150 ease-in-out hover:bg-primary-light hover:text-primary hover:opacity-100 group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </summary>
            <div className="absolute right-0 top-9 z-30 w-40 overflow-hidden rounded-button border border-border bg-white py-1 shadow-elevated">
              {["Assign", "Escalate", "Mark Resolved", "Copy Ticket ID"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={(event) => handleMenuAction(item, event)}
                  className="block w-full px-3 py-2 text-left text-xs font-bold text-text-secondary transition duration-150 ease-in-out hover:bg-primary-light hover:text-primary"
                >
                  {item}
                </button>
              ))}
            </div>
          </details>
        </div>
      </td>
    </tr>
  );
}

function ComplaintsPagination({
  currentPage,
  totalPages,
  total,
  pageStart,
  visibleCount,
  onPageChange,
}) {
  const pageNumbers = paginationRange(currentPage, totalPages);
  const from = total === 0 ? 0 : pageStart + 1;
  const to = pageStart + visibleCount;

  return (
    <div className="flex h-16 items-center justify-between border-t border-[#F1F5F9] px-6">
      <p className="text-sm font-medium text-text-muted">
        Showing {from}-{to} of {total} complaints
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          Prev
        </Button>
        {pageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={cn(
              "grid h-8 min-w-8 place-items-center rounded-badge px-3 text-xs font-extrabold transition duration-150 ease-in-out",
              page === currentPage
                ? "bg-primary text-white shadow-[0_8px_18px_rgba(27,79,216,0.18)]"
                : "border border-border bg-white text-text-secondary hover:bg-primary-light hover:text-primary",
            )}
          >
            {page}
          </button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function BulkActionBar({ count, onAssign, onResolve, onExport }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed bottom-6 left-[calc(50%+120px)] z-40 flex -translate-x-1/2 items-center gap-3 rounded-modal border border-white/70 bg-white/95 px-4 py-3 shadow-modal backdrop-blur-md"
    >
      <span className="rounded-badge bg-primary-light px-3 py-1 text-sm font-extrabold text-primary">
        {count} selected
      </span>
      <Button size="sm" variant="secondary" leftIcon={<Building2 className="h-4 w-4" />} onClick={onAssign}>
        Assign
      </Button>
      <Button size="sm" variant="secondary" leftIcon={<CheckCircle2 className="h-4 w-4" />} onClick={onResolve}>
        Mark Resolved
      </Button>
      <Button size="sm" variant="ghost" leftIcon={<Download className="h-4 w-4" />} onClick={onExport}>
        Export
      </Button>
    </motion.div>
  );
}

function paginationRange(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

function complaintWithinDateRange(complaint, dateRange) {
  if (dateRange === "all") return true;

  const submittedAt = new Date(complaint.submitted_at);
  const now = new Date();
  const hours =
    dateRange === "24h" ? 24 : dateRange === "3d" ? 72 : 168;

  return now.getTime() - submittedAt.getTime() <= hours * 60 * 60 * 1000;
}

const heatmapDepartmentCategoryMap = {
  All: "All",
  PWD: "Roads",
  "Water Dept": "Water",
  "Utility Dept": "Electricity",
  Municipal: "Sanitation",
};

const heatmapSeverityOptions = [
  { value: "All", label: "All severity" },
  { value: "critical", label: "Critical" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const heatmapAreaStats = [
  { area: "Connaught Place", count: 25, tone: "bg-danger" },
  { area: "Chandni Chowk", count: 20, tone: "bg-danger" },
  { area: "Karol Bagh", count: 15, tone: "bg-accent" },
  { area: "Rohini", count: 10, tone: "bg-primary" },
  { area: "South Delhi", count: 10, tone: "bg-success" },
];

function HeatmapPage({ focusedComplaint, complaints: allComplaints }) {
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [dateDays, setDateDays] = useState(7);
  const [showPredictions, setShowPredictions] = useState(true);

  const departmentOptions = [
    { value: "All", label: "All departments" },
    ...departments.map((department) => ({
      value: department.id,
      label: department.name,
    })),
  ];

  function resetMapFilters() {
    setDepartmentFilter("All");
    setSeverityFilter("All");
    setDateDays(7);
  }

  return (
    <div className="flex h-[calc(100vh-68px)] flex-col gap-4 p-6">
      <section className="flex shrink-0 items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-text-primary">
            Heatmap
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            Live complaint density across Delhi, with department filters and predictive risk markers layered over CartoDB Positron.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-badge bg-success-light px-4 py-2 text-sm font-extrabold text-success">
          <span className="h-2 w-2 animate-sidebar-pulse-ring rounded-full bg-success" />
          {allComplaints.length} active complaints
        </span>
      </section>

      <section className="min-h-0 flex-1">
        <DelhiHeatMap
          focusedComplaint={focusedComplaint}
          heightClass="h-full"
          className="border-border shadow-elevated"
          showOverviewControls={false}
          complaintPoints={allComplaints}
          categoryFilter={heatmapDepartmentCategoryMap[departmentFilter]}
          severityFilter={severityFilter}
          daysFilter={dateDays}
          predictionsVisible={showPredictions}
          onPredictionsVisibleChange={setShowPredictions}
          onShowAllCategories={resetMapFilters}
        >
          <HeatmapFilterPanel
            departmentFilter={departmentFilter}
            departmentOptions={departmentOptions}
            severityFilter={severityFilter}
            dateDays={dateDays}
            onDepartmentFilter={setDepartmentFilter}
            onSeverityFilter={setSeverityFilter}
            onDateDays={setDateDays}
          />
          <HeatmapLegendPanel
            showPredictions={showPredictions}
            onTogglePredictions={() => setShowPredictions((value) => !value)}
          />
          <HeatmapAreaStatsStrip />
        </DelhiHeatMap>
      </section>
    </div>
  );
}

function HeatmapFilterPanel({
  departmentFilter,
  departmentOptions,
  severityFilter,
  dateDays,
  onDepartmentFilter,
  onSeverityFilter,
  onDateDays,
}) {
  return (
    <aside className="absolute left-4 top-4 z-[820] w-[288px] rounded-card border border-white/70 bg-white/[0.88] p-4 shadow-elevated backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-text-muted">
            Map Controls
          </p>
          <h2 className="mt-1 text-base font-extrabold tracking-[-0.02em] text-text-primary">
            Complaint Layer
          </h2>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-primary-light text-primary">
          <Map className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
            Department
          </p>
          <CustomDropdown
            value={departmentFilter}
            options={departmentOptions}
            onChange={onDepartmentFilter}
            widthClass="w-full"
          />
        </div>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
            Severity
          </p>
          <CustomDropdown
            value={severityFilter}
            options={heatmapSeverityOptions}
            onChange={onSeverityFilter}
            widthClass="w-full"
          />
        </div>
        <div className="rounded-[12px] border border-border bg-white/80 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
              Date Range
            </p>
            <span className="font-mono text-xs font-extrabold text-primary">
              {dateDays}d
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="7"
            value={dateDays}
            onChange={(event) => onDateDays(Number(event.target.value))}
            className="mt-3 h-2 w-full cursor-pointer accent-primary"
            aria-label="Complaints in the last N days"
          />
          <p className="mt-2 text-xs font-semibold text-text-secondary">
            Complaints in the last {dateDays} {dateDays === 1 ? "day" : "days"}
          </p>
        </div>
      </div>
    </aside>
  );
}

function HeatmapLegendPanel({ showPredictions, onTogglePredictions }) {
  return (
    <aside className="absolute right-4 top-4 z-[820] w-[288px] rounded-card border border-white/70 bg-white/[0.88] p-4 shadow-elevated backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-text-muted">
            Density Legend
          </p>
          <h2 className="mt-1 text-base font-extrabold tracking-[-0.02em] text-text-primary">
            Heat Intensity
          </h2>
        </div>
        <span className="rounded-badge bg-danger-light px-2.5 py-1 text-[10px] font-extrabold text-danger">
          Live
        </span>
      </div>

      <div className="mt-4">
        <div className="h-3 rounded-badge bg-gradient-to-r from-[#3B82F6] via-accent to-danger shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]" />
        <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
          <span>Blue low density</span>
          <span>Red high density</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {[
          ["bg-[#3B82F6]", "Sparse complaints"],
          ["bg-[#8B5CF6]", "Moderate cluster"],
          ["bg-accent", "Dense civic load"],
          ["bg-danger", "Critical hotspot"],
        ].map(([colorClass, label]) => (
          <div key={label} className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span className="inline-flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", colorClass)} />
              {label}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onTogglePredictions}
        className="mt-4 flex h-11 w-full items-center justify-between rounded-button border border-border bg-white px-3 text-sm font-extrabold text-text-primary transition duration-150 ease-in-out hover:bg-primary-light active:scale-[0.98]"
        aria-pressed={showPredictions}
      >
        <span className="inline-flex items-center gap-2">
          <Bell className={cn("h-4 w-4", showPredictions ? "text-danger" : "text-text-muted")} />
          Show predictions
        </span>
        <span
          className={cn(
            "relative h-6 w-11 rounded-full transition duration-150 ease-in-out",
            showPredictions ? "bg-primary" : "bg-slate-300",
          )}
        >
          <span
            className={cn(
              "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition duration-150 ease-in-out",
              showPredictions ? "left-6" : "left-1",
            )}
          />
        </span>
      </button>
    </aside>
  );
}

function HeatmapAreaStatsStrip() {
  return (
    <div className="absolute bottom-4 left-4 z-[820] flex max-w-[calc(100%-120px)] flex-wrap gap-2 rounded-[12px] border border-white/70 bg-white/[0.88] p-2 shadow-elevated backdrop-blur-md">
      {heatmapAreaStats.map((item) => (
        <div
          key={item.area}
          className="flex min-h-12 min-w-[156px] items-center justify-between gap-4 rounded-button border border-border bg-white/80 px-3"
        >
          <span className="inline-flex items-center gap-2 text-xs font-extrabold text-text-primary">
            <span className={cn("h-2.5 w-2.5 rounded-full", item.tone)} />
            {item.area}
          </span>
          <span className="font-mono text-sm font-extrabold text-primary">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function DepartmentsPage({ onDepartmentDrilldown }) {
  return (
    <DashboardPageShell
      title="Department Command"
      description="Monitor workload, critical load, and response ownership across Delhi civic departments."
    >
      <section className="grid grid-cols-2 gap-6">
        {departments.map((department) => {
          const Icon = department.icon;
          const width = Math.round((department.count / 127) * 100);
          return (
            <article
              key={department.id}
              className="rounded-card bg-white p-6 shadow-card transition duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn("grid h-12 w-12 place-items-center rounded-[12px] bg-slate-100", department.color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-[-0.02em] text-text-primary">
                      {department.name}
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      Officer desk synced 2 minutes ago
                    </p>
                  </div>
                </div>
                <span className="rounded-badge bg-danger-light px-3 py-1 text-xs font-extrabold text-danger">
                  {department.critical} critical
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <DepartmentMiniMetric label="Queue" value={department.count} />
                <DepartmentMiniMetric label="SLA" value={`${Math.max(71, 92 - department.critical * 3)}%`} />
                <DepartmentMiniMetric label="Avg response" value={`${(2.8 + department.critical * 0.22).toFixed(1)}h`} />
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
                  <span>Citywide share</span>
                  <span>{width}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-badge bg-slate-100">
                  <div className={cn("h-full rounded-badge", department.bar, percentWidthClass(width))} />
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="mt-6 text-primary hover:bg-primary-light"
                onClick={() => onDepartmentDrilldown(department.id)}
              >
                Open complaint queue
              </Button>
            </article>
          );
        })}
      </section>
    </DashboardPageShell>
  );
}

function AnalyticsPage() {
  return (
    <DashboardPageShell
      title="Analytics"
      description="Cross-department trends, SLA forecasting, and ward-level performance analytics are queued for the next build."
      action={
        <span className="rounded-badge bg-accent-50 px-3 py-1 text-xs font-extrabold text-accent">
          Coming soon
        </span>
      }
    >
      <section className="overflow-hidden rounded-card bg-white shadow-card">
        <div className="border-b border-border p-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold tracking-[-0.02em] text-text-primary">
                Analytics workspace is being prepared
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                This view will combine resolution velocity, ward load, department SLA drift, and repeat-location trends into one executive dashboard.
              </p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-[14px] bg-primary-light text-primary">
              <BarChart3 className="h-7 w-7" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_340px] gap-6 p-6">
          <div className="rounded-card border border-border bg-background p-5">
            <div className="flex h-[260px] items-end gap-3">
              {[44, 62, 51, 76, 68, 84, 72, 91, 78, 88, 95, 82].map((height, index) => (
                <div key={index} className="flex flex-1 items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-button bg-gradient-to-t from-primary to-[#60A5FA]",
                      percentHeightClass(height),
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <AnalyticsPreviewMetric label="SLA prediction" value="87%" tone="primary" />
            <AnalyticsPreviewMetric label="Repeat hotspots" value="14" tone="danger" />
            <AnalyticsPreviewMetric label="Resolved trend" value="+22%" tone="success" />
          </div>
        </div>
      </section>
    </DashboardPageShell>
  );
}

function DashboardPageShell({ title, description, action, children }) {
  return (
    <div className="space-y-6 p-6 pb-12">
      <section className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-text-primary">
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </section>
      {children}
    </div>
  );
}

function DepartmentMiniMetric({ label, value }) {
  return (
    <div className="rounded-button border border-border bg-background p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-lg font-extrabold tracking-[-0.02em] text-text-primary">
        {value}
      </p>
    </div>
  );
}

function AnalyticsPreviewMetric({ label, value, tone }) {
  return (
    <div className="rounded-card border border-border bg-white p-4 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-3xl font-extrabold tracking-[-0.03em]",
          tone === "danger" && "text-danger",
          tone === "success" && "text-success",
          tone === "primary" && "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}

const percentHeightClassMap = {
  44: "h-[44%]",
  51: "h-[51%]",
  62: "h-[62%]",
  68: "h-[68%]",
  72: "h-[72%]",
  76: "h-[76%]",
  78: "h-[78%]",
  82: "h-[82%]",
  84: "h-[84%]",
  88: "h-[88%]",
  91: "h-[91%]",
  95: "h-[95%]",
};

function percentHeightClass(value) {
  return percentHeightClassMap[value] ?? "h-full";
}

function Sidebar({ activePage, totalComplaints, onPageChange }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col bg-[#0F1729] text-white">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-button bg-gradient-to-br from-primary to-[#3B6FE8] shadow-[0_12px_28px_rgba(27,79,216,0.28)]">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[15px] font-bold leading-5 tracking-[-0.02em] text-white">Civic Copilot</p>
            <p className="text-xs leading-5 text-white/50">Delhi Command</p>
          </div>
        </div>
        <div className="mt-6 h-px w-full bg-white/[0.08]" />
        <div className="mt-6 flex items-center gap-2">
          <span className="h-px flex-1 bg-white/[0.08]" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/[0.35]">
            Authority Portal
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.page === activePage;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onPageChange(item.page)}
              className={cn(
                "relative mb-1 flex h-11 w-full items-center gap-3 rounded-r-button px-3 text-sm font-semibold transition duration-150 ease-in-out",
                active
                  ? "border-l-[3px] border-primary bg-[rgba(99,179,237,0.12)] text-[#60A5FA]"
                  : "border-l-[3px] border-transparent text-white/[0.55] hover:bg-white/[0.08] hover:text-white/[0.85]",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {active ? (
                <span className="absolute right-3 h-1 w-1 rounded-full bg-[#60A5FA] shadow-[0_0_10px_rgba(96,165,250,0.9)]" />
              ) : null}
              {item.badge ? (
                <span
                  className={cn(
                    "rounded-badge px-2 py-0.5 text-[10px] font-bold",
                    item.badgeTone === "amber"
                      ? "bg-accent text-white shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      : "bg-[rgba(96,165,250,0.2)] text-[#60A5FA]",
                  )}
                >
                  {item.page === "complaints" ? totalComplaints : item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="mb-5 h-px w-full bg-white/[0.08]" />
        <div className="flex items-center gap-3">
          <span className="flex h-4 w-4 items-center justify-center">
            <span className="h-2 w-2 animate-sidebar-pulse-ring rounded-full bg-[#22C55E]" />
          </span>
          <div>
            <p className="text-[13px] font-medium leading-5 text-white">System Active</p>
            <p className="text-[11px] leading-5 text-white/40">Last sync: 2 minutes ago</p>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-card bg-white/[0.05] p-3 transition duration-150 ease-in-out hover:bg-white/[0.07]">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1B4FD8] to-[#60A5FA] text-sm font-bold text-white shadow-[0_8px_20px_rgba(27,79,216,0.28)]">
            PS
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-5 text-white">Priya Sharma</p>
            <p className="truncate text-[11px] leading-5 text-white/45">Delhi Municipal Corp.</p>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-button text-white/30 transition duration-150 ease-in-out hover:bg-white/[0.08] hover:text-white/80"
            aria-label="User settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function TopHeader({ title, refreshing, onRefresh, onNewComplaint }) {
  return (
    <header className="fixed left-[240px] right-0 top-0 z-30 h-[68px] bg-white shadow-[0_1px_0_#E2E8F0]">
      <div className="flex h-full items-center justify-between px-6">
        <div>
          <h1 className="text-xl font-bold leading-6 tracking-[-0.01em] text-text-primary">
            {title}
          </h1>
          <p className="mt-1 text-[13px] font-medium leading-5 text-text-muted">
            Tuesday, 16 June 2026
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={onNewComplaint}
            className="shadow-[0_8px_18px_rgba(27,79,216,0.18)]"
          >
            New Complaint
          </Button>
          <label className="group relative flex h-10 w-[320px] items-center gap-2 rounded-button border-[1.5px] border-transparent bg-[#F1F5F9] px-3 transition duration-150 ease-in-out focus-within:border-primary focus-within:bg-white">
            <Search className="h-4 w-4 text-slate-400 transition duration-150 ease-in-out group-focus-within:text-primary" />
            <input
              placeholder="Search complaints, tickets, locations..."
              className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
            <span className="grid h-6 min-w-9 place-items-center rounded-md border border-border bg-white px-1.5 font-mono text-[11px] font-bold text-text-muted transition duration-150 ease-in-out group-focus-within:border-primary/30 group-focus-within:text-primary">
              ⌘K
            </span>
          </label>

          <button
            type="button"
            className="group relative grid h-10 w-10 place-items-center rounded-button border border-border bg-white text-text-secondary transition duration-150 ease-in-out hover:bg-primary-light hover:text-primary active:scale-[0.98]"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 group-hover:animate-bell-ring" />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              6
            </span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="group grid h-10 w-10 place-items-center rounded-button border border-border bg-white text-text-secondary transition duration-150 ease-in-out hover:bg-primary-light hover:text-primary active:scale-[0.98]"
            aria-label="Refresh dashboard"
          >
            <RefreshCcw
              className={cn(
                "h-5 w-5 transition-transform duration-300 ease-in-out group-hover:rotate-[360deg]",
                refreshing && "animate-spin text-primary",
              )}
            />
          </button>
        </div>
      </div>
    </header>
  );
}

function StatsGrid({ totalComplaints = 127 }) {
  const stats = [
    {
      label: "Total Complaints Today",
      value: totalComplaints,
      icon: FileText,
      iconClass: "text-primary",
      iconBgClass: "bg-primary/[0.12]",
      cardClass: "bg-white",
      pattern: true,
      spark: "total",
      sparkColor: "#64748B",
      trend: "12% from yesterday",
      trendTone: "positive",
      trendIcon: "up",
    },
    {
      label: "Critical Priority",
      value: 14,
      icon: AlertTriangle,
      iconClass: "text-danger",
      iconBgClass: "bg-danger/[0.12]",
      numberClass: "text-danger",
      cardClass: "border-l-[3px] border-l-danger bg-[#FFF5F5]",
      spark: "critical",
      sparkColor: "#DC2626",
      trend: "Requires immediate attention",
      trendTone: "danger",
      trendIcon: "alert",
    },
    {
      label: "Resolved Today",
      value: 43,
      icon: CheckCircle2,
      iconClass: "text-success",
      iconBgClass: "bg-success/[0.12]",
      cardClass: "border-l-[3px] border-l-success bg-success-light",
      spark: "resolved",
      sparkColor: "#16A34A",
      trend: "34% resolution rate",
      trendTone: "positive",
      trendIcon: "up",
    },
    {
      label: "Avg Response Time",
      value: 3.2,
      suffix: " hrs",
      decimals: 1,
      icon: Clock3,
      iconClass: "text-primary",
      iconBgClass: "bg-primary/[0.12]",
      cardClass: "border-l-[3px] border-l-primary bg-white",
      spark: "response",
      sparkColor: "#1B4FD8",
      trend: "0.8 hrs vs last week",
      trendTone: "positive",
      trendIcon: "down",
    },
  ];

  return (
    <section className="grid grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <article
            key={stat.label}
            className={cn(
              "group relative overflow-hidden rounded-card p-6 shadow-card transition duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-elevated",
              stat.cardClass,
            )}
          >
            {stat.pattern ? (
              <div className="pointer-events-none absolute right-0 top-0 h-28 w-32 opacity-100 [background-image:repeating-linear-gradient(45deg,rgba(27,79,216,0.03)_0px,rgba(27,79,216,0.03)_2px,transparent_2px,transparent_8px)]" />
            ) : null}
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            <div className="flex items-center justify-between">
              <p className="relative text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
                {stat.label}
              </p>
              <div
                className={cn(
                  "relative grid h-10 w-10 place-items-center rounded-[12px] transition duration-150 ease-in-out group-hover:scale-105",
                  stat.iconBgClass,
                )}
              >
                <Icon className={cn("h-[22px] w-[22px]", stat.iconClass)} />
              </div>
            </div>
            <div className="relative mt-5 text-[48px] font-extrabold leading-none tracking-[-0.03em] text-text-primary">
              <AnimatedStatValue
                value={stat.value}
                suffix={stat.suffix}
                decimals={stat.decimals}
                delay={index * 90}
                className={stat.numberClass}
              />
            </div>
            <div className="relative mt-6 flex items-end justify-between gap-4">
              <Sparkline dataKey={stat.spark} color={stat.sparkColor} />
              <TrendBadge
                icon={stat.trendIcon}
                tone={stat.trendTone}
              >
                {stat.trend}
              </TrendBadge>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function TrendBadge({ icon, tone, children }) {
  const Icon =
    icon === "down" ? ArrowDownRight : icon === "alert" ? AlertTriangle : ArrowUpRight;

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-badge px-3 text-xs font-extrabold",
        tone === "danger"
          ? "bg-danger-light text-danger"
          : "bg-[#DCFCE7] text-success",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="whitespace-nowrap">{children}</span>
    </span>
  );
}

function SkeletonBlock({ className }) {
  return (
    <div
      className={cn(
        "animate-dashboard-shimmer rounded-[8px] bg-[linear-gradient(90deg,#F1F5F9_25%,#E2E8F0_50%,#F1F5F9_75%)] bg-[length:200%_auto]",
        className,
      )}
    />
  );
}

function DashboardLoadingState() {
  return (
    <>
      <StatsGridSkeleton />

      <section className="grid h-[480px] grid-cols-[minmax(0,60fr)_minmax(360px,40fr)] gap-6">
        <MapSkeleton />
        <DepartmentPanelSkeleton />
      </section>

      <PriorityQueueSkeleton />
    </>
  );
}

function StatsGridSkeleton() {
  return (
    <section className="grid grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <article
          key={index}
          className="rounded-card bg-white p-6 shadow-card"
          aria-label="Loading statistic"
        >
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-3 w-[100px]" />
            <SkeletonBlock className="h-10 w-10 rounded-[12px]" />
          </div>
          <SkeletonBlock className="mt-6 h-10 w-20" />
          <SkeletonBlock className="mt-6 h-10 w-full" />
          <SkeletonBlock className="mt-5 h-4 w-[120px]" />
        </article>
      ))}
    </section>
  );
}

function MapSkeleton() {
  return (
    <article className="relative h-full min-h-[480px] overflow-hidden rounded-card border border-border bg-[#F8FAFC] shadow-card">
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(226,232,240,0.72)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.72)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="absolute inset-0 animate-dashboard-shimmer bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.72)_50%,transparent_75%)] bg-[length:200%_auto]" />
      <div className="absolute left-4 top-4 w-[188px] rounded-[12px] border border-white/70 bg-white/85 p-4 shadow-card backdrop-blur-md">
        <SkeletonBlock className="h-3 w-[116px]" />
        <SkeletonBlock className="mt-3 h-8 w-16" />
        <SkeletonBlock className="mt-2 h-3 w-[104px]" />
      </div>
      <div className="absolute left-4 top-36 flex gap-2 rounded-[12px] border border-white/70 bg-white/80 p-2 shadow-card backdrop-blur-md">
        {["w-12", "w-14", "w-16", "w-20", "w-24"].map((widthClass) => (
          <SkeletonBlock key={widthClass} className={cn("h-8 rounded-badge", widthClass)} />
        ))}
      </div>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <Compass className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-400">Loading map data...</p>
        </div>
      </div>
    </article>
  );
}

function DepartmentPanelSkeleton() {
  return (
    <div className="grid h-full grid-rows-4 gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <article key={index} className="rounded-card bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-8 w-8 rounded-button" />
              <SkeletonBlock className="h-4 w-32" />
            </div>
            <SkeletonBlock className="h-7 w-10" />
          </div>
          <SkeletonBlock className="mt-4 h-1 w-full rounded-badge" />
          <div className="mt-4 flex items-center justify-between">
            <SkeletonBlock className="h-6 w-20 rounded-badge" />
            <SkeletonBlock className="h-4 w-12" />
          </div>
        </article>
      ))}
    </div>
  );
}

function PriorityQueueSkeleton() {
  const headers = [
    "#",
    "Ticket ID",
    "Issue Type",
    "Location",
    "Severity",
    "Priority Score",
    "Submitted",
    "Status",
    "Actions",
  ];

  return (
    <article className="rounded-card bg-white shadow-card">
      <div className="flex items-center justify-between gap-4 border-b border-border p-6">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-6 w-28 rounded-badge" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-10 w-[172px] rounded-button" />
          <SkeletonBlock className="h-10 w-[172px] rounded-button" />
          <SkeletonBlock className="h-10 w-24 rounded-button" />
        </div>
      </div>

      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr className="h-10 bg-background">
            {headers.map((header) => (
              <th
                key={header}
                className={cn(
                  "h-10 border-b-2 border-border px-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted",
                  header === "#" && "pl-6",
                  header === "Actions" && "pr-6 text-right",
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index} className={cn("h-16", index % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white")}>
              <td className="border-b border-[#F1F5F9] pl-6 pr-4">
                <SkeletonBlock className="h-7 w-7 rounded-full" />
              </td>
              <td className="border-b border-[#F1F5F9] px-4">
                <SkeletonBlock className="h-4 w-20" />
              </td>
              <td className="border-b border-[#F1F5F9] px-4">
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="h-8 w-8 rounded-button" />
                  <SkeletonBlock className="h-4 w-[100px]" />
                </div>
              </td>
              <td className="border-b border-[#F1F5F9] px-4">
                <SkeletonBlock className="h-4 w-[140px]" />
              </td>
              <td className="border-b border-[#F1F5F9] px-4">
                <SkeletonBlock className="h-6 w-[60px] rounded-badge" />
              </td>
              <td className="border-b border-[#F1F5F9] px-4">
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="h-1.5 w-16 rounded-badge" />
                  <SkeletonBlock className="h-4 w-7" />
                </div>
              </td>
              <td className="border-b border-[#F1F5F9] px-4">
                <SkeletonBlock className="h-4 w-12" />
              </td>
              <td className="border-b border-[#F1F5F9] px-4">
                <SkeletonBlock className="h-6 w-20 rounded-badge" />
              </td>
              <td className="border-b border-[#F1F5F9] px-6 text-right">
                <SkeletonBlock className="ml-auto h-8 w-16 rounded-button" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex h-16 items-center justify-between border-t border-[#F1F5F9] px-6">
        <SkeletonBlock className="h-4 w-48" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-8 w-14 rounded-button" />
          <SkeletonBlock className="h-8 w-8 rounded-badge" />
          <SkeletonBlock className="h-8 w-8 rounded-badge" />
          <SkeletonBlock className="h-8 w-14 rounded-button" />
        </div>
      </div>
    </article>
  );
}

function DepartmentPanel({ onFilter }) {
  const total = departments.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="grid h-full grid-rows-4 gap-3">
      {departments.map((department) => {
        const Icon = department.icon;
        const width = Math.round((department.count / total) * 100);
        return (
          <article
            key={department.id}
            className="rounded-card bg-white p-4 shadow-card transition duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn("grid h-8 w-8 place-items-center rounded-button bg-slate-100", department.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-bold text-text-primary">{department.name}</p>
              </div>
              <p className="text-2xl font-bold tracking-[-0.02em] text-primary">
                {department.count}
              </p>
            </div>
            <div className="mt-4 h-1 rounded-badge bg-slate-100">
              <div
                className={cn("h-1 rounded-badge", department.bar, percentWidthClass(width))}
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-badge bg-danger-light px-3 py-1 text-xs font-bold text-danger">
                {department.critical} critical
              </span>
              <button
                type="button"
                onClick={() => onFilter(department.id)}
                className="text-sm font-bold text-primary transition duration-150 ease-in-out hover:text-primary-dark hover:underline"
              >
                View all
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PriorityQueue({
  complaints: visibleComplaints,
  departmentFilter,
  onDepartmentFilter,
  onFocusComplaint,
  onOpenComplaint,
}) {
  const [statusFilter, setStatusFilter] = useState("All");
  const toast = useToast();

  const filteredComplaints = useMemo(() => {
    if (statusFilter === "All") return visibleComplaints;
    return visibleComplaints.filter((complaint) => complaint.status === statusFilter);
  }, [statusFilter, visibleComplaints]);

  const visibleRows = filteredComplaints.slice(0, 10);

  const departmentOptions = [
    { value: "All", label: "All departments" },
    ...departments.map((department) => ({
      value: department.id,
      label: department.id,
    })),
  ];

  const statusOptions = [
    { value: "All", label: "All statuses" },
    { value: "Open", label: "Open" },
    { value: "Under Review", label: "Under Review" },
    { value: "Department Assigned", label: "Assigned" },
    { value: "Field Team Notified", label: "Field Team Notified" },
    { value: "Resolved", label: "Resolved" },
  ];

  function clearFilters() {
    onDepartmentFilter("All");
    setStatusFilter("All");
  }

  function exportQueue() {
    const headers = ["Rank", "Ticket", "Issue", "Location", "Severity", "Priority", "Submitted", "Status"];
    const rows = filteredComplaints.map((complaint) => [
      complaint.rank,
      complaint.ticket,
      complaint.issue,
      complaint.location,
      complaint.severity,
      complaint.priorityScore,
      complaint.submitted,
      complaint.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "civic-copilot-priority-queue.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export ready", `${filteredComplaints.length} visible complaints exported.`);
  }

  return (
    <article className="rounded-card bg-white shadow-card">
      <div className="flex items-center justify-between gap-4 border-b border-border p-6">
        <div className="flex items-center gap-3">
          <h2 className="text-[18px] font-bold leading-none tracking-[-0.02em] text-text-primary">
            Priority Queue
          </h2>
          <span className="rounded-badge bg-primary-light px-3 py-1 text-xs font-extrabold text-primary">
            127 complaints
          </span>
        </div>
        <div className="flex items-center gap-3">
          <CustomDropdown
            value={departmentFilter}
            options={departmentOptions}
            onChange={onDepartmentFilter}
            widthClass="w-[172px]"
          />
          <CustomDropdown
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
            widthClass="w-[172px]"
          />
          <Button
            variant="ghost"
            size="md"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={exportQueue}
          >
            Export
          </Button>
        </div>
      </div>

      {filteredComplaints.length === 0 ? (
        <div className="p-6">
          <NoComplaintsFound onClearFilters={clearFilters} />
        </div>
      ) : (
        <>
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="h-10 bg-background">
                {[
                  "#",
                  "Ticket ID",
                  "Issue Type",
                  "Location",
                  "Severity",
                  "Priority Score",
                  "Submitted",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className={cn(
                      "h-10 border-b-2 border-border px-4 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted",
                      header === "#" && "pl-6",
                      header === "Actions" && "pr-6 text-right",
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((complaint, index) => (
                <ComplaintRow
                  key={complaint.ticket}
                  complaint={complaint}
                  striped={index % 2 === 1}
                  onFocus={() => onFocusComplaint(complaint)}
                  onOpen={() => onOpenComplaint(complaint)}
                />
              ))}
            </tbody>
          </table>
          <div className="flex h-16 items-center justify-between border-t border-[#F1F5F9] px-6">
            <p className="text-sm font-medium text-text-muted">
              Showing 1-10 of 127 complaints
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled>
                Prev
              </Button>
              {[1, 2, 3, 4].map((page) => (
                <button
                  key={page}
                  type="button"
                  className={cn(
                    "grid h-8 min-w-8 place-items-center rounded-badge px-3 text-xs font-extrabold transition duration-150 ease-in-out",
                    page === 1
                      ? "bg-primary text-white shadow-[0_8px_18px_rgba(27,79,216,0.18)]"
                      : "border border-border bg-white text-text-secondary hover:bg-primary-light hover:text-primary",
                  )}
                >
                  {page}
                </button>
              ))}
              <Button variant="ghost" size="sm">
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

function CustomDropdown({ value, options, onChange, widthClass }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className={cn("relative", widthClass)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between rounded-button border border-border bg-white px-3 text-left text-xs font-extrabold text-text-secondary shadow-none outline-none transition duration-150 ease-in-out hover:bg-primary-light hover:text-primary focus:border-primary focus:shadow-[0_0_0_3px_rgba(27,79,216,0.15)]"
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown
          className={cn("h-4 w-4 text-text-muted transition duration-150", open && "rotate-180 text-primary")}
        />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute right-0 top-12 z-30 w-full overflow-hidden rounded-button border border-border bg-white py-1 shadow-elevated"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-9 w-full items-center px-3 text-left text-xs font-bold transition duration-150 ease-in-out",
                  option.value === value
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:bg-background hover:text-text-primary",
                )}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function severityBorderClass(severity) {
  if (severity === "critical") return "group-hover:border-l-danger";
  if (severity === "high") return "group-hover:border-l-orange-500";
  if (severity === "medium") return "group-hover:border-l-accent";
  return "group-hover:border-l-success";
}

function ComplaintRow({ complaint, striped, onFocus, onOpen }) {
  const iconConfig = issueIconMap[complaint.type] ?? {
    icon: AlertTriangle,
    color: "text-text-muted",
    bg: "bg-slate-100",
  };
  const Icon = iconConfig.icon;
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!copied) return undefined;

    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyTicket() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(complaint.ticket);
      setCopied(true);
    } catch {
      toast.error("Copy failed", "Ticket ID could not be copied from this browser.");
    }
  }

  function handleMenuAction(action, event) {
    event.stopPropagation();
    event.currentTarget.closest("details")?.removeAttribute("open");

    if (action === "Copy Ticket ID") {
      copyTicket();
      return;
    }

    toast.info(action, `${complaint.ticket} queued for ${action.toLowerCase()}.`);
  }

  return (
    <tr
      onClick={onFocus}
      className={cn(
        "group h-16 cursor-pointer transition duration-150 ease-in-out hover:bg-primary-light",
        striped ? "bg-[#FAFBFC]" : "bg-white",
      )}
    >
      <td
        className={cn(
          "border-b border-[#F1F5F9] border-l-[3px] border-l-transparent pl-6 pr-4 transition duration-[120ms] ease-in-out",
          severityBorderClass(complaint.severity),
        )}
      >
        <RankBadge rank={complaint.rank} />
      </td>
      <td className="border-b border-[#F1F5F9] px-4">
        <div className="relative inline-flex">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              copyTicket();
            }}
            className="font-mono text-sm font-extrabold text-primary underline-offset-4 transition duration-150 ease-in-out hover:underline"
          >
            {complaint.ticket}
          </button>
          <span
            className={cn(
              "pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-button bg-text-primary px-2 py-1 text-[10px] font-bold text-white shadow-card transition duration-150 ease-in-out",
              copied ? "opacity-100" : "opacity-0",
            )}
          >
            Copied!
          </span>
        </div>
      </td>
      <td className="border-b border-[#F1F5F9] px-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span className={cn("grid h-8 w-8 place-items-center rounded-button", iconConfig.bg)}>
            <Icon className={cn("h-4 w-4", iconConfig.color)} />
          </span>
          {complaint.issue}
        </div>
      </td>
      <td className="max-w-[220px] truncate border-b border-[#F1F5F9] px-4 text-sm font-medium text-text-secondary">
        {complaint.location}
      </td>
      <td className="border-b border-[#F1F5F9] px-4">
        <Badge variant={complaint.severity} className="capitalize">
          {complaint.severity}
        </Badge>
      </td>
      <td className="border-b border-[#F1F5F9] px-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-badge bg-[#F1F5F9]">
            <div
              className={cn(
                "h-full rounded-badge bg-gradient-to-r",
                priorityGradientClass(complaint.severity),
                percentWidthClass(complaint.priorityScore),
              )}
            />
          </div>
          <span className="w-7 text-xs font-extrabold text-text-secondary">
            {(complaint.priorityScore / 10).toFixed(1)}
          </span>
        </div>
      </td>
      <td className="border-b border-[#F1F5F9] px-4 text-sm font-semibold text-text-secondary">
        {complaint.submitted}
      </td>
      <td className="border-b border-[#F1F5F9] px-4">
        <StatusPill status={complaint.status} />
      </td>
      <td className="border-b border-[#F1F5F9] px-6">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            className="inline-flex h-8 items-center gap-1 rounded-button px-2 text-xs font-extrabold text-primary opacity-0 transition duration-150 ease-in-out hover:bg-primary-light group-hover:opacity-100"
          >
            View
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <details className="relative" onClick={(event) => event.stopPropagation()}>
            <summary className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-button text-text-muted opacity-40 transition duration-150 ease-in-out hover:bg-primary-light hover:text-primary hover:opacity-100 group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </summary>
            <div className="absolute right-0 top-9 z-30 w-40 overflow-hidden rounded-button border border-border bg-white py-1 shadow-elevated">
              {["Assign", "Escalate", "Mark Resolved", "Copy Ticket ID"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={(event) => handleMenuAction(item, event)}
                  className="block w-full px-3 py-2 text-left text-xs font-bold text-text-secondary transition duration-150 ease-in-out hover:bg-primary-light hover:text-primary"
                >
                  {item}
                </button>
              ))}
            </div>
          </details>
        </div>
      </td>
    </tr>
  );
}

function RankBadge({ rank }) {
  const rankClass =
    rank === 1
      ? "bg-accent text-white"
      : rank === 2
        ? "bg-text-muted text-white"
        : rank === 3
          ? "bg-[#CD7F32] text-white"
          : "bg-slate-100 text-slate-500";

  return (
    <span className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold", rankClass)}>
      {rank}
    </span>
  );
}

function priorityGradientClass(severity) {
  if (severity === "critical") return "from-accent to-danger";
  if (severity === "high") return "from-orange-300 to-orange-500";
  if (severity === "medium") return "from-success to-accent";
  return "from-success to-emerald-400";
}

function priorityScoreWidthClass(value) {
  if (value >= 95) return "w-[96%]";
  if (value >= 92) return "w-[94%]";
  if (value >= 90) return "w-[91%]";
  if (value >= 87) return "w-[89%]";
  if (value >= 85) return "w-[86%]";
  if (value >= 80) return "w-[84%]";
  if (value >= 72) return "w-[79%]";
  if (value >= 64) return "w-[71%]";
  if (value >= 56) return "w-[62%]";
  if (value >= 42) return "w-[48%]";
  if (value >= 30) return "w-[34%]";
  if (value >= 24) return "w-[28%]";
  if (value >= 18) return "w-[22%]";
  return "w-[15%]";
}

function departmentDisplayName(complaint) {
  return complaint.departmentName ?? departments.find((item) => item.id === complaint.department)?.name ?? complaint.department;
}

function departmentForComplaint(complaint) {
  return departments.find((item) => item.id === complaint.department) ?? departments[0];
}

function StatusPill({ status }) {
  const config =
    status === "Resolved"
      ? {
        icon: CheckCircle2,
        className: "border-success/20 bg-success-light text-success",
      }
      : status === "In Progress"
        ? {
          icon: RefreshCcw,
          className: "border-primary/20 bg-primary-light text-primary",
        }
      : status === "Open"
        ? {
          icon: Clock3,
          className: "border-slate-200 bg-slate-100 text-slate-600",
        }
        : status === "Department Assigned"
          ? {
            icon: Building2,
            className: "border-primary/20 bg-primary-light text-primary",
          }
          : status === "Field Team Notified"
            ? {
              icon: RefreshCcw,
              className: "border-accent/20 bg-accent-50 text-accent",
            }
            : {
              icon: Clock3,
              className: "border-primary/20 bg-primary-light text-primary",
            };
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-badge border px-3 text-xs font-extrabold",
        config.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

function ComplaintDetailModal({ complaint, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(complaint.status);
  const toast = useToast();
  const severityScore = complaint.severityScore ?? Math.max(1, Math.min(10, Math.round(complaint.priorityScore / 12)));
  const confidence = complaint.confidence ?? (complaint.severity === "critical" ? 94 : complaint.severity === "high" ? 91 : 86);
  const department = departmentForComplaint(complaint);
  const DepartmentIcon = department.icon;
  const mapsUrl = `https://www.google.com/maps?q=${complaint.lat},${complaint.lng}`;

  function updateStatus(value) {
    setStatus(value);
    toast.success(`Status updated to ${value}`);
  }

  function copyFormalComplaint() {
    navigator.clipboard?.writeText(formalComplaint(complaint));
    toast.info("Formal complaint copied", "Ready to paste into the department system.");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/[0.75] p-4 backdrop-blur-[4px]"
      onClick={onClose}
    >
      <motion.article
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
        className="w-full max-w-[680px] overflow-visible rounded-modal bg-white shadow-[0_25px_80px_rgba(0,0,0,0.18),0_8px_24px_rgba(0,0,0,0.08)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-3">
            <p className="font-mono text-sm font-extrabold text-primary">{complaint.ticket}</p>
            <Badge variant={complaint.severity} className="capitalize">
              {complaint.severity}
            </Badge>
            <StatusPill status={status} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 transition duration-150 ease-in-out hover:bg-slate-200"
            aria-label="Close complaint detail"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid grid-cols-[55fr_45fr] gap-6 p-6">
          <section className="space-y-5">
            {complaint.photo ? (
              <div className="relative h-[220px] overflow-hidden rounded-[12px] bg-slate-100">
                <Image
                  src={complaint.photo}
                  alt={`${complaint.issue} evidence`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 via-slate-950/25 to-transparent p-3">
                  <div className="flex flex-wrap gap-2">
                    <DetectionChip dotClass="bg-accent">
                      {complaint.issue} detected
                    </DetectionChip>
                    <DetectionChip dotClass="bg-danger">
                      Severity: {severityScore}/10
                    </DetectionChip>
                    <DetectionChip dotClass="bg-primary">
                      Confidence: {confidence}%
                    </DetectionChip>
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
                Original Complaint
              </p>
              <div className="mt-2 rounded-[12px] border border-border bg-background p-3">
                <p className="text-sm italic leading-[1.7] text-text-secondary">
                  {complaint.text}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-white p-3">
              <div className="flex min-w-0 items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <p className="truncate text-sm font-bold text-text-primary">
                  {complaint.location}
                </p>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-primary transition duration-150 ease-in-out hover:text-primary-dark hover:underline"
              >
                Open in Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-[12px] border border-blue-200 bg-[#F0F7FF] p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-primary">
                AI Analysis
              </p>
              <div className="mt-4 space-y-3">
                <AnalysisRow label="Issue type">
                  <span className="font-extrabold text-text-primary">{complaint.issue}</span>
                </AnalysisRow>
                <AnalysisRow label="Urgency">
                  <UrgencyBadge urgency={complaint.urgency} />
                </AnalysisRow>
                <AnalysisRow label="Department">
                  <span className="inline-flex items-center gap-2 font-extrabold text-text-primary">
                    <DepartmentIcon className={cn("h-4 w-4", department.color)} />
                    {departmentDisplayName(complaint)}
                  </span>
                </AnalysisRow>
                <AnalysisRow label="Confidence">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-badge bg-white">
                      <div
                        className={cn(
                          "h-full rounded-badge bg-gradient-to-r from-primary to-blue-400",
                          priorityScoreWidthClass(confidence),
                        )}
                      />
                    </div>
                    <span className="text-xs font-extrabold text-primary">{confidence}%</span>
                  </div>
                </AnalysisRow>
              </div>
            </div>

            <div className="rounded-[12px] border border-border bg-white">
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-between p-4 text-left transition duration-150 ease-in-out hover:bg-background"
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
                    Formal Complaint Generated
                  </p>
                  <p className="mt-1 text-sm font-bold text-text-primary">
                    {expanded ? "Collapse draft" : "Expand draft"}
                  </p>
                </div>
                <ChevronDown
                  className={cn("h-5 w-5 text-text-muted transition duration-150", expanded && "rotate-180")}
                />
              </button>
              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden border-t border-border"
                  >
                    <div className="p-4">
                      <p className="border-l-2 border-primary pl-3 text-sm leading-6 text-text-secondary">
                        {formalComplaint(complaint)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3"
                        leftIcon={<Copy className="h-4 w-4" />}
                        onClick={copyFormalComplaint}
                      >
                        Copy formal complaint
                      </Button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </section>
        </div>

        <footer className="grid grid-cols-[minmax(0,1fr)_minmax(0,180px)_auto] items-center gap-5 border-t border-border px-6 py-4">
          <CompactStatusTimeline status={status} />
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-extrabold text-white">
              RK
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
                Assigned to
              </p>
              <p className="truncate text-sm font-extrabold text-text-primary">Rajesh Kumar</p>
              <p className="truncate text-xs font-medium text-text-secondary">{departmentDisplayName(complaint)}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <StatusActionDropdown value={status} onChange={updateStatus} />
            <Button
              variant="ghost"
              size="md"
              leftIcon={<ArrowUp className="h-4 w-4" />}
              className="text-danger hover:bg-danger-light hover:text-danger"
            >
              Escalate
            </Button>
          </div>
        </footer>
      </motion.article>
    </motion.div>
  );
}

function DetectionChip({ dotClass, children }) {
  return (
    <span className="inline-flex h-7 items-center gap-2 rounded-badge bg-white px-3 text-xs font-extrabold text-text-primary shadow-card">
      <span className={cn("h-2 w-2 rounded-full", dotClass)} />
      {children}
    </span>
  );
}

function AnalysisRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-bold text-text-secondary">{label}</p>
      <div className="text-right text-sm">{children}</div>
    </div>
  );
}

function UrgencyBadge({ urgency }) {
  const tone =
    urgency === "HIGH"
      ? "bg-danger-light text-danger border-danger/20"
      : urgency === "MEDIUM"
        ? "bg-accent-50 text-accent border-accent/20"
        : "bg-success-light text-success border-success/20";

  return (
    <span className={cn("rounded-badge border px-2.5 py-1 text-[11px] font-extrabold", tone)}>
      {urgency}
    </span>
  );
}

function CompactStatusTimeline({ status }) {
  const steps = ["Submitted", "In Progress", "Resolved"];
  const currentIndex = status === "Resolved" ? 2 : status === "Open" || status === "Pending" ? 0 : 1;

  return (
    <div className="min-w-0">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const complete = index < currentIndex;
          const current = index === currentIndex;
          return (
            <div key={step} className="flex min-w-0 flex-1 items-center last:flex-none">
              <div
                className={cn(
                  "relative grid h-5 w-5 shrink-0 place-items-center rounded-full border text-white",
                  complete || current
                    ? "border-primary bg-primary"
                    : "border-border bg-white",
                )}
              >
                {complete ? <CheckCircle2 className="h-3 w-3" /> : null}
                {current && !complete ? (
                  <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_0_4px_rgba(27,79,216,0.18)]" />
                ) : null}
              </div>
              {index < steps.length - 1 ? (
                <div className="mx-2 h-0.5 min-w-8 flex-1 rounded-badge bg-border">
                  <div
                    className={cn(
                      "h-full rounded-badge bg-primary transition duration-300 ease-in-out",
                      index < currentIndex ? "w-full" : "w-0",
                    )}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-[0.04em] text-text-muted">
        {steps.map((step, index) => (
          <span
            key={step}
            className={cn(index === currentIndex && "text-primary")}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatusActionDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const options = ["Open", "Under Review", "In Progress", "Department Assigned", "Field Team Notified", "Resolved"];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 min-w-[148px] items-center justify-between gap-3 rounded-button border border-border bg-white px-3 text-sm font-extrabold text-text-primary transition duration-150 ease-in-out hover:bg-primary-light hover:text-primary active:scale-[0.98]"
      >
        {value}
        <ChevronDown className={cn("h-4 w-4 text-text-muted transition duration-150", open && "rotate-180 text-primary")} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute bottom-12 right-0 z-40 w-48 overflow-hidden rounded-button border border-border bg-white py-1 shadow-elevated"
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={cn(
                  "block h-9 w-full px-3 text-left text-xs font-extrabold transition duration-150 ease-in-out",
                  option === value
                    ? "bg-primary-light text-primary"
                    : "text-text-secondary hover:bg-background hover:text-text-primary",
                )}
              >
                {option}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function formalComplaint(complaint) {
  if (complaint.formalComplaint) return complaint.formalComplaint;

  return `Citizen report ${complaint.ticket} concerns ${complaint.issue.toLowerCase()} at ${complaint.location}. The complaint indicates public safety and service disruption risk. AI triage recommends routing to ${departmentDisplayName(complaint)} with priority score ${complaint.priorityScore}. Field verification and corrective action should be initiated as per municipal response protocol.`;
}
