"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getComplaints,
  getDashboardStats,
  getPredictions,
  updateComplaintStatus,
} from "@/src/services/api";
import { normalizeApiError } from "@/src/utils/errorHandler";

const defaultFilters = {
  department: "All",
  status: "All",
  page: 1,
  per_page: 80,
  search: "",
};

export function useDashboard(initialFilters = {}) {
  const [filters, setFilters] = useState({ ...defaultFilters, ...initialFilters });
  const [sort, setSort] = useState("priority_desc");
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, per_page: 80 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async (activeFilters, activeSort) => {
    setLoading(true);
    setError(null);

    try {
      const [statsResult, complaintsResult, predictionsResult] = await Promise.all([
        getDashboardStats(),
        getComplaints({ ...activeFilters, sort: activeSort }),
        getPredictions(),
      ]);

      setStats(statsResult);
      setComplaints(complaintsResult.complaints ?? []);
      setPagination({
        total: complaintsResult.total ?? 0,
        page: complaintsResult.page ?? activeFilters.page,
        per_page: complaintsResult.per_page ?? activeFilters.per_page,
      });
      setPredictions(predictionsResult);
      return {
        stats: statsResult,
        complaints: complaintsResult,
        predictions: predictionsResult,
      };
    } catch (apiError) {
      const normalized = normalizeApiError(apiError);
      setError(normalized);
      throw normalized;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      loadDashboard(filters, sort).catch(() => {});
    });

    return () => cancelAnimationFrame(frame);
  }, [filters, loadDashboard, sort]);

  const setFilter = useCallback((key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
      page: key === "page" ? value : 1,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const refresh = useCallback(() => loadDashboard(filters, sort), [filters, loadDashboard, sort]);

  const updateStatus = useCallback(
    async (id, status, note) => {
      setError(null);

      try {
        const updated = await updateComplaintStatus(id, status, note);
        setComplaints((previous) =>
          previous.map((complaint) =>
            complaint.id === updated.id || complaint.ticket_id === updated.ticket_id ? updated : complaint,
          ),
        );
        return updated;
      } catch (apiError) {
        const normalized = normalizeApiError(apiError);
        setError(normalized);
        throw normalized;
      }
    },
    [],
  );

  const data = useMemo(
    () => ({
      stats,
      complaints,
      predictions,
      pagination,
    }),
    [complaints, pagination, predictions, stats],
  );

  return {
    data,
    stats,
    complaints,
    predictions,
    pagination,
    filters,
    sort,
    setSort,
    setFilter,
    clearFilters,
    updateStatus,
    loading,
    error,
    execute: refresh,
    refresh,
  };
}
