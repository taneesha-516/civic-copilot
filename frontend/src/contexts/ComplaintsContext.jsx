"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { mockComplaints } from "@/src/data/mockComplaints";

const STORAGE_KEY = "civic-copilot-complaints";
const DEFAULT_PHOTO = "/issues/delhi-pothole-evidence.png";

const ComplaintsContext = createContext(null);

function cloneComplaints(value) {
  return JSON.parse(JSON.stringify(value));
}

function initialComplaints() {
  if (typeof window === "undefined") return cloneComplaints(mockComplaints);

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return cloneComplaints(mockComplaints);

    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // Fall back to seeded mock data if storage is unavailable or malformed.
  }

  return cloneComplaints(mockComplaints);
}

function persistComplaints(nextComplaints) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextComplaints));
  } catch {
    // Persistence is best-effort for demo continuity.
  }
}

function formattedDelhiTime(isoTimestamp) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(new Date(isoTimestamp));
}

function nextTicketNumber(complaints) {
  const highest = complaints.reduce((max, complaint) => {
    const ticket = complaint.ticket_id ?? complaint.ticket ?? "";
    const number = Number(String(ticket).replace("CCP-", ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 2880);

  return highest + 1;
}

function inferCoordinates(location) {
  const normalized = location.toLowerCase();

  if (normalized.includes("karol")) return { latitude: 28.6517, longitude: 77.1907 };
  if (normalized.includes("chandni")) return { latitude: 28.6562, longitude: 77.2301 };
  if (normalized.includes("rohini")) return { latitude: 28.7285, longitude: 77.1174 };
  if (normalized.includes("dwarka")) return { latitude: 28.5811, longitude: 77.057 };
  if (normalized.includes("saket")) return { latitude: 28.5244, longitude: 77.2066 };
  if (normalized.includes("lajpat")) return { latitude: 28.5708, longitude: 77.2433 };

  return { latitude: 28.6328, longitude: 77.2197 };
}

function formalComplaintFor({ issueType, location, severityScore }) {
  return `I request the concerned Public Works Department to inspect and resolve the reported ${issueType.toLowerCase()} at ${location}. The issue has been reported by a citizen through Civic Copilot and is creating inconvenience and public safety risk in the area. Kindly arrange field verification and corrective action at the earliest, as the current severity has been assessed at ${severityScore}/10 by Civic Copilot.`;
}

export function ComplaintsProvider({ children }) {
  const [complaints, setComplaints] = useState(initialComplaints);

  const addComplaint = useCallback((payload) => {
    const submittedAt = new Date().toISOString();
    const ticketNumber = nextTicketNumber(complaints);
    const ticketId = `CCP-${ticketNumber}`;
    const issueType = payload.issueType ?? "Pothole";
    const location = payload.location ?? "Rajiv Chowk, New Delhi";
    const severityScore = payload.severityScore ?? 8;
    const coordinates = inferCoordinates(location);

    const createdComplaint = {
      id: `complaint-${ticketNumber}`,
      ticket_id: ticketId,
      ticket: ticketId,
      issue_type: issueType,
      issue: issueType,
      type: "roads",
      description: payload.description,
      text: payload.description,
      location_name: location,
      location,
      area: location.split(",").at(-1)?.trim() ?? location,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      lat: coordinates.latitude,
      lng: coordinates.longitude,
      urgency: payload.urgency ?? "HIGH",
      severity: "critical",
      severity_score: severityScore,
      severityScore,
      department: "Public Works Department",
      assigned_department: "Public Works Department",
      status: "Pending",
      submitted_at: submittedAt,
      submitted: formattedDelhiTime(submittedAt),
      ai_analysis: {
        issue_type: issueType,
        location,
        urgency: payload.urgency ?? "HIGH",
        department: "Public Works Department",
        formal_complaint: formalComplaintFor({ issueType, location, severityScore }),
        confidence_score: 0.94,
        detected_issues: ["pothole", "road surface damage", "traffic hazard"],
        severity_score: severityScore,
        confidence: 0.93,
        detection_label: "road_surface_pothole",
        analyzed_at: submittedAt,
      },
      formal_complaint: formalComplaintFor({ issueType, location, severityScore }),
      priority_score: 96,
      priorityScore: 96,
      photo_url: DEFAULT_PHOTO,
      photo: DEFAULT_PHOTO,
    };

    setComplaints((current) => {
      const nextComplaints = [createdComplaint, ...current];
      persistComplaints(nextComplaints);
      return nextComplaints;
    });

    return createdComplaint;
  }, [complaints]);

  const value = useMemo(
    () => ({
      complaints,
      addComplaint,
      totalComplaints: complaints.length,
    }),
    [addComplaint, complaints],
  );

  return (
    <ComplaintsContext.Provider value={value}>
      {children}
    </ComplaintsContext.Provider>
  );
}

export function useComplaints() {
  const context = useContext(ComplaintsContext);

  if (!context) {
    throw new Error("useComplaints must be used inside ComplaintsProvider");
  }

  return context;
}
