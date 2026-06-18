import AuthorityDashboard from "@/components/authority/AuthorityDashboard";

export const metadata = {
  title: "Authority Dashboard | Civic Copilot",
  description:
    "Delhi civic authority mission control with complaint heatmap, priority queue, and AI triage.",
};

export default function DashboardPage() {
  return <AuthorityDashboard />;
}
