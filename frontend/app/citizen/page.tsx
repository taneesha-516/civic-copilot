import ComplaintSubmission from "@/components/citizen/ComplaintSubmission";

export const metadata = {
  title: "Report a Civic Issue | Civic Copilot",
  description:
    "Submit a Delhi civic complaint with AI-assisted routing, photo analysis, and complaint tracking.",
};

export default function CitizenPage() {
  return <ComplaintSubmission />;
}
