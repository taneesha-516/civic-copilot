"use client";

import { useCallback, useState } from "react";
import {
  analyzeComplaint,
  analyzeImage,
  getComplaints,
  getDashboardStats,
  getPredictions,
  submitComplaint,
  updateComplaintStatus,
} from "@/src/services/api";
import { normalizeApiError } from "@/src/utils/errorHandler";

function useApiFunction(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (apiError) {
        const normalized = normalizeApiError(apiError);
        setError(normalized);
        throw normalized;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

export function useAnalyzeComplaint() {
  return useApiFunction(analyzeComplaint);
}

export function useAnalyzeImage() {
  return useApiFunction(analyzeImage);
}

export function useSubmitComplaint() {
  return useApiFunction(submitComplaint);
}

export function useDashboardStats() {
  return useApiFunction(getDashboardStats);
}

export function useComplaints() {
  return useApiFunction(getComplaints);
}

export function useUpdateComplaintStatus() {
  return useApiFunction(updateComplaintStatus);
}

export function usePredictions() {
  return useApiFunction(getPredictions);
}
