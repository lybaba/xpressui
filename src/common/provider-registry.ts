import { TFormSubmitRequest } from "./TFormConfig";

export type TFormProviderDefinition = {
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

export function getProviderSuccessEventName(action?: string): string | null {
  return getProviderDefinition(action)?.successEventName || null;
}

export function getProviderErrorEventName(action?: string): string | null {
  return getProviderDefinition(action)?.errorEventName || null;
}

registerProvider("reservation", {
  buildPayload(values) {
    return {
      action: "reservation",
      reservation: values,
    };
  },
  successEventName: "form-ui:reservation-success",
});

registerProvider("payment", {
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
  buildPayload(values) {
    return {
      action: "payment-stripe",
      payment: values,
    };
  },
  successEventName: "form-ui:payment-stripe-success",
  errorEventName: "form-ui:payment-stripe-error",
});
