import { createForm, FormApi } from "final-form";
import TFormConfig, {
  TFormValidationI18nConfig,
  TFormSubmitLifecycleStage,
  TFormSubmitRequest,
} from "./common/TFormConfig";
import { TValidator } from "./common/Validator";
import getFormConfig, { getFieldConfig } from "./dom-utils";
import TFieldConfig from "./common/TFieldConfig";
import { FormEngineRuntime, TDocumentDataViewOptions } from "./common/form-engine";
import {
  DOCUMENT_NORMALIZED_CONTRACT_VERSION,
  createNormalizedDocumentContract,
  isDocumentNormalizedContractV2,
  summarizeNormalizedDocumentContract,
  TDocumentMrzResult,
  TDocumentNormalizedContractV2,
  TDocumentNormalizedFields,
  TDocumentNormalizedQuality,
  TDocumentNormalizedStatus,
  TDocumentNormalizedContractVersion,
  TDocumentScanInsight,
} from "./common/document-contract";
import {
  APPROVAL_STATE_TYPE,
  CAMERA_PHOTO_TYPE,
  CHECKBOXES_TYPE,
  DOCUMENT_SCAN_TYPE,
  isFileFieldType,
  IMAGE_GALLERY_TYPE,
  PRODUCT_LIST_TYPE,
  QUIZ_TYPE,
  RADIO_BUTTONS_TYPE,
  QR_SCAN_TYPE,
  SETTING_TYPE,
  UPLOAD_FILE_TYPE,
  UNKNOWN_TYPE,
} from "./common/field";
import { FormDynamicRuntime } from "./common/form-dynamic";
import type { TFormActiveTemplateWarning } from "./common/form-dynamic";
import {
  FormPersistenceRuntime,
  TFormQueueState,
  TResumeLookupResult,
  TResumeShareCodeClaimDetail,
  TResumeShareCodeRestoreDetail,
  TResumeShareCodeInfo,
  TResumeStatusSummary,
  TResumeTokenInfo,
  TFormStorageHealth,
  TFormStorageSnapshot,
} from "./common/form-persistence";
import {
  getRemoteResumePolicy,
  getResumeShareCodeClaimPresentation,
  isRemoteResumePolicy,
  REMOTE_RESUME_CONTRACT_VERSION,
} from "./common/resume-contract";
import {
  assertProviderResponseContract,
  buildProviderTransitionCandidates as buildConfiguredProviderTransitionCandidates,
  buildProviderMessagesResult,
  buildSubmitHookErrorResult,
  getProviderContractWarning,
  runValidationHooks,
  resolveApprovalStateUpdate,
  resolveSubmitTransportResult,
  runConfiguredSubmitLifecycleStage,
} from "./common/form-submit-runtime";
import { getRestorableStorageValues } from "./common/form-storage";
import { FormStepRuntime } from "./common/form-steps";
import { FormRuntime } from "./common/form-runtime";
import { FormUploadRuntime, TFormUploadState } from "./common/form-upload";
import {
  buildLocalFormIncidentSummary,
  buildLocalFormOperationalSummary,
} from "./common/form-admin";
import { validatePublicFormConfig } from "./common/public-schema";
import {
  createNormalizedProviderResult,
  isNormalizedProviderResult,
  PROVIDER_RESPONSE_CONTRACT_VERSION,
  getProviderErrorEventName,
  getProviderSuccessEventName,
  normalizeProviderResult,
  registerProvider,
} from "./common/provider-registry";
import type { TFormProviderTransition, TNormalizedProviderResult } from "./common/provider-registry";
import {
  getDocumentScanInsight,
  getDocumentScanSlotCount,
  getFileValueList,
  hasFileValues,
  isDocumentScanField,
  isQrScanField,
} from "./ui/form-ui.document";
import {
  getImageGalleryCatalog as getImageGalleryCatalogItems,
  getImageGallerySelectionItems,
  getProductCartItems as getNormalizedProductCartItems,
  getProductCartTotal as getNormalizedProductCartTotal,
  getProductListCatalog as getProductListCatalogItems,
} from "./ui/form-ui.commerce";
import {
  getNextQuizSelectionItems as getNextNormalizedQuizSelectionItems,
  getQuizCatalog as getQuizCatalogItems,
  getQuizSelectionItems as getNormalizedQuizSelectionItems,
  getQuizSelectionLimit as getNormalizedQuizSelectionLimit,
  isOpenQuizField as isConfiguredOpenQuizField,
} from "./ui/form-ui.quiz";
import {
  collectDomFieldValues,
  getOutputRendererType as getFieldOutputRendererType,
  isFieldViewMode as isConfiguredFieldViewMode,
  readInputElementValue as readFieldInputElementValue,
  readViewValuesAttribute as readConfiguredViewValuesAttribute,
  resolveFieldViewValue as resolveConfiguredFieldViewValue,
} from "./ui/form-ui.view";
import {
  ensureStepControls as ensureConfiguredStepControls,
  getCurrentStepFieldElements as getConfiguredCurrentStepFieldElements,
  getStepButtonLabels as getConfiguredStepButtonLabels,
  getStepUiConfig as getConfiguredStepUiConfig,
  getStepElements as getConfiguredStepElements,
  syncStepControls as syncConfiguredStepControls,
  syncStepVisibility as syncConfiguredStepVisibility,
} from "./ui/form-ui.workflow";
import {
  applyFieldValuePresentation as applyConfiguredFieldValuePresentation,
  bindSelectionFieldEvents as bindConfiguredSelectionFieldEvents,
  bindSimpleFieldEvents as bindConfiguredSimpleFieldEvents,
  getFieldContainer as getConfiguredFieldContainer,
  getFieldElement as getConfiguredFieldElement,
  renderFieldErrorState as renderConfiguredFieldErrorState,
} from "./ui/form-ui.field";
import {
  createDefaultHtmlSanitizer as createConfiguredDefaultHtmlSanitizer,
  createDefaultOutputRenderers as createConfiguredDefaultOutputRenderers,
  escapeHtml as escapeConfiguredHtml,
  getDisplayText as getConfiguredDisplayText,
  getFileMeta as getConfiguredFileMeta,
  getFileMetas as getConfiguredFileMetas,
  getMapSources as getConfiguredMapSources,
  getMediaSources as getConfiguredMediaSources,
  isEmbeddableDocumentSource as isConfiguredEmbeddableDocumentSource,
  isSafeMapEmbedSource as isConfiguredSafeMapEmbedSource,
  normalizeViewValue as normalizeConfiguredViewValue,
  readTemplateTokenValue as readConfiguredTemplateTokenValue,
  renderViewTemplate as renderConfiguredViewTemplate,
  resolveMediaDisplayPolicy as resolveConfiguredMediaDisplayPolicy,
  resolveOutputRendererForField as resolveConfiguredOutputRendererForField,
  resolveViewTemplateValue as resolveConfiguredViewTemplateValue,
  shouldRenderUnsafeHtml as shouldConfiguredRenderUnsafeHtml,
} from "./ui/form-ui.output";
export type {
  TFormApprovalState,
  TFormUISubmitDetail,
  TFormWorkflowState,
} from "./ui/form-ui.types";
import type {
  TBarcodeDetectorResult,
  TDocumentPerspectiveCorners,
  TFieldOutputRendererOverride,
  TFormApprovalState,
  TFormHtmlSanitizer,
  TFormOutputRenderer,
  TFormRenderMode,
  TFormUISubmitDetail,
  TFormWorkflowState,
  TImageGalleryItem,
  TMediaDisplayPolicy,
  TOutputRendererType,
  TProductCartItem,
  TProductListItem,
  TProviderTransitionRouteResult,
  TQrScannerState,
  TWorkflowRouteResult,
} from "./ui/form-ui.types";
export {
  DOCUMENT_NORMALIZED_CONTRACT_VERSION,
  createNormalizedDocumentContract,
  isDocumentNormalizedContractV2,
  summarizeNormalizedDocumentContract,
} from "./common/document-contract";
export {
  createFormConfig,
  createMountSnippet,
  createTemplateMarkup,
  hydrateFormUI,
  mountFormUI,
} from "./common/form-builder";
export { createFormPreset, fieldFactory, stepFactory } from "./common/form-presets";
export { createLocalFormAdmin } from "./common/form-admin";
export { attachFormDebugObserver } from "./common/form-debug";
export { createFormDebugPanel } from "./common/form-debug-panel";
export { createFormAdminPanel } from "./common/form-admin-panel";
export { createFormOpsPanel } from "./common/form-ops-panel";
export { createResumeStatusPanel } from "./common/form-resume-status-panel";
export { getPublicApiManifest } from "./common/public-api-manifest";
export { FormEngineRuntime } from "./common/form-engine";
export { FormDynamicRuntime } from "./common/form-dynamic";
export { FormPersistenceRuntime } from "./common/form-persistence";
export {
  getRemoteResumePolicy,
  getResumeShareCodeClaimPresentation,
  isRemoteResumePolicy,
  REMOTE_RESUME_CONTRACT_VERSION,
} from "./common/resume-contract";
export { FormRuntime } from "./common/form-runtime";
export { FormUploadRuntime } from "./common/form-upload";
export { FormStepRuntime } from "./common/form-steps";
export type { TStorageHealth } from "./common/form-storage";
export {
  PUBLIC_FORM_SCHEMA_VERSION,
  getPublicFormSchemaErrors,
  migratePublicFormConfig,
  validatePublicFormConfig,
} from "./common/public-schema";
export {
  createNormalizedProviderResult,
  createSubmitRequestFromProvider,
  getProviderDefinition,
  getProviderErrorEventName,
  getProviderSuccessEventName,
  isNormalizedProviderResult,
  isProviderResponseEnvelopeV2,
  normalizeProviderResult,
  PROVIDER_RESPONSE_CONTRACT_VERSION,
  resolveProviderTransition,
  registerProvider,
  validateProviderResponseEnvelopeV2,
  validateProviderRequest,
} from "./common/provider-registry";
export type {
  TLocalFormAdmin,
  TLocalFormOperationalSummary,
  TLocalFormIncidentSummary,
  TLocalQueueQuery,
} from "./common/form-admin";
export type {
  TFormDebugEventRecord,
  TFormDebugObserver,
  TFormDebugOptions,
  TFormDebugRuleRecord,
  TFormDebugSnapshot,
  TFormDebugRuleStateRecord,
  TFormDebugTemplateDiagnosticRecord,
  TFormDebugTemplateWarningStateRecord,
} from "./common/form-debug";
export type { TFormDebugPanel, TFormDebugPanelOptions } from "./common/form-debug-panel";
export type { TPublicApiManifest } from "./common/public-api-manifest";
export type { TFormActiveTemplateWarning } from "./common/form-dynamic";
export type { TFormUploadState } from "./common/form-upload";
export type { TFormStepProgress, TFormWorkflowSnapshot } from "./common/form-steps";
export type { TResumeShareCodeClaimPresentation } from "./common/resume-contract";
export type {
  TFormQueueState,
  TResumeLookupResult,
  TRemoteResumeCreateRequest,
  TRemoteResumeCreateResponse,
  TRemoteResumeInvalidateResponse,
  TRemoteResumeLookupResponse,
  TRemoteResumeOperation,
  TResumeShareCodeClaimDetail,
  TResumeShareCodeRestoreDetail,
  TResumeShareCodeInfo,
  TResumeStatusSummary,
  TResumeTokenInfo,
  TFormStorageHealth,
  TFormStorageSnapshot,
} from "./common/form-persistence";
export type {
  TRemoteResumeContractVersion,
  TRemoteResumePolicy,
  TRemoteResumePolicyCode,
} from "./common/resume-contract";
export type { TCreateFormPresetOptions, TFormPresetName } from "./common/form-presets";
export type {
  TFormProviderConfigSchema,
  TNormalizedProviderNextAction,
  TFormProviderTransition,
  TNormalizedProviderResult,
  TProviderResponseContractVersion,
  TProviderResponseEnvelopeV2,
} from "./common/provider-registry";
export type {
  TFormMediaDisplayPolicy,
  TFormOutputRendererType,
  TFormOutputSnapshot,
  TFormRuntimeDynamicAdapters,
  TFormRuntimeEmitEvent,
  TFormRuntimeOptions,
  TFormRuntimePublicApi,
  TFormRuntimeSubmitResult,
  TFormRuntimeSubmitValues,
} from "./common/form-runtime";
export type { TDocumentDataReadMode, TStoredDocumentData } from "./common/form-engine";
export type {
  TDocumentNormalizedContractVersion,
  TDocumentNormalizedFields,
  TDocumentNormalizedQuality,
  TDocumentNormalizedStatus,
  TDocumentMrzResult,
  TDocumentNormalizedContractV2,
  TDocumentScanInsight,
} from "./common/document-contract";
export type {
  TFormValidationI18nCatalog,
  TFormValidationI18nConfig,
  TFormValidationI18nMessages,
  TFormValidationMessageResolver,
  TFormValidationMessageResolverContext,
  TFormUploadPolicyContext,
  TFormUploadPolicyHook,
  TFormUploadPolicyResult,
  TFormUploadPolicyStage,
  TFormSubmitLifecycle,
  TFormSubmitLifecycleContext,
  TFormSubmitLifecycleHook,
  TFormSubmitLifecycleHookResult,
  TFormSubmitLifecycleStage,
} from "./common/TFormConfig";

export class FormUI extends HTMLElement {
  form: FormApi<any, any> | null;
  registered: Record<string, boolean>;
  formConfig: TFormConfig | null;
  engine: FormEngineRuntime;
  errors: Record<string, boolean>;
  initialized: boolean;
  dynamic: FormDynamicRuntime;
  persistence: FormPersistenceRuntime;
  upload: FormUploadRuntime;
  steps: FormStepRuntime;
  filePreviewUrls: Record<string, string[]>;
  fileDragActive: Record<string, boolean>;
  fileUploadState: Record<string, TFormUploadState | null>;
  ruleFieldErrors: Record<string, string>;
  submitLockedByRules: boolean;
  submitLockMessage: string | null;
  qrScannerState: Record<string, TQrScannerState>;
  qrScannerStreams: Record<string, MediaStream | null>;
  qrScannerTimers: Record<string, number | null>;
  qrScannerRunning: Record<string, boolean>;
  activeDocumentScanSlot: Record<string, number>;
  documentScanInsights: Record<string, TDocumentScanInsight>;
  approvalState: TFormApprovalState | null;
  workflowState: TFormWorkflowState;
  stepNames: string[];
  currentStepIndex: number;
  stepProgressContainer: HTMLElement | null;
  stepActionsContainer: HTMLElement | null;
  stepProgressElement: HTMLElement | null;
  stepProgressBar: HTMLElement | null;
  stepSummaryElement: HTMLElement | null;
  stepBackButton: HTMLButtonElement | null;
  stepNextButton: HTMLButtonElement | null;
  productListCartClickBound: boolean;
  productCartOverlay: HTMLElement | null;
  productCartCloseTimer: number | null;
  pageScrollLockCount: number;
  pageScrollPreviousOverflow: string | null;
  productGalleryOverlay: HTMLElement | null;
  overlayCleanup: (() => void) | null;
  overlayReturnFocusElement: HTMLElement | null;
  hostAriaHiddenBeforeOverlay: string | null;
  viewValues: Record<string, any>;
  outputRenderers: Record<string, TFormOutputRenderer>;
  fieldOutputRenderers: Record<string, TFieldOutputRendererOverride>;
  fieldMediaPolicies: Record<string, TMediaDisplayPolicy>;
  htmlSanitizer: TFormHtmlSanitizer;
  allowUnsafeHtml: boolean;

  constructor() {
    super();
    this.formConfig = null;
    this.engine = new FormEngineRuntime();
    this.registered = {};
    this.errors = {}
    this.form = null;
    this.initialized = false;
    this.fileUploadState = {};
    this.ruleFieldErrors = {};
    this.submitLockedByRules = false;
    this.submitLockMessage = null;
    this.filePreviewUrls = {};
    this.fileDragActive = {};
    this.qrScannerState = {};
    this.qrScannerStreams = {};
    this.qrScannerTimers = {};
    this.qrScannerRunning = {};
    this.activeDocumentScanSlot = {};
    this.documentScanInsights = {};
    this.approvalState = null;
    this.workflowState = "draft";
    this.stepNames = [];
    this.currentStepIndex = 0;
    this.stepProgressContainer = null;
    this.stepActionsContainer = null;
    this.stepProgressElement = null;
    this.stepProgressBar = null;
    this.stepSummaryElement = null;
    this.stepBackButton = null;
    this.stepNextButton = null;
    this.productListCartClickBound = false;
    this.productCartOverlay = null;
    this.productCartCloseTimer = null;
    this.pageScrollLockCount = 0;
    this.pageScrollPreviousOverflow = null;
    this.productGalleryOverlay = null;
    this.overlayCleanup = null;
    this.overlayReturnFocusElement = null;
    this.hostAriaHiddenBeforeOverlay = null;
    this.viewValues = {};
    this.fieldOutputRenderers = {};
    this.fieldMediaPolicies = {};
    this.htmlSanitizer = createConfiguredDefaultHtmlSanitizer();
    this.outputRenderers = this.createDefaultOutputRenderers();
    this.allowUnsafeHtml = false;
    this.dynamic = new FormDynamicRuntime({
      getFieldConfigs: () => Object.values(this.engine.getFields()),
      getRules: () => this.formConfig?.rules || [],
      getFieldContainer: (fieldName) => this.getFieldContainer(fieldName),
      getFieldElement: (fieldName) => this.getFieldElement(fieldName),
      setFieldDisabled: (fieldName, disabled) => {
        const fieldElement = this.getFieldElement(fieldName);
        if (fieldElement) {
          fieldElement.disabled = disabled;
        }
      },
      setFieldError: (fieldName, message) => {
        if (!message) {
          delete this.ruleFieldErrors[fieldName];
          this.syncFieldErrorDisplay(fieldName);
          return;
        }
        this.ruleFieldErrors[fieldName] = message;
        this.syncFieldErrorDisplay(fieldName);
      },
      clearFieldErrors: () => {
        const previousFieldNames = Object.keys(this.ruleFieldErrors);
        this.ruleFieldErrors = {};
        previousFieldNames.forEach((fieldName) => this.syncFieldErrorDisplay(fieldName));
      },
      setSubmitLocked: (locked, message) => {
        const nextLocked = Boolean(locked);
        const nextMessage = message || null;
        const changed =
          this.submitLockedByRules !== nextLocked
          || this.submitLockMessage !== nextMessage;
        this.submitLockedByRules = nextLocked;
        this.submitLockMessage = nextMessage;
        if (changed) {
          this.syncStepControls();
          this.emitFormEvent("form-ui:submit-lock", {
            values: this.form?.getState().values || {},
            formConfig: this.formConfig,
            submit: this.formConfig?.submit,
            result: {
              locked: this.submitLockedByRules,
              message: this.submitLockMessage,
            },
          });
        }
      },
      getFieldValue: (fieldName) => this.getFieldValue(fieldName),
      clearFieldValue: (fieldName) => {
        if (this.form) {
          this.form.change(fieldName, undefined);
        }
      },
      setFieldValue: (fieldName, value) => {
        if (this.form) {
          this.form.change(fieldName, value);
        }
      },
      getFormValues: () => this.form?.getState().values || {},
      emitEvent: (eventName, detail) =>
        this.emitFormEvent(eventName, detail as TFormUISubmitDetail),
      getEventContext: () => ({
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
      }),
    });
    this.steps = new FormStepRuntime();
    this.persistence = new FormPersistenceRuntime({
      getFormConfig: () => this.formConfig,
      getValues: () => this.form?.getState().values || {},
      getCurrentStepIndex: () =>
        (this.isMultiStepMode() && this.steps.getStepNames().length > 1
          ? this.steps.getCurrentStepIndex()
          : null),
      setCurrentStepIndex: (index) => this.setCurrentStepIndex(index),
      emitEvent: (eventName, detail) =>
        this.emitFormEvent(eventName, detail as TFormUISubmitDetail),
      submitValues: (values, submitConfig) => this.submitToApi(values, submitConfig),
    });
    this.upload = new FormUploadRuntime({
      emitEvent: (eventName, detail) => {
        const uploadState = detail.result as TFormUploadState | undefined;
        if (uploadState?.fieldNames?.length) {
          uploadState.fieldNames.forEach((fieldName) => {
            this.fileUploadState[fieldName] =
              uploadState.status === "complete" || uploadState.status === "error"
                ? uploadState
                : uploadState;
            const fieldConfig = this.engine.getField(fieldName);
            const selectionElement = this.querySelector(`#${fieldName}_selection`) as HTMLElement | null;
            if (fieldConfig) {
              this.renderFileSelection(fieldConfig, this.getFieldValue(fieldName), selectionElement);
            }
          });
        }

        return this.emitFormEvent(eventName, {
          ...(detail as TFormUISubmitDetail),
          formConfig: this.formConfig,
        });
      },
    });
  }

  get validators(): TValidator[] {
    return this.engine.validators;
  }

  get inputFields(): Record<string, TFieldConfig> {
    return this.engine.getFields();
  }

  connectedCallback() {
    if (!this.initialized) {
      this.initialize();
    }
  }

  disconnectedCallback() {
    this.stopAllQrCameras();
    this.clearAllFilePreviewUrls();
    if (this.productGalleryOverlay) {
      this.productGalleryOverlay.remove();
      this.productGalleryOverlay = null;
    }
    if (this.productCartOverlay) {
      this.productCartOverlay.remove();
      this.productCartOverlay = null;
    }
    if (this.productCartCloseTimer !== null && typeof window !== "undefined") {
      window.clearTimeout(this.productCartCloseTimer);
      this.productCartCloseTimer = null;
    }
    if (typeof document !== "undefined" && this.pageScrollLockCount > 0) {
      const body = document.body;
      if (body) {
        body.style.overflow = this.pageScrollPreviousOverflow || "";
      }
      this.pageScrollLockCount = 0;
      this.pageScrollPreviousOverflow = null;
    }
    this.teardownOverlayAccessibility(false);
    this.productListCartClickBound = false;
    this.persistence.disconnect();
  }

  normalizeViewValue = (value: any): any => {
    return normalizeConfiguredViewValue(value);
  }

  getDisplayText = (value: any): string => {
    return getConfiguredDisplayText(value);
  }

  getFileMeta = (value: any): { href: string; label: string } | null => {
    return getConfiguredFileMeta(value);
  }

  getFileMetas = (value: any): Array<{ href: string; label: string }> => {
    return getConfiguredFileMetas(value);
  }

  getMediaSources = (value: any): string[] => {
    return getConfiguredMediaSources(value);
  }

  isEmbeddableDocumentSource = (source: string): boolean => {
    return isConfiguredEmbeddableDocumentSource(source);
  }

  getMapSources = (value: any): string[] => {
    return getConfiguredMapSources(value);
  }

  isSafeMapEmbedSource = (source: string): boolean => {
    return isConfiguredSafeMapEmbedSource(source);
  }

  resolveMediaDisplayPolicy = (
    fieldConfig: TFieldConfig,
    inputElement: HTMLElement | null,
    rendererType?: string,
  ): TMediaDisplayPolicy => {
    return resolveConfiguredMediaDisplayPolicy(
      this.fieldMediaPolicies,
      fieldConfig,
      inputElement,
      rendererType,
    );
  }

  createDefaultOutputRenderers = (): Record<TOutputRendererType, TFormOutputRenderer> => {
    return createConfiguredDefaultOutputRenderers({
      htmlSanitizer: (html, context) => this.htmlSanitizer(html, context),
    });
  }

  getRenderMode = (): TFormRenderMode => {
    const mode = (this.getAttribute("mode") || "").trim().toLowerCase();
    if (
      mode === "view"
      || mode === "hybrid"
      || mode === "form-multi-step"
      || mode === "view-multi-step"
    ) {
      return mode;
    }

    return "form";
  }

  isMultiStepMode = (): boolean => {
    const mode = this.getRenderMode();
    return mode === "form-multi-step" || mode === "view-multi-step";
  }

  getBaseRenderMode = (): "form" | "view" | "hybrid" => {
    const mode = this.getRenderMode();
    if (mode === "view" || mode === "view-multi-step") {
      return "view";
    }
    if (mode === "hybrid") {
      return "hybrid";
    }
    return "form";
  }

  setViewValues = (values: Record<string, any>) => {
    this.viewValues = values && typeof values === "object" ? { ...values } : {};
    if (this.initialized && this.getBaseRenderMode() === "view") {
      const formElement = this.querySelector("form") as HTMLFormElement | null;
      if (formElement) {
        this.applyViewMode(formElement);
      }
    }

    if (this.initialized && this.getBaseRenderMode() === "hybrid" && this.form) {
      Object.entries(this.viewValues).forEach(([fieldName, fieldValue]) => {
        this.form?.change(fieldName, fieldValue);
      });
    }
  }

  getViewValues = (): Record<string, any> => {
    return { ...this.viewValues };
  }

  defaultHtmlSanitizer: TFormHtmlSanitizer = createConfiguredDefaultHtmlSanitizer()

  escapeHtml = (value: string): string => {
    return escapeConfiguredHtml(value);
  }

  readTemplateTokenValue = (values: Record<string, any>, tokenPath: string): any => {
    return readConfiguredTemplateTokenValue(values, tokenPath);
  }

  renderViewTemplate = (
    template: string,
    values: Record<string, any>,
    escapeValues: boolean,
  ): string => {
    return renderConfiguredViewTemplate(template, values, escapeValues);
  }

  resolveViewTemplateValue = (
    fieldConfig: TFieldConfig,
    inputElement: HTMLElement,
    rendererType: string,
    value: any,
    valuesContext?: Record<string, any>,
  ): any => {
    return resolveConfiguredViewTemplateValue(
      fieldConfig,
      inputElement,
      rendererType,
      value,
      valuesContext,
    );
  }

  setHtmlSanitizer = (sanitizer: TFormHtmlSanitizer) => {
    if (typeof sanitizer !== "function") {
      return;
    }

    this.htmlSanitizer = sanitizer;
    this.refreshOutputRendering();
  }

  resetHtmlSanitizer = () => {
    this.htmlSanitizer = this.defaultHtmlSanitizer;
    this.refreshOutputRendering();
  }

  setAllowUnsafeHtml = (enabled: boolean) => {
    this.allowUnsafeHtml = Boolean(enabled);
    this.refreshOutputRendering();
  }

  shouldRenderUnsafeHtml = (inputElement: HTMLElement | null): boolean => {
    return shouldConfiguredRenderUnsafeHtml(this, this.allowUnsafeHtml, inputElement);
  }

  setOutputRenderer = (rendererType: string, renderer: TFormOutputRenderer) => {
    if (!rendererType || typeof renderer !== "function") {
      return;
    }

    this.outputRenderers[rendererType] = renderer;
    this.refreshOutputRendering();
  }

  removeOutputRenderer = (rendererType: string) => {
    if (!rendererType || !this.outputRenderers[rendererType]) {
      return;
    }

    delete this.outputRenderers[rendererType];
    this.refreshOutputRendering();
  }

  setFieldOutputRenderer = (fieldName: string, renderer: TFieldOutputRendererOverride) => {
    if (!fieldName || !renderer) {
      return;
    }

    this.fieldOutputRenderers[fieldName] = renderer;
    this.refreshOutputRendering();
  }

  clearFieldOutputRenderer = (fieldName: string) => {
    if (!fieldName || !this.fieldOutputRenderers[fieldName]) {
      return;
    }

    delete this.fieldOutputRenderers[fieldName];
    this.refreshOutputRendering();
  }

  setFieldMediaPolicy = (fieldName: string, policy: TMediaDisplayPolicy) => {
    if (
      !fieldName
      || (policy !== "thumbnail" && policy !== "large" && policy !== "link" && policy !== "gallery")
    ) {
      return;
    }

    this.fieldMediaPolicies[fieldName] = policy;
    this.refreshOutputRendering();
  }

  clearFieldMediaPolicy = (fieldName: string) => {
    if (!fieldName || !this.fieldMediaPolicies[fieldName]) {
      return;
    }

    delete this.fieldMediaPolicies[fieldName];
    this.refreshOutputRendering();
  }

  resolveOutputRendererForField = (
    fieldConfig: TFieldConfig,
    inputElement: HTMLElement,
  ): { rendererType: string; renderer: TFormOutputRenderer } => {
    return resolveConfiguredOutputRendererForField({
      fieldConfig,
      inputElement,
      outputRenderers: this.outputRenderers,
      fieldOutputRenderers: this.fieldOutputRenderers,
      getOutputRendererType: (nextFieldConfig) => this.getOutputRendererType(nextFieldConfig),
    });
  }

  getOutputSnapshot = (values?: Record<string, any>) => {
    const formElem = this.querySelector("form") as HTMLFormElement | null;
    if (!formElem) {
      return {};
    }

    const mode = this.getBaseRenderMode();
    const fallbackValues = mode === "hybrid"
      ? (this.form?.getState().values || this.getInitialViewValues(formElem))
      : this.getInitialViewValues(formElem);
    const currentValues = values || fallbackValues;
    const snapshot: Record<string, { rendererType: string; mediaDisplayPolicy: TMediaDisplayPolicy; value: any }> = {};

    Array.from(formElem.elements).forEach((node) => {
      const fieldConfig = getFieldConfig(node);
      if (!fieldConfig?.name || fieldConfig.type === UNKNOWN_TYPE) {
        return;
      }

      const inputElement = this.querySelector(`#${fieldConfig.name}`) as HTMLElement | null;
      if (!inputElement) {
        return;
      }

      const { rendererType } = this.resolveOutputRendererForField(fieldConfig, inputElement);
      const mediaDisplayPolicy = this.resolveMediaDisplayPolicy(fieldConfig, inputElement, rendererType);
      snapshot[fieldConfig.name] = {
        rendererType,
        mediaDisplayPolicy,
        value: currentValues[fieldConfig.name],
      };
    });

    return snapshot;
  }

  emitOutputSnapshot = (values?: Record<string, any>) => {
    const snapshot = this.getOutputSnapshot(values);
    this.emitFormEvent("form-ui:output-snapshot", {
      values:
        values
        || this.form?.getState().values
        || {},
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
      result: snapshot,
    });
  }

  refreshOutputRendering = () => {
    if (!this.initialized) {
      return;
    }

    const formElem = this.querySelector("form") as HTMLFormElement | null;
    if (!formElem) {
      return;
    }

    const mode = this.getBaseRenderMode();
    if (mode === "view") {
      this.applyViewMode(formElem);
      this.emitOutputSnapshot(this.getInitialViewValues(formElem));
      return;
    }

    if (mode === "hybrid") {
      const values = this.form?.getState().values || this.getInitialViewValues(formElem);
      this.applyHybridMode(formElem, values);
      this.emitOutputSnapshot(values);
    }
  }

  readViewValuesAttribute = (): Record<string, any> => {
    return readConfiguredViewValuesAttribute(this);
  }

  collectDomFieldValues = (formElem: HTMLFormElement): Record<string, any> => {
    return collectDomFieldValues(formElem);
  }

  getInitialViewValues = (formElem: HTMLFormElement): Record<string, any> => {
    const domValues = this.collectDomFieldValues(formElem);
    const persistedValues = this.persistence.loadDraftValues();
    const attributeValues = this.readViewValuesAttribute();
    return {
      ...domValues,
      ...(persistedValues || {}),
      ...attributeValues,
      ...this.viewValues,
    };
  }

  getOutputRendererType = (fieldConfig: TFieldConfig): TOutputRendererType => {
    return getFieldOutputRendererType(fieldConfig);
  }

  isFieldViewMode = (fieldConfig: TFieldConfig, inputElement: HTMLElement | null): boolean => {
    return isConfiguredFieldViewMode(fieldConfig, inputElement);
  }

  readInputElementValue = (
    fieldConfig: TFieldConfig,
    inputElement: HTMLElement | null,
  ): any => {
    return readFieldInputElementValue(
      (nextFieldConfig) => this.isProductListField(nextFieldConfig),
      (nextFieldConfig) => this.isImageGalleryField(nextFieldConfig),
      (nextFieldConfig) => this.isQuizField(nextFieldConfig),
      (nextFieldConfig) => this.isChoiceListField(nextFieldConfig),
      fieldConfig,
      inputElement,
    );
  }

  resolveFieldViewValue = (
    fieldConfig: TFieldConfig,
    inputElement: HTMLElement | null,
    stateValue: any,
  ): any => {
    return resolveConfiguredFieldViewValue(
      this,
      fieldConfig,
      inputElement,
      stateValue,
      this.viewValues,
      (nextFieldConfig, nextInputElement) => this.readInputElementValue(nextFieldConfig, nextInputElement),
    );
  }

  applyFieldViewPresentation = (
    fieldConfig: TFieldConfig,
    inputElement: HTMLElement | null,
    selectionElement: HTMLElement | null,
    errorElement: HTMLElement | null,
    stateValue: any,
  ) => {
    if (!inputElement) {
      return;
    }

    const viewValue = this.resolveFieldViewValue(fieldConfig, inputElement, stateValue);
    this.renderViewField(
      fieldConfig,
      viewValue,
      inputElement,
      "view",
      this.form?.getState().values || {},
    );
    inputElement.style.display = "none";
    inputElement.setAttribute("aria-hidden", "true");
    if (
      inputElement instanceof HTMLInputElement
      || inputElement instanceof HTMLSelectElement
      || inputElement instanceof HTMLTextAreaElement
    ) {
      inputElement.disabled = true;
    }
    if (selectionElement) {
      selectionElement.style.display = "none";
      selectionElement.setAttribute("aria-hidden", "true");
    }
    if (errorElement) {
      errorElement.style.display = "none";
    }
  }

  renderViewField = (
    fieldConfig: TFieldConfig,
    value: any,
    inputElement: HTMLElement,
    modeOverride?: TFormRenderMode,
    valuesContext?: Record<string, any>,
  ) => {
    const viewFieldId = `${fieldConfig.name}_view`;
    let viewElement = this.querySelector(`#${viewFieldId}`) as HTMLElement | null;
    if (!viewElement) {
      viewElement = document.createElement("div");
      viewElement.id = viewFieldId;
      viewElement.setAttribute("data-view-field", fieldConfig.name);
      inputElement.insertAdjacentElement("afterend", viewElement);
    }

    viewElement.innerHTML = "";
    const { rendererType, renderer } = this.resolveOutputRendererForField(fieldConfig, inputElement);
    viewElement.setAttribute("data-renderer-type", rendererType);
    const mediaDisplayPolicy = this.resolveMediaDisplayPolicy(fieldConfig, inputElement, rendererType);
    viewElement.setAttribute("data-media-display-policy", mediaDisplayPolicy);
    const unsafeHtml = this.shouldRenderUnsafeHtml(inputElement);
    const resolvedValue = this.resolveViewTemplateValue(
      fieldConfig,
      inputElement,
      rendererType,
      value,
      valuesContext,
    );
    const rendered = renderer({
      fieldConfig,
      value: resolvedValue,
      mode: modeOverride || this.getRenderMode(),
      unsafeHtml,
      mediaDisplayPolicy,
    });
    viewElement.appendChild(rendered);
  }

  applyViewMode = (formElem: HTMLFormElement) => {
    const values = this.getInitialViewValues(formElem);
    Array.from(formElem.elements).forEach((node) => {
      const fieldConfig = getFieldConfig(node);
      if (!fieldConfig?.name || fieldConfig.type === UNKNOWN_TYPE) {
        return;
      }

      const inputElement = this.querySelector(`#${fieldConfig.name}`) as HTMLElement | null;
      if (!inputElement) {
        return;
      }

      this.renderViewField(fieldConfig, values[fieldConfig.name], inputElement, undefined, values);
      inputElement.style.display = "none";
      inputElement.setAttribute("aria-hidden", "true");
      if (
        inputElement instanceof HTMLInputElement ||
        inputElement instanceof HTMLSelectElement ||
        inputElement instanceof HTMLTextAreaElement
      ) {
        inputElement.disabled = true;
      }

      const errorElement = this.querySelector(`#${fieldConfig.name}_error`) as HTMLElement | null;
      if (errorElement) {
        errorElement.style.display = "none";
      }

      const selectionElement = this.querySelector(`#${fieldConfig.name}_selection`) as HTMLElement | null;
      if (selectionElement) {
        selectionElement.style.display = "none";
      }
    });

    Array.from(formElem.querySelectorAll('button[type="submit"], input[type="submit"]')).forEach((button) => {
      (button as HTMLElement).style.display = "none";
    });
  }

  applyHybridMode = (formElem: HTMLFormElement, values?: Record<string, any>) => {
    const modeValues = values || this.getInitialViewValues(formElem);
    Array.from(formElem.elements).forEach((node) => {
      const fieldConfig = getFieldConfig(node);
      if (!fieldConfig?.name || fieldConfig.type === UNKNOWN_TYPE) {
        return;
      }

      const inputElement = this.querySelector(`#${fieldConfig.name}`) as HTMLElement | null;
      if (!inputElement) {
        return;
      }

      this.renderViewField(fieldConfig, modeValues[fieldConfig.name], inputElement, undefined, modeValues);
    });
  }

  getFileValueList = getFileValueList

  isQrScanField = isQrScanField

  isDocumentScanField = isDocumentScanField

  getDocumentScanSlotCount = getDocumentScanSlotCount

  getDocumentScanInsight = (fieldConfig: TFieldConfig): TDocumentScanInsight =>
    getDocumentScanInsight(this.documentScanInsights, fieldConfig)

  buildDocumentNormalizedContract = createNormalizedDocumentContract

  resolveFileInputValue = async (fieldConfig: TFieldConfig, input: HTMLInputElement) => {
    const files = input.multiple
      ? Array.from(input.files || [])
      : input.files?.[0];

    if (this.isDocumentScanField(fieldConfig)) {
      const selectedFile = Array.isArray(files) ? files[0] : files;
      if (!selectedFile) {
        return undefined;
      }

      const currentFiles = this.getFileValueList(this.getFieldValue(fieldConfig.name));
      const slotCount = this.getDocumentScanSlotCount(fieldConfig);
      const activeSlot = Math.min(
        Math.max(this.activeDocumentScanSlot[fieldConfig.name] || 0, 0),
        slotCount - 1,
      );
      const nextFiles = Array.from(
        { length: slotCount },
        (_, index) => currentFiles[index] instanceof File ? currentFiles[index] : undefined,
      );
      const croppedFile = await this.cropDocumentScanFile(fieldConfig, selectedFile, activeSlot);
      nextFiles[activeSlot] = croppedFile;
      await this.analyzeDocumentScanFile(fieldConfig, croppedFile, activeSlot);
      return slotCount === 1 ? nextFiles[0] : nextFiles;
    }

    if (!this.isQrScanField(fieldConfig)) {
      return files;
    }

    const fileList = Array.isArray(files)
      ? files
      : files
        ? [files]
        : [];

    const fileValidationError = this.engine.validateFileField(fieldConfig.name, files);
    if (fileValidationError) {
      this.emitFileValidationErrorEvent(
        fieldConfig.name,
        {
          ...(this.form?.getState().values || {}),
          [fieldConfig.name]: files,
        },
        fileValidationError as TValidationError,
      );
      return undefined;
    }

    if (!fileList.length) {
      return undefined;
    }

    const qrValue = await this.decodeQrScanFile(fieldConfig, fileList[0]);
    if (qrValue !== null) {
      return qrValue;
    }

    return undefined;
  }

  getBarcodeDetector = () => {
    const barcodeDetector = (globalThis as any).BarcodeDetector;
    if (!barcodeDetector) {
      return null;
    }

    try {
      return new barcodeDetector({ formats: ["qr_code"] });
    } catch {
      try {
        return new barcodeDetector();
      } catch {
        return null;
      }
    }
  }

  getTextDetector = () => {
    const textDetector = (globalThis as any).TextDetector;
    if (!textDetector) {
      return null;
    }

    try {
      return new textDetector();
    } catch {
      return null;
    }
  }

  getMrzCharValue = (char: string) => {
    if (char >= "0" && char <= "9") {
      return Number(char);
    }

    if (char >= "A" && char <= "Z") {
      return char.charCodeAt(0) - 55;
    }

    return 0;
  }

  computeMrzChecksum = (input: string) => {
    const weights = [7, 3, 1];
    return input
      .split("")
      .reduce((sum, char, index) => sum + this.getMrzCharValue(char) * weights[index % 3], 0) % 10;
  }

  validateMrzChecksum = (source: string, checkDigit?: string) => {
    if (!checkDigit || checkDigit === "<") {
      return undefined;
    }

    if (!/^\d$/.test(checkDigit)) {
      return false;
    }

    return this.computeMrzChecksum(source) === Number(checkDigit);
  }

  computeMrzValidity = (checksums?: TDocumentMrzResult["checksums"]) => {
    if (!checksums) {
      return undefined;
    }

    const values = Object.values(checksums).filter((entry) => entry !== undefined);
    if (!values.length) {
      return undefined;
    }

    return values.every((entry) => entry === true);
  }

  parseMrz = (text: string): TDocumentMrzResult | null => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim().toUpperCase())
      .filter((line) => /^[A-Z0-9<]{20,}$/.test(line));

    if (lines.length >= 3) {
      const [line1, line2, line3] = lines.slice(-3);
      const nameBlock = line3.split("<<");
      const documentNumberSource = line1.slice(5, 14);
      const birthDateSource = line2.slice(0, 6);
      const expiryDateSource = line2.slice(8, 14);
      const compositeSource = `${line1.slice(0, 30)}${line2.slice(0, 7)}${line2.slice(8, 15)}${line2.slice(18, 29)}`;
      const checksums = {
        documentNumber: this.validateMrzChecksum(documentNumberSource, line1.slice(14, 15)),
        birthDate: this.validateMrzChecksum(birthDateSource, line2.slice(6, 7)),
        expiryDate: this.validateMrzChecksum(expiryDateSource, line2.slice(14, 15)),
        composite: this.validateMrzChecksum(compositeSource, line2.slice(29, 30)),
      };
      return {
        format: "TD1",
        lines: [line1, line2, line3],
        documentCode: line1.slice(0, 2).replace(/</g, ""),
        issuingCountry: line1.slice(2, 5).replace(/</g, ""),
        documentNumber: documentNumberSource.replace(/</g, ""),
        birthDate: birthDateSource.replace(/</g, ""),
        sex: line2.slice(7, 8).replace(/</g, ""),
        expiryDate: expiryDateSource.replace(/</g, ""),
        nationality: line2.slice(15, 18).replace(/</g, ""),
        surnames: (nameBlock[0] || "").split("<").filter(Boolean),
        givenNames: (nameBlock.slice(1).join("<<") || "").split("<").filter(Boolean),
        checksums,
        valid: this.computeMrzValidity(checksums),
      };
    }

    if (lines.length < 2) {
      return null;
    }

    const [line1, line2] = lines.slice(-2);
    const nameBlock = line1.slice(5).split("<<");
    const surnames = (nameBlock[0] || "")
      .split("<")
      .filter(Boolean);
    const givenNames = (nameBlock.slice(1).join("<<") || "")
      .split("<")
      .filter(Boolean);
    const format = line1.length >= 40 || line2.length >= 40 ? "TD3" : "TD2";
    const isTd3 = format === "TD3";
    const documentNumberSource = line2.slice(0, 9);
    const birthDateSource = isTd3 ? line2.slice(13, 19) : line2.slice(0, 6);
    const expiryDateSource = isTd3 ? line2.slice(21, 27) : line2.slice(8, 14);
    const checksums = {
      documentNumber: this.validateMrzChecksum(documentNumberSource, line2.slice(9, 10)),
      birthDate: this.validateMrzChecksum(
        birthDateSource,
        isTd3 ? line2.slice(19, 20) : line2.slice(6, 7),
      ),
      expiryDate: this.validateMrzChecksum(
        expiryDateSource,
        isTd3 ? line2.slice(27, 28) : line2.slice(14, 15),
      ),
      composite: this.validateMrzChecksum(
        isTd3
          ? `${line2.slice(0, 10)}${line2.slice(13, 20)}${line2.slice(21, 43)}`
          : `${line2.slice(0, 18)}`,
        isTd3 ? line2.slice(43, 44) : line2.slice(18, 19),
      ),
    };
    return {
      format,
      lines: [line1, line2],
      documentCode: line1.slice(0, 2).replace(/</g, ""),
      issuingCountry: line1.slice(2, 5).replace(/</g, ""),
      documentNumber: documentNumberSource.replace(/</g, ""),
      nationality: (isTd3 ? line2.slice(10, 13) : line2.slice(15, 18)).replace(/</g, ""),
      birthDate: birthDateSource.replace(/</g, ""),
      sex: (isTd3 ? line2.slice(20, 21) : line2.slice(7, 8)).replace(/</g, ""),
      expiryDate: expiryDateSource.replace(/</g, ""),
      surnames,
      givenNames,
      checksums,
      valid: this.computeMrzValidity(checksums),
    };
  }

  getDocumentCropBounds = (width: number, height: number) => {
    const targetRatio = 1.586;
    const insetX = Math.round(width * 0.06);
    const insetY = Math.round(height * 0.06);
    const safeWidth = Math.max(1, width - insetX * 2);
    const safeHeight = Math.max(1, height - insetY * 2);
    let cropWidth = safeWidth;
    let cropHeight = Math.round(cropWidth / targetRatio);

    if (cropHeight > safeHeight) {
      cropHeight = safeHeight;
      cropWidth = Math.round(cropHeight * targetRatio);
    }

    const x = insetX + Math.max(0, Math.round((safeWidth - cropWidth) / 2));
    const y = insetY + Math.max(0, Math.round((safeHeight - cropHeight) / 2));

    return {
      x,
      y,
      width: Math.max(1, cropWidth),
      height: Math.max(1, cropHeight),
    };
  }

  getDocumentPerspectiveCorners = (bounds: ReturnType<FormUI["getDocumentCropBounds"]>): TDocumentPerspectiveCorners => {
    const topInset = Math.max(2, Math.round(bounds.width * 0.04));
    const bottomInset = Math.max(1, Math.round(bounds.width * 0.01));

    return {
      topLeft: { x: bounds.x + topInset, y: bounds.y },
      topRight: { x: bounds.x + bounds.width - topInset, y: bounds.y },
      bottomRight: { x: bounds.x + bounds.width - bottomInset, y: bounds.y + bounds.height },
      bottomLeft: { x: bounds.x + bottomInset, y: bounds.y + bounds.height },
    };
  }

  drawPerspectiveCorrectedDocument = (
    context: CanvasRenderingContext2D,
    imageBitmap: ImageBitmap,
    bounds: ReturnType<FormUI["getDocumentCropBounds"]>,
    corners: TDocumentPerspectiveCorners,
  ) => {
    const destinationWidth = bounds.width;
    const destinationHeight = bounds.height;

    for (let y = 0; y < destinationHeight; y += 1) {
      const ratio = destinationHeight <= 1 ? 0 : y / (destinationHeight - 1);
      const sourceLeftX = corners.topLeft.x + (corners.bottomLeft.x - corners.topLeft.x) * ratio;
      const sourceRightX = corners.topRight.x + (corners.bottomRight.x - corners.topRight.x) * ratio;
      const sourceY = corners.topLeft.y + (corners.bottomLeft.y - corners.topLeft.y) * ratio;
      const sourceWidth = Math.max(1, sourceRightX - sourceLeftX);

      context.drawImage(
        imageBitmap,
        sourceLeftX,
        sourceY,
        sourceWidth,
        1,
        0,
        y,
        destinationWidth,
        1,
      );
    }
  }

  cropDocumentScanFile = async (fieldConfig: TFieldConfig, file: File, slotIndex: number) => {
    if (
      typeof document === "undefined" ||
      typeof createImageBitmap !== "function"
    ) {
      return file;
    }

    let imageBitmap: ImageBitmap | null = null;

    try {
      imageBitmap = await createImageBitmap(file);
      const bounds = this.getDocumentCropBounds(imageBitmap.width, imageBitmap.height);
      const corners = this.getDocumentPerspectiveCorners(bounds);

      const canvas = document.createElement("canvas");
      canvas.width = bounds.width;
      canvas.height = bounds.height;
      const context = canvas.getContext("2d");
      if (!context) {
        return file;
      }

      this.drawPerspectiveCorrectedDocument(context, imageBitmap, bounds, corners);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), file.type || "image/jpeg");
      });

      if (!blob) {
        return file;
      }

      const croppedFile = new File(
        [blob],
        file.name,
        {
          type: blob.type || file.type,
          lastModified: file.lastModified,
        },
      );

      this.emitFormEvent("form-ui:document-scan-cropped", {
        values: this.engine.normalizeValues(this.form?.getState().values || {}),
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
        result: {
          field: fieldConfig.name,
          slot: slotIndex,
          fileName: croppedFile.name,
          bounds,
          corners,
        },
      });

      this.emitFormEvent("form-ui:document-scan-bounds-detected", {
        values: this.engine.normalizeValues(this.form?.getState().values || {}),
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
        result: {
          field: fieldConfig.name,
          slot: slotIndex,
          bounds,
          corners,
        },
      });

      return croppedFile;
    } catch {
      return file;
    } finally {
      if (imageBitmap && typeof imageBitmap.close === "function") {
        imageBitmap.close();
      }
    }
  }

  analyzeDocumentScanFile = async (fieldConfig: TFieldConfig, file: File, slotIndex: number) => {
    if (fieldConfig.enableDocumentOcr === false) {
      return;
    }

    const detector = this.getTextDetector();
    if (!detector || typeof detector.detect !== "function") {
      return;
    }

    let scanSource: any = file;
    let imageBitmap: ImageBitmap | null = null;

    if (typeof createImageBitmap === "function") {
      try {
        imageBitmap = await createImageBitmap(file);
        scanSource = imageBitmap;
      } catch {
        scanSource = file;
      }
    }

    try {
      const textBlocks = await detector.detect(scanSource);
      const detectedText = (textBlocks || [])
        .map((entry: { rawValue?: string }) => String(entry?.rawValue || "").trim())
        .filter(Boolean)
        .join("\n");

      if (!detectedText) {
        return;
      }

      const insight = this.getDocumentScanInsight(fieldConfig);
      insight.textBySlot[slotIndex] = detectedText;

      this.emitFormEvent("form-ui:document-text-detected", {
        values: this.engine.normalizeValues(this.form?.getState().values || {}),
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
        result: {
          field: fieldConfig.name,
          slot: slotIndex,
          text: detectedText,
        },
      });

      if (fieldConfig.documentTextTargetField && this.form) {
        this.form.change(fieldConfig.documentTextTargetField, detectedText);
      }

      const mrz = this.parseMrz(detectedText);
      let normalizedFields: Record<string, any> | null = null;
      if (mrz) {
        insight.mrzBySlot[slotIndex] = mrz;
        normalizedFields = {
          firstName: mrz.givenNames?.join(" ") || "",
          lastName: mrz.surnames?.join(" ") || "",
          documentNumber: mrz.documentNumber || "",
          nationality: mrz.nationality || "",
          birthDate: mrz.birthDate || "",
          expiryDate: mrz.expiryDate || "",
          sex: mrz.sex || "",
        };
        if (fieldConfig.documentMrzTargetField && this.form) {
          this.form.change(fieldConfig.documentMrzTargetField, mrz);
        }
        if (this.form) {
          if (fieldConfig.documentFirstNameTargetField) {
            this.form.change(fieldConfig.documentFirstNameTargetField, normalizedFields.firstName);
          }
          if (fieldConfig.documentLastNameTargetField) {
            this.form.change(fieldConfig.documentLastNameTargetField, normalizedFields.lastName);
          }
          if (fieldConfig.documentNumberTargetField) {
            this.form.change(fieldConfig.documentNumberTargetField, normalizedFields.documentNumber);
          }
          if (fieldConfig.documentNationalityTargetField) {
            this.form.change(fieldConfig.documentNationalityTargetField, normalizedFields.nationality);
          }
          if (fieldConfig.documentBirthDateTargetField) {
            this.form.change(fieldConfig.documentBirthDateTargetField, normalizedFields.birthDate);
          }
          if (fieldConfig.documentExpiryDateTargetField) {
            this.form.change(fieldConfig.documentExpiryDateTargetField, normalizedFields.expiryDate);
          }
          if (fieldConfig.documentSexTargetField) {
            this.form.change(fieldConfig.documentSexTargetField, normalizedFields.sex);
          }
        }
        this.emitFormEvent("form-ui:document-mrz-detected", {
          values: this.engine.normalizeValues(this.form?.getState().values || {}),
          formConfig: this.formConfig,
          submit: this.formConfig?.submit,
          result: {
            field: fieldConfig.name,
            slot: slotIndex,
            mrz,
            normalized: this.buildDocumentNormalizedContract(
              detectedText,
              mrz || null,
              normalizedFields,
            ),
          },
        });
      }

      const normalizedContract = this.buildDocumentNormalizedContract(
        detectedText,
        mrz || null,
        normalizedFields,
      );
      insight.normalizedBySlot[slotIndex] = normalizedContract;

      this.engine.setDocumentData(fieldConfig.name, {
        text: detectedText,
        mrz,
        fields: normalizedFields,
        normalized: normalizedContract,
      });

      this.emitFormEvent("form-ui:document-data", {
        values: this.engine.normalizeValues(this.form?.getState().values || {}),
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
        result: {
          field: fieldConfig.name,
          slot: slotIndex,
          text: detectedText,
          mrz,
          normalized: normalizedContract,
        },
      });

      if (mrz) {
        this.emitFormEvent("form-ui:document-fields-populated", {
          values: this.engine.normalizeValues(this.form?.getState().values || {}),
          formConfig: this.formConfig,
          submit: this.formConfig?.submit,
          result: {
            field: fieldConfig.name,
            slot: slotIndex,
            fields: {
              firstName: mrz.givenNames?.join(" ") || "",
              lastName: mrz.surnames?.join(" ") || "",
              documentNumber: mrz.documentNumber || "",
              nationality: mrz.nationality || "",
              birthDate: mrz.birthDate || "",
              expiryDate: mrz.expiryDate || "",
              sex: mrz.sex || "",
            },
          },
        });
      }
    } catch {
      return;
    } finally {
      if (imageBitmap && typeof imageBitmap.close === "function") {
        imageBitmap.close();
      }
    }
  }

  assignQrVideoStream = (fieldName: string) => {
    const video = this.querySelector(`[data-qr-video="${fieldName}"]`) as HTMLVideoElement | null;
    const stream = this.qrScannerStreams[fieldName];
    if (!video || !stream) {
      return;
    }

    try {
      (video as any).srcObject = stream;
    } catch {
      return;
    }

    if (typeof video.play === "function") {
      void video.play().catch(() => undefined);
    }
  }

  clearQrScanTimer = (fieldName: string) => {
    const timerId = this.qrScannerTimers[fieldName];
    if (typeof timerId === "number") {
      window.clearTimeout(timerId);
    }
    this.qrScannerTimers[fieldName] = null;
  }

  stopQrCamera = (fieldName: string, rerender: boolean = true) => {
    this.clearQrScanTimer(fieldName);
    this.qrScannerRunning[fieldName] = false;
    const stream = this.qrScannerStreams[fieldName];
    stream?.getTracks?.().forEach((track) => track.stop());
    this.qrScannerStreams[fieldName] = null;
    this.qrScannerState[fieldName] = { status: "idle" };
    if (rerender) {
      const fieldConfig = this.engine.getField(fieldName);
      const selectionElement = this.querySelector(`#${fieldName}_selection`) as HTMLElement | null;
      if (fieldConfig) {
        this.renderFileSelection(fieldConfig, this.getFieldValue(fieldName), selectionElement);
      }
    }
  }

  stopAllQrCameras = () => {
    Object.keys(this.qrScannerStreams).forEach((fieldName) => {
      this.stopQrCamera(fieldName, false);
    });
  }

  scheduleContinuousQrScan = (fieldConfig: TFieldConfig) => {
    const fieldName = fieldConfig.name;
    this.clearQrScanTimer(fieldName);

    if (!this.qrScannerStreams[fieldName]) {
      return;
    }

    this.qrScannerTimers[fieldName] = window.setTimeout(async () => {
      if (!this.qrScannerStreams[fieldName] || this.qrScannerRunning[fieldName]) {
        this.scheduleContinuousQrScan(fieldConfig);
        return;
      }

      this.qrScannerRunning[fieldName] = true;
      try {
        await this.scanQrFromLiveVideo(fieldConfig, true);
      } finally {
        this.qrScannerRunning[fieldName] = false;
      }

      if (this.qrScannerStreams[fieldName]) {
        this.scheduleContinuousQrScan(fieldConfig);
      }
    }, 250);
  }

  startQrCamera = async (fieldConfig: TFieldConfig) => {
    const mediaDevices = navigator?.mediaDevices;
    if (!mediaDevices?.getUserMedia) {
      this.qrScannerState[fieldConfig.name] = {
        status: "error",
        message: "Camera is not available in this browser.",
      };
      const selectionElement = this.querySelector(`#${fieldConfig.name}_selection`) as HTMLElement | null;
      this.renderFileSelection(fieldConfig, this.getFieldValue(fieldConfig.name), selectionElement);
      return;
    }

    this.qrScannerState[fieldConfig.name] = { status: "starting" };
    this.renderFileSelection(
      fieldConfig,
      this.getFieldValue(fieldConfig.name),
      this.querySelector(`#${fieldConfig.name}_selection`) as HTMLElement | null,
    );

    try {
      const stream = await mediaDevices.getUserMedia({
        video: {
          facingMode: fieldConfig.capture || "environment",
        },
      });
      this.qrScannerStreams[fieldConfig.name] = stream;
      this.qrScannerState[fieldConfig.name] = { status: "live" };
      const selectionElement = this.querySelector(`#${fieldConfig.name}_selection`) as HTMLElement | null;
      this.renderFileSelection(fieldConfig, this.getFieldValue(fieldConfig.name), selectionElement);
      this.scheduleContinuousQrScan(fieldConfig);
    } catch {
      this.qrScannerState[fieldConfig.name] = {
        status: "error",
        message: "Unable to start the camera.",
      };
      const selectionElement = this.querySelector(`#${fieldConfig.name}_selection`) as HTMLElement | null;
      this.renderFileSelection(fieldConfig, this.getFieldValue(fieldConfig.name), selectionElement);
    }
  }

  scanQrFromLiveVideo = async (fieldConfig: TFieldConfig, silent: boolean = false) => {
    const detector = this.getBarcodeDetector();
    if (!detector || typeof detector.detect !== "function") {
      if (!silent) {
        this.emitFormEvent("form-ui:qr-scan-error", {
          values: this.engine.normalizeValues(this.form?.getState().values || {}),
          formConfig: this.formConfig,
          submit: this.formConfig?.submit,
          error: new Error("QR scan is not available in this browser."),
          result: {
            field: fieldConfig.name,
            reason: "barcode-detector-unavailable",
          },
        });
      }
      return;
    }

    const video = this.querySelector(`[data-qr-video="${fieldConfig.name}"]`) as HTMLVideoElement | null;
    if (!video) {
      return;
    }

    try {
      const results = await detector.detect(video);
      const qrResult = (results as TBarcodeDetectorResult[]).find(
        (entry) => typeof entry?.rawValue === "string" && entry.rawValue.trim().length,
      );
      if (!qrResult?.rawValue) {
        throw new Error("No QR code detected.");
      }

      this.form?.change(fieldConfig.name, qrResult.rawValue);
      this.stopQrCamera(fieldConfig.name, false);
      this.emitFormEvent("form-ui:qr-scan-success", {
        values: this.engine.normalizeValues({
          ...(this.form?.getState().values || {}),
          [fieldConfig.name]: qrResult.rawValue,
        }),
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
        result: {
          field: fieldConfig.name,
          code: qrResult.rawValue,
          source: "camera",
        },
      });
      this.scheduleDraftSave();
      this.updateConditionalFields();
      void this.refreshRemoteOptions(fieldConfig.name);
      this.renderFileSelection(
        fieldConfig,
        this.getFieldValue(fieldConfig.name),
        this.querySelector(`#${fieldConfig.name}_selection`) as HTMLElement | null,
      );
    } catch (error) {
      if (!silent) {
        this.emitFormEvent("form-ui:qr-scan-error", {
          values: this.engine.normalizeValues(this.form?.getState().values || {}),
          formConfig: this.formConfig,
          submit: this.formConfig?.submit,
          error,
          result: {
            field: fieldConfig.name,
            reason: "decode-failed",
          },
        });
      }
    }
  }

  decodeQrScanFile = async (fieldConfig: TFieldConfig, file: File) => {
    const detector = this.getBarcodeDetector();
    if (!detector || typeof detector.detect !== "function") {
      const error = new Error("QR scan is not available in this browser.");
      this.emitFormEvent("form-ui:qr-scan-error", {
        values: this.engine.normalizeValues(this.form?.getState().values || {}),
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
        error,
        result: {
          field: fieldConfig.name,
          reason: "barcode-detector-unavailable",
        },
      });
      return null;
    }

    let scanSource: any = file;
    let imageBitmap: ImageBitmap | null = null;

    if (typeof createImageBitmap === "function") {
      try {
        imageBitmap = await createImageBitmap(file);
        scanSource = imageBitmap;
      } catch {
        scanSource = file;
      }
    }

    try {
      const results = await detector.detect(scanSource);
      const qrResult = (results as TBarcodeDetectorResult[]).find(
        (entry) => typeof entry?.rawValue === "string" && entry.rawValue.trim().length,
      );
      if (!qrResult?.rawValue) {
        throw new Error("No QR code detected.");
      }

      this.stopQrCamera(fieldConfig.name, false);
      this.emitFormEvent("form-ui:qr-scan-success", {
        values: this.engine.normalizeValues({
          ...(this.form?.getState().values || {}),
          [fieldConfig.name]: qrResult.rawValue,
        }),
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
        result: {
          field: fieldConfig.name,
          code: qrResult.rawValue,
        },
      });

      return qrResult.rawValue;
    } catch (error) {
      this.emitFormEvent("form-ui:qr-scan-error", {
        values: this.engine.normalizeValues(this.form?.getState().values || {}),
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
        error,
        result: {
          field: fieldConfig.name,
          reason: "decode-failed",
        },
      });
      return null;
    } finally {
      if (imageBitmap && typeof imageBitmap.close === "function") {
        imageBitmap.close();
      }
    }
  }

  clearFilePreviewUrls = (fieldName: string) => {
    const urls = this.filePreviewUrls[fieldName] || [];
    if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    }
    this.filePreviewUrls[fieldName] = [];
  }

  clearAllFilePreviewUrls = () => {
    Object.keys(this.filePreviewUrls).forEach((fieldName) => {
      this.clearFilePreviewUrls(fieldName);
    });
  }

  shouldShowImagePreview = (fieldConfig: TFieldConfig, file: File) => {
    const accept = String(fieldConfig.accept || "").toLowerCase();
    return accept.includes("image/*") && String(file.type || "").startsWith("image/");
  }

  isProductListField = (fieldConfig: TFieldConfig) => {
    return fieldConfig.type === PRODUCT_LIST_TYPE;
  }

  isImageGalleryField = (fieldConfig: TFieldConfig) => {
    return fieldConfig.type === IMAGE_GALLERY_TYPE;
  }

  isQuizField = (fieldConfig: TFieldConfig) => {
    return fieldConfig.type === QUIZ_TYPE;
  }

  isChoiceListField = (fieldConfig: TFieldConfig) => {
    return fieldConfig.type === RADIO_BUTTONS_TYPE || fieldConfig.type === CHECKBOXES_TYPE;
  }

  isOpenQuizField = (fieldConfig: TFieldConfig) => {
    return isConfiguredOpenQuizField(fieldConfig);
  }

  isSettingField = (fieldConfig: TFieldConfig) => {
    return fieldConfig.type === SETTING_TYPE;
  }

  getSettingInitialValue = (inputElement: HTMLElement | null): any => {
    if (!inputElement) {
      return "";
    }
    const rawValue =
      inputElement.getAttribute("data-setting-value")
      || (inputElement instanceof HTMLInputElement ? inputElement.value : "");
    if (!rawValue) {
      return "";
    }
    try {
      return JSON.parse(rawValue);
    } catch {
      return rawValue;
    }
  }

  getProductListCatalog = (fieldConfig: TFieldConfig): TProductListItem[] => {
    return getProductListCatalogItems(fieldConfig);
  }

  getImageGalleryCatalog = (fieldConfig: TFieldConfig): TImageGalleryItem[] => {
    return getImageGalleryCatalogItems(fieldConfig);
  }

  getImageGallerySelectionLimit = (fieldConfig: TFieldConfig) => {
    const catalogSize = this.getImageGalleryCatalog(fieldConfig).length;
    const requestedMax = Number(fieldConfig.maxNumOfChoices);
    if (!Number.isFinite(requestedMax) || requestedMax <= 0) {
      return catalogSize || 0;
    }

    const normalizedMax = Math.round(requestedMax);
    return catalogSize > 0 ? Math.min(normalizedMax, catalogSize) : normalizedMax;
  }

  getProductCartItems = (value: any): TProductCartItem[] => {
    return getNormalizedProductCartItems(value);
  }

  getImageGallerySelectionItems = (value: any): TImageGalleryItem[] => {
    return getImageGallerySelectionItems(value);
  }

  getQuizCatalog = (fieldConfig: TFieldConfig) => {
    return getQuizCatalogItems(fieldConfig);
  }

  getQuizSelectionItems = (value: any) => {
    return getNormalizedQuizSelectionItems(value);
  }

  getChoiceSelectionItems = (fieldConfig: TFieldConfig, value: any): string[] => {
    if (fieldConfig.type === RADIO_BUTTONS_TYPE) {
      return typeof value === "string" && value ? [value] : [];
    }
    return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
  }

  getQuizSelectionLimit = (fieldConfig: TFieldConfig) => {
    return getNormalizedQuizSelectionLimit(fieldConfig);
  }

  getNextQuizSelectionItems = (
    fieldConfig: TFieldConfig,
    currentValue: any,
    answerId: string,
  ) => {
    return getNextNormalizedQuizSelectionItems(fieldConfig, currentValue, answerId);
  }

  getNextChoiceSelectionValue = (
    fieldConfig: TFieldConfig,
    currentValue: any,
    choiceValue: string,
  ) => {
    if (fieldConfig.type === RADIO_BUTTONS_TYPE) {
      return currentValue === choiceValue ? "" : choiceValue;
    }

    const currentValues = Array.isArray(currentValue)
      ? currentValue.map((entry) => String(entry))
      : [];
    if (currentValues.includes(choiceValue)) {
      return currentValues.filter((entry) => entry !== choiceValue);
    }
    const maxChoices = typeof fieldConfig.maxNumOfChoices === "number" ? fieldConfig.maxNumOfChoices : null;
    if (maxChoices !== null && maxChoices > 0 && currentValues.length >= maxChoices) {
      return currentValues;
    }
    return [...currentValues, choiceValue];
  }

  getProductCartTotal = (cartItems: TProductCartItem[]): number => {
    return getNormalizedProductCartTotal(cartItems);
  }

  createCartCountBadge = (value: string) => {
    const badge = document.createElement("span");
    badge.className = "text-xs opacity-70";
    badge.style.lineHeight = "1.2";
    badge.style.display = "inline-flex";
    badge.style.alignItems = "center";
    badge.style.gap = "4px";

    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle><path d="M5 6h16l-1.5 9h-11z"></path><path d="M5 6 4 3H2"></path></svg>';
    badge.appendChild(icon);

    const text = document.createElement("span");
    text.textContent = value;
    badge.appendChild(text);

    return badge;
  }

  updateProductListInlineTotal = (fieldConfig: TFieldConfig, value: any) => {
    const totalNode = this.querySelector(`[data-product-list-total="${fieldConfig.name}"]`) as HTMLElement | null;
    if (!totalNode) {
      return;
    }

    const cartItems = this.getProductCartItems(value);
    const totalAmount = this.getProductCartTotal(cartItems);
    if (totalAmount > 0) {
      totalNode.style.display = "inline-flex";
      totalNode.innerHTML = `<span aria-hidden="true" style="display:inline-flex;align-items:center;margin-right:6px;">🛒</span><span>${totalAmount.toFixed(2)}€</span>`;
      return;
    }

    totalNode.innerHTML = "";
    totalNode.style.display = "none";
  }

  getProductCartEntries = (): Array<{ fieldName: string; item: TProductCartItem }> => {
    return Object.values(this.engine.getFields())
      .filter((fieldConfig) => this.isProductListField(fieldConfig))
      .flatMap((fieldConfig) => this.getProductCartItems(this.getFieldValue(fieldConfig.name)).map((item) => ({
        fieldName: fieldConfig.name,
        item,
      })));
  }

  ensureProductCartTrigger = (): HTMLElement | null => {
    const formElement = this.querySelector("form");
    if (!formElement) {
      return null;
    }

    let trigger = this.querySelector("[data-product-cart-trigger]") as HTMLButtonElement | null;
    if (!trigger) {
      trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "btn btn-primary";
      trigger.setAttribute("data-product-cart-trigger", "true");
      trigger.style.position = "fixed";
      trigger.style.right = "20px";
      trigger.style.bottom = "20px";
      trigger.style.zIndex = "10001";
      trigger.style.display = "inline-flex";
      trigger.style.alignItems = "center";
      trigger.style.justifyContent = "center";
      trigger.style.width = "50px";
      trigger.style.height = "50px";
      trigger.style.borderRadius = "999px";
      trigger.style.padding = "0";
      trigger.style.fontSize = "20px";
      trigger.style.lineHeight = "1";
      trigger.setAttribute("aria-label", "Open cart");
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-expanded", "false");
      this.appendChild(trigger);
    }

    return trigger;
  }

  ensureProductListGlobalCart = (): HTMLElement | null => {
    const formElement = this.querySelector("form");
    if (!formElement) {
      return null;
    }

    if (this.productCartOverlay && this.contains(this.productCartOverlay)) {
      return this.productCartOverlay.querySelector("[data-product-list-global-cart]") as HTMLElement | null;
    }

    const overlay = document.createElement("div");
    overlay.setAttribute("data-product-cart-overlay", "true");
    overlay.setAttribute("data-state", "closed");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(15, 23, 42, 0.26)";
    overlay.style.zIndex = "10002";
    overlay.style.display = "none";
    overlay.style.justifyContent = "flex-end";
    overlay.style.opacity = "0";
    overlay.style.visibility = "hidden";
    overlay.style.transition = "opacity 180ms ease";

    const panel = document.createElement("aside");
    panel.setAttribute("data-product-list-global-cart", "true");
    panel.setAttribute("data-product-cart-panel", "true");
    panel.id = `${this.getAttribute("name") || "form"}_product_cart_panel`;
    panel.setAttribute("aria-label", "Mini cart");
    panel.style.width = "min(340px, 88vw)";
    panel.style.height = "100%";
    panel.style.background = "rgba(255, 255, 255, 0.98)";
    panel.style.borderLeft = "1px solid rgba(15, 23, 42, 0.08)";
    panel.style.padding = "14px";
    panel.style.overflowY = "auto";
    panel.style.display = "flex";
    panel.style.flexDirection = "column";
    panel.style.gap = "10px";
    panel.style.transform = "translateX(100%)";
    panel.style.transition = "transform 180ms ease";
    panel.style.boxShadow = "-24px 0 48px -36px rgba(15, 23, 42, 0.28)";

    overlay.appendChild(panel);
    this.appendChild(overlay);
    this.productCartOverlay = overlay;

    return panel;
  }

  openProductCartModal = () => {
    if (!this.productCartOverlay) {
      this.ensureProductListGlobalCart();
    }
    if (!this.productCartOverlay) {
      return;
    }
    if (this.productCartCloseTimer !== null && typeof window !== "undefined") {
      window.clearTimeout(this.productCartCloseTimer);
      this.productCartCloseTimer = null;
    }
    this.productCartOverlay.setAttribute("data-state", "open");
    this.productCartOverlay.style.display = "flex";
    this.productCartOverlay.style.visibility = "visible";
    const panel = this.productCartOverlay.querySelector("[data-product-cart-panel]") as HTMLElement | null;
    const closeButton = this.productCartOverlay.querySelector("[data-product-cart-close]") as HTMLElement | null;
    if (panel) {
      this.setupOverlayAccessibility(
        this.productCartOverlay,
        panel,
        () => this.closeProductCartModal(),
        closeButton,
      );
    }
    const trigger = this.querySelector("[data-product-cart-trigger]") as HTMLElement | null;
    if (trigger) {
      trigger.setAttribute("aria-expanded", "true");
    }
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => {
        this.productCartOverlay!.style.opacity = "1";
        if (panel) {
          panel.style.transform = "translateX(0)";
        }
      });
    } else {
      this.productCartOverlay.style.opacity = "1";
      if (panel) {
        panel.style.transform = "translateX(0)";
      }
    }
    this.acquirePageScrollLock();
  }

  closeProductCartModal = () => {
    if (!this.productCartOverlay) {
      return;
    }
    this.productCartOverlay.setAttribute("data-state", "closing");
    this.productCartOverlay.style.opacity = "0";
    const panel = this.productCartOverlay.querySelector("[data-product-cart-panel]") as HTMLElement | null;
    if (panel) {
      panel.style.transform = "translateX(100%)";
    }
    if (this.productCartCloseTimer !== null && typeof window !== "undefined") {
      window.clearTimeout(this.productCartCloseTimer);
    }
    if (typeof window !== "undefined") {
      this.productCartCloseTimer = window.setTimeout(() => {
        if (!this.productCartOverlay) {
          return;
        }
        this.productCartOverlay.style.display = "none";
        this.productCartOverlay.style.visibility = "hidden";
        this.productCartOverlay.setAttribute("data-state", "closed");
        this.productCartOverlay.setAttribute("aria-hidden", "true");
        this.teardownOverlayAccessibility(true);
        const trigger = this.querySelector("[data-product-cart-trigger]") as HTMLElement | null;
        if (trigger) {
          trigger.setAttribute("aria-expanded", "false");
        }
        this.releasePageScrollLock();
        this.productCartCloseTimer = null;
      }, 180);
    } else {
      this.productCartOverlay.style.display = "none";
      this.productCartOverlay.style.visibility = "hidden";
      this.productCartOverlay.setAttribute("data-state", "closed");
      this.productCartOverlay.setAttribute("aria-hidden", "true");
      this.teardownOverlayAccessibility(true);
      const trigger = this.querySelector("[data-product-cart-trigger]") as HTMLElement | null;
      if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
      }
      this.releasePageScrollLock();
    }
  }

  acquirePageScrollLock = () => {
    if (typeof document === "undefined") {
      return;
    }
    const body = document.body;
    if (!body) {
      return;
    }
    if (this.pageScrollLockCount === 0) {
      this.pageScrollPreviousOverflow = body.style.overflow || "";
      body.style.overflow = "hidden";
    }
    this.pageScrollLockCount += 1;
  }

  releasePageScrollLock = () => {
    if (typeof document === "undefined") {
      return;
    }
    const body = document.body;
    if (!body || this.pageScrollLockCount <= 0) {
      return;
    }
    this.pageScrollLockCount -= 1;
    if (this.pageScrollLockCount === 0) {
      body.style.overflow = this.pageScrollPreviousOverflow || "";
      this.pageScrollPreviousOverflow = null;
    }
  }

  getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const selectors = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ];
    const candidates = Array.from(container.querySelectorAll(selectors.join(", "))) as HTMLElement[];
    return candidates.filter((element) => {
      if (element.getAttribute("aria-hidden") === "true") {
        return false;
      }
      const computed = typeof window !== "undefined" ? window.getComputedStyle(element) : null;
      if (computed && (computed.display === "none" || computed.visibility === "hidden")) {
        return false;
      }
      return true;
    });
  }

  applyHostAriaHiddenForOverlay = () => {
    const formElement = this.querySelector("form");
    if (!formElement) {
      return;
    }
    this.hostAriaHiddenBeforeOverlay = formElement.getAttribute("aria-hidden");
    formElement.setAttribute("aria-hidden", "true");
  }

  restoreHostAriaHiddenAfterOverlay = () => {
    const formElement = this.querySelector("form");
    if (!formElement) {
      return;
    }
    if (this.hostAriaHiddenBeforeOverlay === null) {
      formElement.removeAttribute("aria-hidden");
    } else {
      formElement.setAttribute("aria-hidden", this.hostAriaHiddenBeforeOverlay);
    }
    this.hostAriaHiddenBeforeOverlay = null;
  }

  setupOverlayAccessibility = (
    overlay: HTMLElement,
    dialog: HTMLElement,
    onEscape: () => void,
    preferredFocusElement?: HTMLElement | null,
  ) => {
    this.teardownOverlayAccessibility(false);
    this.overlayReturnFocusElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    this.applyHostAriaHiddenForOverlay();

    overlay.setAttribute("aria-hidden", "false");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    if (!dialog.hasAttribute("tabindex")) {
      dialog.setAttribute("tabindex", "-1");
    }

    const focusTarget = preferredFocusElement || this.getFocusableElements(dialog)[0] || dialog;
    if (typeof focusTarget.focus === "function") {
      focusTarget.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
        return;
      }
      if (event.key !== "Tab") {
        return;
      }

      const focusable = this.getFocusableElements(dialog);
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !active || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last || !active || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Node | null;
      if (!target || dialog.contains(target)) {
        return;
      }
      const fallback = this.getFocusableElements(dialog)[0] || dialog;
      fallback.focus();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("focusin", handleFocusIn, true);

    this.overlayCleanup = () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("focusin", handleFocusIn, true);
    };
  }

  teardownOverlayAccessibility = (restoreFocus: boolean = true) => {
    if (this.overlayCleanup) {
      this.overlayCleanup();
      this.overlayCleanup = null;
    }
    this.restoreHostAriaHiddenAfterOverlay();
    if (restoreFocus && this.overlayReturnFocusElement && typeof this.overlayReturnFocusElement.focus === "function") {
      this.overlayReturnFocusElement.focus();
    }
    this.overlayReturnFocusElement = null;
  }

  renderProductListGlobalCart = () => {
    Object.values(this.engine.getFields())
      .filter((fieldConfig) => this.isProductListField(fieldConfig))
      .forEach((fieldConfig) => {
        this.updateProductListInlineTotal(fieldConfig, this.getFieldValue(fieldConfig.name));
      });

    const trigger = this.querySelector("[data-product-cart-trigger]") as HTMLElement | null;
    if (trigger) {
      trigger.remove();
    }
    if (this.productCartOverlay) {
      this.productCartOverlay.remove();
      this.productCartOverlay = null;
    }
  }

  bindProductListGlobalCartEvents = () => {
    if (this.productListCartClickBound) {
      return;
    }

    this.productListCartClickBound = true;
    this.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.productCartOverlay?.style.display === "flex") {
        this.closeProductCartModal();
      }
    });
    this.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      const cartTrigger = target?.closest("[data-product-cart-trigger]") as HTMLElement | null;
      if (cartTrigger) {
        event.preventDefault();
        event.stopPropagation();
        this.openProductCartModal();
        return;
      }

      const cartClose = target?.closest("[data-product-cart-close]") as HTMLElement | null;
      if (cartClose) {
        event.preventDefault();
        event.stopPropagation();
        this.closeProductCartModal();
        return;
      }

      if (this.productCartOverlay && target === this.productCartOverlay) {
        event.preventDefault();
        event.stopPropagation();
        this.closeProductCartModal();
        return;
      }

      const actionButton = target?.closest("[data-product-cart-action]") as HTMLElement | null;
      if (!actionButton || !this.form) {
        return;
      }

      const action = actionButton.getAttribute("data-product-cart-action");
      const fieldName = actionButton.getAttribute("data-product-field");
      const productId = actionButton.getAttribute("data-product-id");
      if (!fieldName || !productId) {
        return;
      }

      const fieldConfig = this.engine.getField(fieldName);
      if (!fieldConfig || !this.isProductListField(fieldConfig)) {
        return;
      }

      if (action !== "inc" && action !== "dec" && action !== "remove") {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const nextCart = this.getNextProductCartItems(
        fieldConfig,
        this.getFieldValue(fieldName),
        action,
        productId,
      );
      this.form.change(fieldName, nextCart);
      this.scheduleDraftSave();
      this.updateConditionalFields();
      void this.refreshRemoteOptions(fieldName);
    });
  }

  openMediaGallery = (name: string, photos: string[]) => {
    if (!photos.length || typeof document === "undefined") {
      return;
    }

    if (this.productGalleryOverlay) {
      this.productGalleryOverlay.remove();
      this.productGalleryOverlay = null;
      this.teardownOverlayAccessibility(false);
      this.releasePageScrollLock();
    }

    const overlay = document.createElement("div");
    overlay.setAttribute("data-product-gallery-overlay", "true");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(15, 23, 42, 0.8)";
    overlay.style.zIndex = "10000";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "24px";

    const modal = document.createElement("div");
    modal.setAttribute("data-product-gallery-modal", "true");
    modal.setAttribute("aria-label", `${name} gallery`);
    modal.style.width = "min(960px, 100%)";
    modal.style.maxHeight = "90vh";
    modal.style.overflow = "auto";
    modal.style.background = "#ffffff";
    modal.style.borderRadius = "14px";
    modal.style.padding = "14px";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "btn";
    closeButton.textContent = "×";
    closeButton.setAttribute("data-product-gallery-close", "true");
    closeButton.style.float = "right";
    closeButton.style.width = "36px";
    closeButton.style.minWidth = "36px";
    closeButton.style.height = "36px";
    closeButton.style.padding = "0";
    closeButton.style.display = "inline-flex";
    closeButton.style.alignItems = "center";
    closeButton.style.justifyContent = "center";
    closeButton.style.borderRadius = "999px";
    closeButton.style.border = "1px solid rgba(148, 163, 184, 0.4)";
    closeButton.style.background = "#ffffff";
    closeButton.style.color = "#0f172a";
    closeButton.style.boxShadow = "none";
    closeButton.setAttribute("aria-label", "Close gallery");
    const closeGallery = () => {
      overlay.remove();
      this.productGalleryOverlay = null;
      this.teardownOverlayAccessibility(true);
      this.releasePageScrollLock();
    };
    closeButton.addEventListener("click", closeGallery);
    modal.appendChild(closeButton);

    const title = document.createElement("div");
    title.className = "mb-2 text-sm font-semibold";
    title.textContent = name;
    modal.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "mb-3 text-xs opacity-70";
    modal.appendChild(meta);

    const mainImage = document.createElement("img");
    mainImage.setAttribute("data-product-gallery-main", "true");
    mainImage.src = photos[0];
    mainImage.alt = name;
    mainImage.style.width = "100%";
    mainImage.style.maxHeight = "60vh";
    mainImage.style.objectFit = "contain";
    mainImage.style.borderRadius = "10px";
    modal.appendChild(mainImage);

    const thumbs = document.createElement("div");
    thumbs.setAttribute("data-product-gallery-thumbs", "true");
    thumbs.style.display = "flex";
    thumbs.style.gap = "8px";
    thumbs.style.marginTop = "10px";
    thumbs.style.overflowX = "auto";
    const thumbButtons: HTMLImageElement[] = [];
    const setActivePhoto = (photo: string) => {
      const photoIndex = photos.findIndex((entry) => entry === photo);
      mainImage.src = photo;
      meta.textContent = photoIndex >= 0 ? `${photoIndex + 1} of ${photos.length}` : `${photos.length} photos`;
      thumbButtons.forEach((thumb) => {
        const selected = thumb.getAttribute("data-product-gallery-thumb") === photo;
        thumb.style.outline = selected ? "2px solid rgb(59 130 246)" : "1px solid rgba(148, 163, 184, 0.35)";
        thumb.style.outlineOffset = "1px";
        thumb.style.opacity = selected ? "1" : "0.78";
      });
    };

    photos.forEach((photo) => {
      const thumb = document.createElement("img");
      thumb.setAttribute("data-product-gallery-thumb", photo);
      thumb.src = photo;
      thumb.alt = `${name} preview`;
      thumb.style.width = "72px";
      thumb.style.height = "72px";
      thumb.style.objectFit = "cover";
      thumb.style.borderRadius = "8px";
      thumb.style.cursor = "pointer";
      thumb.addEventListener("click", () => {
        setActivePhoto(photo);
      });
      thumbButtons.push(thumb);
      thumbs.appendChild(thumb);
    });
    modal.appendChild(thumbs);
    setActivePhoto(photos[0]);

    overlay.appendChild(modal);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeGallery();
      }
    });
    document.body.appendChild(overlay);
    this.productGalleryOverlay = overlay;
    this.setupOverlayAccessibility(
      overlay,
      modal,
      closeGallery,
      closeButton,
    );
    this.acquirePageScrollLock();
  }

  openProductListGallery = (product: TProductListItem) => {
    const photos = product.photos_full.length
      ? product.photos_full
      : [product.image_medium || product.image_thumbnail].filter(Boolean);
    this.openMediaGallery(product.name, photos);
  }

  openImageGalleryItem = (item: TImageGalleryItem) => {
    const photos = item.photos_full.length
      ? item.photos_full
      : [item.image_medium || item.image_thumbnail].filter(Boolean);
    this.openMediaGallery(item.name, photos);
  }

  getNextProductCartItems = (
    fieldConfig: TFieldConfig,
    currentValue: any,
    action: "add" | "inc" | "dec" | "remove",
    productId: string,
  ): TProductCartItem[] => {
    const catalog = this.getProductListCatalog(fieldConfig);
    const product = catalog.find((entry) => entry.id === productId);
    const currentItems = this.getProductCartItems(currentValue);
    const existingIndex = currentItems.findIndex((entry) => entry.id === productId);
    const nextItems = [...currentItems];

    if (action === "add") {
      if (!product) {
        return nextItems;
      }

      if (existingIndex >= 0) {
        const maxQuantity = product.maxNumOfChoices;
        if (typeof maxQuantity === "number" && nextItems[existingIndex].quantity >= maxQuantity) {
          return nextItems;
        }
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: nextItems[existingIndex].quantity + 1,
        };
        return nextItems;
      }

      return [
        ...nextItems,
        {
          ...product,
          quantity: 1,
        },
      ];
    }

    if (existingIndex < 0) {
      return nextItems;
    }

    if (action === "inc") {
      const maxQuantity = nextItems[existingIndex].maxNumOfChoices;
      if (typeof maxQuantity === "number" && nextItems[existingIndex].quantity >= maxQuantity) {
        return nextItems;
      }
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        quantity: nextItems[existingIndex].quantity + 1,
      };
      return nextItems;
    }

    if (action === "dec") {
      const nextQuantity = nextItems[existingIndex].quantity - 1;
      if (nextQuantity <= 0) {
        return nextItems.filter((entry) => entry.id !== productId);
      }
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        quantity: nextQuantity,
      };
      return nextItems;
    }

    return nextItems.filter((entry) => entry.id !== productId);
  }

  getNextImageGallerySelectionItems = (
    fieldConfig: TFieldConfig,
    currentValue: any,
    action: "toggle" | "remove",
    imageId: string,
  ): TImageGalleryItem[] => {
    const catalog = this.getImageGalleryCatalog(fieldConfig);
    const image = catalog.find((entry) => entry.id === imageId);
    const currentItems = this.getImageGallerySelectionItems(currentValue);
    const existingIndex = currentItems.findIndex((entry) => entry.id === imageId);
    const nextItems = [...currentItems];

    if (action === "toggle") {
      if (existingIndex >= 0) {
        return nextItems.filter((entry) => entry.id !== imageId);
      }

      if (!image) {
        return nextItems;
      }

      const selectionLimit = this.getImageGallerySelectionLimit(fieldConfig);
      if (selectionLimit > 0 && nextItems.length >= selectionLimit) {
        return nextItems;
      }

      return [...nextItems, image];
    }

    return nextItems.filter((entry) => entry.id !== imageId);
  }

  renderProductListSelection = (
    fieldConfig: TFieldConfig,
    value: any,
    selectionElement: HTMLElement | null,
  ) => {
    if (!selectionElement) {
      return;
    }

    const products = this.getProductListCatalog(fieldConfig);
    const cartItems = this.getProductCartItems(value);
    const cartMap = cartItems.reduce((accumulator, item) => {
      accumulator[item.id] = item.quantity;
      return accumulator;
    }, {} as Record<string, number>);

    const productList =
      (selectionElement.querySelector(
        `[data-product-list-catalog="${fieldConfig.name}"]`,
      ) as HTMLDivElement | null)
      ?? (selectionElement as HTMLDivElement);

    if (productList === selectionElement) {
      productList.setAttribute("data-product-list-catalog", fieldConfig.name);
      productList.innerHTML = "";
    }

    productList.style.display = "grid";
    productList.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
    productList.style.gap = "10px";
    productList.style.marginBottom = "14px";
    productList.style.alignItems = "start";

    const styleProductActionButton = (
      button: HTMLButtonElement,
      options: { emphasized?: boolean; ghost?: boolean } = {},
    ) => {
      const { emphasized = false, ghost = false } = options;
      button.style.width = "30px";
      button.style.minWidth = "30px";
      button.style.height = "30px";
      button.style.padding = "0";
      button.style.display = "inline-flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";
      button.style.borderRadius = "999px";
      button.style.fontSize = "13px";
      button.style.fontWeight = "700";
      button.style.lineHeight = "1";
      button.style.boxShadow = "none";
      button.style.border = ghost ? "1px solid transparent" : "1px solid rgba(148, 163, 184, 0.4)";
      button.style.background = emphasized ? "#0f172a" : (ghost ? "transparent" : "#f8fafc");
      button.style.color = emphasized ? "#ffffff" : "#0f172a";
    };

    products.forEach((product) => {
      const currentQuantity = cartMap[product.id] || 0;
      const maxReached = typeof product.maxNumOfChoices === "number" && currentQuantity >= product.maxNumOfChoices;
      const unitPrice = product.discount_price ?? product.sale_price ?? 0;
      const subtotalAmount = unitPrice * currentQuantity;

      let card = productList.querySelector(`[data-product-card="${product.id}"]`) as HTMLDivElement | null;
      if (!card) {
        card = document.createElement("div");
        card.setAttribute("data-product-card", product.id);
        productList.appendChild(card);
      }

      card.setAttribute("data-product-open-gallery", product.id);
      card.className = "rounded border border-base-300 p-2";
      card.style.cursor = "pointer";
      card.style.borderColor = currentQuantity > 0 ? "rgb(59 130 246)" : "";
      card.style.boxShadow = currentQuantity > 0 ? "0 0 0 2px rgba(59, 130, 246, 0.12)" : "";
      card.style.background = currentQuantity > 0 ? "rgba(59, 130, 246, 0.05)" : "rgba(248, 250, 252, 0.84)";
      card.style.display = "grid";
      card.style.gridTemplateRows = "auto auto auto";
      card.style.padding = "16px";
      card.style.justifyItems = "center";
      card.style.borderRadius = "16px";

      const previewSource = product.image_medium || product.image_thumbnail;
      let thumbFrame = card.querySelector("[data-product-media]") as HTMLDivElement | null;
      if (!thumbFrame) {
        thumbFrame = card.querySelector(".template-product-media") as HTMLDivElement | null;
      }
      if (!thumbFrame && previewSource) {
        thumbFrame = document.createElement("div");
        thumbFrame.setAttribute("data-product-media", product.id);
        card.appendChild(thumbFrame);
      }
      if (thumbFrame) {
        thumbFrame.style.width = "100%";
        thumbFrame.style.aspectRatio = "4 / 3";
        thumbFrame.style.maxHeight = "164px";
        thumbFrame.style.position = "relative";
        thumbFrame.style.display = "flex";
        thumbFrame.style.alignItems = "center";
        thumbFrame.style.justifyContent = "center";
        thumbFrame.style.borderRadius = "12px";
        thumbFrame.style.background = "rgba(255,255,255,0.72)";
        thumbFrame.style.overflow = "hidden";

        let thumb = thumbFrame.querySelector("img") as HTMLImageElement | null;
        if (!thumb && previewSource) {
          thumb = document.createElement("img");
          thumb.setAttribute("data-product-image", product.id);
          thumbFrame.appendChild(thumb);
        }
        if (thumb) {
          thumb.src = previewSource || "";
          thumb.alt = product.name;
          thumb.style.width = "100%";
          thumb.style.height = "100%";
          thumb.style.objectFit = "cover";
          thumb.style.objectPosition = "center center";
          thumb.style.display = previewSource ? "block" : "none";
        }

        let imageOverlay = thumbFrame.querySelector("[data-product-overlay]") as HTMLDivElement | null;
        if (!imageOverlay && currentQuantity > 0) {
          imageOverlay = document.createElement("div");
          imageOverlay.setAttribute("data-product-overlay", product.id);
          thumbFrame.appendChild(imageOverlay);
        }
        if (imageOverlay) {
          if (currentQuantity > 0) {
            imageOverlay.style.position = "absolute";
            imageOverlay.style.left = "0";
            imageOverlay.style.right = "0";
            imageOverlay.style.bottom = "0";
            imageOverlay.style.display = "flex";
            imageOverlay.style.justifyContent = "space-between";
            imageOverlay.style.alignItems = "center";
            imageOverlay.style.gap = "8px";
            imageOverlay.style.padding = "10px";
            imageOverlay.style.background = "linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.74) 100%)";

            let quantityPill = imageOverlay.querySelector("[data-product-quantity-pill]") as HTMLSpanElement | null;
            if (!quantityPill) {
              quantityPill = document.createElement("span");
              quantityPill.setAttribute("data-product-quantity-pill", product.id);
              imageOverlay.appendChild(quantityPill);
            }
            quantityPill.style.display = "inline-flex";
            quantityPill.style.alignItems = "center";
            quantityPill.style.gap = "4px";
            quantityPill.style.padding = "4px 8px";
            quantityPill.style.borderRadius = "999px";
            quantityPill.style.background = "rgba(255,255,255,0.16)";
            quantityPill.style.color = "#ffffff";
            quantityPill.style.fontSize = "11px";
            quantityPill.style.fontWeight = "700";
            quantityPill.innerHTML = `<span aria-hidden="true">🛒</span><span>${currentQuantity}</span>`;

            let subtotalPill = imageOverlay.querySelector("[data-product-subtotal-pill]") as HTMLSpanElement | null;
            if (!subtotalPill) {
              subtotalPill = document.createElement("span");
              subtotalPill.setAttribute("data-product-subtotal-pill", product.id);
              imageOverlay.appendChild(subtotalPill);
            }
            subtotalPill.style.display = "inline-flex";
            subtotalPill.style.alignItems = "center";
            subtotalPill.style.padding = "4px 8px";
            subtotalPill.style.borderRadius = "999px";
            subtotalPill.style.background = "rgba(15,23,42,0.42)";
            subtotalPill.style.color = "#ffffff";
            subtotalPill.style.fontSize = "11px";
            subtotalPill.style.fontWeight = "700";
            subtotalPill.textContent = `${subtotalAmount.toFixed(2)}€`;
          } else {
            imageOverlay.remove();
          }
        }
      }

      let title = card.querySelector("[data-product-title]") as HTMLDivElement | null;
      if (!title) {
        title = document.createElement("div");
        title.setAttribute("data-product-title", product.id);
        card.appendChild(title);
      }
      title.className = "mt-2 text-sm font-semibold";
      title.style.width = "100%";
      title.style.overflow = "hidden";
      title.style.textOverflow = "ellipsis";
      title.style.whiteSpace = "nowrap";
      title.style.lineHeight = "1.2";
      title.style.textAlign = "center";
      title.textContent = product.name;

      let metaRow = card.querySelector("[data-product-meta-row]") as HTMLDivElement | null;
      if (!metaRow) {
        metaRow = document.createElement("div");
        metaRow.setAttribute("data-product-meta-row", product.id);
        card.appendChild(metaRow);
      }
      metaRow.className = "mt-1 flex flex-col items-center gap-2";
      metaRow.style.width = "100%";
      metaRow.style.alignItems = "center";
      metaRow.style.justifyItems = "center";

      let metaText = metaRow.querySelector("[data-product-meta-text]") as HTMLDivElement | null;
      if (!metaText) {
        metaText = document.createElement("div");
        metaText.setAttribute("data-product-meta-text", product.id);
        metaRow.appendChild(metaText);
      }
      metaText.className = "min-w-0 text-xs";
      metaText.style.display = "grid";
      metaText.style.gap = "1px";
      metaText.style.textAlign = "center";
      metaText.style.justifyItems = "center";

      let pricing = metaText.querySelector("[data-product-pricing]") as HTMLDivElement | null;
      if (!pricing) {
        pricing = document.createElement("div");
        pricing.setAttribute("data-product-pricing", product.id);
        metaText.appendChild(pricing);
      }
      pricing.className = "text-xs";
      pricing.style.display = "flex";
      pricing.style.alignItems = "baseline";
      pricing.style.justifyContent = "center";
      pricing.style.gap = "4px";

      let primaryPrice = pricing.querySelector("[data-product-price]") as HTMLSpanElement | null;
      if (!primaryPrice) {
        primaryPrice = document.createElement("span");
        primaryPrice.setAttribute("data-product-price", product.id);
        pricing.appendChild(primaryPrice);
      }
      primaryPrice.className = "font-semibold";
      primaryPrice.style.fontSize = "13px";
      primaryPrice.style.overflowWrap = "anywhere";
      primaryPrice.textContent =
        product.discount_price !== null
          ? `${product.discount_price.toFixed(2)}€`
          : product.sale_price !== null
            ? `${product.sale_price.toFixed(2)}€`
            : "Price on request";

      const controlsWrap = document.createElement("div");
      controlsWrap.style.width = "100%";
      controlsWrap.style.display = "grid";
      controlsWrap.style.placeItems = "center";

      const controls = document.createElement("div");
      controls.className = "flex items-center gap-1";
      controls.style.display = "flex";
      controls.style.alignItems = "center";
      controls.style.justifyContent = "center";
      controls.style.flexShrink = "0";
      controls.style.columnGap = "10px";
      controls.style.margin = "0 auto";
      controls.style.padding = currentQuantity > 0 ? "5px 8px" : "0";
      controls.style.borderRadius = "999px";
      controls.style.background = currentQuantity > 0 ? "#eef2f7" : "transparent";

      const buildAction = (
        action: "add" | "inc" | "dec" | "remove",
        label: string,
        disabled = false,
      ) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn";
        button.textContent = label;
        button.setAttribute("data-product-action", action);
        button.setAttribute("data-product-id", product.id);
        button.setAttribute("aria-label", action === "add" ? `Add ${product.name}` : `${action} ${product.name}`);
        button.disabled = disabled;
        return button;
      };

      if (currentQuantity > 0) {
        const decButton = buildAction("dec", "−");
        styleProductActionButton(decButton);
        controls.appendChild(decButton);
      }

      const incButton = buildAction(currentQuantity > 0 ? "inc" : "add", "+", maxReached);
      styleProductActionButton(incButton, { emphasized: true });
      controls.appendChild(incButton);

      controlsWrap.appendChild(controls);

      let existingControls = card.querySelector("[data-product-controls]") as HTMLDivElement | null;
      if (!existingControls) {
        existingControls = document.createElement("div");
        existingControls.setAttribute("data-product-controls", product.id);
        card.appendChild(existingControls);
      }
      existingControls.innerHTML = "";
      existingControls.style.width = "100%";
      existingControls.style.display = "grid";
      existingControls.style.placeItems = "center";
      existingControls.appendChild(controls);
    });

    Array.from(productList.querySelectorAll("[data-product-card]")).forEach((node) => {
      const productId = (node as HTMLElement).getAttribute("data-product-card");
      if (productId && !products.some((product) => product.id === productId)) {
        node.remove();
      }
    });

    selectionElement.appendChild(productList);
    this.renderProductListGlobalCart();
  }

  renderImageGallerySelection = (
    fieldConfig: TFieldConfig,
    value: any,
    selectionElement: HTMLElement | null,
  ) => {
    if (!selectionElement) {
      return;
    }

    const images = this.getImageGalleryCatalog(fieldConfig);
    const selectedItems = this.getImageGallerySelectionItems(value);
    const selectedMap = selectedItems.reduce((accumulator, item) => {
      accumulator[item.id] = true;
      return accumulator;
    }, {} as Record<string, boolean>);
    const selectionLimit = this.getImageGallerySelectionLimit(fieldConfig);
    const limitReached = selectionLimit > 0 && selectedItems.length >= selectionLimit;

    let gallery = selectionElement.querySelector(
      `[data-image-gallery-catalog="${fieldConfig.name}"]`,
    ) as HTMLDivElement | null;

    if (!gallery) {
      gallery = document.createElement("div");
      gallery.setAttribute("data-image-gallery-catalog", fieldConfig.name);
      selectionElement.innerHTML = "";
      selectionElement.appendChild(gallery);
    }

    gallery.style.display = "grid";
    gallery.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
    gallery.style.gap = "10px";
    gallery.style.marginBottom = "14px";

    images.forEach((imageItem) => {
      const selected = Boolean(selectedMap[imageItem.id]);
      const disabled = !selected && limitReached;

      let card = gallery!.querySelector(`[data-image-card="${imageItem.id}"]`) as HTMLDivElement | null;
      if (!card) {
        card = document.createElement("div");
        card.setAttribute("data-image-card", imageItem.id);
        gallery!.appendChild(card);
      }
      card.setAttribute("data-image-open-gallery", imageItem.id);
      card.className = "rounded border border-base-300 p-2 transition-all";
      card.style.cursor = disabled ? "not-allowed" : "pointer";
      card.style.opacity = disabled ? "0.55" : "1";
      card.style.borderColor = selected ? "rgb(59 130 246)" : "";
      card.style.boxShadow = selected ? "0 0 0 2px rgba(59, 130, 246, 0.15)" : "";
      card.style.background = selected ? "rgba(59, 130, 246, 0.06)" : "rgba(248, 250, 252, 0.82)";

      const previewSrc = imageItem.image_medium || imageItem.image_thumbnail;
      let preview = card.querySelector("img") as HTMLImageElement | null;
      if (!preview && previewSrc) {
        preview = document.createElement("img");
        preview.setAttribute("data-image-preview", imageItem.id);
        card.appendChild(preview);
      }
      if (preview) {
        preview.src = previewSrc || "";
        preview.alt = imageItem.name;
        preview.style.width = "100%";
        preview.style.height = "140px";
        preview.style.objectFit = "cover";
        preview.style.borderRadius = "8px";
      }

      let title = card.querySelector("[data-image-title]") as HTMLDivElement | null;
      if (!title) {
        title = document.createElement("div");
        title.setAttribute("data-image-title", imageItem.id);
        card.appendChild(title);
      }
      title.className = "mt-2 text-sm font-semibold";
      title.style.overflowWrap = "anywhere";
      title.style.wordBreak = "break-word";
      title.textContent = imageItem.name;

      const photoCount = imageItem.photos_full.length;
      let stateRow = card.querySelector("[data-image-meta-row]") as HTMLDivElement | null;
      if (!stateRow) {
        stateRow = document.createElement("div");
        stateRow.setAttribute("data-image-meta-row", imageItem.id);
        card.appendChild(stateRow);
      }
      stateRow.className = "mt-2 flex items-center justify-between gap-2";

      let galleryBadge = stateRow.querySelector("[data-image-gallery-badge]") as HTMLSpanElement | null;
      if (!galleryBadge) {
        galleryBadge = document.createElement("span");
        galleryBadge.setAttribute("data-image-gallery-badge", imageItem.id);
        stateRow.appendChild(galleryBadge);
      }
      galleryBadge.className = "text-[11px] font-semibold uppercase tracking-[0.12em]";
      galleryBadge.style.opacity = "0.68";
      galleryBadge.style.overflowWrap = "anywhere";
      galleryBadge.textContent = photoCount ? `${photoCount} photos` : "single image";

      let selectedBadge = stateRow.querySelector("[data-image-gallery-state]") as HTMLSpanElement | null;
      if (!selectedBadge) {
        selectedBadge = document.createElement("span");
        selectedBadge.setAttribute("data-image-gallery-state", imageItem.id);
        stateRow.appendChild(selectedBadge);
      }
      if (selected) {
        selectedBadge.className = "text-[11px] font-semibold";
        selectedBadge.style.display = "inline-flex";
        selectedBadge.style.padding = "4px 8px";
        selectedBadge.style.borderRadius = "999px";
        selectedBadge.style.background = "rgba(59, 130, 246, 0.12)";
        selectedBadge.style.color = "rgb(29, 78, 216)";
        selectedBadge.style.whiteSpace = "nowrap";
        selectedBadge.textContent = "Selected";
      } else if (disabled) {
        selectedBadge.className = "text-[11px] font-semibold";
        selectedBadge.style.display = "inline-flex";
        selectedBadge.style.padding = "4px 8px";
        selectedBadge.style.borderRadius = "999px";
        selectedBadge.style.background = "rgba(148, 163, 184, 0.12)";
        selectedBadge.style.color = "#475569";
        selectedBadge.style.whiteSpace = "nowrap";
        selectedBadge.textContent = "Limit reached";
      } else {
        selectedBadge.className = "text-[11px] opacity-70";
        selectedBadge.style.display = "inline-flex";
        selectedBadge.style.padding = "0";
        selectedBadge.style.background = "transparent";
        selectedBadge.style.color = "";
        selectedBadge.style.whiteSpace = "nowrap";
        selectedBadge.textContent = "Available";
      }

      const toggleButton = document.createElement("button");
      toggleButton.type = "button";
      toggleButton.className = "btn";
      toggleButton.textContent = selected ? "×" : "+";
      toggleButton.setAttribute("data-image-gallery-action", "toggle");
      toggleButton.setAttribute("data-image-id", imageItem.id);
      toggleButton.setAttribute("aria-label", selected ? `Remove ${imageItem.name}` : `Select ${imageItem.name}`);
      toggleButton.disabled = disabled;
      toggleButton.style.width = "36px";
      toggleButton.style.minWidth = "36px";
      toggleButton.style.height = "36px";
      toggleButton.style.padding = "0";
      toggleButton.style.display = "inline-flex";
      toggleButton.style.alignItems = "center";
      toggleButton.style.justifyContent = "center";
      toggleButton.style.borderRadius = "999px";
      toggleButton.style.fontSize = "14px";
      toggleButton.style.fontWeight = "700";
      toggleButton.style.boxShadow = "none";
      toggleButton.style.border = selected ? "1px solid transparent" : "1px solid rgba(148, 163, 184, 0.4)";
      toggleButton.style.background = selected ? "transparent" : "#0f172a";
      toggleButton.style.color = selected ? "#0f172a" : "#ffffff";

      let controls = card.querySelector("[data-image-controls]") as HTMLDivElement | null;
      if (!controls) {
        controls = document.createElement("div");
        controls.setAttribute("data-image-controls", imageItem.id);
        card.appendChild(controls);
      }
      controls.innerHTML = "";
      controls.className = "mt-2 flex items-center justify-center";
      controls.appendChild(toggleButton);
    });

    Array.from(gallery.querySelectorAll("[data-image-card]")).forEach((node) => {
      const imageId = (node as HTMLElement).getAttribute("data-image-card");
      if (imageId && !images.some((image) => image.id === imageId)) {
        node.remove();
      }
    });

    let selectedPanel = selectionElement.querySelector(
      `[data-image-gallery-selection="${fieldConfig.name}"]`,
    ) as HTMLDivElement | null;
    if (!selectedPanel) {
      selectedPanel = document.createElement("div");
      selectedPanel.setAttribute("data-image-gallery-selection", fieldConfig.name);
      selectionElement.appendChild(selectedPanel);
    }
    selectedPanel.innerHTML = "";
    selectedPanel.className = "rounded border border-base-300 p-3";

    const heading = document.createElement("div");
    heading.className = "mb-2 text-sm font-semibold";
    heading.textContent = `Selected Images (${selectedItems.length}${selectionLimit ? `/${selectionLimit}` : ""})`;
    selectedPanel.appendChild(heading);

    if (!selectedItems.length) {
      const empty = document.createElement("div");
      empty.className = "grid gap-1 rounded border border-base-300 px-3 py-3 text-xs";
      empty.style.background = "rgba(248, 250, 252, 0.82)";
      const emptyTitle = document.createElement("div");
      emptyTitle.className = "font-semibold";
      emptyTitle.textContent = "No image selected";
      const emptyHint = document.createElement("div");
      emptyHint.style.opacity = "0.72";
      emptyHint.textContent = "Use the gallery cards above to build the selection.";
      empty.appendChild(emptyTitle);
      empty.appendChild(emptyHint);
      selectedPanel.appendChild(empty);
      selectionElement.appendChild(selectedPanel);
      return;
    }

    const list = document.createElement("div");
    list.style.display = "grid";
    list.style.gap = "8px";
    selectedItems.forEach((item) => {
      const row = document.createElement("div");
      row.className = "flex items-center justify-between gap-2 rounded border border-base-300 px-2 py-2";
      row.setAttribute("data-image-gallery-item", item.id);
      row.style.background = "rgba(248, 250, 252, 0.82)";

      const nameWrap = document.createElement("div");
      nameWrap.className = "flex min-w-0 items-center gap-2";
      if (item.image_thumbnail || item.image_medium) {
        const thumb = document.createElement("img");
        thumb.src = item.image_thumbnail || item.image_medium;
        thumb.alt = item.name;
        thumb.style.width = "40px";
        thumb.style.height = "40px";
        thumb.style.objectFit = "cover";
        thumb.style.borderRadius = "8px";
        thumb.style.flexShrink = "0";
        nameWrap.appendChild(thumb);
      }

      const name = document.createElement("div");
      name.className = "text-sm";
      name.style.overflowWrap = "anywhere";
      name.style.wordBreak = "break-word";
      name.textContent = item.name;
      nameWrap.appendChild(name);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn";
      remove.textContent = "×";
      remove.setAttribute("data-image-gallery-action", "remove");
      remove.setAttribute("data-image-id", item.id);
      remove.setAttribute("aria-label", `Remove ${item.name}`);
      remove.style.width = "32px";
      remove.style.minWidth = "32px";
      remove.style.height = "32px";
      remove.style.padding = "0";
      remove.style.display = "inline-flex";
      remove.style.alignItems = "center";
      remove.style.justifyContent = "center";
      remove.style.borderRadius = "999px";
      remove.style.fontSize = "16px";
      remove.style.boxShadow = "none";
      remove.style.border = "1px solid transparent";
      remove.style.background = "transparent";
      remove.style.color = "#0f172a";

      row.appendChild(nameWrap);
      row.appendChild(remove);
      list.appendChild(row);
    });
    selectedPanel.appendChild(list);
    selectionElement.appendChild(selectedPanel);
  }

  renderQuizSelection = (
    fieldConfig: TFieldConfig,
    value: any,
    selectionElement: HTMLElement | null,
  ) => {
    if (!selectionElement) {
      return;
    }

    if (this.isOpenQuizField(fieldConfig)) {
      let wrapper = selectionElement.querySelector("[data-quiz-open-wrapper]") as HTMLDivElement | null;
      let textarea = selectionElement.querySelector(
        `[data-quiz-open-answer="${fieldConfig.name}"]`,
      ) as HTMLTextAreaElement | null;

      if (!wrapper || !textarea) {
        selectionElement.innerHTML = "";

        wrapper = document.createElement("div");
        wrapper.className = "grid gap-2";
        wrapper.setAttribute("data-quiz-open-wrapper", fieldConfig.name);
        wrapper.style.gap = "6px";

        textarea = document.createElement("textarea");
        textarea.className = "textarea textarea-bordered w-full";
        textarea.rows = 2;
        textarea.placeholder = fieldConfig.placeholder || "Write your answer";
        textarea.setAttribute("data-quiz-open-answer", fieldConfig.name);
        textarea.style.background = "#ffffff";
        textarea.style.minHeight = "72px";
        wrapper.appendChild(textarea);
        selectionElement.appendChild(wrapper);
      }

      const nextValue = typeof value === "string" ? value : "";
      if (textarea.value !== nextValue && document.activeElement !== textarea) {
        textarea.value = nextValue;
      }
      const maxLen = Number(fieldConfig.maxLen);
      if (Number.isFinite(maxLen) && maxLen > 0) {
        textarea.maxLength = Math.round(maxLen);
      } else {
        textarea.removeAttribute("maxlength");
      }
      return;
    }

    const answers = this.getQuizCatalog(fieldConfig);
    const selectedItems = this.getQuizSelectionItems(value);
    const selectedMap = selectedItems.reduce((accumulator, item) => {
      accumulator[item.id] = true;
      return accumulator;
    }, {} as Record<string, boolean>);
    const selectionLimit = this.getQuizSelectionLimit(fieldConfig);
    const limitReached = selectionLimit > 0 && selectedItems.length >= selectionLimit;

    let grid = selectionElement.querySelector(
      `[data-quiz-catalog="${fieldConfig.name}"]`,
    ) as HTMLDivElement | null;
    if (!grid) {
      grid = document.createElement("div");
      grid.setAttribute("data-quiz-catalog", fieldConfig.name);
      selectionElement.innerHTML = "";
      selectionElement.appendChild(grid);
    }
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
    grid.style.gap = "10px";
    grid.style.marginBottom = "14px";

    answers.forEach((answer) => {
      const selected = Boolean(selectedMap[answer.id]);
      const disabled = !selected && limitReached && fieldConfig.multiple;

      let card = grid.querySelector(`[data-quiz-answer-card="${answer.id}"]`) as HTMLDivElement | null;
      if (!card) {
        card = document.createElement("div");
        card.setAttribute("data-quiz-answer-card", answer.id);
        grid.appendChild(card);
      }
      card.setAttribute("data-quiz-answer-action", "toggle");
      card.setAttribute("data-quiz-answer-id", answer.id);
      card.setAttribute("data-selected", selected ? "true" : "false");
      card.setAttribute("data-disabled", disabled ? "true" : "false");
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", disabled ? "-1" : "0");
      card.setAttribute("aria-pressed", selected ? "true" : "false");
      card.className = "rounded border p-2 transition-all";
      card.style.cursor = disabled ? "not-allowed" : "pointer";
      card.style.opacity = disabled ? "0.55" : "1";
      card.style.borderColor = selected ? "rgb(59 130 246)" : "";
      card.style.boxShadow = selected ? "0 0 0 2px rgba(59, 130, 246, 0.15)" : "";
      card.style.background = selected ? "rgba(59, 130, 246, 0.06)" : "rgba(248, 250, 252, 0.82)";

      const previewSrc = answer.image_medium || answer.image_thumbnail;
      let preview = card.querySelector("[data-quiz-answer-image]") as HTMLImageElement | null;
      if (!preview && previewSrc) {
        preview = document.createElement("img");
        preview.setAttribute("data-quiz-answer-image", answer.id);
        card.appendChild(preview);
      }
      if (preview) {
        preview.src = previewSrc || "";
        preview.alt = answer.name;
        preview.style.width = "100%";
        preview.style.height = "140px";
        preview.style.objectFit = "cover";
        preview.style.borderRadius = "8px";
        preview.style.marginBottom = "8px";
      }

      let title = card.querySelector("[data-quiz-answer-title]") as HTMLDivElement | null;
      if (!title) {
        title = document.createElement("div");
        title.setAttribute("data-quiz-answer-title", answer.id);
        card.appendChild(title);
      }
      title.className = "text-sm font-semibold";
      title.style.overflowWrap = "anywhere";
      title.style.wordBreak = "break-word";
      title.textContent = answer.name;

      let stateRow = card.querySelector("[data-quiz-answer-state]") as HTMLDivElement | null;
      if (!stateRow) {
        stateRow = document.createElement("div");
        stateRow.setAttribute("data-quiz-answer-state", answer.id);
        card.appendChild(stateRow);
      }
      stateRow.className = "mt-2 flex items-center justify-between gap-2";

      let modeBadge = stateRow.querySelector("[data-quiz-mode]") as HTMLSpanElement | null;
      if (!modeBadge) {
        modeBadge = document.createElement("span");
        modeBadge.setAttribute("data-quiz-mode", answer.id);
        stateRow.appendChild(modeBadge);
      }
      modeBadge.className = "text-[11px] font-semibold uppercase tracking-[0.12em]";
      modeBadge.style.opacity = "0.68";
      modeBadge.style.overflowWrap = "anywhere";
      modeBadge.textContent = fieldConfig.multiple ? "Multi select" : "Single select";

      let selectedBadge = stateRow.querySelector("[data-quiz-selected-state]") as HTMLSpanElement | null;
      if (!selectedBadge) {
        selectedBadge = document.createElement("span");
        selectedBadge.setAttribute("data-quiz-selected-state", answer.id);
        stateRow.appendChild(selectedBadge);
      }
      if (selected) {
        selectedBadge.className = "text-[11px] font-semibold";
        selectedBadge.style.padding = "4px 8px";
        selectedBadge.style.borderRadius = "999px";
        selectedBadge.style.background = "rgba(59, 130, 246, 0.12)";
        selectedBadge.style.color = "rgb(29, 78, 216)";
        selectedBadge.style.whiteSpace = "nowrap";
        selectedBadge.textContent = "Selected";
      } else if (disabled) {
        selectedBadge.className = "text-[11px] font-semibold";
        selectedBadge.style.padding = "4px 8px";
        selectedBadge.style.borderRadius = "999px";
        selectedBadge.style.background = "rgba(148, 163, 184, 0.12)";
        selectedBadge.style.color = "#475569";
        selectedBadge.style.whiteSpace = "nowrap";
        selectedBadge.textContent = "Limit reached";
      } else {
        selectedBadge.className = "text-[11px] opacity-70";
        selectedBadge.style.padding = "0";
        selectedBadge.style.background = "transparent";
        selectedBadge.style.color = "";
        selectedBadge.style.whiteSpace = "nowrap";
        selectedBadge.textContent = "Available";
      }
    });

    Array.from(grid.querySelectorAll("[data-quiz-answer-card]")).forEach((node) => {
      const answerId = (node as HTMLElement).getAttribute("data-quiz-answer-card");
      if (answerId && !answers.some((answer) => answer.id === answerId)) {
        node.remove();
      }
    });

    let selectedPanel = selectionElement.querySelector(
      `[data-quiz-selection="${fieldConfig.name}"]`,
    ) as HTMLDivElement | null;
    if (!selectedPanel) {
      selectedPanel = document.createElement("div");
      selectedPanel.setAttribute("data-quiz-selection", fieldConfig.name);
      selectionElement.appendChild(selectedPanel);
    }
    selectedPanel.innerHTML = "";
    selectedPanel.className = "rounded border border-base-300 p-3";

    const heading = document.createElement("div");
    heading.className = "mb-2 text-sm font-semibold";
    heading.textContent = `Selected Answers (${selectedItems.length}${selectionLimit ? `/${selectionLimit}` : ""})`;
    selectedPanel.appendChild(heading);

    if (!selectedItems.length) {
      const empty = document.createElement("div");
      empty.className = "grid gap-1 rounded border border-base-300 px-3 py-3 text-xs";
      empty.style.background = "rgba(248, 250, 252, 0.82)";
      const emptyTitle = document.createElement("div");
      emptyTitle.className = "font-semibold";
      emptyTitle.textContent = "No answer selected";
      const emptyHint = document.createElement("div");
      emptyHint.style.opacity = "0.72";
      emptyHint.textContent = "Pick one or more answers from the cards above.";
      empty.appendChild(emptyTitle);
      empty.appendChild(emptyHint);
      selectedPanel.appendChild(empty);
      selectionElement.appendChild(selectedPanel);
      return;
    }

    const list = document.createElement("div");
    list.style.display = "grid";
    list.style.gap = "8px";
    selectedItems.forEach((item) => {
      const row = document.createElement("div");
      row.className = "flex items-center gap-2 rounded border border-base-300 px-2 py-2";
      row.setAttribute("data-quiz-selection-item", item.id);
      row.style.background = "rgba(248, 250, 252, 0.82)";

      if (item.image_thumbnail || item.image_medium) {
        const thumb = document.createElement("img");
        thumb.src = item.image_thumbnail || item.image_medium;
        thumb.alt = item.name;
        thumb.style.width = "40px";
        thumb.style.height = "40px";
        thumb.style.objectFit = "cover";
        thumb.style.borderRadius = "8px";
        thumb.style.flexShrink = "0";
        row.appendChild(thumb);
      }

      const content = document.createElement("div");
      content.className = "min-w-0";

      const name = document.createElement("div");
      name.className = "text-sm font-medium";
      name.style.overflowWrap = "anywhere";
      name.style.wordBreak = "break-word";
      name.textContent = item.name;
      content.appendChild(name);

      if (item.desc) {
        const desc = document.createElement("div");
        desc.className = "text-xs opacity-70";
        desc.style.overflowWrap = "anywhere";
        desc.textContent = item.desc;
        content.appendChild(desc);
      }

      row.appendChild(content);
      list.appendChild(row);
    });
    selectedPanel.appendChild(list);
    selectionElement.appendChild(selectedPanel);
  }

  renderChoiceListSelection = (
    fieldConfig: TFieldConfig,
    value: any,
    selectionElement: HTMLElement | null,
  ) => {
    if (!selectionElement) {
      return;
    }

    selectionElement.innerHTML = "";
    const choices = fieldConfig.choices || [];
    const selectedValues = this.getChoiceSelectionItems(fieldConfig, value);
    const selectedMap = selectedValues.reduce((accumulator, item) => {
      accumulator[item] = true;
      return accumulator;
    }, {} as Record<string, boolean>);
    const selectionLimit =
      fieldConfig.type === CHECKBOXES_TYPE && typeof fieldConfig.maxNumOfChoices === "number"
        ? fieldConfig.maxNumOfChoices
        : 1;
    const limitReached =
      fieldConfig.type === CHECKBOXES_TYPE && selectionLimit > 0 && selectedValues.length >= selectionLimit;

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
    grid.style.gap = "10px";

    choices.forEach((choice) => {
      const optionValue = String(choice.value ?? choice.id ?? choice.label ?? "");
      const selected = Boolean(selectedMap[optionValue]);
      const disabled = !selected && limitReached;

      const card = document.createElement("div");
      card.setAttribute("data-choice-option-action", "toggle");
      card.setAttribute("data-choice-option-value", optionValue);
      card.setAttribute("data-selected", selected ? "true" : "false");
      card.setAttribute("data-disabled", disabled ? "true" : "false");
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", disabled ? "-1" : "0");
      card.setAttribute("aria-pressed", selected ? "true" : "false");
      card.className = "rounded border p-3 transition-all";
      card.style.cursor = disabled ? "not-allowed" : "pointer";
      card.style.opacity = disabled ? "0.55" : "1";
      card.style.borderColor = selected ? "rgb(59 130 246)" : "";
      card.style.boxShadow = selected ? "0 0 0 2px rgba(59, 130, 246, 0.15)" : "";
      card.style.background = selected ? "rgba(59, 130, 246, 0.06)" : "rgba(248, 250, 252, 0.82)";

      const title = document.createElement("div");
      title.className = "text-sm font-semibold";
      title.style.overflowWrap = "anywhere";
      title.textContent = String(choice.label ?? optionValue);
      card.appendChild(title);

      if (choice.desc) {
        const description = document.createElement("div");
        description.className = "mt-1 text-xs opacity-80";
        description.style.overflowWrap = "anywhere";
        description.textContent = choice.desc;
        card.appendChild(description);
      }

      const footer = document.createElement("div");
      footer.className = "mt-2 text-xs opacity-70";
      footer.textContent = selected
        ? "Selected"
        : disabled
          ? "Selection limit reached"
          : (fieldConfig.type === RADIO_BUTTONS_TYPE ? "Click to choose" : "Click to toggle");
      card.appendChild(footer);
      grid.appendChild(card);
    });

    selectionElement.appendChild(grid);
  }

  renderDocumentScanSelection = (
    fieldConfig: TFieldConfig,
    selectedFiles: any[],
    selectionElement: HTMLElement,
  ) => {
    const slotCount = this.getDocumentScanSlotCount(fieldConfig);
    const activeSlot = this.activeDocumentScanSlot[fieldConfig.name] || 0;
    const insight = this.getDocumentScanInsight(fieldConfig);
    const controls = document.createElement("div");
    controls.className = "mb-3 flex flex-wrap gap-2";

    Array.from({ length: slotCount }, (_, index) => index).forEach((slotIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-xs btn-outline";
      button.textContent = slotIndex === 0 ? "Capture Front" : "Capture Back";
      button.setAttribute("data-document-scan-slot", String(slotIndex));
      button.classList.toggle("btn-primary", activeSlot === slotIndex);
      controls.appendChild(button);
    });

    selectionElement.appendChild(controls);

    const slotGrid = document.createElement("div");
    slotGrid.className = "grid gap-3 md:grid-cols-2";

    Array.from({ length: slotCount }, (_, index) => index).forEach((slotIndex) => {
      const file = selectedFiles[slotIndex];
      const card = document.createElement("div");
      card.className = "rounded border border-base-300 p-3";

      const title = document.createElement("div");
      title.className = "mb-2 text-xs font-medium uppercase opacity-70";
      title.textContent = slotIndex === 0 ? "Front" : "Back";
      card.appendChild(title);

      const previewFrame = document.createElement("div");
      previewFrame.className = "flex h-28 w-full items-center justify-center overflow-hidden rounded border border-base-300 bg-base-200";
      previewFrame.style.aspectRatio = "1.586 / 1";

      if (
        file instanceof File &&
        this.shouldShowImagePreview(fieldConfig, file) &&
        typeof URL !== "undefined" &&
        typeof URL.createObjectURL === "function"
      ) {
        const previewUrl = URL.createObjectURL(file);
        this.filePreviewUrls[fieldConfig.name] = [
          ...(this.filePreviewUrls[fieldConfig.name] || []),
          previewUrl,
        ];
        const image = document.createElement("img");
        image.src = previewUrl;
        image.alt = file.name;
        image.className = "h-full w-full object-cover";
        image.style.display = "block";
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.objectFit = "cover";
        previewFrame.appendChild(image);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "px-2 text-center text-xs opacity-70";
        placeholder.textContent = file?.name || "No scan yet";
        previewFrame.appendChild(placeholder);
      }

      card.appendChild(previewFrame);

      if (file?.name) {
        const name = document.createElement("div");
        name.className = "mt-2 text-xs";
        name.textContent = file.name;
        card.appendChild(name);
      }

      const textInsight = insight.textBySlot[slotIndex];
      if (textInsight) {
        const textBlock = document.createElement("div");
        textBlock.className = "mt-2 text-[11px] opacity-80";
        textBlock.textContent = `OCR: ${textInsight.slice(0, 80)}`;
        card.appendChild(textBlock);
      }

      const mrzInsight = insight.mrzBySlot[slotIndex];
      if (mrzInsight) {
        const mrzBlock = document.createElement("div");
        mrzBlock.className = "mt-1 text-[11px] font-medium";
        mrzBlock.textContent = `MRZ: ${mrzInsight.documentCode} ${mrzInsight.issuingCountry}`;
        card.appendChild(mrzBlock);
      }

      slotGrid.appendChild(card);
    });

    selectionElement.appendChild(slotGrid);

    const helper = document.createElement("div");
    helper.className = "mt-2 text-xs opacity-70";
    helper.textContent = "Scans are center-cropped to an ID card frame before submit.";
    selectionElement.appendChild(helper);
  }

  renderQrSelection = (fieldConfig: TFieldConfig, value: any, selectionElement: HTMLElement) => {
    const qrState = this.qrScannerState[fieldConfig.name] || { status: "idle" as const };

    if (typeof value === "string" && value.length) {
      const result = document.createElement("div");
      result.className = "text-sm";
      result.textContent = `Scanned code: ${value}`;
      selectionElement.appendChild(result);
    }

    const controls = document.createElement("div");
    controls.className = "mt-2 flex flex-wrap gap-2";

    const startButton = document.createElement("button");
    startButton.type = "button";
    startButton.className = "btn btn-xs btn-outline";
    startButton.textContent =
      qrState.status === "starting" ? "Starting..." : qrState.status === "live" ? "Camera Live" : "Start Camera";
    startButton.setAttribute("data-qr-action", "start");
    startButton.disabled = qrState.status === "starting" || qrState.status === "live";
    controls.appendChild(startButton);

    if (qrState.status === "live") {
      const scanButton = document.createElement("button");
      scanButton.type = "button";
      scanButton.className = "btn btn-xs btn-primary";
      scanButton.textContent = "Scan Now";
      scanButton.setAttribute("data-qr-action", "scan");
      controls.appendChild(scanButton);

      const stopButton = document.createElement("button");
      stopButton.type = "button";
      stopButton.className = "btn btn-xs btn-ghost";
      stopButton.textContent = "Stop";
      stopButton.setAttribute("data-qr-action", "stop");
      controls.appendChild(stopButton);
    }

    selectionElement.appendChild(controls);

    if (qrState.message) {
      const message = document.createElement("div");
      message.className = "mt-2 text-xs";
      message.textContent = qrState.message;
      selectionElement.appendChild(message);
    }

    if (qrState.status === "live") {
      const video = document.createElement("video");
      video.className = "mt-3 h-40 w-full rounded border border-base-300 bg-black object-cover";
      video.setAttribute("playsinline", "true");
      video.setAttribute("muted", "true");
      video.setAttribute("autoplay", "true");
      video.setAttribute("data-qr-video", fieldConfig.name);
      selectionElement.appendChild(video);
      this.assignQrVideoStream(fieldConfig.name);
    }

    const hint = document.createElement("div");
    hint.className = "mt-2 text-xs opacity-70";
    hint.textContent = "You can also upload or capture an image with the file picker.";
    selectionElement.appendChild(hint);
  }

  renderFileSelection = (
    fieldConfig: TFieldConfig,
    value: any,
    selectionElement: HTMLElement | null,
  ) => {
    if (!selectionElement) {
      return;
    }

    const selectedFiles = this.getFileValueList(value);
    const isDragActive = Boolean(this.fileDragActive[fieldConfig.name]);
    const uploadState = this.fileUploadState[fieldConfig.name];
    const titleElement = this.ensureUploadSelectionTextNode(
      selectionElement,
      fieldConfig.name,
      "data-upload-selection-title",
      "div",
      "text-sm font-medium",
    );
    const messageElement = this.ensureUploadSelectionTextNode(
      selectionElement,
      fieldConfig.name,
      "data-upload-selection-message",
      "div",
      "mt-2 text-xs opacity-70",
    );
    const bodyElement = this.ensureUploadSelectionBody(selectionElement, fieldConfig.name);
    const fileCountLabel = selectedFiles.length === 1 ? "1 file selected" : `${selectedFiles.length} files selected`;

    this.clearFilePreviewUrls(fieldConfig.name);
    bodyElement.innerHTML = "";

    selectionElement.classList.toggle("border-primary", isDragActive);
    selectionElement.classList.toggle("bg-base-200", isDragActive);
    titleElement.textContent = !selectedFiles.length
      ? "Awaiting file"
      : selectedFiles.length === 1
        ? selectedFiles[0]?.name || "1 file selected"
        : fileCountLabel;
    messageElement.textContent = !selectedFiles.length
      ? this.getUploadSelectionIdleMessage(fieldConfig)
      : "Ready for upload.";

    if (uploadState) {
      const status = document.createElement("div");
      status.className = "text-xs font-medium";
      status.textContent =
        uploadState.status === "uploading"
          ? `Uploading... ${uploadState.progress}%`
          : uploadState.status === "complete"
            ? "Uploaded"
            : "Upload failed";
      bodyElement.appendChild(status);
      messageElement.textContent =
        uploadState.status === "uploading"
          ? `Upload in progress (${uploadState.progress}%).`
          : uploadState.status === "complete"
            ? "Upload completed."
            : "Upload failed. Please try again.";
    }

    if (this.isDocumentScanField(fieldConfig)) {
      this.renderDocumentScanSelection(fieldConfig, selectedFiles, bodyElement);
      return;
    }

    if (this.isQrScanField(fieldConfig)) {
      this.renderQrSelection(fieldConfig, value, bodyElement);
      if (!selectedFiles.length) {
        return;
      }
    }

    if (!selectedFiles.length) {
      return;
    }

    const list = document.createElement("div");
    list.className = "space-y-2";

    selectedFiles.forEach((file, index) => {
      const row = document.createElement("div");
      row.className = "flex items-start justify-between gap-3 rounded border border-base-300 px-3 py-2";

      const details = document.createElement("div");
      details.className = "min-w-0 flex-1";

      const name = document.createElement("div");
      name.className = "text-sm";
      name.textContent = file?.name || "";
      details.appendChild(name);

      if (typeof file?.size === "number") {
        const meta = document.createElement("div");
        meta.className = "text-xs opacity-70";
        meta.textContent = `${Math.max(1, Math.round(file.size / 1024))} KB`;
        details.appendChild(meta);
      }

      if (
        file instanceof File &&
        this.shouldShowImagePreview(fieldConfig, file) &&
        typeof URL !== "undefined" &&
        typeof URL.createObjectURL === "function"
      ) {
        const previewUrl = URL.createObjectURL(file);
        this.filePreviewUrls[fieldConfig.name] = [
          ...(this.filePreviewUrls[fieldConfig.name] || []),
          previewUrl,
        ];
        const image = document.createElement("img");
        image.src = previewUrl;
        image.alt = file.name;
        image.className = "mt-2 h-20 w-20 rounded object-cover";
        image.style.display = "block";
        image.style.width = "72px";
        image.style.height = "72px";
        image.style.marginTop = "8px";
        image.style.borderRadius = "8px";
        image.style.objectFit = "cover";
        image.style.flexShrink = "0";
        details.appendChild(image);
      }

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "btn btn-xs btn-ghost";
      removeButton.textContent = "Remove";
      removeButton.setAttribute("data-remove-file-index", String(index));

      row.appendChild(details);
      row.appendChild(removeButton);
      list.appendChild(row);
    });

    bodyElement.appendChild(list);
  }

  ensureUploadSelectionTextNode = (
    selectionElement: HTMLElement,
    fieldName: string,
    attributeName: string,
    tagName: "div" | "span",
    className: string,
  ) => {
    let element = selectionElement.querySelector(
      `[${attributeName}="${fieldName}"]`,
    ) as HTMLElement | null;
    if (element) {
      return element;
    }

    element = document.createElement(tagName);
    element.className = className;
    element.setAttribute(attributeName, fieldName);
    selectionElement.appendChild(element);
    return element;
  }

  ensureUploadSelectionBody = (selectionElement: HTMLElement, fieldName: string) => {
    let bodyElement = selectionElement.querySelector(
      `[data-upload-selection-body="${fieldName}"]`,
    ) as HTMLDivElement | null;
    if (bodyElement) {
      return bodyElement;
    }

    bodyElement = document.createElement("div");
    bodyElement.className = "mt-3 grid gap-2";
    bodyElement.setAttribute("data-upload-selection-body", fieldName);
    selectionElement.appendChild(bodyElement);
    return bodyElement;
  }

  getUploadSelectionIdleMessage = (fieldConfig: TFieldConfig) =>
    fieldConfig.type === "upload-image"
      ? "Drop an image here or use the file picker."
      : "Drop files here or use the file picker."

  setFileDragState = (fieldName: string, active: boolean) => {
    this.fileDragActive[fieldName] = active;
    const fieldConfig = this.engine.getField(fieldName);
    if (!fieldConfig) {
      return;
    }

    const selectionElement = this.querySelector(`#${fieldName}_selection`) as HTMLElement | null;
    this.renderFileSelection(fieldConfig, this.getFieldValue(fieldName), selectionElement);
  }

  applyDroppedFiles = async (fieldName: string, files: File[]) => {
    if (!this.form || !files.length) {
      return;
    }

    const fieldConfig = this.engine.getField(fieldName);
    if (!fieldConfig) {
      return;
    }

    const currentFiles = this.getFileValueList(this.getFieldValue(fieldName));
    const mergedFiles =
      fieldConfig.multiple && fieldConfig.fileDropMode === "append"
        ? [...currentFiles, ...files]
        : files;
    const nextValue = fieldConfig.multiple ? mergedFiles : mergedFiles[0];
    const fileValidationError = this.engine.validateFileField(fieldName, nextValue);
    if (fileValidationError) {
      this.emitFileValidationErrorEvent(
        fieldName,
        {
          ...(this.form.getState().values || {}),
          [fieldName]: nextValue,
        },
        fileValidationError as TValidationError,
      );
      return;
    }

    if (this.isQrScanField(fieldConfig)) {
      const qrValue = files[0]
        ? await this.decodeQrScanFile(fieldConfig, files[0])
        : undefined;
      this.form.change(fieldName, qrValue);
      this.scheduleDraftSave();
      this.updateConditionalFields();
      void this.refreshRemoteOptions(fieldName);
      return;
    }

    if (this.isDocumentScanField(fieldConfig)) {
      const slotCount = this.getDocumentScanSlotCount(fieldConfig);
      const currentFiles = this.getFileValueList(this.getFieldValue(fieldName));
      const nextFiles = Array.from(
        { length: slotCount },
        (_, index) => currentFiles[index] instanceof File ? currentFiles[index] : undefined,
      );
      const targetSlot = Math.min(this.activeDocumentScanSlot[fieldName] || 0, slotCount - 1);
      const croppedFile = await this.cropDocumentScanFile(fieldConfig, files[0], targetSlot);
      nextFiles[targetSlot] = croppedFile;
      await this.analyzeDocumentScanFile(fieldConfig, croppedFile, targetSlot);
      const nextDocumentValue = slotCount === 1 ? nextFiles[0] : nextFiles;
      this.form.change(fieldName, nextDocumentValue);
      this.scheduleDraftSave();
      this.updateConditionalFields();
      void this.refreshRemoteOptions(fieldName);
      return;
    }

    this.form.change(fieldName, nextValue);
    this.scheduleDraftSave();
    this.updateConditionalFields();
    void this.refreshRemoteOptions(fieldName);
  }

  removeSelectedFile = (fieldName: string, fileIndex: number) => {
    const currentValue = this.getFieldValue(fieldName);
    const currentFiles = this.getFileValueList(currentValue);
    if (!currentFiles.length || fileIndex < 0 || fileIndex >= currentFiles.length) {
      return;
    }

    const nextFiles = currentFiles.filter((_, index) => index !== fileIndex);
    const fieldElement = this.getFieldElement(fieldName);
    if (fieldElement instanceof HTMLInputElement && fieldElement.type === "file") {
      fieldElement.value = "";
    }

    if (!this.form) {
      return;
    }

    const fieldConfig = this.engine.getField(fieldName);
    const nextValue = fieldConfig?.multiple ? nextFiles : nextFiles[0];
    this.form.change(fieldName, nextValue);
    this.scheduleDraftSave();
    this.updateConditionalFields();
    void this.refreshRemoteOptions(fieldName);
  }

  initialize = () => {
    let formElem: HTMLFormElement | null = null;
    const hydrationConfig = (this as any).__xpressuiHydrationConfig as TFormConfig | null | undefined;
    const useHydration = this.hasAttribute("hydrate-existing");

    if (useHydration) {
      formElem = this.querySelector("form") as HTMLFormElement | null;
    } else if ("content" in document.createElement("template")) {
      const name = this.getAttribute("name");
      if (name) {
        const root = this.getRootNode();
        const scopedRoot = this.parentElement || (root instanceof Document ? root : null);
        const template = scopedRoot?.querySelector(`#${name}`) as HTMLTemplateElement | null
          || document.querySelector(`#${name}`) as HTMLTemplateElement | null;
        if (template) {
          this.appendChild(template?.content.cloneNode(true));
          formElem = this.querySelector(`#${name}_form`) as HTMLFormElement;
        }
      }
    }

    if (!formElem) {
      this.initialized = false;
      return;
    }

    this.initialized = true;

    if (formElem) {
      this.formConfig = hydrationConfig
        ? validatePublicFormConfig(hydrationConfig)
        : validatePublicFormConfig(getFormConfig(formElem) as unknown as Record<string, any>);
      this.engine.setFormConfig(this.formConfig);
      this.steps.setFormConfig(this.formConfig);
      this.persistence.setFormConfig(this.formConfig);
      this.stepNames = this.isMultiStepMode() ? this.steps.getStepNames() : [];
      this.currentStepIndex = this.isMultiStepMode() ? this.steps.getCurrentStepIndex() : 0;
      const savedStepIndex = this.persistence.loadCurrentStepIndex();
      if (
        this.isMultiStepMode() &&
        typeof savedStepIndex === "number" &&
        savedStepIndex >= 0 &&
        savedStepIndex < this.stepNames.length
      ) {
        this.steps.setCurrentStepIndex(savedStepIndex);
        this.currentStepIndex = this.steps.getCurrentStepIndex();
      }
      const draftValues = this.persistence.loadDraftValues();
      const renderMode = this.getBaseRenderMode();
      const hybridInitialValues =
        renderMode === "hybrid"
          ? this.getInitialViewValues(formElem)
          : null;

      if (renderMode === "view") {
        this.applyViewMode(formElem);
        this.emitOutputSnapshot(this.getInitialViewValues(formElem));
        return;
      }

      this.form = createForm({
        onSubmit: this.onSubmit,
        initialValues: hybridInitialValues || draftValues,
        validate: (values: Record<string, any>) => this.validateForm(values),

      });


      formElem.addEventListener("submit", (event) => {
        event.preventDefault();
        if (this.isMultiStepMode() && !this.isLastStep()) {
          this.nextStep();
          return;
        }
        const submitValues = this.form?.getState().values || {};
        const submitErrors = this.validateForm(submitValues);
        const blockingFields = Object.keys(submitErrors || {});
        if (blockingFields.length) {
          blockingFields.forEach((fieldName) => {
            this.form?.blur(fieldName);
          });
          this.emitFormEvent("form-ui:validation-blocked-submit", {
            values: this.engine.normalizeValues(submitValues),
            formConfig: this.formConfig,
            submit: this.formConfig?.submit,
            error: submitErrors,
            result: {
              fieldNames: blockingFields,
            },
          });
          return;
        }
        this.form?.submit();
      });

      if (useHydration && this.formConfig) {
        Object.values(this.engine.getFields()).forEach((fieldConfig) => {
          const input = this.getFieldElement(fieldConfig.name);
          const selectionElement = this.querySelector(`#${fieldConfig.name}_selection`) as HTMLElement | null;
          if (input || selectionElement) {
            this.registerField(fieldConfig, input);
          }
        });
      } else {
        Array.from(formElem.elements).forEach(input => {
          const fieldConfig = getFieldConfig(input);
          if (fieldConfig.type !== UNKNOWN_TYPE) {
            this.registerField(fieldConfig, input);
          }
        });
      }
      this.bindProductListGlobalCartEvents();

      this.ensureStepControls(formElem);

      this.dynamic.updateConditionalFields();
      void this.dynamic.refreshRemoteOptions();
      this.syncStepVisibility();
      this.syncStepControls();
      this.emitWorkflowSnapshotEvent({
        values: this.form?.getState().values || {},
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
      });
      this.emitStepChange();

      if (renderMode === "hybrid") {
        this.applyHybridMode(formElem, hybridInitialValues || undefined);
        this.emitOutputSnapshot(hybridInitialValues || this.form?.getState().values || {});
      }

      this.persistence.connect();

      void this.persistence.hydrateStorage().then((result) => {
        if (!result) {
          return;
        }

        const restoredDraft = getRestorableStorageValues(result.snapshot.draft);
        const initialDraftJson = JSON.stringify(draftValues);
        const restoredDraftJson = JSON.stringify(restoredDraft);
        if (
          this.form &&
          Object.keys(restoredDraft).length &&
          restoredDraftJson !== initialDraftJson
        ) {
          this.form.initialize(restoredDraft);
          this.persistence.emitDraftRestored(restoredDraft);
        }

        this.persistence.emitQueueState();
      });

      if (Object.keys(draftValues).length) {
        this.persistence.emitDraftRestored(draftValues);
      }

      this.persistence.emitQueueState();
    }
  }

  saveDraft = (values?: Record<string, any>) => {
    this.persistence.saveDraft(values);
  }

  scheduleDraftSave = () => {
    this.persistence.scheduleDraftSave();
  }

  clearDraft = () => {
    this.persistence.clearDraft();
  }

  shouldUseQueue = () => {
    return this.persistence.shouldUseQueue();
  }

  enqueueSubmission = (values: Record<string, any>) => {
    this.persistence.enqueueSubmission(values);
  }

  getQueueState = (): TFormQueueState => {
    return this.persistence.getQueueState();
  }

  emitQueueState = () => {
    this.persistence.emitQueueState();
  }

  getStorageSnapshot = (): TFormStorageSnapshot => {
    return this.persistence.getStorageSnapshot();
  }

  getStorageHealth = (): TFormStorageHealth => {
    return this.persistence.getStorageHealth();
  }

  getResumeStatusSummary = (): TResumeStatusSummary => {
    return this.persistence.getResumeStatusSummary();
  }

  getOperationalSummary = () => {
    return buildLocalFormOperationalSummary({
      storageHealth: this.getStorageHealth(),
      snapshot: this.getStorageSnapshot(),
      resumeTokens: this.listResumeTokens(),
      workflow: {
        currentStepIndex: this.getCurrentStepIndex(),
        stepProgress: this.getStepProgress(),
        workflowSnapshot: this.getWorkflowSnapshot(),
      },
    });
  }

  getIncidentSummary = (limit = 5) => {
    return buildLocalFormIncidentSummary({
      snapshot: this.getStorageSnapshot(),
      resumeTokens: this.listResumeTokens(),
    }, limit);
  }

  setValidationI18n = (i18n?: TFormValidationI18nConfig | null): void => {
    if (!this.formConfig) {
      return;
    }
    const nextValidation = {
      ...(this.formConfig.validation || {}),
      ...(i18n ? { i18n } : {}),
    };
    if (!i18n) {
      delete (nextValidation as any).i18n;
    }
    this.formConfig = {
      ...this.formConfig,
      validation: Object.keys(nextValidation).length ? nextValidation : undefined,
    };
    this.engine.setFormConfig(this.formConfig);
    this.persistence.setFormConfig(this.formConfig);
    this.emitFormEvent("form-ui:validation-i18n-updated", {
      values: this.engine.normalizeValues(this.form?.getState().values || {}),
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
      result: {
        locale: this.formConfig.validation?.i18n?.locale || null,
      },
    });
  }

  createResumeToken = (): string | null => {
    return this.persistence.createResumeToken();
  }

  createResumeTokenAsync = (): Promise<string | null> => {
    return this.persistence.createResumeTokenAsync();
  }

  createResumeShareCode = (token: string): Promise<string | null> => {
    return this.persistence.createResumeShareCode(token);
  }

  createResumeShareCodeDetail = (token: string): Promise<TResumeShareCodeInfo | null> => {
    return this.persistence.createResumeShareCodeDetail(token);
  }

  listResumeTokens = (): TResumeTokenInfo[] => {
    return this.persistence.listResumeTokens();
  }

  deleteResumeToken = (token: string): boolean => {
    return this.persistence.deleteResumeToken(token);
  }

  invalidateResumeToken = (token: string): Promise<boolean> => {
    return this.persistence.invalidateResumeToken(token);
  }

  restoreFromResumeToken = (token: string): Record<string, any> | null => {
    const restoredValues = this.persistence.restoreFromResumeToken(token);
    if (!restoredValues || !this.form) {
      return restoredValues;
    }

    Object.entries(restoredValues).forEach(([fieldName, fieldValue]) => {
      this.form?.change(fieldName, fieldValue);
    });
    this.persistence.emitDraftRestored(restoredValues);
    this.updateConditionalFields();
    void this.refreshRemoteOptions();
    return restoredValues;
  }

  lookupResumeToken = (token: string): Promise<TResumeLookupResult | null> => {
    return this.persistence.lookupResumeToken(token);
  }

  claimResumeShareCode = (code: string): Promise<TResumeLookupResult | null> => {
    return this.persistence.claimResumeShareCode(code);
  }

  claimResumeShareCodeDetail = (code: string): Promise<TResumeShareCodeClaimDetail | null> => {
    return this.persistence.claimResumeShareCodeDetail(code);
  }

  restoreFromShareCodeDetailAsync = async (code: string): Promise<TResumeShareCodeRestoreDetail | null> => {
    const detail = await this.persistence.restoreFromShareCodeDetailAsync(code);
    const restoredValues = detail?.restoredValues || null;
    if (!restoredValues || !this.form) {
      return detail;
    }

    Object.entries(restoredValues).forEach(([fieldName, fieldValue]) => {
      this.form?.change(fieldName, fieldValue);
    });
    this.persistence.emitDraftRestored(restoredValues);
    this.updateConditionalFields();
    await this.refreshRemoteOptions();
    return detail;
  }

  restoreFromResumeTokenAsync = async (token: string): Promise<Record<string, any> | null> => {
    const restoredValues = await this.persistence.restoreFromResumeTokenAsync(token);
    if (!restoredValues || !this.form) {
      return restoredValues;
    }

    Object.entries(restoredValues).forEach(([fieldName, fieldValue]) => {
      this.form?.change(fieldName, fieldValue);
    });
    this.persistence.emitDraftRestored(restoredValues);
    this.updateConditionalFields();
    await this.refreshRemoteOptions();
    return restoredValues;
  }

  restoreFromShareCodeAsync = async (code: string): Promise<Record<string, any> | null> => {
    const detail = await this.restoreFromShareCodeDetailAsync(code);
    return detail?.restoredValues || null;
  }

  clearDeadLetterQueue = () => {
    this.persistence.clearDeadLetterQueue();
  }

  requeueDeadLetterEntry = (entryId: string) => {
    return this.persistence.requeueDeadLetterEntry(entryId);
  }

  replayDeadLetterEntry = async (entryId: string) => {
    return this.persistence.replayDeadLetterEntry(entryId);
  }

  flushSubmissionQueue = async () => {
    await this.persistence.flushSubmissionQueue();
  }

  getActiveTemplateWarnings = (): TFormActiveTemplateWarning[] => {
    return this.dynamic.getActiveTemplateWarnings();
  }

  clearActiveTemplateWarnings = () => {
    this.dynamic.clearActiveTemplateWarnings();
  }

  getRecentAppliedRules = () => {
    return this.dynamic.getRecentAppliedRules();
  }

  clearRecentAppliedRules = () => {
    this.dynamic.clearRecentAppliedRules();
  }

  getDocumentData = (fieldName: string) => {
    return this.engine.getDocumentData(fieldName);
  }

  getDocumentDataView = (
    fieldName: string,
    mode: "full" | "summary" | "fields-only" | "mrz-only" | "none" = "summary",
    options: boolean | TDocumentDataViewOptions = true,
  ) => {
    return this.engine.getDocumentDataView(fieldName, mode, options);
  }

  getAllDocumentData = () => {
    return this.engine.getAllDocumentData();
  }

  getAllDocumentDataView = (
    mode: "full" | "summary" | "fields-only" | "mrz-only" | "none" = "summary",
    options: boolean | TDocumentDataViewOptions = true,
  ) => {
    return this.engine.getAllDocumentDataView(mode, options);
  }

  getApprovalState = (): TFormApprovalState | null => {
    return this.approvalState;
  }

  getWorkflowState = (): TFormWorkflowState => {
    return this.workflowState;
  }

  getStepNames = (): string[] => {
    return this.isMultiStepMode() ? this.steps.getStepNames() : [];
  }

  getCurrentStepIndex = (): number => {
    return this.isMultiStepMode() ? this.steps.getCurrentStepIndex() : 0;
  }

  getCurrentStepName = (): string | null => {
    return this.isMultiStepMode() ? this.steps.getCurrentStepName() : null;
  }

  getStepProgress = () => {
    if (!this.isMultiStepMode()) {
      return {
        stepIndex: 0,
        stepNumber: 1,
        stepCount: 1,
        percent: 100,
      };
    }
    return this.steps.getStepProgress();
  }

  getStepButtonLabels = (): { previous: string; next: string } => {
    return getConfiguredStepButtonLabels(this.formConfig);
  }

  getStepUiConfig = () => {
    return getConfiguredStepUiConfig(this.formConfig);
  }

  getWorkflowSnapshot = () => {
    const values = this.form?.getState().values || {};
    return this.steps.getWorkflowSnapshot(values);
  }

  getWorkflowContext = () => {
    return {
      workflowState: this.getWorkflowState(),
      approvalState: this.approvalState,
      snapshot: this.getWorkflowSnapshot(),
    };
  }

  emitWorkflowSnapshotEvent = (
    detail: Omit<TFormUISubmitDetail, "result">,
    response?: Response,
  ) => {
    const workflowDetail = {
      ...detail,
      ...(response ? { response } : {}),
      result: this.getWorkflowSnapshot(),
    };
    this.emitFormEvent("form-ui:workflow-step", workflowDetail);
    this.emitFormEvent("form-ui:workflow-snapshot", workflowDetail);
  }

  goToWorkflowStep = (state?: string): boolean => {
    if (!this.isMultiStepMode()) {
      return false;
    }
    if (!this.steps.goToWorkflowStep(state)) {
      return false;
    }

    this.currentStepIndex = this.steps.getCurrentStepIndex();
    this.persistence.saveCurrentStepIndex(this.currentStepIndex);
    this.syncStepVisibility();
    this.syncStepControls();
    this.emitFormEvent("form-ui:step-jumped", {
      values: this.form?.getState().values || {},
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
      result: {
        state: state || this.workflowState,
        stepIndex: this.currentStepIndex,
        stepName: this.getCurrentStepName(),
      },
    });
    this.emitWorkflowSnapshotEvent({
      values: this.form?.getState().values || {},
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
    });
    this.emitStepChange();
    return true;
  }

  isLastStep = (): boolean => {
    if (!this.isMultiStepMode()) {
      return true;
    }
    return this.steps.isLastStep();
  }

  getCurrentStepConfig = (): TFieldConfig | null => {
    const currentStepName = this.getCurrentStepName();
    if (!currentStepName) {
      return null;
    }

    return (
      this.steps.getCurrentStepConfig()
    );
  }

  getStepSummary = (): Array<{ field: string; label: string; value: any }> => {
    const currentStepConfig = this.getCurrentStepConfig();
    if (!currentStepConfig?.stepSummary) {
      return [];
    }

    const values = this.form?.getState().values || {};
    return this.steps.getStepSummary(values, this.engine.getFields());
  }

  shouldValidateCurrentStepForWorkflow = (): boolean => {
    return this.steps.shouldValidateCurrentStepForWorkflow();
  }

  isCurrentStepSkippable = (): boolean => {
    return this.steps.isCurrentStepSkippable();
  }

  getConditionalNextStepName = (): string | null => {
    if (!this.form) {
      return null;
    }

    return this.steps.getConditionalNextStepName(this.form.getState().values || {});
  }

  setCurrentStepIndex = (index: number): boolean => {
    if (!this.isMultiStepMode()) {
      return false;
    }
    if (!this.steps.setCurrentStepIndex(index)) {
      return false;
    }

    this.currentStepIndex = this.steps.getCurrentStepIndex();
    this.syncStepVisibility();
    this.syncStepControls();
    this.emitStepChange();
    return true;
  }

  getCurrentStepFieldElements = (): Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> => {
    return getConfiguredCurrentStepFieldElements(this, this.getCurrentStepName());
  }

  getStepElements = (sectionName: string): HTMLElement[] => {
    return getConfiguredStepElements(this, sectionName);
  }

  validateCurrentStep = (): boolean => {
    if (!this.form || !this.isMultiStepMode() || this.stepNames.length <= 1) {
      return true;
    }

    if (!this.shouldValidateCurrentStepForWorkflow()) {
      return true;
    }

    const currentStepFields = this.getCurrentStepFieldElements();
    if (!currentStepFields.length) {
      return true;
    }

    currentStepFields.forEach((fieldElement) => {
      fieldElement.dispatchEvent(new FocusEvent("blur"));
    });

    const values = this.form.getState().values || {};
    const errors = this.engine.validateValues(values);
    return !currentStepFields.some((fieldElement) => Boolean(errors[fieldElement.name]));
  }

  ensureStepControls = (formElem: HTMLFormElement) => {
    if (!this.isMultiStepMode()) {
      this.stepProgressContainer?.remove();
      this.stepActionsContainer?.remove();
      this.stepProgressContainer = null;
      this.stepActionsContainer = null;
      this.stepProgressElement = null;
      this.stepProgressBar = null;
      this.stepSummaryElement = null;
      this.stepBackButton = null;
      this.stepNextButton = null;
      return;
    }
    const controls = ensureConfiguredStepControls({
      formElem,
      stepCount: this.stepNames.length,
      buttonLabels: this.getStepButtonLabels(),
      stepUi: this.getStepUiConfig(),
      onPrevious: () => {
        this.previousStep();
      },
      onNext: () => {
        this.nextStep();
      },
    });
    this.stepProgressContainer = controls.progressContainer;
    this.stepActionsContainer = controls.actionsContainer;
    this.stepProgressElement = controls.progress;
    this.stepProgressBar = controls.progressBar;
    this.stepSummaryElement = controls.summary;
    this.stepBackButton = controls.backButton;
    this.stepNextButton = controls.nextButton;
  }

  syncStepVisibility = () => {
    if (!this.isMultiStepMode()) {
      this.steps.getStepNames().forEach((sectionName) => {
        this.getStepElements(sectionName).forEach((element) => {
          if (element.getAttribute("data-step-hidden") === "true") {
            element.removeAttribute("data-step-hidden");
            element.style.display = "";
          }
        });
      });
      return;
    }
    syncConfiguredStepVisibility({
      stepNames: this.stepNames,
      currentStepIndex: this.currentStepIndex,
      getStepElements: (sectionName) => this.getStepElements(sectionName),
    });
  }

  syncStepControls = () => {
    const formElement = this.querySelector("form");
    if (!this.isMultiStepMode()) {
      syncConfiguredStepControls({
        formElement,
        stepCount: 1,
        currentStepIndex: 0,
        isLastStep: true,
        progress: {
          stepIndex: 0,
          stepNumber: 1,
          stepCount: 1,
          percent: 100,
        },
        isCurrentStepSkippable: false,
        summary: [],
        submitLockedByRules: this.submitLockedByRules,
        submitLockMessage: this.submitLockMessage,
        stepUi: this.getStepUiConfig(),
        controls: {
          progressContainer: this.stepProgressContainer,
          progress: this.stepProgressElement,
          progressBar: this.stepProgressBar,
          summary: this.stepSummaryElement,
          actionsContainer: this.stepActionsContainer,
          backButton: this.stepBackButton,
          nextButton: this.stepNextButton,
        },
      });
      return;
    }
    syncConfiguredStepControls({
      formElement,
      stepCount: this.stepNames.length,
      currentStepIndex: this.currentStepIndex,
      isLastStep: this.isLastStep(),
      progress: this.getStepProgress(),
      isCurrentStepSkippable: this.isCurrentStepSkippable(),
      summary: this.getStepSummary(),
      submitLockedByRules: this.submitLockedByRules,
      submitLockMessage: this.submitLockMessage,
      stepUi: this.getStepUiConfig(),
      controls: {
        progressContainer: this.stepProgressContainer,
        progress: this.stepProgressElement,
        progressBar: this.stepProgressBar,
        summary: this.stepSummaryElement,
        actionsContainer: this.stepActionsContainer,
        backButton: this.stepBackButton,
        nextButton: this.stepNextButton,
      },
    });
  }

  emitStepChange = () => {
    if (!this.isMultiStepMode() || this.stepNames.length <= 1) {
      return;
    }

    const progress = this.getStepProgress();
    const conditionalNextStepName = this.getConditionalNextStepName();

    this.emitFormEvent("form-ui:step-change", {
      values: this.form?.getState().values || {},
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
      result: {
        stepIndex: this.currentStepIndex,
        stepName: this.getCurrentStepName(),
        stepCount: this.stepNames.length,
        progress,
        skippable: this.isCurrentStepSkippable(),
        summary: this.getStepSummary(),
        nextStepTarget: conditionalNextStepName,
      },
    });
  }

  goToStep = (index: number): boolean => {
    if (!this.isMultiStepMode()) {
      return false;
    }
    if (!this.steps.canGoToStep(index)) {
      return false;
    }

    if (!this.steps.goToStep(index)) {
      return false;
    }
    this.currentStepIndex = this.steps.getCurrentStepIndex();
    this.persistence.saveCurrentStepIndex(this.currentStepIndex);
    this.syncStepVisibility();
    this.syncStepControls();
    this.emitStepChange();
    return true;
  }

  nextStep = (): boolean => {
    if (!this.isMultiStepMode()) {
      return false;
    }
    const values = this.form?.getState().values || {};
    const wasSkippable = this.steps.isCurrentStepSkippable();
    const conditionalTarget = this.steps.getConditionalNextStepName(values);
    const isStepValid = this.validateCurrentStep();
    if (!wasSkippable && !isStepValid) {
      this.emitFormEvent("form-ui:step-blocked", {
        values,
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
        result: {
          stepIndex: this.currentStepIndex,
          stepName: this.getCurrentStepName(),
        },
      });
    }
    if (!this.steps.nextStep(values, isStepValid)) {
      return false;
    }
    const jumped = Boolean(conditionalTarget);
    if (jumped) {
      this.emitFormEvent("form-ui:step-jumped", {
        values,
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
        result: {
          stepIndex: this.steps.getCurrentStepIndex(),
          stepName: this.steps.getCurrentStepName(),
        },
      });
    } else if (wasSkippable) {
      this.emitFormEvent("form-ui:step-skipped", {
        values,
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
        result: {
          stepIndex: this.currentStepIndex,
          stepName: this.getCurrentStepName(),
        },
      });
    }
    this.currentStepIndex = this.steps.getCurrentStepIndex();
    this.persistence.saveCurrentStepIndex(this.currentStepIndex);
    this.syncStepVisibility();
    this.syncStepControls();
    this.emitWorkflowSnapshotEvent({
      values,
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
    });
    this.emitStepChange();
    return true;
  }

  previousStep = (): boolean => {
    if (!this.isMultiStepMode()) {
      return false;
    }
    const stepUi = this.getStepUiConfig();
    if (stepUi.backBehavior !== "always") {
      return false;
    }
    if (!this.steps.previousStep()) {
      return false;
    }
    this.currentStepIndex = this.steps.getCurrentStepIndex();
    this.persistence.saveCurrentStepIndex(this.currentStepIndex);
    this.syncStepVisibility();
    this.syncStepControls();
    this.emitWorkflowSnapshotEvent({
      values: this.form?.getState().values || {},
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
    });
    this.emitStepChange();
    return true;
  }

  syncApprovalStateFields = () => {
    if (!this.form) {
      return;
    }

    Object.values(this.engine.getFields()).forEach((fieldConfig) => {
      if (fieldConfig.type === APPROVAL_STATE_TYPE) {
        this.form?.change(fieldConfig.name, this.approvalState?.status || "");
      }
    });
  }

  setWorkflowState = (
    nextState: TFormWorkflowState,
    detail: TFormUISubmitDetail,
    response?: Response,
    result?: any,
  ): TWorkflowRouteResult => {
    const workflowTarget = this.steps.getWorkflowStepTarget(nextState);
    if (this.workflowState === nextState) {
      const moved = this.goToWorkflowStep(nextState);
      const routed = moved || (workflowTarget !== null && workflowTarget === this.getCurrentStepName());
      const routeResult = {
        routed,
        stepIndex: this.getCurrentStepIndex(),
        stepName: this.getCurrentStepName(),
      };
      if (routed) {
        this.emitWorkflowSnapshotEvent(detail, response);
      }
      return routeResult;
    }

    this.workflowState = nextState;
    this.steps.setWorkflowState(nextState);
    const moved = this.goToWorkflowStep(nextState);
    const routed = moved || (workflowTarget !== null && workflowTarget === this.getCurrentStepName());
    this.emitFormEvent("form-ui:workflow-state", {
      ...detail,
      response,
      result: {
        state: nextState,
        approvalState: this.approvalState,
        snapshot: this.getWorkflowSnapshot(),
      },
    });
    this.emitWorkflowSnapshotEvent(detail, response);
    return {
      routed,
      stepIndex: this.getCurrentStepIndex(),
      stepName: this.getCurrentStepName(),
    };
  }

  resolveProviderStepTargetIndex = (target: string | number): number | null => {
    if (typeof target === "number" && Number.isInteger(target)) {
      return target;
    }

    if (typeof target === "string") {
      const stepNames = this.getStepNames();
      const stepIndex = stepNames.indexOf(target);
      return stepIndex >= 0 ? stepIndex : null;
    }

    return null;
  }

  getProviderRoutingPolicy = (): NonNullable<TFormSubmitRequest["providerRoutingPolicy"]> => {
    const policy = this.formConfig?.submit?.providerRoutingPolicy;
    if (
      policy === "workflow-first" ||
      policy === "step-first" ||
      policy === "workflow-only" ||
      policy === "step-only"
    ) {
      return policy;
    }

    return "auto";
  }

  applySingleProviderTransition = (
    transition: TFormProviderTransition,
    detail: TFormUISubmitDetail,
    response: Response | undefined,
    result: any,
  ): TProviderTransitionRouteResult | null => {
    if (transition.type === "workflow") {
      const workflowRoute = this.setWorkflowState(
        transition.state as TFormWorkflowState,
        detail,
        response,
        result,
      );
      if (workflowRoute.routed) {
        this.emitFormEvent("form-ui:provider-step-routed", {
          ...detail,
          response,
          result: {
            transition,
            stepIndex: workflowRoute.stepIndex,
            stepName: workflowRoute.stepName,
            workflow: this.getWorkflowSnapshot(),
          },
        });
      }
      return {
        routed: workflowRoute.routed,
        stepIndex: workflowRoute.stepIndex,
        stepName: workflowRoute.stepName,
      };
    }

    const stepIndex = this.resolveProviderStepTargetIndex(transition.target);
    if (stepIndex === null || !this.goToStep(stepIndex)) {
      return null;
    }

    this.emitFormEvent("form-ui:step-jumped", {
      ...detail,
      response,
      result: {
        transition,
        stepIndex: this.getCurrentStepIndex(),
        stepName: this.getCurrentStepName(),
      },
    });
    this.emitWorkflowSnapshotEvent(detail, response);
    return {
      routed: true,
      stepIndex: this.getCurrentStepIndex(),
      stepName: this.getCurrentStepName(),
    };
  }

  applyProviderTransition = (
    detail: TFormUISubmitDetail,
    response: Response | undefined,
    result: any,
    providerResult?: TNormalizedProviderResult,
  ) => {
    const policy = this.getProviderRoutingPolicy();
    const transitions = buildConfiguredProviderTransitionCandidates(policy, result, providerResult);
    if (!transitions.length) {
      return false;
    }

    for (const transition of transitions) {
      const routeResult = this.applySingleProviderTransition(transition, detail, response, result);
      if (!routeResult) {
        continue;
      }

      this.emitFormEvent("form-ui:provider-transition", {
        ...detail,
        response,
        result: {
          transition,
          routed: routeResult.routed,
          stepIndex: routeResult.stepIndex,
          stepName: routeResult.stepName,
          policy,
          workflow: this.getWorkflowSnapshot(),
        },
      });
      return true;
    }

    return false;
  }

  emitFileValidationErrorEvent = (
    fieldName: string,
    values: Record<string, any>,
    validationError: TValidationError,
  ) => {
    this.emitFormEvent("form-ui:file-validation-error", {
      values: this.engine.normalizeValues(values),
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
      error: validationError,
      result: {
        field: fieldName,
        code: validationError?.errorData?.type,
      },
    });
  }

  validateForm = (values: Record<string, any>) => {
    const errors = runValidationHooks({
      formConfig: this.formConfig,
      values,
      validateValues: (nextValues) => this.engine.validateValues(nextValues),
    });

    Object.entries(errors).forEach(([fieldName, errorValue]) => {
      const validationError = errorValue as TValidationError;
      const errorType = validationError?.errorData?.type;
      if (
        errorType === "file-accept" ||
        errorType === "file-size" ||
        errorType === "file-count" ||
        errorType === "file-min-count" ||
        errorType === "file-total-size"
      ) {
        this.emitFileValidationErrorEvent(fieldName, values, validationError);
      }
    });

    return errors;
  }

  emitFormEvent = (
    eventName: string,
    detail: TFormUISubmitDetail,
    cancelable: boolean = false,
  ) => {
    const event = new CustomEvent<TFormUISubmitDetail>(eventName, {
      detail,
      bubbles: true,
      cancelable,
    });

    return this.dispatchEvent(event);
  }

  submitToApi = async (
    formValues: Record<string, any>,
    submitConfig: TFormSubmitRequest,
  ) => {
    return this.upload.submit(formValues, submitConfig, this.engine.getFields());
  }

  emitApprovalStateEvents = (
    detail: TFormUISubmitDetail,
    result: any,
    providerResult?: TNormalizedProviderResult,
    response?: Response,
  ) => {
    const approvalUpdate = resolveApprovalStateUpdate({
      action: this.formConfig?.submit?.action,
      result,
      providerResult,
      currentApprovalId: this.approvalState?.approvalId,
      detail,
      response,
    });
    if (!approvalUpdate.approvalState) {
      return;
    }

    this.approvalState = approvalUpdate.approvalState;
    approvalUpdate.events.forEach((event) => {
      this.emitFormEvent(event.eventName, event.detail);
    });
    this.syncApprovalStateFields();
  }

  emitProviderMessages = (
    detail: TFormUISubmitDetail,
    providerResult?: TNormalizedProviderResult,
    response?: Response,
    source: "success" | "error" = "success",
  ) => {
    const result = buildProviderMessagesResult(providerResult, source);
    if (!result) {
      return;
    }

    this.emitFormEvent("form-ui:provider-messages", {
      ...detail,
      response,
      result,
    });
  }

  enforceProviderResponseContract = (
    result: any,
    submitConfig: TFormSubmitRequest,
  ) => {
    const warning = getProviderContractWarning(result, submitConfig);
    if (warning) {
      this.emitFormEvent("form-ui:provider-contract-warning", {
        values: this.engine.normalizeValues(this.form?.getState().values || {}),
        formConfig: this.formConfig,
        submit: submitConfig,
        result: warning,
      });
    }

    assertProviderResponseContract(result, submitConfig);
  }

  emitSubmitHookError = (
    stage: TFormSubmitLifecycleStage,
    detail: TFormUISubmitDetail,
    hookError: unknown,
  ) => {
    this.emitFormEvent("form-ui:submit-hook-error", {
      ...detail,
      error: hookError,
      result: buildSubmitHookErrorResult(stage, hookError),
    });
  }

  onSubmit = async (values: Record<string, any>) => {
    let formValues = this.engine.buildSubmissionValues(
      values,
      Boolean(this.formConfig?.submit?.includeDocumentData),
      this.formConfig?.submit?.documentDataMode || "full",
      this.formConfig?.submit?.documentFieldPaths,
    );
    if (this.submitLockedByRules) {
      this.emitFormEvent("form-ui:submit-locked", {
        values: formValues,
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
        result: {
          message: this.submitLockMessage,
        },
      });
      return;
    }
    const detail: TFormUISubmitDetail = {
      values: formValues,
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
    };
    try {
      const preSubmitResult = await runConfiguredSubmitLifecycleStage(this.formConfig?.submit, "preSubmit", detail);
      if (preSubmitResult.canceled) {
        this.emitFormEvent("form-ui:submit-canceled", {
          ...detail,
          result: {
            reason: "pre-submit-canceled",
          },
        });
        return;
      }
      formValues = preSubmitResult.values;
    } catch (hookError) {
      const hookDetail = {
        ...detail,
        values: formValues,
        error: hookError,
      };
      this.emitFormEvent("form-ui:submit-error", hookDetail);
      this.emitSubmitHookError("preSubmit", hookDetail, hookError);
      this.setWorkflowState("error", hookDetail, undefined, hookError);
      throw hookError;
    }
    detail.values = formValues;
    const shouldContinue = this.emitFormEvent("form-ui:submit", detail, true);

    if (!shouldContinue) {
      return;
    }
    this.setWorkflowState("submitting", detail);

    const customTransport = this.formConfig?.submit?.transport;
    const hasEndpoint = Boolean(this.formConfig?.submit?.endpoint);

    if (!hasEndpoint && !customTransport) {
      this.clearDraft();
      this.setWorkflowState("submitted", detail);
      this.emitFormEvent("form-ui:submit-success", detail);
      try {
        await runConfiguredSubmitLifecycleStage(this.formConfig?.submit, "postSuccess", detail);
      } catch (hookError) {
        this.emitSubmitHookError("postSuccess", detail, hookError);
      }
      return;
    }

    try {
      const submitConfig = this.formConfig?.submit as TFormSubmitRequest;
      const transportResult = customTransport
        ? await resolveSubmitTransportResult(
          await customTransport(formValues, {
            formConfig: this.formConfig,
            submit: submitConfig,
            fields: this.engine.getFields(),
          }),
        )
        : await this.submitToApi(formValues, submitConfig);
      const response = transportResult?.response;
      const result = transportResult?.result;
      this.enforceProviderResponseContract(result, submitConfig);
      const providerResult = normalizeProviderResult(
        submitConfig.action,
        result,
        submitConfig,
      );
      const successDetail = {
        ...detail,
        response,
        result,
        providerResult,
      };
      this.emitFormEvent("form-ui:submit-success", successDetail);
      this.emitProviderMessages(successDetail, providerResult, response, "success");
      this.emitApprovalStateEvents(successDetail, result, providerResult, response);
      const appliedProviderTransition = this.applyProviderTransition(successDetail, response, result, providerResult);
      if (!appliedProviderTransition && this.formConfig?.submit?.action !== "approval-request" && this.formConfig?.submit?.action !== "approval-decision") {
        this.setWorkflowState("submitted", successDetail, response, result);
      }
      this.clearDraft();
      const providerSuccessEvent = getProviderSuccessEventName(this.formConfig?.submit?.action);
      if (providerSuccessEvent) {
        this.emitFormEvent(providerSuccessEvent, successDetail);
      }
      try {
        await runConfiguredSubmitLifecycleStage(this.formConfig?.submit, "postSuccess", successDetail);
      } catch (hookError) {
        this.emitSubmitHookError("postSuccess", successDetail, hookError);
      }
    } catch (error: any) {
      const isNetworkError = !error?.response;
      const storageMode = this.formConfig?.storage?.mode;
      const queueConfigured = storageMode === "queue" || storageMode === "draft-and-queue";
      if (isNetworkError && hasFileValues(formValues) && queueConfigured) {
        const queueError = new Error(
          "Offline queue is disabled for file uploads. Retry while online after re-selecting files.",
        );
        this.emitFormEvent("form-ui:queue-disabled-for-files", {
          ...detail,
          error: queueError,
        });
        this.emitFormEvent("form-ui:submit-error", {
          ...detail,
          error: queueError,
        });
        this.setWorkflowState("error", detail, undefined, queueError);
        return;
      }

      if (isNetworkError && this.shouldUseQueue()) {
        this.enqueueSubmission(formValues);
        this.clearDraft();
        return;
      }

      const providerResult =
        error?.result && this.formConfig?.submit
          ? normalizeProviderResult(this.formConfig.submit.action, error.result, this.formConfig.submit)
          : undefined;
      const errorDetail = {
        ...detail,
        response: error?.response,
        result: error?.result,
        providerResult,
        error,
      };
      this.emitFormEvent("form-ui:submit-error", errorDetail);
      this.emitProviderMessages(errorDetail, providerResult, error?.response, "error");
      this.setWorkflowState("error", errorDetail, error?.response, error?.result);
      const providerErrorEvent = getProviderErrorEventName(this.formConfig?.submit?.action);
      if (providerErrorEvent) {
        this.emitFormEvent(providerErrorEvent, errorDetail);
      }
      try {
        await runConfiguredSubmitLifecycleStage(this.formConfig?.submit, "postFailure", errorDetail);
      } catch (hookError) {
        this.emitSubmitHookError("postFailure", errorDetail, hookError);
      }
      throw error;
    }
  }

  getFieldElement = (fieldName: string) => {
    return getConfiguredFieldElement(this, fieldName);
  }

  renderFieldErrorState = (
    fieldName: string,
    inputElement:
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
      | null,
    errorElement: HTMLElement | null,
    touched?: boolean,
    error?: unknown,
  ) => {
    renderConfiguredFieldErrorState({
      fieldName,
      inputElement,
      errorElement,
      touched,
      error,
      errors: this.errors,
      ruleFieldErrors: this.ruleFieldErrors,
    });
  }

  syncFieldErrorDisplay = (fieldName: string) => {
    const inputElement = this.getFieldElement(fieldName);
    const errorElement = this.querySelector(`#${fieldName}_error`) as HTMLElement | null;
    const fieldState = this.form?.getFieldState(fieldName);
    this.renderFieldErrorState(
      fieldName,
      inputElement,
      errorElement,
      Boolean(fieldState?.touched),
      fieldState?.error,
    );
  }

  getFieldContainer = (fieldName: string) => {
    return getConfiguredFieldContainer(this, fieldName);
  }

  getFieldValue = (fieldName: string) => {
    const values = this.form?.getState().values || {};
    return values[fieldName];
  }

  updateConditionalFields = () => {
    this.dynamic.updateConditionalFields();
  }

  refreshRemoteOptions = async (sourceFieldName?: string) => {
    await this.dynamic.refreshRemoteOptions(sourceFieldName);
  }

  registerField = (fieldConfig: TFieldConfig, input: any) => {
    const {
      name
    } = fieldConfig;

    this.form?.registerField(
      name,
      (fieldState) => {
        const { blur, change, error, focus, touched, value } = fieldState;
        const errorElement = this.querySelector(`#${name}_error`) as HTMLElement | null;
        const selectionElement = this.querySelector(`#${name}_selection`) as HTMLElement | null;
        const inputElement = this.querySelector(`#${name}`) as HTMLElement | null;
        const fieldViewOnly = this.isFieldViewMode(fieldConfig, inputElement);
        const settingField = this.isSettingField(fieldConfig);


        if (!this.registered[name]) {
          // first time, register event listeners
          if (!fieldViewOnly && !settingField) {
            bindConfiguredSimpleFieldEvents({
              input,
              fieldConfig,
              onBlur: () => blur(),
              onFocus: () => focus(),
              onChangeValue: (nextValue) => {
                change(nextValue);
              },
              onAfterChange: () => {
                this.scheduleDraftSave();
                this.updateConditionalFields();
                void this.refreshRemoteOptions(name);
              },
              resolveFileInputValue: async (nextFieldConfig, nextInput) =>
                this.resolveFileInputValue(nextFieldConfig as TFieldConfig, nextInput),
            });
          }
          if (selectionElement && !fieldViewOnly && !settingField) {
            bindConfiguredSelectionFieldEvents({
              selectionElement,
              input,
              fieldConfig,
              isFileField: isFileFieldType(fieldConfig.type),
              isProductListField: this.isProductListField(fieldConfig),
              isImageGalleryField: this.isImageGalleryField(fieldConfig),
              isQuizField: this.isQuizField(fieldConfig),
              isChoiceListField: this.isChoiceListField(fieldConfig),
              isOpenQuizField: this.isOpenQuizField(fieldConfig),
              getCurrentValue: () => this.getFieldValue(name),
              onChangeValue: (nextValue) => {
                change(nextValue);
              },
              onAfterChange: () => {
                this.scheduleDraftSave();
                this.updateConditionalFields();
                void this.refreshRemoteOptions(name);
              },
              getNextProductCartItems: (action, productId) =>
                this.getNextProductCartItems(fieldConfig, this.getFieldValue(name), action, productId),
              getNextImageGallerySelectionItems: (action, imageId) =>
                this.getNextImageGallerySelectionItems(fieldConfig, this.getFieldValue(name), action, imageId),
              getNextQuizSelectionItems: (answerId) =>
                this.getNextQuizSelectionItems(fieldConfig, this.getFieldValue(name), answerId),
              getNextChoiceSelectionValue: (choiceValue) =>
                this.getNextChoiceSelectionValue(fieldConfig, this.getFieldValue(name), choiceValue),
              openProductGallery: (productId) => {
                const product = this.getProductListCatalog(fieldConfig).find((entry) => entry.id === productId);
                if (product) {
                  this.openProductListGallery(product);
                }
              },
              openImageGallery: (imageId) => {
                const imageItem = this.getImageGalleryCatalog(fieldConfig).find((entry) => entry.id === imageId);
                if (imageItem) {
                  this.openImageGalleryItem(imageItem);
                }
              },
              startQrCamera: () => {
                void this.startQrCamera(fieldConfig);
              },
              scanQrCamera: () => {
                void this.scanQrFromLiveVideo(fieldConfig);
              },
              stopQrCamera: () => {
                this.stopQrCamera(name);
              },
              setActiveDocumentScanSlot: (slotIndex) => {
                this.activeDocumentScanSlot[name] = slotIndex;
              },
              refreshSelection: () => {
                this.renderFileSelection(fieldConfig, this.getFieldValue(name), selectionElement);
              },
              removeSelectedFile: (fileIndex) => {
                this.removeSelectedFile(name, fileIndex);
              },
              setFileDragState: (active) => {
                this.setFileDragState(name, active);
              },
              applyDroppedFiles: (files) => {
                void this.applyDroppedFiles(name, files);
              },
            });
          }
          if (fieldViewOnly) {
            const configuredViewValue = this.resolveFieldViewValue(fieldConfig, inputElement, value);
            if (configuredViewValue !== undefined && JSON.stringify(configuredViewValue) !== JSON.stringify(value)) {
              change(configuredViewValue);
            }
          }
          if (settingField) {
            const settingValue = this.getSettingInitialValue(inputElement);
            if (JSON.stringify(settingValue) !== JSON.stringify(value)) {
              change(settingValue);
            }
            if (inputElement) {
              inputElement.style.display = "none";
              inputElement.setAttribute("aria-hidden", "true");
            }
          }
          this.registered[name] = true;
          this.engine.setField(name, fieldConfig);
        }

        // update value
        applyConfiguredFieldValuePresentation({
          input,
          inputElement,
          selectionElement,
          errorElement,
          fieldConfig,
          value,
          settingField,
          fieldViewOnly,
          isQrScanField: this.isQrScanField(fieldConfig),
          isProductListField: this.isProductListField(fieldConfig),
          isImageGalleryField: this.isImageGalleryField(fieldConfig),
          isQuizField: this.isQuizField(fieldConfig),
          isChoiceListField: this.isChoiceListField(fieldConfig),
          isOpenQuizField: this.isOpenQuizField(fieldConfig),
          applyFieldViewPresentation: () => {
            this.applyFieldViewPresentation(fieldConfig, inputElement, selectionElement, errorElement, value);
          },
          renderFileSelection: () => {
            this.renderFileSelection(fieldConfig, value, selectionElement);
          },
          renderProductListSelection: () => {
            this.renderProductListSelection(fieldConfig, value, selectionElement);
          },
          renderImageGallerySelection: () => {
            this.renderImageGallerySelection(fieldConfig, value, selectionElement);
          },
          renderQuizSelection: () => {
            this.renderQuizSelection(fieldConfig, value, selectionElement);
          },
          renderChoiceListSelection: () => {
            this.renderChoiceListSelection(fieldConfig, value, selectionElement);
          },
          getProductCartItems: () => this.getProductCartItems(value),
          getImageGallerySelectionItems: () => this.getImageGallerySelectionItems(value),
          getQuizSelectionItems: () => this.getQuizSelectionItems(value),
          isHybridMode: this.getBaseRenderMode() === "hybrid",
          renderHybridView: () => {
            if (!inputElement) {
              return;
            }
            this.renderViewField(
              fieldConfig,
              value,
              inputElement,
              undefined,
              this.form?.getState().values || {},
            );
            this.emitOutputSnapshot(this.form?.getState().values || {});
          },
        });

        // show/hide errors
        if (errorElement && inputElement) {
          this.renderFieldErrorState(
            name,
            inputElement as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
            errorElement,
            touched,
            error,
          );
        }
      },
      {
        value: true,
        error: true,
        touched: true,
      }
    )
  }
}

if (typeof window !== "undefined" && !window.customElements.get('form-ui')) {
  window.customElements.define('form-ui', FormUI);
}
