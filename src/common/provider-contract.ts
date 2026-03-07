export const PROVIDER_RESPONSE_CONTRACT_VERSION = "provider-envelope-v2" as const;

export type TProviderResponseContractVersion = typeof PROVIDER_RESPONSE_CONTRACT_VERSION;

export type TFormProviderTransition =
  | {
      type: "step";
      target: string | number;
    }
  | {
      type: "workflow";
      state: string;
    };

export type TNormalizedProviderNextAction = any;

export type TNormalizedProviderResult = {
  status: string | null;
  transition: TFormProviderTransition | null;
  messages: string[];
  errors: any[];
  nextActions?: TNormalizedProviderNextAction[];
  data: any;
};

export type TProviderResponseEnvelopeV2 = {
  status?: string;
  transition?: TFormProviderTransition;
  messages?: string[];
  errors?: any[];
  nextActions?: TNormalizedProviderNextAction[];
  data?: any;
};

export function createNormalizedProviderResult(
  input: Partial<TNormalizedProviderResult> & Pick<TNormalizedProviderResult, "data">,
): TNormalizedProviderResult {
  return {
    status: input.status ?? null,
    transition: input.transition ?? null,
    messages: Array.isArray(input.messages) ? input.messages : [],
    errors: Array.isArray(input.errors) ? input.errors : [],
    ...(Array.isArray(input.nextActions) ? { nextActions: input.nextActions } : {}),
    data: input.data,
  };
}

export function isNormalizedProviderResult(value: unknown): value is TNormalizedProviderResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const result = value as Record<string, any>;
  const transition = result.transition;
  const transitionValid =
    transition === null ||
    transition === undefined ||
    (typeof transition === "object" &&
      ((transition.type === "step" && ("target" in transition)) ||
        (transition.type === "workflow" && typeof transition.state === "string")));

  return (
    (result.status === null || typeof result.status === "string") &&
    transitionValid &&
    Array.isArray(result.messages) &&
    Array.isArray(result.errors) &&
    (!("nextActions" in result) || Array.isArray(result.nextActions)) &&
    "data" in result
  );
}
