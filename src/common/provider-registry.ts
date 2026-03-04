import { TFormProviderRequest, TFormSubmitRequest } from "./TFormConfig";

export type TFormProviderDefinition = {
  createSubmitRequest?(
    provider: TFormProviderRequest,
  ): TFormSubmitRequest;
  buildPayload(
    values: Record<string, any>,
    submitConfig: TFormSubmitRequest,
  ): Record<string, any>;
  successEventName?: string;
  errorEventName?: string;
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
