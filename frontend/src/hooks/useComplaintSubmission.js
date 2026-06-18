"use client";

import { useCallback, useMemo, useState } from "react";
import {
  analyzeComplaint,
  analyzeImage,
  submitComplaint,
} from "@/src/services/api";
import { normalizeApiError } from "@/src/utils/errorHandler";

const defaultFormData = {
  text: "",
  location: "",
  photo: null,
  photoPreview: "",
};

export function useComplaintSubmission(initialValues = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({ ...defaultFormData, ...initialValues });
  const [textAnalysis, setTextAnalysis] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = useMemo(
    () => [
      { id: "details", label: "Complaint Details", complete: Boolean(formData.text && formData.location) },
      { id: "analysis", label: "AI Analysis", complete: Boolean(textAnalysis) },
      { id: "review", label: "Review & Submit", complete: Boolean(ticket) },
    ],
    [formData.location, formData.text, textAnalysis, ticket],
  );

  const aiResults = useMemo(
    () => ({
      text: textAnalysis,
      image: imageAnalysis,
      combined: {
        issue_type: imageAnalysis?.detected_issues?.[0] ?? textAnalysis?.issue_type,
        location: textAnalysis?.location ?? formData.location,
        urgency: textAnalysis?.urgency,
        department: textAnalysis?.department,
        severity_score: imageAnalysis?.severity_score,
        confidence_score: Math.max(textAnalysis?.confidence_score ?? 0, imageAnalysis?.confidence ?? 0),
        formal_complaint: textAnalysis?.formal_complaint,
      },
    }),
    [formData.location, imageAnalysis, textAnalysis],
  );

  const updateFormData = useCallback((patch) => {
    setFormData((previous) => ({ ...previous, ...patch }));
  }, []);

  const handleError = useCallback((apiError) => {
    const normalized = normalizeApiError(apiError);
    setError(normalized);
    return normalized;
  }, []);

  const runTextAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeComplaint(formData.text, formData.location);
      setTextAnalysis(result);
      setCurrentStep(1);
      return result;
    } catch (apiError) {
      throw handleError(apiError);
    } finally {
      setLoading(false);
    }
  }, [formData.location, formData.text, handleError]);

  const runImageAnalysis = useCallback(async () => {
    if (!formData.photo) {
      setImageAnalysis(null);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeImage(formData.photo);
      setImageAnalysis(result);
      return result;
    } catch (apiError) {
      throw handleError(apiError);
    } finally {
      setLoading(false);
    }
  }, [formData.photo, handleError]);

  const submit = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        complaint_text: formData.text,
        location: formData.location,
        issue_type: textAnalysis?.issue_type,
        urgency: textAnalysis?.urgency,
        department: textAnalysis?.department,
        formal_complaint: textAnalysis?.formal_complaint,
        image_analysis: imageAnalysis,
      };
      const result = await submitComplaint(payload);
      setTicket(result);
      setCurrentStep(2);
      return result;
    } catch (apiError) {
      throw handleError(apiError);
    } finally {
      setLoading(false);
    }
  }, [formData.location, formData.text, handleError, imageAnalysis, textAnalysis]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setFormData({ ...defaultFormData, ...initialValues });
    setTextAnalysis(null);
    setImageAnalysis(null);
    setTicket(null);
    setLoading(false);
    setError(null);
  }, [initialValues]);

  const nextStep = useCallback(() => {
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }, [steps.length]);

  const previousStep = useCallback(() => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }, []);

  return {
    data: ticket,
    loading,
    error,
    execute: submit,
    steps,
    currentStep,
    setCurrentStep,
    nextStep,
    previousStep,
    formData,
    updateFormData,
    aiResults,
    textAnalysis,
    imageAnalysis,
    ticket,
    runTextAnalysis,
    runImageAnalysis,
    submit,
    reset,
  };
}
