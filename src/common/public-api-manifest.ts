export type TPublicApiManifest = {
  schemaVersion: number;
  stable: string[];
  advanced: string[];
};

const STABLE_PUBLIC_API = [
  "mountFormUI",
  "createFormConfig",
  "createMountSnippet",
  "createFormPreset",
  "fieldFactory",
  "stepFactory",
  "createTemplateMarkup",
  "FormUI",
  "FormRuntime",
  "FormUploadRuntime",
  "createLocalFormAdmin",
  "DOCUMENT_NORMALIZED_CONTRACT_VERSION",
  "createNormalizedDocumentContract",
  "isDocumentNormalizedContractV2",
  "summarizeNormalizedDocumentContract",
  "PROVIDER_RESPONSE_CONTRACT_VERSION",
  "validateProviderResponseEnvelopeV2",
  "isProviderResponseEnvelopeV2",
  "REMOTE_RESUME_CONTRACT_VERSION",
  "isRemoteResumePolicy",
  "getRemoteResumePolicy",
  "validatePublicFormConfig",
  "migratePublicFormConfig",
];

const ADVANCED_PUBLIC_API = [
  "FormEngineRuntime",
  "FormDynamicRuntime",
  "FormPersistenceRuntime",
  "FormStepRuntime",
  "createFormDebugPanel",
  "attachFormDebugObserver",
  "registerProvider",
  "getProviderDefinition",
  "createSubmitRequestFromProvider",
  "resolveProviderTransition",
  "createNormalizedProviderResult",
  "isNormalizedProviderResult",
  "normalizeProviderResult",
  "validateProviderRequest",
  "getProviderSuccessEventName",
  "getProviderErrorEventName",
];

export function getPublicApiManifest(): TPublicApiManifest {
  return {
    schemaVersion: 1,
    stable: [...STABLE_PUBLIC_API],
    advanced: [...ADVANCED_PUBLIC_API],
  };
}
