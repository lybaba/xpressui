import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as publicApi from "../src/index";
import {
  createLocalFormAdmin,
  createFormConfig,
  createFormPreset,
  createMountSnippet,
  createSubmitRequestFromProvider,
  fieldFactory,
  FormRuntime,
  FormStepRuntime,
  FormUI,
  FormUploadRuntime,
  getProviderDefinition,
  getPublicApiManifest,
  isProviderResponseEnvelopeV2,
  mountFormUI,
  PUBLIC_FORM_SCHEMA_VERSION,
  registerProvider,
  resolveProviderTransition,
  validateProviderResponseEnvelopeV2,
  validatePublicFormConfig,
} from "../src/index";
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
    expect(publicApi.createMountSnippet).toBe(createMountSnippet);
    expect(publicApi.createFormPreset).toBe(createFormPreset);
    expect(publicApi.fieldFactory).toBe(fieldFactory);
    expect(publicApi.mountFormUI).toBe(mountFormUI);
    expect(publicApi.createLocalFormAdmin).toBe(createLocalFormAdmin);
    expect(publicApi.validatePublicFormConfig).toBe(validatePublicFormConfig);
    expect(publicApi.PUBLIC_FORM_SCHEMA_VERSION).toBe(PUBLIC_FORM_SCHEMA_VERSION);
    expect(publicApi.getPublicApiManifest).toBe(getPublicApiManifest);
    expect(publicApi.registerProvider).toBe(registerProvider);
    expect(publicApi.getProviderDefinition).toBe(getProviderDefinition);
    expect(publicApi.createSubmitRequestFromProvider).toBe(createSubmitRequestFromProvider);
    expect(publicApi.resolveProviderTransition).toBe(resolveProviderTransition);
    expect(publicApi.validateProviderResponseEnvelopeV2).toBe(validateProviderResponseEnvelopeV2);
    expect(publicApi.isProviderResponseEnvelopeV2).toBe(isProviderResponseEnvelopeV2);
  });

  it("exposes a public api manifest with stable and advanced boundaries", () => {
    const manifest = getPublicApiManifest();

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.stable).toEqual(
      expect.arrayContaining([
        "mountFormUI",
        "createFormConfig",
        "createMountSnippet",
        "createFormPreset",
        "fieldFactory",
        "createTemplateMarkup",
        "FormUI",
        "FormRuntime",
        "FormUploadRuntime",
        "createLocalFormAdmin",
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
        "attachFormDebugObserver",
        "registerProvider",
        "getProviderDefinition",
        "createSubmitRequestFromProvider",
        "resolveProviderTransition",
        "normalizeProviderResult",
        "validateProviderResponseEnvelopeV2",
        "isProviderResponseEnvelopeV2",
        "validateProviderRequest",
        "getProviderSuccessEventName",
        "getProviderErrorEventName",
      ]),
    );
  });
});
