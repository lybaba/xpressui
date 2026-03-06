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
  "provider-registry helpers",
];

export function getPublicApiManifest(): TPublicApiManifest {
  return {
    schemaVersion: 1,
    stable: [...STABLE_PUBLIC_API],
    advanced: [...ADVANCED_PUBLIC_API],
  };
}

