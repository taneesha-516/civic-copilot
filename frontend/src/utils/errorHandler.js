export const ERROR_MESSAGES = {
  network: "Unable to connect. Check your internet connection.",
  server: "Something went wrong on our end. Please try again.",
  timeout: "This is taking longer than usual. Still working...",
  fallback: "We could not complete that request. Please try again.",
};

function humanizeFieldName(field) {
  return String(field)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function validationMessage(payload) {
  const errors = payload?.errors ?? payload?.field_errors ?? payload?.fields;

  if (errors && typeof errors === "object") {
    const [field, value] = Object.entries(errors)[0] ?? [];
    if (field) {
      const message = Array.isArray(value) ? value[0] : value;
      return `${humanizeFieldName(field)}: ${message}`;
    }
  }

  return payload?.message ?? payload?.error ?? "Please check the highlighted fields.";
}

export function createApiError({ status, payload, type, message, cause } = {}) {
  const error = new Error(
    message ??
      (type === "timeout"
        ? ERROR_MESSAGES.timeout
        : status === 422
          ? validationMessage(payload)
          : status >= 500
            ? ERROR_MESSAGES.server
            : ERROR_MESSAGES.fallback),
    { cause },
  );

  error.name = "CivicCopilotApiError";
  error.status = status;
  error.payload = payload;
  error.type = type;
  error.userMessage = error.message;
  error.fieldErrors = status === 422 ? payload?.errors ?? payload?.field_errors : undefined;

  return error;
}

export function normalizeApiError(error) {
  if (error?.userMessage) {
    return {
      message: error.userMessage,
      status: error.status,
      type: error.type,
      fieldErrors: error.fieldErrors,
      raw: error,
    };
  }

  if (error?.name === "AbortError" || error?.type === "timeout") {
    return {
      message: ERROR_MESSAGES.timeout,
      type: "timeout",
      raw: error,
    };
  }

  if (error instanceof TypeError) {
    return {
      message: ERROR_MESSAGES.network,
      type: "network",
      raw: error,
    };
  }

  if (error?.status === 422) {
    return {
      message: validationMessage(error.payload),
      status: 422,
      type: "validation",
      fieldErrors: error.payload?.errors ?? error.payload?.field_errors,
      raw: error,
    };
  }

  if (error?.status >= 500) {
    return {
      message: ERROR_MESSAGES.server,
      status: error.status,
      type: "server",
      raw: error,
    };
  }

  return {
    message: error?.message ?? ERROR_MESSAGES.fallback,
    status: error?.status,
    type: error?.type ?? "unknown",
    raw: error,
  };
}

export function getErrorMessage(error) {
  return normalizeApiError(error).message;
}
