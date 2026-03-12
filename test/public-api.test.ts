import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as publicApi from "../src/index";
import * as standaloneApi from "../src/standalone";
import {
  createFormAdminPanel,
  createFormOpsPanel,
  createResumeStatusPanel,
  createLocalFormAdmin,
  createFormConfig,
  createFormPreset,
  createSubmitRequestFromProvider,
  fieldFactory,
  FormRuntime,
  FormStepRuntime,
  FormUI,
  FormUploadRuntime,
  getProviderDefinition,
  getPublicApiManifest,
  getResumeShareCodeClaimPresentation,
  hydrateFormUI,
  isProviderResponseEnvelopeV2,
  PUBLIC_FORM_SCHEMA_VERSION,
  registerProvider,
  resolveProviderTransition,
  validateProviderResponseEnvelopeV2,
  validatePublicFormConfig,
} from "../src/index";
import {
  createMountSnippet,
  createTemplateMarkup,
  mountFormUI,
} from "../src/standalone";
import { resetDomAndStorage } from "./test-utils";

describe("Public API", () => {
  beforeEach(() => {
    resetDomAndStorage();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("keeps the main public runtime exports available from the package entrypoint", () => {
    expect(publicApi.FormUI).toBe(FormUI);
    expect(publicApi.FormRuntime).toBe(FormRuntime);
    expect(publicApi.FormStepRuntime).toBe(FormStepRuntime);
    expect(publicApi.FormUploadRuntime).toBe(FormUploadRuntime);
    expect(publicApi.createFormConfig).toBe(createFormConfig);
    expect(publicApi.createFormPreset).toBe(createFormPreset);
    expect(publicApi.fieldFactory).toBe(fieldFactory);
    expect(publicApi.hydrateFormUI).toBe(hydrateFormUI);
    expect(publicApi.createFormAdminPanel).toBe(createFormAdminPanel);
    expect(publicApi.createFormOpsPanel).toBe(createFormOpsPanel);
    expect(publicApi.createResumeStatusPanel).toBe(createResumeStatusPanel);
    expect(publicApi.createLocalFormAdmin).toBe(createLocalFormAdmin);
    expect(publicApi.validatePublicFormConfig).toBe(validatePublicFormConfig);
    expect(publicApi.PUBLIC_FORM_SCHEMA_VERSION).toBe(PUBLIC_FORM_SCHEMA_VERSION);
    expect(publicApi.getPublicApiManifest).toBe(getPublicApiManifest);
    expect(publicApi.getResumeShareCodeClaimPresentation).toBe(getResumeShareCodeClaimPresentation);
    expect(publicApi.registerProvider).toBe(registerProvider);
    expect(publicApi.getProviderDefinition).toBe(getProviderDefinition);
    expect(publicApi.createSubmitRequestFromProvider).toBe(createSubmitRequestFromProvider);
    expect(publicApi.resolveProviderTransition).toBe(resolveProviderTransition);
    expect(publicApi.validateProviderResponseEnvelopeV2).toBe(validateProviderResponseEnvelopeV2);
    expect(publicApi.isProviderResponseEnvelopeV2).toBe(isProviderResponseEnvelopeV2);
    expect(standaloneApi.createMountSnippet).toBe(createMountSnippet);
    expect(standaloneApi.createTemplateMarkup).toBe(createTemplateMarkup);
    expect(standaloneApi.mountFormUI).toBe(mountFormUI);
  });

  it("exposes a public api manifest with stable and advanced boundaries", () => {
    const manifest = getPublicApiManifest();

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.stable).toEqual(
      expect.arrayContaining([
        "hydrateFormUI",
        "createFormConfig",
        "createFormPreset",
        "fieldFactory",
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
        "getResumeShareCodeClaimPresentation",
        "validatePublicFormConfig",
        "migratePublicFormConfig",
      ]),
    );
    expect(manifest.advanced).toEqual(
      expect.arrayContaining([
        "FormEngineRuntime",
        "FormDynamicRuntime",
        "FormPersistenceRuntime",
        "FormStepRuntime",
        "createFormDebugPanel",
        "createFormAdminPanel",
        "createFormOpsPanel",
        "createResumeStatusPanel",
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
      ]),
    );

    const exportedKeys = new Set(Object.keys(publicApi));
    for (const exportName of [...manifest.stable, ...manifest.advanced]) {
      expect(exportedKeys.has(exportName)).toBe(true);
    }
  });
});
