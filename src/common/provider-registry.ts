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
  providerConfigSchema?: TFormProviderConfigSchema;
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

export type TNormalizedProviderResult = {
  status: string | null;
  transition: TFormProviderTransition | null;
  messages: string[];
  errors: any[];
  nextActions?: any[];
  data: any;
};

type TProviderConfigFieldSchema = {
  type: "string" | "number" | "boolean" | "array" | "object";
  minLength?: number;
  minimum?: number;
  enum?: readonly any[];
};

export type TFormProviderConfigSchema = {
  required?: string[];
  properties: Record<string, TProviderConfigFieldSchema>;
  additionalProperties?: boolean;
};

const providerRegistry = new Map<string, TFormProviderDefinition>();

const providerConfigSchemas = new Map<string, TFormProviderConfigSchema>([
  [
    "payment-stripe",
    {
      properties: {
        publishableKey: { type: "string", minLength: 1 },
        accountId: { type: "string", minLength: 1 },
      },
      additionalProperties: true,
    },
  ],
  [
    "booking-availability",
    {
      properties: {
        slotDurationMinutes: { type: "number", minimum: 1 },
        timezone: { type: "string", minLength: 1 },
      },
      additionalProperties: true,
    },
  ],
  [
    "identity-verification-stripe",
    {
      properties: {
        verificationFlow: {
          type: "string",
          enum: ["document", "id_number", "selfie"],
        },
      },
      additionalProperties: true,
    },
  ],
]);

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

function getProviderConfigSchema(
  action: string,
  definition?: TFormProviderDefinition | null,
): TFormProviderConfigSchema | null {
  if (definition?.providerConfigSchema) {
    return definition.providerConfigSchema;
  }

  return providerConfigSchemas.get(action) || null;
}

function validateConfigField(
  providerType: string,
  fieldName: string,
  fieldValue: unknown,
  fieldSchema: TProviderConfigFieldSchema,
): void {
  const valueType =
    Array.isArray(fieldValue) ? "array" : fieldValue === null ? "null" : typeof fieldValue;

  if (valueType !== fieldSchema.type) {
    throw new Error(
      `Invalid provider config for "${providerType}": config.${fieldName} must be ${fieldSchema.type}.`,
    );
  }

  if (
    fieldSchema.type === "string" &&
    typeof fieldSchema.minLength === "number" &&
    typeof fieldValue === "string" &&
    fieldValue.length < fieldSchema.minLength
  ) {
    throw new Error(
      `Invalid provider config for "${providerType}": config.${fieldName} must contain at least ${fieldSchema.minLength} characters.`,
    );
  }

  if (
    fieldSchema.type === "number" &&
    typeof fieldSchema.minimum === "number" &&
    typeof fieldValue === "number" &&
    fieldValue < fieldSchema.minimum
  ) {
    throw new Error(
      `Invalid provider config for "${providerType}": config.${fieldName} must be >= ${fieldSchema.minimum}.`,
    );
  }

  if (fieldSchema.enum && !fieldSchema.enum.includes(fieldValue)) {
    throw new Error(
      `Invalid provider config for "${providerType}": config.${fieldName} is not an allowed value.`,
    );
  }
}

export function validateProviderRequest(
  provider: TFormProviderRequest,
  definition?: TFormProviderDefinition | null,
): void {
  if (!provider || typeof provider !== "object") {
    throw new Error("Invalid provider config: provider must be an object.");
  }

  if (typeof provider.type !== "string" || provider.type.length === 0) {
    throw new Error("Invalid provider config: provider.type must be a non-empty string.");
  }

  if (typeof provider.endpoint !== "string" || provider.endpoint.length === 0) {
    throw new Error(
      `Invalid provider config for "${provider.type}": provider.endpoint must be a non-empty string.`,
    );
  }

  if (provider.headers !== undefined) {
    if (!provider.headers || typeof provider.headers !== "object" || Array.isArray(provider.headers)) {
      throw new Error(
        `Invalid provider config for "${provider.type}": provider.headers must be an object.`,
      );
    }
    for (const [headerName, headerValue] of Object.entries(provider.headers)) {
      if (typeof headerValue !== "string") {
        throw new Error(
          `Invalid provider config for "${provider.type}": provider.headers.${headerName} must be a string.`,
        );
      }
    }
  }

  const schema = getProviderConfigSchema(provider.type, definition);
  if (!schema) {
    return;
  }

  if (provider.config === undefined) {
    if (schema.required?.length) {
      throw new Error(
        `Invalid provider config for "${provider.type}": provider.config is required.`,
      );
    }
    return;
  }

  if (!provider.config || typeof provider.config !== "object" || Array.isArray(provider.config)) {
    throw new Error(
      `Invalid provider config for "${provider.type}": provider.config must be an object.`,
    );
  }

  const config = provider.config as Record<string, unknown>;

  if (schema.required?.length) {
    for (const requiredKey of schema.required) {
      if (config[requiredKey] === undefined) {
        throw new Error(
          `Invalid provider config for "${provider.type}": missing required config.${requiredKey}.`,
        );
      }
    }
  }

  for (const [fieldName, fieldValue] of Object.entries(config)) {
    const fieldSchema = schema.properties[fieldName];
    if (!fieldSchema) {
      if (schema.additionalProperties === false) {
        throw new Error(
          `Invalid provider config for "${provider.type}": unsupported config.${fieldName}.`,
        );
      }
      continue;
    }
    validateConfigField(provider.type, fieldName, fieldValue, fieldSchema);
  }
}

export function createSubmitRequestFromProvider(
  provider: TFormProviderRequest,
): TFormSubmitRequest {
  const definition = getProviderDefinition(provider.type);
  validateProviderRequest(provider, definition);
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

function normalizeProviderStatus(result: any): string | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  if (typeof result.status === "string" && result.status) {
    return result.status;
  }

  if (
    result.data &&
    typeof result.data === "object" &&
    typeof result.data.status === "string" &&
    result.data.status
  ) {
    return result.data.status;
  }

  return null;
}

function normalizeProviderMessages(result: any): string[] {
  if (!result || typeof result !== "object") {
    return [];
  }

  if (Array.isArray(result.messages)) {
    return result.messages.filter(
      (entry: unknown): entry is string =>
        typeof entry === "string" && entry.length > 0,
    );
  }

  if (typeof result.message === "string" && result.message) {
    return [result.message];
  }

  return [];
}

function normalizeProviderErrors(result: any): any[] {
  if (!result || typeof result !== "object") {
    return [];
  }

  if (Array.isArray(result.errors)) {
    return result.errors;
  }

  if (result.errors && typeof result.errors === "object") {
    return [result.errors];
  }

  if (result.error !== undefined) {
    return [result.error];
  }

  return [];
}

function normalizeProviderNextActions(result: any): any[] | undefined {
  if (!result || typeof result !== "object") {
    return undefined;
  }

  const explicitNextActions = (result as Record<string, any>).nextActions;
  if (Array.isArray(explicitNextActions)) {
    return explicitNextActions;
  }
  if (explicitNextActions !== undefined && explicitNextActions !== null) {
    return [explicitNextActions];
  }

  const nestedData = (result as Record<string, any>).data;
  if (!nestedData || typeof nestedData !== "object") {
    return undefined;
  }
  const nestedNextActions = (nestedData as Record<string, any>).nextActions;
  if (Array.isArray(nestedNextActions)) {
    return nestedNextActions;
  }
  if (nestedNextActions !== undefined && nestedNextActions !== null) {
    return [nestedNextActions];
  }

  return undefined;
}

function normalizeProviderData(result: any): any {
  if (!result || typeof result !== "object") {
    return result;
  }

  if (result.data !== undefined) {
    return result.data;
  }

  const {
    status,
    transition,
    message,
    messages,
    error,
    errors,
    nextActions,
    ...rest
  } = result as Record<string, any>;
  void status;
  void transition;
  void message;
  void messages;
  void error;
  void errors;
  void nextActions;

  if (Object.keys(rest).length > 0) {
    return rest;
  }

  return result;
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

export function normalizeProviderResult(
  action: string | undefined,
  result: any,
  submitConfig: TFormSubmitRequest,
): TNormalizedProviderResult {
  const nextActions = normalizeProviderNextActions(result);
  return {
    status: normalizeProviderStatus(result),
    transition: resolveProviderTransition(action, result, submitConfig),
    messages: normalizeProviderMessages(result),
    errors: normalizeProviderErrors(result),
    ...(nextActions ? { nextActions } : {}),
    data: normalizeProviderData(result),
  };
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
