import { departmentStats } from "@/src/data/departmentStats";
import { mockComplaints as seededMockComplaints } from "@/src/data/mockComplaints";
import { mockPredictions } from "@/src/data/mockPredictions";
import { createApiError } from "@/src/utils/errorHandler";

const env = typeof process !== "undefined" ? process.env : {};

function parseMockMode(value) {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  return String(value).toLowerCase() !== "false";
}

export const CONFIG = {
  BASE_URL: env.NEXT_PUBLIC_API_URL ?? "",
  MOCK_MODE: parseMockMode(env.NEXT_PUBLIC_MOCK_MODE),
  MOCK_DELAY: 1800,
  TIMEOUT_MS: 8000,
};

let mockComplaintStore = clone(seededMockComplaints);

const departmentAliases = {
  All: "All",
  PWD: "Public Works Department",
  Municipal: "Municipal Sanitation Department",
  "Water Dept": "Delhi Jal Board",
  "Utility Dept": "Electricity Department",
  "Electricity Dept": "Electricity Department",
};

function searchableComplaintText(complaint) {
  return [
    complaint.id,
    complaint.ticket,
    complaint.ticket_id,
    complaint.complaint_id,
    complaint.title,
    complaint.issue,
    complaint.issue_type,
    complaint.location,
    complaint.location_name,
    complaint.department,
    normalizeDepartmentFilter(complaint.department),
    complaint.status,
    complaint.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function wait(ms = CONFIG.MOCK_DELAY) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function shouldUseMock() {
  return CONFIG.MOCK_MODE || !CONFIG.BASE_URL;
}

async function mockResponse(factory) {
  await wait();
  return clone(typeof factory === "function" ? factory() : factory);
}

function endpoint(path, query) {
  const base = CONFIG.BASE_URL.replace(/\/$/, "");
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = new URL(`${base}${path}`, origin);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "All") {
      url.searchParams.set(key, value);
    }
  });

  if (!base) {
    return `${path}${url.search ? url.search : ""}`;
  }

  return url.toString();
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(path, { method = "GET", body, headers, query, timeoutMs = CONFIG.TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(endpoint(path, query), {
      method,
      body,
      headers,
      signal: controller.signal,
    });

    const payload = await safeJson(response);

    if (!response.ok) {
      throw createApiError({
        status: response.status,
        payload,
      });
    }

    return payload;
  } catch (error) {
    if (timedOut) {
      throw createApiError({ type: "timeout", cause: error });
    }

    if (error?.name === "CivicCopilotApiError") {
      throw error;
    }

    throw createApiError({
      type: "network",
      message: "Unable to connect. Check your internet connection.",
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function inferIssueType(text = "") {
  const value = text.toLowerCase();

  if (value.includes("garbage") || value.includes("waste") || value.includes("dump")) {
    return {
      issue_type: "Garbage/Sanitation",
      urgency: "MEDIUM",
      department: "Municipal Sanitation Department",
    };
  }

  if (value.includes("water") || value.includes("leak") || value.includes("sewage")) {
    return {
      issue_type: "Water Leakage",
      urgency: "MEDIUM",
      department: "Delhi Jal Board",
    };
  }

  if (value.includes("light") || value.includes("electric") || value.includes("wire")) {
    return {
      issue_type: "Streetlight/Electrical",
      urgency: "HIGH",
      department: "Electricity Department",
    };
  }

  return {
    issue_type: "Pothole",
    urgency: "HIGH",
    department: "Public Works Department",
  };
}

function dashboardSparkline() {
  return Array.from({ length: 7 }, (_, offset) => {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - (6 - offset));
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const complaints = mockComplaintStore.filter((complaint) => {
      const submitted = new Date(complaint.submitted_at);
      return submitted >= dayStart && submitted < dayEnd;
    });

    return {
      day: dayStart.toLocaleDateString("en-IN", { weekday: "short" }),
      total: complaints.length,
      critical: complaints.filter((complaint) => complaint.severity_score >= 8).length,
      resolved: complaints.filter((complaint) => complaint.status === "Resolved").length,
      response: Number((3.4 + ((offset + 2) % 5) * 0.28).toFixed(1)),
    };
  });
}

function normalizeDepartmentFilter(department) {
  return departmentAliases[department] ?? department;
}

function sortComplaints(complaints, sort = "priority_desc") {
  if (sort === "oldest") {
    return complaints.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  }

  if (sort === "newest") {
    return complaints.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  }

  return complaints.sort((a, b) => b.priority_score - a.priority_score);
}

export async function analyzeComplaint(text, location = "Rajiv Chowk, New Delhi") {
  if (shouldUseMock()) {
    return mockResponse(() => {
      const inferred = inferIssueType(text);
      return {
        issue_type: inferred.issue_type,
        location: location || "Rajiv Chowk, New Delhi",
        urgency: inferred.urgency,
        department: inferred.department,
        formal_complaint:
          "I request the concerned department to inspect and resolve the reported civic issue at the stated location. The matter is causing inconvenience and possible safety risk to residents and commuters, and therefore requires timely field verification and corrective action.",
        confidence_score: 0.93,
      };
    });
  }

  return request("/api/analyze-complaint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, location }),
    timeoutMs: 45000,
  });
}

export async function analyzeImage(imageFile) {
  if (shouldUseMock()) {
    return mockResponse({
      detected_issues: ["pothole", "damaged asphalt", "standing water"],
      severity_score: 8,
      confidence: 0.91,
      detection_label: "road_surface_pothole",
      file_name: imageFile?.name ?? "uploaded-civic-issue.jpg",
    });
  }

  const formData = new FormData();
  formData.append("image", imageFile);

  return request("/api/analyze-image", {
    method: "POST",
    body: formData,
    timeoutMs: 30000,
  });
}

export async function submitComplaint(payload) {
  if (shouldUseMock()) {
    return mockResponse(() => {
      const ticketNumber = Math.floor(1000 + Math.random() * 9000);
      const submittedAt = new Date().toISOString();
      const department = payload?.department ?? payload?.assigned_department ?? "Public Works Department";

      return {
        ticket_id: `CCP-${ticketNumber}`,
        submitted_at: submittedAt,
        estimated_response_hours: payload?.urgency === "HIGH" ? 6 : 18,
        assigned_department: department,
      };
    });
  }

  return request("/api/complaints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    timeoutMs: 30000,
  });
}

export async function getDashboardStats() {
  if (shouldUseMock()) {
    return mockResponse(() => {
      const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
      const today = mockComplaintStore.filter(
        (complaint) => new Date(complaint.submitted_at).getTime() >= last24Hours,
      );
      const critical = mockComplaintStore.filter((item) => item.severity_score >= 8).length;
      const resolved = mockComplaintStore.filter((item) => item.status === "Resolved").length;

      return {
        total_today: today.length,
        critical,
        resolved,
        avg_response_hours: 4.8,
        sparkline_data: dashboardSparkline(),
        departments: departmentStats,
      };
    });
  }

  return request("/api/dashboard/stats");
}

export async function getHeatmap({ highPriority = false } = {}) {
  if (shouldUseMock()) {
    return mockResponse({
      geojson: {
        type: "FeatureCollection",
        features: [],
      },
      heatmap_points: mockComplaintStore.map((complaint) => ({
        complaint_id: complaint.id ?? complaint.ticket_id,
        latitude: complaint.latitude ?? complaint.lat,
        longitude: complaint.longitude ?? complaint.lng,
        priority_score: complaint.priority_score,
        weight: Math.max(0.3, Math.min(1, Number(complaint.priority_score ?? 50) / 100)),
        issue_type: complaint.issue_type,
        location: complaint.location_name ?? complaint.location,
      })),
      area_counts: [],
    });
  }

  return request(highPriority ? "/heatmap/high-priority" : "/heatmap");
}

export async function getComplaints(filters = {}) {
  if (shouldUseMock()) {
    return mockResponse(() => {
      const page = Number(filters.page ?? 1);
      const perPage = Number(filters.per_page ?? 80);
      const department = normalizeDepartmentFilter(filters.department);
      const status = filters.status;

      let filtered = [...mockComplaintStore];

      if (department && department !== "All") {
        filtered = filtered.filter((complaint) => complaint.department === department);
      }

      if (status && status !== "All" && status !== "Status") {
        filtered = filtered.filter((complaint) => complaint.status === status);
      }

      if (filters.search) {
        const search = String(filters.search).toLowerCase();
        filtered = filtered.filter((complaint) =>
          searchableComplaintText(complaint).includes(search),
        );
      }

      const sorted = sortComplaints(filtered, filters.sort);
      const start = (page - 1) * perPage;

      return {
        complaints: sorted.slice(start, start + perPage),
        total: filtered.length,
        page,
        per_page: perPage,
      };
    });
  }

  return request("/api/complaints", {
    query: {
      department: filters.department,
      status: filters.status,
      page: filters.page,
      per_page: filters.per_page,
      search: filters.search,
    },
  });
}

export async function updateComplaintStatus(id, status, note = "") {
  if (shouldUseMock()) {
    return mockResponse(() => {
      const index = mockComplaintStore.findIndex(
        (complaint) => complaint.id === id || complaint.ticket_id === id || complaint.ticket === id,
      );

      if (index === -1) {
        throw createApiError({
          status: 404,
          message: "Complaint not found.",
        });
      }

      mockComplaintStore[index] = {
        ...mockComplaintStore[index],
        status,
        note,
        updated_at: new Date().toISOString(),
      };

      return mockComplaintStore[index];
    });
  }

  return request(`/api/complaints/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, note }),
  });
}

export async function getPredictions() {
  if (shouldUseMock()) {
    return mockResponse({
      hotspots: mockPredictions.map((prediction) => ({
        ...prediction,
        area: prediction.location_name,
        risk_score: Number((prediction.confidence_percentage / 100).toFixed(2)),
        expected_reports: prediction.historical_complaint_count,
      })),
      model_accuracy: 0.89,
      generated_at: new Date().toISOString(),
    });
  }

  return request("/api/predictions");
}

export function resetMockComplaints() {
  mockComplaintStore = clone(seededMockComplaints);
  return clone(mockComplaintStore);
}
