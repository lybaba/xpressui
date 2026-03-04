import { TFormProviderRequest, TFormSubmitRequest } from "./TFormConfig";

export type TFormProviderDefinition = {
  createSubmitRequest?(
    provider: TFormProviderRequest,
  ): TFormSubmitRequest;
  buildPayload(
    values: Record<string, any>,
    submitConfig: TFormSubmitRequest,
  ): Record<string, any>;
  resolveTransition?(
    result: any,
    submitConfig: TFormSubmitRequest,
  ): TFormProviderTransition | null;
  successEventName?: string;
  errorEventName?: string;
};

export type TFormProviderTransition =
  | {
      type: "step";
      target: string | number;
    }
  | {
      type: "workflow";
      state: string;
    };

const providerRegistry = new Map<string, TFormProviderDefinition>();

export function registerProvider(
  action: string,
  definition: TFormProviderDefinition,
): void {
  providerRegistry.set(action, definition);
}

export function getProviderDefinition(
  action?: string,
): TFormProviderDefinition | null {
  if (!action) {
    return null;
  }

  return providerRegistry.get(action) || null;
}

export function buildProviderPayload(
  values: Record<string, any>,
  submitConfig: TFormSubmitRequest,
): Record<string, any> {
  const definition = getProviderDefinition(submitConfig.action);
  return definition ? definition.buildPayload(values, submitConfig) : values;
}

export function createSubmitRequestFromProvider(
  provider: TFormProviderRequest,
): TFormSubmitRequest {
  const definition = getProviderDefinition(provider.type);
  if (definition?.createSubmitRequest) {
    return definition.createSubmitRequest(provider);
  }

  return {
    endpoint: provider.endpoint,
    method: provider.method || "POST",
    headers: provider.headers,
    action: provider.type,
  };
}

export function getProviderSuccessEventName(action?: string): string | null {
  return getProviderDefinition(action)?.successEventName || null;
}

export function getProviderErrorEventName(action?: string): string | null {
  return getProviderDefinition(action)?.errorEventName || null;
}

function normalizeProviderTransition(result: any): TFormProviderTransition | null {
  if (!result || typeof result !== "object" || !result.transition || typeof result.transition !== "object") {
    return null;
  }

  const transition = result.transition as Record<string, any>;
  if (
    transition.type === "step" &&
    (typeof transition.target === "string" || Number.isFinite(transition.target))
  ) {
    return {
      type: "step",
      target: transition.target as string | number,
    };
  }

  if (transition.type === "workflow" && typeof transition.state === "string" && transition.state) {
    return {
      type: "workflow",
      state: transition.state,
    };
  }

  return null;
}

export function resolveProviderTransition(
  action: string | undefined,
  result: any,
  submitConfig: TFormSubmitRequest,
): TFormProviderTransition | null {
  const definition = getProviderDefinition(action);
  const explicitTransition = normalizeProviderTransition(result);
  if (explicitTransition) {
    return explicitTransition;
  }

  return definition?.resolveTransition?.(result, submitConfig) || null;
}

registerProvider("reservation", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "reservation",
    };
  },
  buildPayload(values) {
    return {
      action: "reservation",
      reservation: values,
    };
  },
  successEventName: "form-ui:reservation-success",
});

registerProvider("payment", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "payment",
    };
  },
  buildPayload(values) {
    return {
      action: "payment",
      payment: values,
    };
  },
  successEventName: "form-ui:payment-success",
  errorEventName: "form-ui:payment-error",
});

registerProvider("payment-stripe", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "payment-stripe",
    };
  },
  buildPayload(values) {
    return {
      action: "payment-stripe",
      payment: values,
    };
  },
  successEventName: "form-ui:payment-stripe-success",
  errorEventName: "form-ui:payment-stripe-error",
});

registerProvider("webhook", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "webhook",
    };
  },
  buildPayload(values) {
    return {
      action: "webhook",
      data: values,
    };
  },
  successEventName: "form-ui:webhook-success",
  errorEventName: "form-ui:webhook-error",
});

registerProvider("booking-availability", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "booking-availability",
    };
  },
  buildPayload(values) {
    return {
      action: "booking-availability",
      availability: values,
    };
  },
  successEventName: "form-ui:booking-availability-success",
  errorEventName: "form-ui:booking-availability-error",
});

registerProvider("calendar-booking", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "calendar-booking",
    };
  },
  buildPayload(values) {
    return {
      action: "calendar-booking",
      booking: values,
    };
  },
  successEventName: "form-ui:calendar-booking-success",
  errorEventName: "form-ui:calendar-booking-error",
});

registerProvider("calendar-cancel", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "calendar-cancel",
    };
  },
  buildPayload(values) {
    return {
      action: "calendar-cancel",
      cancellation: values,
    };
  },
  successEventName: "form-ui:calendar-cancel-success",
  errorEventName: "form-ui:calendar-cancel-error",
});

registerProvider("calendar-reschedule", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "calendar-reschedule",
    };
  },
  buildPayload(values) {
    return {
      action: "calendar-reschedule",
      reschedule: values,
    };
  },
  successEventName: "form-ui:calendar-reschedule-success",
  errorEventName: "form-ui:calendar-reschedule-error",
});

registerProvider("approval-request", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "approval-request",
    };
  },
  buildPayload(values) {
    return {
      action: "approval-request",
      approval: values,
    };
  },
  resolveTransition(result) {
    if (!result || typeof result !== "object") {
      return null;
    }

    const status = typeof result.status === "string" ? result.status : "";
    if (
      status === "pending_approval" ||
      status === "approved" ||
      status === "completed" ||
      status === "rejected"
    ) {
      return {
        type: "workflow",
        state: status,
      };
    }

    return null;
  },
  successEventName: "form-ui:approval-request-success",
  errorEventName: "form-ui:approval-request-error",
});

registerProvider("approval-decision", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "approval-decision",
    };
  },
  buildPayload(values) {
    return {
      action: "approval-decision",
      decision: values,
    };
  },
  resolveTransition(result) {
    if (!result || typeof result !== "object") {
      return null;
    }

    const status = typeof result.status === "string" ? result.status : "";
    if (status === "approved" || status === "completed" || status === "rejected") {
      return {
        type: "workflow",
        state: status,
      };
    }

    return null;
  },
  successEventName: "form-ui:approval-decision-success",
  errorEventName: "form-ui:approval-decision-error",
});

registerProvider("approval-comment", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "approval-comment",
    };
  },
  buildPayload(values) {
    return {
      action: "approval-comment",
      comment: values,
    };
  },
  successEventName: "form-ui:approval-comment-success",
  errorEventName: "form-ui:approval-comment-error",
});

registerProvider("email", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "email",
    };
  },
  buildPayload(values) {
    return {
      action: "email",
      email: values,
    };
  },
  successEventName: "form-ui:email-success",
  errorEventName: "form-ui:email-error",
});

registerProvider("crm", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "crm",
    };
  },
  buildPayload(values) {
    return {
      action: "crm",
      contact: values,
    };
  },
  successEventName: "form-ui:crm-success",
  errorEventName: "form-ui:crm-error",
});

registerProvider("identity-verification", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "identity-verification",
    };
  },
  buildPayload(values) {
    return {
      action: "identity-verification",
      identity: values,
    };
  },
  successEventName: "form-ui:identity-verification-success",
  errorEventName: "form-ui:identity-verification-error",
});

registerProvider("identity-verification-stripe", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "identity-verification-stripe",
    };
  },
  buildPayload(values) {
    return {
      action: "identity-verification-stripe",
      identity: values,
    };
  },
  successEventName: "form-ui:identity-verification-stripe-success",
  errorEventName: "form-ui:identity-verification-stripe-error",
});

registerProvider("identity-verification-webhook", {
  createSubmitRequest(provider) {
    return {
      endpoint: provider.endpoint,
      method: provider.method || "POST",
      headers: provider.headers,
      action: "identity-verification-webhook",
    };
  },
  buildPayload(values) {
    return {
      action: "identity-verification-webhook",
      identity: values,
    };
  },
  successEventName: "form-ui:identity-verification-webhook-success",
  errorEventName: "form-ui:identity-verification-webhook-error",
});
