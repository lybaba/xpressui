import { createForm, FormApi } from "final-form";
import TFormConfig, {
  TFormValidationErrorsHook,
  TFormValidationHook,
  TFormSubmitLifecycleHook,
  TFormSubmitLifecycleStage,
  TFormSubmitRequest,
} from "./common/TFormConfig";
import { TValidator } from "./common/Validator";
import getFormConfig, { getErrorClass, getFieldConfig } from "./dom-utils";
import TFieldConfig from "./common/TFieldConfig";
import { FormEngineRuntime } from "./common/form-engine";
import {
  APPROVAL_STATE_TYPE,
  CAMERA_PHOTO_TYPE,
  HTML_TYPE,
  IMAGE_TYPE,
  DOCUMENT_SCAN_TYPE,
  isFileFieldType,
  isFileLikeValue,
  LINK_TYPE,
  MEDIA_TYPE,
  OUTPUT_TYPE,
  IMAGE_GALLERY_TYPE,
  PRODUCT_LIST_TYPE,
  QR_SCAN_TYPE,
  RICH_EDITOR_TYPE,
  SETTING_TYPE,
  TEXTAREA_TYPE,
  TEXT_TYPE,
  UPLOAD_FILE_TYPE,
  UPLOAD_IMAGE_TYPE,
  URL_TYPE,
  UNKNOWN_TYPE,
} from "./common/field";
import { FormDynamicRuntime } from "./common/form-dynamic";
import type { TFormActiveTemplateWarning } from "./common/form-dynamic";
import {
  FormPersistenceRuntime,
  TFormQueueState,
  TResumeLookupResult,
  TResumeTokenInfo,
  TFormStorageHealth,
  TFormStorageSnapshot,
} from "./common/form-persistence";
import { getRestorableStorageValues } from "./common/form-storage";
import { FormStepRuntime } from "./common/form-steps";
import { FormRuntime } from "./common/form-runtime";
import { FormUploadRuntime, TFormUploadState } from "./common/form-upload";
import { validatePublicFormConfig } from "./common/public-schema";
import {
  getProviderErrorEventName,
  getProviderSuccessEventName,
  normalizeProviderResult,
  registerProvider,
} from "./common/provider-registry";
import type { TFormProviderTransition, TNormalizedProviderResult } from "./common/provider-registry";
export {
  createFormConfig,
  createTemplateMarkup,
  mountFormUI,
} from "./common/form-builder";
export { createFormPreset, fieldFactory, stepFactory } from "./common/form-presets";
export { createLocalFormAdmin } from "./common/form-admin";
export { attachFormDebugObserver } from "./common/form-debug";
export { createFormDebugPanel } from "./common/form-debug-panel";
export { FormEngineRuntime } from "./common/form-engine";
export { FormDynamicRuntime } from "./common/form-dynamic";
export { FormPersistenceRuntime } from "./common/form-persistence";
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
  createSubmitRequestFromProvider,
  getProviderDefinition,
  getProviderErrorEventName,
  getProviderSuccessEventName,
  normalizeProviderResult,
  resolveProviderTransition,
  registerProvider,
  validateProviderRequest,
} from "./common/provider-registry";
export type { TLocalFormAdmin, TLocalQueueQuery } from "./common/form-admin";
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
export type { TFormActiveTemplateWarning } from "./common/form-dynamic";
export type { TFormUploadState } from "./common/form-upload";
export type { TFormStepProgress, TFormWorkflowSnapshot } from "./common/form-steps";
export type {
  TFormQueueState,
  TResumeLookupResult,
  TRemoteResumeCreateRequest,
  TRemoteResumeCreateResponse,
  TRemoteResumeInvalidateResponse,
  TRemoteResumeLookupResponse,
  TRemoteResumeOperation,
  TResumeTokenInfo,
  TFormStorageHealth,
  TFormStorageSnapshot,
} from "./common/form-persistence";
export type { TCreateFormPresetOptions, TFormPresetName } from "./common/form-presets";
export type {
  TFormProviderConfigSchema,
  TFormProviderTransition,
  TNormalizedProviderResult,
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
export type { TStoredDocumentData } from "./common/form-engine";
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

export type TFormUISubmitDetail = {
  values: Record<string, any>;
  formConfig: TFormConfig | null;
  submit?: TFormSubmitRequest;
  response?: Response;
  result?: any;
  providerResult?: TNormalizedProviderResult;
  error?: unknown;
};

export type TFormApprovalState = {
  status: string;
  approvalId?: string;
  result?: any;
  providerResult?: TNormalizedProviderResult;
};

export type TFormWorkflowState =
  | "draft"
  | "submitting"
  | "submitted"
  | "pending_approval"
  | "approved"
  | "completed"
  | "rejected"
  | "error";

type TWorkflowRouteResult = {
  routed: boolean;
  stepIndex: number;
  stepName: string | null;
};

type TProviderTransitionRouteResult = {
  routed: boolean;
  stepIndex: number;
  stepName: string | null;
};

type TFormRenderMode = "form" | "view" | "hybrid";
type TFormOutputRendererContext = {
  fieldConfig: TFieldConfig;
  value: any;
  mode: TFormRenderMode;
  unsafeHtml: boolean;
  mediaDisplayPolicy: TMediaDisplayPolicy;
};
type TFormOutputRenderer = (context: TFormOutputRendererContext) => HTMLElement;
type TOutputRendererType =
  | "text"
  | "html"
  | "image"
  | "file"
  | "video"
  | "audio"
  | "map"
  | "link"
  | "document";
type TFieldOutputRendererOverride = string | TFormOutputRenderer;
type TMediaDisplayPolicy = "thumbnail" | "large" | "link" | "gallery" | "embed";
type TFormHtmlSanitizer = (
  html: string,
  context: {
    fieldConfig: TFieldConfig;
    mode: TFormRenderMode;
  },
) => string;

type TBarcodeDetectorResult = {
  rawValue?: string;
};

type TQrScannerState = {
  status: "idle" | "starting" | "live" | "error";
  message?: string;
};

type TDocumentMrzResult = {
  format: "TD1" | "TD2" | "TD3";
  lines: string[];
  documentCode: string;
  issuingCountry: string;
  documentNumber?: string;
  nationality?: string;
  birthDate?: string;
  expiryDate?: string;
  sex?: string;
  surnames?: string[];
  givenNames?: string[];
  checksums?: {
    documentNumber?: boolean;
    birthDate?: boolean;
    expiryDate?: boolean;
    composite?: boolean;
  };
  valid?: boolean;
};

type TDocumentPerspectiveCorners = {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
};

type TDocumentScanInsight = {
  textBySlot: Array<string | null>;
  mrzBySlot: Array<TDocumentMrzResult | null>;
};

type TProductListItem = {
  id: string;
  name: string;
  sale_price: number | null;
  discount_price: number | null;
  image_thumbnail: string;
  image_medium: string;
  photos_full: string[];
};

type TProductCartItem = TProductListItem & {
  quantity: number;
};

type TImageGalleryItem = {
  id: string;
  name: string;
  image_thumbnail: string;
  image_medium: string;
  photos_full: string[];
};

function hasFileValues(value: any): boolean {
  if (isFileLikeValue(value)) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => hasFileValues(entry));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((entry) => hasFileValues(entry));
  }

  return false;
}

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
  stepControlContainer: HTMLElement | null;
  stepProgressElement: HTMLElement | null;
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
    this.stepControlContainer = null;
    this.stepProgressElement = null;
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
    this.outputRenderers = this.createDefaultOutputRenderers();
    this.fieldOutputRenderers = {};
    this.fieldMediaPolicies = {};
    this.htmlSanitizer = this.defaultHtmlSanitizer;
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
        (this.steps.getStepNames().length > 1 ? this.steps.getCurrentStepIndex() : null),
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
    if (value === undefined || value === null) {
      return value;
    }

    if (Array.isArray(value)) {
      return value
        .map((entry) => this.normalizeViewValue(entry))
        .filter((entry) => entry !== undefined && entry !== null && entry !== "");
    }

    if (isFileLikeValue(value)) {
      return value;
    }

    if (typeof value === "object") {
      const mediaValue =
        value.url
        || value.href
        || value.src
        || value.path
        || value.value
        || value.fileName
        || value.name;
      return mediaValue !== undefined ? mediaValue : value;
    }

    return value;
  }

  getDisplayText = (value: any): string => {
    if (value === undefined || value === null) {
      return "";
    }

    if (Array.isArray(value)) {
      return value
        .map((entry) => this.getDisplayText(entry))
        .filter(Boolean)
        .join(", ");
    }

    if (isFileLikeValue(value)) {
      return value.name || "";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }

  getFileMeta = (value: any): { href: string; label: string } | null => {
    const normalized = this.normalizeViewValue(value);
    if (isFileLikeValue(value)) {
      return {
        href: "",
        label: value.name || "file",
      };
    }

    const source = Array.isArray(normalized) ? normalized[0] : normalized;
    if (typeof source !== "string" || !source) {
      return null;
    }

    const fileNameCandidate = source.split("?")[0].split("/").pop();
    return {
      href: source,
      label: fileNameCandidate || source,
    };
  }

  getFileMetas = (value: any): Array<{ href: string; label: string }> => {
    if (Array.isArray(value)) {
      return value
        .map((entry) => this.getFileMeta(entry))
        .filter((entry): entry is { href: string; label: string } => Boolean(entry));
    }

    const meta = this.getFileMeta(value);
    return meta ? [meta] : [];
  }

  getMediaSources = (value: any): string[] => {
    const normalized = this.normalizeViewValue(value);
    const entries = Array.isArray(normalized) ? normalized : [normalized];
    return entries.filter((entry): entry is string => typeof entry === "string" && Boolean(entry));
  }

  isEmbeddableDocumentSource = (source: string): boolean => {
    if (!source) {
      return false;
    }

    if (source.startsWith("blob:") || source.startsWith("data:application/pdf")) {
      return true;
    }

    const lowerSource = source.toLowerCase();
    if (lowerSource.includes(".pdf")) {
      return true;
    }

    try {
      const parsed = new URL(source);
      const pathname = parsed.pathname.toLowerCase();
      return pathname.endsWith(".pdf");
    } catch {
      return false;
    }
  }

  getMapSources = (value: any): string[] => {
    const fromEntry = (entry: any): string[] => {
      if (entry === undefined || entry === null) {
        return [];
      }

      if (typeof entry === "string") {
        return entry ? [entry] : [];
      }

      if (Array.isArray(entry)) {
        return entry.flatMap((item) => fromEntry(item));
      }

      if (typeof entry === "object") {
        const latitude = Number((entry as any).lat ?? (entry as any).latitude);
        const longitude = Number((entry as any).lng ?? (entry as any).lon ?? (entry as any).longitude);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          return [`https://www.google.com/maps?q=${latitude},${longitude}&output=embed`];
        }

        const url =
          (entry as any).url
          || (entry as any).href
          || (entry as any).src
          || (entry as any).value
          || "";
        return typeof url === "string" && url ? [url] : [];
      }

      return [];
    };

    return fromEntry(value);
  }

  isSafeMapEmbedSource = (source: string): boolean => {
    try {
      const parsed = new URL(source);
      if (parsed.protocol !== "https:") {
        return false;
      }

      const allowedHosts = new Set([
        "www.google.com",
        "maps.google.com",
        "google.com",
        "www.openstreetmap.org",
        "openstreetmap.org",
        "www.bing.com",
        "bing.com",
      ]);
      return allowedHosts.has(parsed.hostname.toLowerCase());
    } catch {
      return false;
    }
  }

  resolveMediaDisplayPolicy = (
    fieldConfig: TFieldConfig,
    inputElement: HTMLElement | null,
    rendererType?: string,
  ): TMediaDisplayPolicy => {
    const runtimePolicy = this.fieldMediaPolicies[fieldConfig.name];
    if (runtimePolicy) {
      return runtimePolicy;
    }

    const attributePolicy =
      inputElement?.getAttribute("data-view-media-display")
      || inputElement?.getAttribute("data-view-resource-display");
    if (
      attributePolicy === "thumbnail"
      || attributePolicy === "large"
      || attributePolicy === "link"
      || attributePolicy === "gallery"
      || attributePolicy === "embed"
    ) {
      return attributePolicy;
    }

    if (rendererType === "file" || rendererType === "link") {
      return "link";
    }
    if (rendererType === "document") {
      return "embed";
    }

    return "large";
  }

  createDefaultOutputRenderers = (): Record<TOutputRendererType, TFormOutputRenderer> => {
    const textRenderer: TFormOutputRenderer = ({ value }) => {
      const element = document.createElement("span");
      element.textContent = this.getDisplayText(value);
      return element;
    };

    const htmlRenderer: TFormOutputRenderer = ({ value, fieldConfig, mode, unsafeHtml }) => {
      const element = document.createElement("div");
      const htmlContent = this.getDisplayText(value);
      element.innerHTML = unsafeHtml
        ? htmlContent
        : this.htmlSanitizer(htmlContent, {
          fieldConfig,
          mode,
        });
      return element;
    };

    const imageRenderer: TFormOutputRenderer = ({ value, fieldConfig, mediaDisplayPolicy }) => {
      const element = document.createElement("div");
      const sources = fieldConfig.type === IMAGE_GALLERY_TYPE
        ? (Array.isArray(value) ? value : [])
          .filter((entry) => entry && typeof entry === "object")
          .map((entry) =>
            String(
              (entry as any).image_medium
              || (entry as any).image_thumbnail
              || "",
            ),
          )
          .filter(Boolean)
        : this.getMediaSources(value);
      if (!sources.length) {
        return element;
      }

      if (mediaDisplayPolicy === "link") {
        sources.forEach((source) => {
          const link = document.createElement("a");
          link.href = source;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.textContent = source;
          link.style.display = "block";
          element.appendChild(link);
        });
        return element;
      }

      const renderImage = (source: string) => {
        const image = document.createElement("img");
        image.src = source;
        image.alt = fieldConfig.label || fieldConfig.name || "image";
        image.style.height = "auto";
        image.style.display = "block";
        image.style.maxWidth = mediaDisplayPolicy === "thumbnail" ? "160px" : "100%";
        image.style.objectFit = mediaDisplayPolicy === "thumbnail" ? "cover" : "contain";
        return image;
      };

      if (mediaDisplayPolicy === "gallery") {
        const gallery = document.createElement("div");
        gallery.setAttribute("data-media-gallery", "true");
        gallery.style.display = "grid";
        gallery.style.gridTemplateColumns = "repeat(auto-fill, minmax(120px, 1fr))";
        gallery.style.gap = "8px";
        sources.forEach((source) => {
          gallery.appendChild(renderImage(source));
        });
        element.appendChild(gallery);
        return element;
      }

      element.appendChild(renderImage(sources[0]));
      return element;
    };

    const linkRenderer: TFormOutputRenderer = ({ value }) => {
      const element = document.createElement("div");
      const normalized = this.normalizeViewValue(value);
      const href = Array.isArray(normalized) ? normalized[0] : normalized;
      if (typeof href !== "string" || !href) {
        return element;
      }

      const link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = href;
      element.appendChild(link);
      return element;
    };

    const fileRenderer: TFormOutputRenderer = ({ value, mediaDisplayPolicy }) => {
      const element = document.createElement("div");
      const fileMetas = this.getFileMetas(value);
      if (!fileMetas.length) {
        return element;
      }

      const shouldRenderAll = mediaDisplayPolicy === "gallery";
      const items = shouldRenderAll ? fileMetas : [fileMetas[0]];
      items.forEach((fileMeta) => {
        if (!fileMeta.href) {
          const text = document.createElement("span");
          text.textContent = fileMeta.label;
          text.style.display = "block";
          element.appendChild(text);
          return;
        }

        const link = document.createElement("a");
        link.href = fileMeta.href;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.download = "";
        link.textContent = fileMeta.label;
        link.style.display = "block";
        element.appendChild(link);
      });
      return element;
    };

    const documentRenderer: TFormOutputRenderer = ({ value, mediaDisplayPolicy }) => {
      const element = document.createElement("div");
      const sources = this.getMediaSources(value);
      if (!sources.length) {
        return element;
      }

      if (mediaDisplayPolicy === "link") {
        sources.forEach((source) => {
          const link = document.createElement("a");
          link.href = source;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.textContent = source;
          link.style.display = "block";
          element.appendChild(link);
        });
        return element;
      }

      const renderEmbed = (source: string) => {
        if (!this.isEmbeddableDocumentSource(source)) {
          const link = document.createElement("a");
          link.href = source;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.textContent = source;
          link.style.display = "block";
          return link;
        }

        const frame = document.createElement("iframe");
        frame.src = source;
        frame.loading = "lazy";
        frame.style.width = "100%";
        frame.style.border = "1px solid rgba(15, 23, 42, 0.12)";
        frame.style.borderRadius = "10px";
        frame.style.background = "#ffffff";
        frame.style.height =
          mediaDisplayPolicy === "thumbnail"
            ? "220px"
            : mediaDisplayPolicy === "large"
              ? "520px"
              : "420px";
        frame.setAttribute("title", "Document preview");
        return frame;
      };

      if (mediaDisplayPolicy === "gallery") {
        const gallery = document.createElement("div");
        gallery.setAttribute("data-media-gallery", "true");
        gallery.style.display = "grid";
        gallery.style.gap = "10px";
        sources.forEach((source) => {
          gallery.appendChild(renderEmbed(source));
        });
        element.appendChild(gallery);
        return element;
      }

      element.appendChild(renderEmbed(sources[0]));
      return element;
    };

    const videoRenderer: TFormOutputRenderer = ({ value, mediaDisplayPolicy }) => {
      const element = document.createElement("div");
      const sources = this.getMediaSources(value);
      if (!sources.length) {
        return element;
      }

      if (mediaDisplayPolicy === "link") {
        sources.forEach((source) => {
          const link = document.createElement("a");
          link.href = source;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.textContent = source;
          link.style.display = "block";
          element.appendChild(link);
        });
        return element;
      }

      const renderVideo = (source: string) => {
        const video = document.createElement("video");
        video.controls = true;
        video.preload = "metadata";
        video.style.maxWidth = mediaDisplayPolicy === "thumbnail" ? "220px" : "100%";
        video.src = source;
        return video;
      };

      if (mediaDisplayPolicy === "gallery") {
        const list = document.createElement("div");
        list.setAttribute("data-media-gallery", "true");
        list.style.display = "grid";
        list.style.gap = "8px";
        sources.forEach((source) => {
          list.appendChild(renderVideo(source));
        });
        element.appendChild(list);
        return element;
      }

      element.appendChild(renderVideo(sources[0]));
      return element;
    };

    const audioRenderer: TFormOutputRenderer = ({ value, mediaDisplayPolicy }) => {
      const element = document.createElement("div");
      const sources = this.getMediaSources(value);
      if (!sources.length) {
        return element;
      }

      if (mediaDisplayPolicy === "link") {
        sources.forEach((source) => {
          const link = document.createElement("a");
          link.href = source;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.textContent = source;
          link.style.display = "block";
          element.appendChild(link);
        });
        return element;
      }

      const renderAudio = (source: string) => {
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.preload = "metadata";
        audio.src = source;
        audio.style.width = mediaDisplayPolicy === "thumbnail" ? "220px" : "100%";
        return audio;
      };

      if (mediaDisplayPolicy === "gallery") {
        const list = document.createElement("div");
        list.setAttribute("data-media-gallery", "true");
        list.style.display = "grid";
        list.style.gap = "8px";
        sources.forEach((source) => {
          list.appendChild(renderAudio(source));
        });
        element.appendChild(list);
        return element;
      }

      element.appendChild(renderAudio(sources[0]));
      return element;
    };

    const mapRenderer: TFormOutputRenderer = ({ value, mediaDisplayPolicy }) => {
      const element = document.createElement("div");
      const sources = this.getMapSources(value);
      if (!sources.length) {
        return element;
      }

      if (mediaDisplayPolicy === "link") {
        sources.forEach((source) => {
          const link = document.createElement("a");
          link.href = source;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.textContent = source;
          link.style.display = "block";
          element.appendChild(link);
        });
        return element;
      }

      const embedSource = sources.find((source) => this.isSafeMapEmbedSource(source));
      if (!embedSource) {
        const fallback = document.createElement("a");
        fallback.href = sources[0];
        fallback.target = "_blank";
        fallback.rel = "noreferrer";
        fallback.textContent = sources[0];
        element.appendChild(fallback);
        return element;
      }

      const frame = document.createElement("iframe");
      frame.src = embedSource;
      frame.loading = "lazy";
      frame.referrerPolicy = "no-referrer-when-downgrade";
      frame.style.width = "100%";
      frame.style.height = mediaDisplayPolicy === "thumbnail" ? "200px" : "320px";
      frame.style.border = "0";
      frame.setAttribute("title", "Map preview");
      frame.setAttribute("allowfullscreen", "");
      element.appendChild(frame);
      return element;
    };

    return {
      text: textRenderer,
      html: htmlRenderer,
      image: imageRenderer,
      file: fileRenderer,
      video: videoRenderer,
      audio: audioRenderer,
      map: mapRenderer,
      link: linkRenderer,
      document: documentRenderer,
    };
  }

  getRenderMode = (): TFormRenderMode => {
    const mode = (this.getAttribute("mode") || "").trim().toLowerCase();
    if (mode === "view" || mode === "hybrid") {
      return mode;
    }

    return "form";
  }

  setViewValues = (values: Record<string, any>) => {
    this.viewValues = values && typeof values === "object" ? { ...values } : {};
    if (this.initialized && this.getRenderMode() === "view") {
      const formElement = this.querySelector("form") as HTMLFormElement | null;
      if (formElement) {
        this.applyViewMode(formElement);
      }
    }

    if (this.initialized && this.getRenderMode() === "hybrid" && this.form) {
      Object.entries(this.viewValues).forEach(([fieldName, fieldValue]) => {
        this.form?.change(fieldName, fieldValue);
      });
    }
  }

  getViewValues = (): Record<string, any> => {
    return { ...this.viewValues };
  }

  defaultHtmlSanitizer: TFormHtmlSanitizer = (html: string) => {
    if (typeof document === "undefined") {
      return html
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
        .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "");
    }

    const template = document.createElement("template");
    template.innerHTML = html;

    const blockedTags = [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "link",
      "meta",
      "base",
    ];
    template.content
      .querySelectorAll(blockedTags.join(","))
      .forEach((node) => node.remove());

    template.content.querySelectorAll("*").forEach((element) => {
      Array.from(element.attributes).forEach((attribute) => {
        const attributeName = attribute.name.toLowerCase();
        const attributeValue = String(attribute.value || "").trim().toLowerCase();
        if (attributeName.startsWith("on")) {
          element.removeAttribute(attribute.name);
          return;
        }

        if (attributeName === "srcdoc") {
          element.removeAttribute(attribute.name);
          return;
        }

        if (
          (attributeName === "href" || attributeName === "src" || attributeName === "xlink:href")
          && attributeValue.startsWith("javascript:")
        ) {
          element.removeAttribute(attribute.name);
        }
      });
    });

    return template.innerHTML;
  }

  escapeHtml = (value: string): string => {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  readTemplateTokenValue = (values: Record<string, any>, tokenPath: string): any => {
    const path = String(tokenPath || "").trim();
    if (!path) {
      return "";
    }

    if (Object.prototype.hasOwnProperty.call(values, path)) {
      return values[path];
    }

    const segments = path.split(".");
    let cursor: any = values;
    for (const segment of segments) {
      if (!cursor || typeof cursor !== "object" || !(segment in cursor)) {
        return "";
      }
      cursor = cursor[segment];
    }

    return cursor;
  }

  renderViewTemplate = (
    template: string,
    values: Record<string, any>,
    escapeValues: boolean,
  ): string => {
    return String(template).replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, token: string) => {
      const value = this.readTemplateTokenValue(values, token);
      const textValue = this.getDisplayText(value);
      return escapeValues ? this.escapeHtml(textValue) : textValue;
    });
  }

  resolveViewTemplateValue = (
    fieldConfig: TFieldConfig,
    inputElement: HTMLElement,
    rendererType: string,
    value: any,
    valuesContext?: Record<string, any>,
  ): any => {
    if (rendererType !== "html") {
      return value;
    }

    const template = inputElement.getAttribute("data-view-template") || fieldConfig.viewTemplate;
    if (!template) {
      return value;
    }

    const rawUnsafe =
      inputElement.getAttribute("data-view-template-unsafe")
      ?? (fieldConfig.viewTemplateUnsafe ? "true" : "false");
    const templateUnsafe = rawUnsafe === "true";
    const tokenValues = {
      ...(valuesContext || {}),
      value,
    };
    return this.renderViewTemplate(template, tokenValues, !templateUnsafe);
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
    if (this.allowUnsafeHtml) {
      return true;
    }

    const unsafeGlobalAttr = this.getAttribute("allow-unsafe-html") || this.getAttribute("data-allow-unsafe-html");
    if (unsafeGlobalAttr === "true") {
      return true;
    }

    if (!inputElement) {
      return false;
    }

    const unsafeFieldAttr = inputElement.getAttribute("data-view-html-unsafe");
    return unsafeFieldAttr === "true";
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
    const fieldOverride = this.fieldOutputRenderers[fieldConfig.name];
    if (typeof fieldOverride === "function") {
      return {
        rendererType: "custom",
        renderer: fieldOverride,
      };
    }

    if (typeof fieldOverride === "string" && this.outputRenderers[fieldOverride]) {
      return {
        rendererType: fieldOverride,
        renderer: this.outputRenderers[fieldOverride],
      };
    }

    const rendererOverride = inputElement.getAttribute("data-view-renderer");
    if (rendererOverride && this.outputRenderers[rendererOverride]) {
      return {
        rendererType: rendererOverride,
        renderer: this.outputRenderers[rendererOverride],
      };
    }

    const defaultRendererType = this.getOutputRendererType(fieldConfig);
    return {
      rendererType: defaultRendererType,
      renderer: this.outputRenderers[defaultRendererType] || this.outputRenderers.text,
    };
  }

  getOutputSnapshot = (values?: Record<string, any>) => {
    const formElem = this.querySelector("form") as HTMLFormElement | null;
    if (!formElem) {
      return {};
    }

    const mode = this.getRenderMode();
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

    const mode = this.getRenderMode();
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
    const rawAttribute = this.getAttribute("view-values") || this.getAttribute("data-view-values");
    if (!rawAttribute) {
      return {};
    }

    try {
      const parsed = JSON.parse(rawAttribute);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  collectDomFieldValues = (formElem: HTMLFormElement): Record<string, any> => {
    const domValues: Record<string, any> = {};
    Array.from(formElem.elements).forEach((node) => {
      const fieldConfig = getFieldConfig(node);
      if (!fieldConfig?.name || fieldConfig.type === UNKNOWN_TYPE) {
        return;
      }

      if (node instanceof HTMLInputElement) {
        if (node.type === "checkbox") {
          domValues[fieldConfig.name] = node.checked;
        } else if (node.type === "radio") {
          if (node.checked) {
            domValues[fieldConfig.name] = node.value;
          }
        } else {
          domValues[fieldConfig.name] = node.value;
        }
        return;
      }

      if (node instanceof HTMLSelectElement) {
        domValues[fieldConfig.name] = node.multiple
          ? Array.from(node.selectedOptions).map((option) => option.value)
          : node.value;
        return;
      }

      if (node instanceof HTMLTextAreaElement) {
        domValues[fieldConfig.name] = node.value;
      }
    });
    return domValues;
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
    const subType = String(fieldConfig.subType || fieldConfig.refType || "").toLowerCase();
    const accept = String(fieldConfig.accept || "").toLowerCase();

    if (fieldConfig.type === OUTPUT_TYPE || fieldConfig.type === MEDIA_TYPE) {
      if (subType.includes("html")) {
        return "html";
      }
      if (subType.includes("image")) {
        return "image";
      }
      if (subType.includes("video")) {
        return "video";
      }
      if (subType.includes("audio")) {
        return "audio";
      }
      if (subType.includes("map")) {
        return "map";
      }
      if (
        subType.includes("document")
        || subType.includes("pdf")
        || subType.includes("viewer")
        || subType.includes("embed")
      ) {
        return "document";
      }
      if (subType.includes("file") || subType.includes("document")) {
        return "file";
      }
      if (subType.includes("link") || subType.includes("url")) {
        return "link";
      }
    }

    if (fieldConfig.type === HTML_TYPE || fieldConfig.type === RICH_EDITOR_TYPE) {
      return "html";
    }

    if (
      fieldConfig.type === IMAGE_TYPE ||
      fieldConfig.type === UPLOAD_IMAGE_TYPE ||
      fieldConfig.type === CAMERA_PHOTO_TYPE
    ) {
      return "image";
    }

    if (fieldConfig.type === UPLOAD_FILE_TYPE || fieldConfig.type === DOCUMENT_SCAN_TYPE) {
      if (accept.includes("video/")) {
        return "video";
      }
      if (accept.includes("audio/")) {
        return "audio";
      }
      if (accept.includes("application/pdf")) {
        return "document";
      }
      return "file";
    }

    if (fieldConfig.type === LINK_TYPE || fieldConfig.type === URL_TYPE) {
      if (subType.includes("map")) {
        return "map";
      }
      return "link";
    }

    if (fieldConfig.type === PRODUCT_LIST_TYPE) {
      return "text";
    }

    if (fieldConfig.type === IMAGE_GALLERY_TYPE) {
      return "image";
    }

    if (fieldConfig.type === SETTING_TYPE) {
      return "text";
    }

    if (fieldConfig.type === "video" || accept.includes("video/")) {
      return "video";
    }

    if (fieldConfig.type === "audio" || accept.includes("audio/")) {
      return "audio";
    }

    if (fieldConfig.type === TEXT_TYPE || fieldConfig.type === TEXTAREA_TYPE) {
      return "text";
    }

    return "text";
  }

  isFieldViewMode = (fieldConfig: TFieldConfig, inputElement: HTMLElement | null): boolean => {
    const configMode = String((fieldConfig as any).viewMode || "").toLowerCase();
    const attrMode = String(
      inputElement?.getAttribute("data-field-render-mode")
      || inputElement?.getAttribute("data-view-mode")
      || "",
    ).toLowerCase();
    return configMode === "view" || attrMode === "view";
  }

  readInputElementValue = (
    fieldConfig: TFieldConfig,
    inputElement: HTMLElement | null,
  ): any => {
    if (!inputElement) {
      return undefined;
    }

    if (inputElement instanceof HTMLInputElement) {
      if (inputElement.type === "checkbox") {
        return inputElement.checked;
      }

      if (
        inputElement.type === "hidden"
        && (this.isProductListField(fieldConfig) || this.isImageGalleryField(fieldConfig))
      ) {
        if (!inputElement.value) {
          return [];
        }
        try {
          const parsed = JSON.parse(inputElement.value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }

      return inputElement.value;
    }

    if (inputElement instanceof HTMLSelectElement) {
      return inputElement.multiple
        ? Array.from(inputElement.selectedOptions).map((option) => option.value)
        : inputElement.value;
    }

    if (inputElement instanceof HTMLTextAreaElement) {
      return inputElement.value;
    }

    return undefined;
  }

  resolveFieldViewValue = (
    fieldConfig: TFieldConfig,
    inputElement: HTMLElement | null,
    stateValue: any,
  ): any => {
    if (stateValue !== undefined) {
      return stateValue;
    }

    const overrideValues = {
      ...this.readViewValuesAttribute(),
      ...this.viewValues,
    };
    if (Object.prototype.hasOwnProperty.call(overrideValues, fieldConfig.name)) {
      return overrideValues[fieldConfig.name];
    }

    const attrViewValue = inputElement?.getAttribute("data-view-value");
    if (attrViewValue) {
      try {
        return JSON.parse(attrViewValue);
      } catch {
        return attrViewValue;
      }
    }

    const inputValue = this.readInputElementValue(fieldConfig, inputElement);
    if (inputValue !== undefined && inputValue !== "") {
      return inputValue;
    }

    if ((fieldConfig as any).value !== undefined) {
      return (fieldConfig as any).value;
    }

    if (fieldConfig.defaultValue !== undefined) {
      return fieldConfig.defaultValue;
    }

    return "";
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

  getFileValueList = (value: any) => {
    return Array.isArray(value)
      ? value
      : value && typeof value === "object"
        ? [value]
        : [];
  }

  isQrScanField = (fieldConfig: TFieldConfig) => {
    return fieldConfig.type === QR_SCAN_TYPE;
  }

  isDocumentScanField = (fieldConfig: TFieldConfig) => {
    return fieldConfig.type === DOCUMENT_SCAN_TYPE;
  }

  getDocumentScanSlotCount = (fieldConfig: TFieldConfig) => {
    return fieldConfig.documentScanMode === "single" ? 1 : 2;
  }

  getDocumentScanInsight = (fieldConfig: TFieldConfig): TDocumentScanInsight => {
    const slotCount = this.getDocumentScanSlotCount(fieldConfig);
    if (!this.documentScanInsights[fieldConfig.name]) {
      this.documentScanInsights[fieldConfig.name] = {
        textBySlot: Array.from({ length: slotCount }, () => null),
        mrzBySlot: Array.from({ length: slotCount }, () => null),
      };
    }

    return this.documentScanInsights[fieldConfig.name];
  }

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
          },
        });
      }

      this.engine.setDocumentData(fieldConfig.name, {
        text: detectedText,
        mrz,
        fields: normalizedFields,
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
    const source = Array.isArray(fieldConfig.choices) ? fieldConfig.choices : [];
    return source
      .slice(0, 20)
      .map((choice, index) => {
        const id = String((choice as any).value || (choice as any).id || `product_${index + 1}`);
        const name = String((choice as any).name || (choice as any).label || id);
        const salePriceRaw = (choice as any).sale_price ?? (choice as any).salePrice;
        const discountPriceRaw = (choice as any).discount_price ?? (choice as any).discountPrice;
        const sale_price = salePriceRaw === undefined || salePriceRaw === null
          ? null
          : Number(salePriceRaw);
        const discount_price = discountPriceRaw === undefined || discountPriceRaw === null
          ? null
          : Number(discountPriceRaw);
        const image_thumbnail = String(
          (choice as any).image_thumbnail
          || (choice as any).imageThumbnail
          || "",
        );
        const image_medium = String(
          (choice as any).image_medium
          || (choice as any).imageMedium
          || image_thumbnail,
        );
        const photosSource = (choice as any).photos_full ?? (choice as any).photosFull;
        const photos_full = Array.isArray(photosSource)
          ? photosSource.map((entry: any) => String(entry)).filter(Boolean)
          : [];

        return {
          id,
          name,
          sale_price: Number.isFinite(sale_price as number) ? sale_price : null,
          discount_price: Number.isFinite(discount_price as number) ? discount_price : null,
          image_thumbnail,
          image_medium,
          photos_full,
        };
      });
  }

  getImageGalleryCatalog = (fieldConfig: TFieldConfig): TImageGalleryItem[] => {
    const source = Array.isArray(fieldConfig.choices) ? fieldConfig.choices : [];
    return source
      .slice(0, 20)
      .map((choice, index) => {
        const id = String((choice as any).value || (choice as any).id || `image_${index + 1}`);
        const name = String((choice as any).name || (choice as any).label || id);
        const image_thumbnail = String(
          (choice as any).image_thumbnail
          || (choice as any).imageThumbnail
          || "",
        );
        const image_medium = String(
          (choice as any).image_medium
          || (choice as any).imageMedium
          || image_thumbnail,
        );
        const photosSource = (choice as any).photos_full ?? (choice as any).photosFull;
        const photos_full = Array.isArray(photosSource)
          ? photosSource.map((entry: any) => String(entry)).filter(Boolean)
          : [];

        return {
          id,
          name,
          image_thumbnail,
          image_medium,
          photos_full,
        };
      });
  }

  getProductCartItems = (value: any): TProductCartItem[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => {
        const quantityRaw = Number((entry as any).quantity || 1);
        return {
          id: String((entry as any).id || (entry as any).value || ""),
          name: String((entry as any).name || (entry as any).label || ""),
          sale_price: (entry as any).sale_price === undefined || (entry as any).sale_price === null
            ? null
            : Number((entry as any).sale_price),
          discount_price: (entry as any).discount_price === undefined || (entry as any).discount_price === null
            ? null
            : Number((entry as any).discount_price),
          image_thumbnail: String((entry as any).image_thumbnail || ""),
          image_medium: String((entry as any).image_medium || ""),
          photos_full: Array.isArray((entry as any).photos_full)
            ? (entry as any).photos_full.map((photo: any) => String(photo)).filter(Boolean)
            : [],
          quantity: Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.round(quantityRaw) : 1,
        };
      })
      .filter((entry) => Boolean(entry.id));
  }

  getImageGallerySelectionItems = (value: any): TImageGalleryItem[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((entry) => entry && typeof entry === "object")
      .map((entry, index) => ({
        id: String((entry as any).id || (entry as any).value || `image_${index + 1}`),
        name: String((entry as any).name || (entry as any).label || (entry as any).id || ""),
        image_thumbnail: String((entry as any).image_thumbnail || ""),
        image_medium: String((entry as any).image_medium || ""),
        photos_full: Array.isArray((entry as any).photos_full)
          ? (entry as any).photos_full.map((photo: any) => String(photo)).filter(Boolean)
          : [],
      }))
      .filter((entry) => Boolean(entry.id));
  }

  getProductCartTotal = (cartItems: TProductCartItem[]): number => {
    return cartItems.reduce((sum, item) => {
      const unitPrice = item.discount_price ?? item.sale_price ?? 0;
      return sum + (Number.isFinite(unitPrice) ? unitPrice : 0) * item.quantity;
    }, 0);
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
    overlay.style.background = "rgba(15, 23, 42, 0.45)";
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
    panel.style.width = "min(420px, 92vw)";
    panel.style.height = "100%";
    panel.style.background = "#ffffff";
    panel.style.borderLeft = "1px solid rgba(15, 23, 42, 0.12)";
    panel.style.padding = "12px";
    panel.style.overflowY = "auto";
    panel.style.display = "flex";
    panel.style.flexDirection = "column";
    panel.style.gap = "8px";
    panel.style.transform = "translateX(100%)";
    panel.style.transition = "transform 180ms ease";

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
    const hasProductListField = Object.values(this.engine.getFields()).some((fieldConfig) =>
      this.isProductListField(fieldConfig),
    );
    const trigger = hasProductListField ? this.ensureProductCartTrigger() : null;
    const cart = this.ensureProductListGlobalCart();
    if (!cart || !trigger) {
      return;
    }

    const entries = this.getProductCartEntries();
    const totalItems = entries.reduce((sum, entry) => sum + entry.item.quantity, 0);
    const totalAmount = entries.reduce((sum, entry) => {
      const unit = entry.item.discount_price ?? entry.item.sale_price ?? 0;
      return sum + unit * entry.item.quantity;
    }, 0);
    trigger.innerHTML = "";
    if (cart.id) {
      trigger.setAttribute("aria-controls", cart.id);
    }
    const triggerIcon = document.createElement("span");
    triggerIcon.setAttribute("aria-hidden", "true");
    triggerIcon.textContent = "🛒";
    const triggerLabel = document.createElement("span");
    triggerLabel.className = "sr-only";
    triggerLabel.textContent = "Open cart";
    const triggerCount = document.createElement("span");
    triggerCount.setAttribute("data-product-cart-summary", "true");
    triggerCount.textContent = String(totalItems);
    triggerCount.style.position = "absolute";
    triggerCount.style.top = "-5px";
    triggerCount.style.right = "-5px";
    triggerCount.style.minWidth = "20px";
    triggerCount.style.height = "20px";
    triggerCount.style.borderRadius = "999px";
    triggerCount.style.display = "inline-flex";
    triggerCount.style.alignItems = "center";
    triggerCount.style.justifyContent = "center";
    triggerCount.style.fontSize = "11px";
    triggerCount.style.fontWeight = "700";
    triggerCount.style.background = "#0f172a";
    triggerCount.style.color = "#ffffff";
    const triggerTotal = document.createElement("span");
    triggerTotal.setAttribute("data-product-cart-total-badge", "true");
    triggerTotal.textContent = `${totalAmount.toFixed(2)}€`;
    triggerTotal.style.position = "absolute";
    triggerTotal.style.bottom = "-8px";
    triggerTotal.style.left = "50%";
    triggerTotal.style.transform = "translateX(-50%)";
    triggerTotal.style.padding = "2px 8px";
    triggerTotal.style.borderRadius = "999px";
    triggerTotal.style.fontSize = "10px";
    triggerTotal.style.fontWeight = "700";
    triggerTotal.style.background = "#ffffff";
    triggerTotal.style.color = "#0f172a";
    triggerTotal.style.border = "1px solid rgba(15, 23, 42, 0.2)";
    trigger.style.position = "fixed";
    trigger.appendChild(triggerIcon);
    trigger.appendChild(triggerLabel);
    trigger.appendChild(triggerCount);
    trigger.appendChild(triggerTotal);

    cart.innerHTML = "";
    const header = document.createElement("div");
    header.className = "flex items-center justify-between";
    const heading = document.createElement("div");
    heading.className = "flex items-center gap-2 text-sm font-semibold";
    const headingIcon = document.createElement("span");
    headingIcon.setAttribute("aria-hidden", "true");
    headingIcon.textContent = "🛒";
    const headingText = document.createElement("span");
    headingText.textContent = `${totalAmount.toFixed(2)}€`;
    heading.appendChild(headingIcon);
    heading.appendChild(headingText);
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "btn btn-sm btn-ghost";
    closeButton.textContent = "Close";
    closeButton.setAttribute("data-product-cart-close", "true");
    header.appendChild(heading);
    header.appendChild(closeButton);
    cart.appendChild(header);

    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "text-xs opacity-70";
      empty.textContent = "No product added yet.";
      cart.appendChild(empty);
      const totalBlock = document.createElement("div");
      totalBlock.className = "text-sm font-semibold";
      totalBlock.textContent = "Total: 0.00€";
      cart.appendChild(totalBlock);
      return;
    }

    const list = document.createElement("div");
    list.style.display = "grid";
    list.style.gap = "6px";
    list.style.maxHeight = "calc(100vh - 170px)";
    list.style.overflowY = "auto";
    entries.forEach(({ fieldName, item }) => {
      const row = document.createElement("div");
      row.className = "grid gap-2 rounded border border-base-300 px-2 py-2";
      row.setAttribute("data-product-cart-item", `${fieldName}:${item.id}`);

      const top = document.createElement("div");
      top.className = "flex items-center gap-2";
      if (item.image_thumbnail || item.image_medium) {
        const thumb = document.createElement("img");
        thumb.src = item.image_thumbnail || item.image_medium;
        thumb.alt = item.name;
        thumb.style.width = "52px";
        thumb.style.height = "52px";
        thumb.style.objectFit = "cover";
        thumb.style.borderRadius = "8px";
        thumb.style.flexShrink = "0";
        top.appendChild(thumb);
      }

      const details = document.createElement("div");
      details.className = "min-w-0 flex-1";
      const name = document.createElement("div");
      name.className = "text-sm font-medium";
      name.textContent = item.name;
      details.appendChild(name);

      const meta = document.createElement("div");
      meta.className = "text-xs opacity-70";
      const unitPrice = item.discount_price ?? item.sale_price ?? 0;
      meta.textContent = `Qty: ${item.quantity} · Unit: ${unitPrice.toFixed(2)}€`;
      details.appendChild(meta);
      const subtotal = document.createElement("div");
      subtotal.className = "text-xs font-semibold";
      subtotal.textContent = `Subtotal: ${(unitPrice * item.quantity).toFixed(2)}€`;
      details.appendChild(subtotal);
      top.appendChild(details);

      const controls = document.createElement("div");
      controls.className = "flex items-center gap-1";

      const createControl = (action: "inc" | "dec" | "remove", label: string, buttonClass: string) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = buttonClass;
        button.textContent = label;
        button.setAttribute("data-product-cart-action", action);
        button.setAttribute("data-product-field", fieldName);
        button.setAttribute("data-product-id", item.id);
        return button;
      };

      controls.appendChild(createControl("dec", "-", "btn btn-xs btn-outline"));
      controls.appendChild(createControl("inc", "+", "btn btn-xs btn-outline"));
      controls.appendChild(createControl("remove", "Remove", "btn btn-xs btn-ghost"));

      row.appendChild(top);
      row.appendChild(controls);
      list.appendChild(row);
    });
    cart.appendChild(list);

    const totalBlock = document.createElement("div");
    totalBlock.className = "text-sm font-semibold";
    totalBlock.textContent = `Total: ${totalAmount.toFixed(2)}€`;
    cart.appendChild(totalBlock);
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
    closeButton.className = "btn btn-sm btn-ghost";
    closeButton.textContent = "Close";
    closeButton.setAttribute("data-product-gallery-close", "true");
    closeButton.style.float = "right";
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
        mainImage.src = photo;
      });
      thumbs.appendChild(thumb);
    });
    modal.appendChild(thumbs);

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

    selectionElement.innerHTML = "";
    const products = this.getProductListCatalog(fieldConfig);
    const cartItems = this.getProductCartItems(value);
    const cartMap = cartItems.reduce((accumulator, item) => {
      accumulator[item.id] = item.quantity;
      return accumulator;
    }, {} as Record<string, number>);

    const productList = document.createElement("div");
    productList.setAttribute("data-product-list-catalog", fieldConfig.name);
    productList.style.display = "grid";
    productList.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
    productList.style.gap = "10px";
    productList.style.marginBottom = "14px";

    products.forEach((product) => {
      const card = document.createElement("div");
      card.setAttribute("data-product-open-gallery", product.id);
      card.setAttribute("data-product-card", product.id);
      card.className = "rounded border border-base-300 p-2";
      card.style.cursor = "pointer";

      const previewSource = product.image_thumbnail || product.image_medium;
      if (previewSource) {
        const thumb = document.createElement("img");
        thumb.src = previewSource;
        thumb.alt = product.name;
        thumb.style.width = "100%";
        thumb.style.height = "96px";
        thumb.style.objectFit = "cover";
        thumb.style.borderRadius = "8px";
        card.appendChild(thumb);
      }

      const title = document.createElement("div");
      title.className = "mt-2 text-sm font-semibold";
      title.textContent = product.name;
      card.appendChild(title);

      const pricing = document.createElement("div");
      pricing.className = "text-xs opacity-80";
      const saleText = product.sale_price !== null ? `${product.sale_price.toFixed(2)}€` : "n/a";
      const discountText = product.discount_price !== null ? `${product.discount_price.toFixed(2)}€` : "n/a";
      pricing.textContent = `Sale: ${saleText} | Discount: ${discountText}`;
      card.appendChild(pricing);

      const galleryHint = document.createElement("div");
      galleryHint.className = "mt-1 text-xs opacity-70";
      const photoCount = product.photos_full.length;
      galleryHint.textContent = photoCount > 0 ? `${photoCount} full photos` : "No full gallery";
      card.appendChild(galleryHint);

      const buttonRow = document.createElement("div");
      buttonRow.className = "mt-2 flex items-center justify-between";

      const quantityTag = document.createElement("span");
      quantityTag.className = "text-xs opacity-70";
      quantityTag.textContent = `In cart: ${cartMap[product.id] || 0}`;

      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "btn btn-xs btn-primary";
      addButton.textContent = "Add";
      addButton.setAttribute("data-product-action", "add");
      addButton.setAttribute("data-product-id", product.id);

      buttonRow.appendChild(quantityTag);
      buttonRow.appendChild(addButton);
      card.appendChild(buttonRow);
      productList.appendChild(card);
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

    selectionElement.innerHTML = "";
    const images = this.getImageGalleryCatalog(fieldConfig);
    const selectedItems = this.getImageGallerySelectionItems(value);
    const selectedMap = selectedItems.reduce((accumulator, item) => {
      accumulator[item.id] = true;
      return accumulator;
    }, {} as Record<string, boolean>);

    const gallery = document.createElement("div");
    gallery.setAttribute("data-image-gallery-catalog", fieldConfig.name);
    gallery.style.display = "grid";
    gallery.style.gridTemplateColumns = "repeat(auto-fit, minmax(180px, 1fr))";
    gallery.style.gap = "10px";
    gallery.style.marginBottom = "14px";

    images.forEach((imageItem) => {
      const card = document.createElement("div");
      card.setAttribute("data-image-open-gallery", imageItem.id);
      card.setAttribute("data-image-card", imageItem.id);
      card.className = "rounded border border-base-300 p-2";
      card.style.cursor = "pointer";

      const previewSrc = imageItem.image_medium || imageItem.image_thumbnail;
      if (previewSrc) {
        const preview = document.createElement("img");
        preview.src = previewSrc;
        preview.alt = imageItem.name;
        preview.style.width = "100%";
        preview.style.height = "140px";
        preview.style.objectFit = "cover";
        preview.style.borderRadius = "8px";
        card.appendChild(preview);
      }

      const title = document.createElement("div");
      title.className = "mt-2 text-sm font-semibold";
      title.textContent = imageItem.name;
      card.appendChild(title);

      const meta = document.createElement("div");
      meta.className = "text-xs opacity-70";
      meta.textContent = imageItem.photos_full.length ? `${imageItem.photos_full.length} full photos` : "No full gallery";
      card.appendChild(meta);

      const buttonRow = document.createElement("div");
      buttonRow.className = "mt-2 flex items-center justify-between";

      const statusTag = document.createElement("span");
      statusTag.className = "text-xs opacity-70";
      statusTag.textContent = selectedMap[imageItem.id] ? "Selected" : "Not selected";

      const toggleButton = document.createElement("button");
      toggleButton.type = "button";
      toggleButton.className = selectedMap[imageItem.id] ? "btn btn-xs btn-outline" : "btn btn-xs btn-primary";
      toggleButton.textContent = selectedMap[imageItem.id] ? "Remove" : "Select";
      toggleButton.setAttribute("data-image-gallery-action", "toggle");
      toggleButton.setAttribute("data-image-id", imageItem.id);

      buttonRow.appendChild(statusTag);
      buttonRow.appendChild(toggleButton);
      card.appendChild(buttonRow);
      gallery.appendChild(card);
    });

    selectionElement.appendChild(gallery);

    const selectedPanel = document.createElement("div");
    selectedPanel.setAttribute("data-image-gallery-selection", fieldConfig.name);
    selectedPanel.className = "rounded border border-base-300 p-3";

    const heading = document.createElement("div");
    heading.className = "mb-2 text-sm font-semibold";
    heading.textContent = `Selected Images (${selectedItems.length})`;
    selectedPanel.appendChild(heading);

    if (!selectedItems.length) {
      const empty = document.createElement("div");
      empty.className = "text-xs opacity-70";
      empty.textContent = "No image selected yet.";
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

      const name = document.createElement("div");
      name.className = "text-sm";
      name.textContent = item.name;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn btn-xs btn-ghost";
      remove.textContent = "Remove";
      remove.setAttribute("data-image-gallery-action", "remove");
      remove.setAttribute("data-image-id", item.id);

      row.appendChild(name);
      row.appendChild(remove);
      list.appendChild(row);
    });
    selectedPanel.appendChild(list);
    selectionElement.appendChild(selectedPanel);
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

    this.clearFilePreviewUrls(fieldConfig.name);
    selectionElement.innerHTML = "";
    const selectedFiles = this.getFileValueList(value);
    const isDragActive = Boolean(this.fileDragActive[fieldConfig.name]);
    const uploadState = this.fileUploadState[fieldConfig.name];

    selectionElement.classList.toggle("border-primary", isDragActive);
    selectionElement.classList.toggle("bg-base-200", isDragActive);

    if (uploadState) {
      const status = document.createElement("div");
      status.className = "mb-2 text-xs font-medium";
      status.textContent =
        uploadState.status === "uploading"
          ? `Uploading... ${uploadState.progress}%`
          : uploadState.status === "complete"
            ? "Uploaded"
            : "Upload failed";
      selectionElement.appendChild(status);
    }

    if (this.isDocumentScanField(fieldConfig)) {
      this.renderDocumentScanSelection(fieldConfig, selectedFiles, selectionElement);
      return;
    }

    if (this.isQrScanField(fieldConfig)) {
      this.renderQrSelection(fieldConfig, value, selectionElement);
      if (!selectedFiles.length) {
        return;
      }
    }

    if (!selectedFiles.length) {

      const placeholder = document.createElement("div");
      placeholder.className = "text-xs opacity-70";
      placeholder.textContent = "Drop files here or use the file picker.";
      selectionElement.appendChild(placeholder);
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

    selectionElement.appendChild(list);
  }

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

    if ("content" in document.createElement("template")) {
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
      this.formConfig = validatePublicFormConfig(getFormConfig(formElem) as unknown as Record<string, any>);
      this.engine.setFormConfig(this.formConfig);
      this.steps.setFormConfig(this.formConfig);
      this.persistence.setFormConfig(this.formConfig);
      this.stepNames = this.steps.getStepNames();
      this.currentStepIndex = this.steps.getCurrentStepIndex();
      const savedStepIndex = this.persistence.loadCurrentStepIndex();
      if (
        typeof savedStepIndex === "number" &&
        savedStepIndex >= 0 &&
        savedStepIndex < this.stepNames.length
      ) {
        this.steps.setCurrentStepIndex(savedStepIndex);
        this.currentStepIndex = this.steps.getCurrentStepIndex();
      }
      const draftValues = this.persistence.loadDraftValues();
      const renderMode = this.getRenderMode();
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
        if (!this.isLastStep()) {
          this.nextStep();
          return;
        }
        this.form?.submit();
      });

      Array.from(formElem.elements).forEach(input => {
        const fieldConfig = getFieldConfig(input);
        if (fieldConfig.type !== UNKNOWN_TYPE) {
          this.registerField(fieldConfig, input);
        }
      });
      this.bindProductListGlobalCartEvents();

      this.ensureStepControls(formElem);

      this.dynamic.updateConditionalFields();
      void this.dynamic.refreshRemoteOptions();
      this.syncStepVisibility();
      this.syncStepControls();
      this.emitFormEvent("form-ui:workflow-step", {
        values: this.form?.getState().values || {},
        formConfig: this.formConfig,
        submit: this.formConfig?.submit,
        result: this.getWorkflowSnapshot(),
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

  createResumeToken = (): string | null => {
    return this.persistence.createResumeToken();
  }

  createResumeTokenAsync = (): Promise<string | null> => {
    return this.persistence.createResumeTokenAsync();
  }

  createResumeShareCode = (token: string): Promise<string | null> => {
    return this.persistence.createResumeShareCode(token);
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
    const restoredValues = await this.persistence.restoreFromShareCodeAsync(code);
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

  getAllDocumentData = () => {
    return this.engine.getAllDocumentData();
  }

  getApprovalState = (): TFormApprovalState | null => {
    return this.approvalState;
  }

  getWorkflowState = (): TFormWorkflowState => {
    return this.workflowState;
  }

  getStepNames = (): string[] => {
    return this.steps.getStepNames();
  }

  getCurrentStepIndex = (): number => {
    return this.steps.getCurrentStepIndex();
  }

  getCurrentStepName = (): string | null => {
    return this.steps.getCurrentStepName();
  }

  getStepProgress = () => {
    return this.steps.getStepProgress();
  }

  getStepButtonLabels = (): { previous: string; next: string } => {
    return {
      previous: this.formConfig?.stepLabels?.previous || "Back",
      next: this.formConfig?.stepLabels?.next || "Next",
    };
  }

  getWorkflowSnapshot = () => {
    const values = this.form?.getState().values || {};
    return this.steps.getWorkflowSnapshot(values);
  }

  goToWorkflowStep = (state?: string): boolean => {
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
    this.emitFormEvent("form-ui:workflow-step", {
      values: this.form?.getState().values || {},
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
      result: this.getWorkflowSnapshot(),
    });
    this.emitStepChange();
    return true;
  }

  isLastStep = (): boolean => {
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
    const currentStepName = this.getCurrentStepName();
    if (!currentStepName) {
      return [];
    }

    return Array.from(
      this.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input[data-section-name], select[data-section-name], textarea[data-section-name]",
      ),
    ).filter((element) => element.getAttribute("data-section-name") === currentStepName);
  }

  getStepElements = (sectionName: string): HTMLElement[] => {
    const fieldNodes = Array.from(this.querySelectorAll("[data-section-name]"))
      .filter((node) => node.getAttribute("data-section-name") === sectionName)
      .map((node) => (node.closest("label") as HTMLElement | null) || node as HTMLElement);
    const sectionNodes = Array.from(this.querySelectorAll('[data-type="section"]'))
      .filter((node) => node.getAttribute("data-name") === sectionName)
      .map((node) => node as HTMLElement);

    return Array.from(new Set([...sectionNodes, ...fieldNodes]));
  }

  validateCurrentStep = (): boolean => {
    if (!this.form || this.stepNames.length <= 1) {
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
    if (this.stepNames.length <= 1) {
      this.stepControlContainer = null;
      this.stepProgressElement = null;
      this.stepSummaryElement = null;
      this.stepBackButton = null;
      this.stepNextButton = null;
      return;
    }

    const existingContainer = formElem.querySelector("[data-form-step-controls]") as HTMLElement | null;
    if (existingContainer) {
      this.stepControlContainer = existingContainer;
      this.stepProgressElement = existingContainer.querySelector(
        "[data-form-step-progress]",
      ) as HTMLElement | null;
      this.stepSummaryElement = existingContainer.querySelector(
        "[data-form-step-summary]",
      ) as HTMLElement | null;
      this.stepBackButton = existingContainer.querySelector(
        '[data-step-action="back"]',
      ) as HTMLButtonElement | null;
      this.stepNextButton = existingContainer.querySelector(
        '[data-step-action="next"]',
      ) as HTMLButtonElement | null;
      return;
    }

    const controlsContainer = document.createElement("div");
    controlsContainer.setAttribute("data-form-step-controls", "true");
    controlsContainer.className = "mt-4 flex flex-wrap items-center gap-2";
    controlsContainer.style.marginTop = "16px";
    controlsContainer.style.display = "flex";
    controlsContainer.style.flexWrap = "wrap";
    controlsContainer.style.alignItems = "center";
    controlsContainer.style.gap = "8px";
    const buttonLabels = this.getStepButtonLabels();

    const progressElement = document.createElement("div");
    progressElement.setAttribute("data-form-step-progress", "true");
    progressElement.className = "text-sm font-medium";
    progressElement.style.fontSize = "14px";
    progressElement.style.fontWeight = "600";

    const summaryElement = document.createElement("div");
    summaryElement.setAttribute("data-form-step-summary", "true");
    summaryElement.className = "text-xs opacity-80";
    summaryElement.style.fontSize = "12px";
    summaryElement.style.opacity = "0.8";
    summaryElement.style.flexBasis = "100%";

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.textContent = buttonLabels.previous;
    backButton.setAttribute("data-step-action", "back");
    backButton.className = "btn btn-outline btn-sm";
    backButton.addEventListener("click", () => {
      this.previousStep();
    });

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.textContent = buttonLabels.next;
    nextButton.setAttribute("data-step-action", "next");
    nextButton.className = "btn btn-primary btn-sm";
    nextButton.addEventListener("click", () => {
      this.nextStep();
    });

    controlsContainer.appendChild(progressElement);
    controlsContainer.appendChild(summaryElement);
    controlsContainer.appendChild(backButton);
    controlsContainer.appendChild(nextButton);
    formElem.appendChild(controlsContainer);

    this.stepControlContainer = controlsContainer;
    this.stepProgressElement = progressElement;
    this.stepSummaryElement = summaryElement;
    this.stepBackButton = backButton;
    this.stepNextButton = nextButton;
  }

  syncStepVisibility = () => {
    if (this.stepNames.length <= 1) {
      return;
    }

    this.stepNames.forEach((sectionName, index) => {
      const isActive = index === this.currentStepIndex;
      this.getStepElements(sectionName).forEach((element) => {
        const isStepHidden = element.getAttribute("data-step-hidden") === "true";
        if (!isActive) {
          element.setAttribute("data-step-hidden", "true");
          element.style.display = "none";
          return;
        }

        if (isStepHidden) {
          element.removeAttribute("data-step-hidden");
          element.style.display = "";
        }
      });
    });
  }

  syncStepControls = () => {
    const formElement = this.querySelector("form");
    if (!formElement) {
      return;
    }

    const submitButtons = Array.from(
      formElement.querySelectorAll<HTMLButtonElement | HTMLInputElement>(
        'button[type="submit"], input[type="submit"]',
      ),
    );

    if (this.stepNames.length <= 1) {
      submitButtons.forEach((button) => {
        button.disabled = this.submitLockedByRules;
        (button as HTMLElement).style.display = "";
        if (button instanceof HTMLButtonElement) {
          button.title = this.submitLockedByRules && this.submitLockMessage
            ? this.submitLockMessage
            : "";
        }
      });
      return;
    }

    const isLastStep = this.isLastStep();
    const progress = this.getStepProgress();
    if (this.stepProgressElement) {
      const suffix = this.isCurrentStepSkippable() ? " (Optional)" : "";
      this.stepProgressElement.textContent =
        `Step ${progress.stepNumber} of ${progress.stepCount} (${progress.percent}%)${suffix}`;
    }
    if (this.stepSummaryElement) {
      const summary = this.getStepSummary();
      if (!summary.length) {
        this.stepSummaryElement.textContent = "";
        this.stepSummaryElement.style.display = "none";
      } else {
        this.stepSummaryElement.textContent = summary
          .map((entry) => `${entry.label}: ${Array.isArray(entry.value) ? entry.value.join(", ") : String(entry.value)}`)
          .join(" | ");
        this.stepSummaryElement.style.display = "";
      }
    }
    if (this.stepBackButton) {
      this.stepBackButton.disabled = this.currentStepIndex === 0;
      this.stepBackButton.style.display = this.currentStepIndex === 0 ? "none" : "";
    }
    if (this.stepNextButton) {
      this.stepNextButton.disabled = isLastStep;
      this.stepNextButton.style.display = isLastStep ? "none" : "";
    }

    submitButtons.forEach((button) => {
      button.disabled = !isLastStep || this.submitLockedByRules;
      (button as HTMLElement).style.display = isLastStep ? "" : "none";
      if (button instanceof HTMLButtonElement) {
        button.title = this.submitLockedByRules && this.submitLockMessage
          ? this.submitLockMessage
          : "";
      }
    });
  }

  emitStepChange = () => {
    if (this.stepNames.length <= 1) {
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
    this.emitFormEvent("form-ui:workflow-step", {
      values,
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
      result: this.getWorkflowSnapshot(),
    });
    this.emitStepChange();
    return true;
  }

  previousStep = (): boolean => {
    if (!this.steps.previousStep()) {
      return false;
    }
    this.currentStepIndex = this.steps.getCurrentStepIndex();
    this.persistence.saveCurrentStepIndex(this.currentStepIndex);
    this.syncStepVisibility();
    this.syncStepControls();
    this.emitFormEvent("form-ui:workflow-step", {
      values: this.form?.getState().values || {},
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
      result: this.getWorkflowSnapshot(),
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
        this.emitFormEvent("form-ui:workflow-step", {
          ...detail,
          response,
          result: this.getWorkflowSnapshot(),
        });
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
      },
    });
    this.emitFormEvent("form-ui:workflow-step", {
      ...detail,
      response,
      result: this.getWorkflowSnapshot(),
    });
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

  normalizeExplicitProviderTransition = (result: any): TFormProviderTransition | null => {
    const transition = result?.transition;
    if (!transition || typeof transition !== "object") {
      return null;
    }

    if (transition.type === "workflow" && typeof transition.state === "string" && transition.state) {
      return {
        type: "workflow",
        state: transition.state,
      };
    }

    if (
      transition.type === "step" &&
      (typeof transition.target === "string" || Number.isFinite(transition.target))
    ) {
      return {
        type: "step",
        target: transition.target as string | number,
      };
    }

    return null;
  }

  normalizeStatusWorkflowTransition = (
    providerResult?: TNormalizedProviderResult,
  ): TFormProviderTransition | null => {
    const status = providerResult?.status;
    if (
      status === "draft" ||
      status === "submitting" ||
      status === "submitted" ||
      status === "pending_approval" ||
      status === "approved" ||
      status === "completed" ||
      status === "rejected" ||
      status === "error"
    ) {
      return {
        type: "workflow",
        state: status,
      };
    }

    return null;
  }

  getProviderTransitionKey = (transition: TFormProviderTransition): string => {
    return transition.type === "workflow"
      ? `workflow:${transition.state}`
      : `step:${String(transition.target)}`;
  }

  buildProviderTransitionCandidates = (
    policy: NonNullable<TFormSubmitRequest["providerRoutingPolicy"]>,
    result: any,
    providerResult?: TNormalizedProviderResult,
  ): TFormProviderTransition[] => {
    const explicitTransition = this.normalizeExplicitProviderTransition(result);
    const normalizedTransition = providerResult?.transition || null;
    const statusWorkflowTransition = this.normalizeStatusWorkflowTransition(providerResult);
    const stepTransition =
      explicitTransition?.type === "step"
        ? explicitTransition
        : normalizedTransition?.type === "step"
          ? normalizedTransition
          : null;
    const workflowTransition =
      explicitTransition?.type === "workflow"
        ? explicitTransition
        : normalizedTransition?.type === "workflow"
          ? normalizedTransition
          : null;

    let ordered: Array<TFormProviderTransition | null> = [];
    if (policy === "workflow-only") {
      ordered = [workflowTransition, statusWorkflowTransition];
    } else if (policy === "step-only") {
      ordered = [stepTransition];
    } else if (policy === "workflow-first") {
      ordered = [workflowTransition, statusWorkflowTransition, stepTransition];
    } else if (policy === "step-first") {
      ordered = [stepTransition, workflowTransition, statusWorkflowTransition];
    } else {
      ordered = [explicitTransition, normalizedTransition, statusWorkflowTransition];
    }

    const unique: TFormProviderTransition[] = [];
    const seen = new Set<string>();
    ordered.forEach((candidate) => {
      if (!candidate) {
        return;
      }
      const key = this.getProviderTransitionKey(candidate);
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      unique.push(candidate);
    });

    return unique;
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
    this.emitFormEvent("form-ui:workflow-step", {
      ...detail,
      response,
      result: this.getWorkflowSnapshot(),
    });
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
    const transitions = this.buildProviderTransitionCandidates(policy, result, providerResult);
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

  getValidationHooks = (stage: "preValidate" | "customValidate"): TFormValidationHook[] => {
    const candidate = this.formConfig?.validation?.[stage];
    if (!candidate) {
      return [];
    }
    return Array.isArray(candidate) ? candidate : [candidate];
  }

  getValidationErrorHooks = (): TFormValidationErrorsHook[] => {
    const candidate = this.formConfig?.validation?.postValidate;
    if (!candidate) {
      return [];
    }
    return Array.isArray(candidate) ? candidate : [candidate];
  }

  mergeValidationErrors = (
    baseErrors: Record<string, any>,
    incomingErrors: Record<string, any>,
  ): Record<string, any> => {
    return {
      ...(baseErrors || {}),
      ...(incomingErrors || {}),
    };
  }

  validateForm = (values: Record<string, any>) => {
    let nextValues = values;
    const validationContext = {
      formConfig: this.formConfig,
    };
    this.getValidationHooks("preValidate").forEach((hook) => {
      const hookResult = hook(nextValues, validationContext);
      if (
        hookResult &&
        typeof hookResult === "object" &&
        !Array.isArray(hookResult)
      ) {
        nextValues = hookResult;
      }
    });

    let errors = this.engine.validateValues(nextValues);

    this.getValidationHooks("customValidate").forEach((hook) => {
      const hookResult = hook(nextValues, validationContext);
      if (
        hookResult &&
        typeof hookResult === "object" &&
        !Array.isArray(hookResult)
      ) {
        errors = this.mergeValidationErrors(errors, hookResult);
      }
    });

    this.getValidationErrorHooks().forEach((hook) => {
      const hookResult = hook(nextValues, errors, validationContext);
      if (
        hookResult &&
        typeof hookResult === "object" &&
        !Array.isArray(hookResult)
      ) {
        errors = hookResult;
      }
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
    const action = this.formConfig?.submit?.action;
    if (action !== "approval-request" && action !== "approval-decision") {
      return;
    }

    const status = providerResult?.status || "";
    const normalizedData = providerResult?.data;
    const approvalId =
      (normalizedData &&
      typeof normalizedData === "object" &&
      typeof normalizedData.approvalId === "string"
        ? normalizedData.approvalId
        : undefined) ||
      (result && typeof result === "object" && typeof result.approvalId === "string"
        ? result.approvalId
        : undefined) ||
      this.approvalState?.approvalId;
    this.approvalState = {
      status: status || "unknown",
      approvalId,
      result,
      providerResult,
    };
    this.emitFormEvent("form-ui:approval-state", {
      ...detail,
      response,
      result: this.approvalState,
    });
    this.syncApprovalStateFields();

    if (status === "pending_approval") {
      this.emitFormEvent("form-ui:approval-requested", {
        ...detail,
        response,
        result,
        providerResult,
      });
      return;
    }

    if (status === "approved" || status === "completed") {
      this.emitFormEvent("form-ui:approval-complete", {
        ...detail,
        response,
        result,
        providerResult,
      });
      return;
    }

    if (status === "rejected") {
      return;
    }
  }

  emitProviderMessages = (
    detail: TFormUISubmitDetail,
    providerResult?: TNormalizedProviderResult,
    response?: Response,
    source: "success" | "error" = "success",
  ) => {
    if (!providerResult?.messages?.length) {
      return;
    }

    this.emitFormEvent("form-ui:provider-messages", {
      ...detail,
      response,
      result: {
        status: providerResult.status,
        source,
        messages: providerResult.messages,
        ...(providerResult.nextActions?.length
          ? { nextActions: providerResult.nextActions }
          : {}),
      },
    });
  }

  getSubmitLifecycleHooks = (
    stage: TFormSubmitLifecycleStage,
  ): TFormSubmitLifecycleHook[] => {
    const lifecycle = this.formConfig?.submit?.lifecycle;
    const candidate = lifecycle?.[stage];
    if (!candidate) {
      return [];
    }
    return Array.isArray(candidate) ? candidate : [candidate];
  }

  emitSubmitHookError = (
    stage: TFormSubmitLifecycleStage,
    detail: TFormUISubmitDetail,
    hookError: unknown,
  ) => {
    this.emitFormEvent("form-ui:submit-hook-error", {
      ...detail,
      error: hookError,
      result: {
        stage,
      },
    });
  }

  runSubmitLifecycleStage = async (
    stage: TFormSubmitLifecycleStage,
    detail: TFormUISubmitDetail,
  ): Promise<{ canceled: boolean; values: Record<string, any> }> => {
    const hooks = this.getSubmitLifecycleHooks(stage);
    if (!hooks.length) {
      return { canceled: false, values: detail.values };
    }

    let nextValues = detail.values;
    for (const hook of hooks) {
      const hookResult = await hook({
        stage,
        values: nextValues,
        formConfig: detail.formConfig,
        submit: detail.submit,
        response: detail.response,
        result: detail.result,
        providerResult: detail.providerResult,
        error: detail.error,
      });

      if (stage === "preSubmit") {
        if (hookResult === false) {
          return { canceled: true, values: nextValues };
        }

        if (
          hookResult &&
          typeof hookResult === "object" &&
          !Array.isArray(hookResult)
        ) {
          nextValues = hookResult as Record<string, any>;
        }
      }
    }

    return { canceled: false, values: nextValues };
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
      const preSubmitResult = await this.runSubmitLifecycleStage("preSubmit", detail);
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
        await this.runSubmitLifecycleStage("postSuccess", detail);
      } catch (hookError) {
        this.emitSubmitHookError("postSuccess", detail, hookError);
      }
      return;
    }

    try {
      const submitConfig = this.formConfig?.submit as TFormSubmitRequest;
      const transportResult = customTransport
        ? await customTransport(formValues, {
          formConfig: this.formConfig,
          submit: submitConfig,
          fields: this.engine.getFields(),
        })
        : await this.submitToApi(formValues, submitConfig);
      const response = transportResult && typeof transportResult === "object" && "response" in transportResult
        ? (transportResult as any).response
        : undefined;
      const result = transportResult && typeof transportResult === "object" && "result" in transportResult
        ? (transportResult as any).result
        : transportResult;
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
        await this.runSubmitLifecycleStage("postSuccess", successDetail);
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
        await this.runSubmitLifecycleStage("postFailure", errorDetail);
      } catch (hookError) {
        this.emitSubmitHookError("postFailure", errorDetail, hookError);
      }
      throw error;
    }
  }

  getFieldElement = (fieldName: string) => {
    const nodes = Array.from(this.querySelectorAll("[id]"));
    for (const node of nodes) {
      if ((node as HTMLElement).id === fieldName) {
        return node as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      }
    }

    return null;
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
    if (!errorElement || !inputElement) {
      return;
    }

    const ruleError = this.ruleFieldErrors[fieldName];
    const displayedError = ruleError || (touched ? error : undefined);
    if (displayedError) {
      const errorClass = getErrorClass(inputElement);
      errorElement.innerHTML = ruleError
        ? ruleError
        : (displayedError as TValidationError).errorMessage;
      errorElement.style.display = "block";
      inputElement.classList.add(errorClass);
      this.errors[fieldName] = true;
      return;
    }

    if (this.errors[fieldName]) {
      errorElement.innerHTML = "";
      errorElement.style.display = "none";
      const errorClass = getErrorClass(inputElement);
      inputElement.classList.remove(errorClass);
    }
    this.errors[fieldName] = false;
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
    const fieldElement = this.getFieldElement(fieldName);
    if (!fieldElement) {
      return null;
    }

    const closestLabel = fieldElement.closest("label");
    if (closestLabel) {
      return closestLabel as HTMLElement;
    }

    return fieldElement.parentElement as HTMLElement | null;
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
            input.addEventListener("blur", () => blur());
            input.addEventListener("input", (event: any) => {
              if (input instanceof HTMLInputElement && input.type === "file") {
                return;
              }

              const nextValue =
                input.type === "checkbox"
                  ? (<HTMLInputElement>event.target)?.checked
                  : input instanceof HTMLSelectElement && input.multiple
                    ? Array.from((<HTMLSelectElement>event.target)?.selectedOptions || []).map(
                        (option) => option.value,
                      )
                  : (<HTMLInputElement>event.target)?.value;
              change(nextValue);
              this.scheduleDraftSave();
              this.updateConditionalFields();
              void this.refreshRemoteOptions(name);
            });
            input.addEventListener("change", async () => {
              if (input instanceof HTMLInputElement && input.type === "file") {
                const nextValue = await this.resolveFileInputValue(fieldConfig, input);
                change(nextValue);
              }
              this.scheduleDraftSave();
              this.updateConditionalFields();
              void this.refreshRemoteOptions(name);
            });
            input.addEventListener("focus", () => focus());
          }
          if (selectionElement && !fieldViewOnly && !settingField) {
            selectionElement.addEventListener("click", (event) => {
              const target = event.target as HTMLElement | null;
              const productActionButton = target?.closest("[data-product-action]") as HTMLElement | null;
              if (this.isProductListField(fieldConfig) && productActionButton) {
                event.preventDefault();
                event.stopPropagation();
                const action = productActionButton.getAttribute("data-product-action");
                const productId = productActionButton.getAttribute("data-product-id");
                if (
                  (action === "add" || action === "inc" || action === "dec" || action === "remove")
                  && productId
                ) {
                  const nextCart = this.getNextProductCartItems(
                    fieldConfig,
                    this.getFieldValue(name),
                    action,
                    productId,
                  );
                  change(nextCart);
                  this.scheduleDraftSave();
                  this.updateConditionalFields();
                  void this.refreshRemoteOptions(name);
                }
                return;
              }

              const imageGalleryActionButton = target?.closest("[data-image-gallery-action]") as HTMLElement | null;
              if (this.isImageGalleryField(fieldConfig) && imageGalleryActionButton) {
                event.preventDefault();
                event.stopPropagation();
                const action = imageGalleryActionButton.getAttribute("data-image-gallery-action");
                const imageId = imageGalleryActionButton.getAttribute("data-image-id");
                if (
                  (action === "toggle" || action === "remove")
                  && imageId
                ) {
                  const nextSelection = this.getNextImageGallerySelectionItems(
                    fieldConfig,
                    this.getFieldValue(name),
                    action,
                    imageId,
                  );
                  change(nextSelection);
                  this.scheduleDraftSave();
                  this.updateConditionalFields();
                  void this.refreshRemoteOptions(name);
                }
                return;
              }

              if (this.isProductListField(fieldConfig)) {
                const productCard = target?.closest("[data-product-open-gallery]") as HTMLElement | null;
                if (productCard) {
                  const productId = productCard.getAttribute("data-product-open-gallery");
                  if (productId) {
                    const product = this.getProductListCatalog(fieldConfig).find((entry) => entry.id === productId);
                    if (product) {
                      event.preventDefault();
                      event.stopPropagation();
                      this.openProductListGallery(product);
                    }
                  }
                  return;
                }
              }

              if (this.isImageGalleryField(fieldConfig)) {
                const imageCard = target?.closest("[data-image-open-gallery]") as HTMLElement | null;
                if (imageCard) {
                  const imageId = imageCard.getAttribute("data-image-open-gallery");
                  if (imageId) {
                    const imageItem = this.getImageGalleryCatalog(fieldConfig).find((entry) => entry.id === imageId);
                    if (imageItem) {
                      event.preventDefault();
                      event.stopPropagation();
                      this.openImageGalleryItem(imageItem);
                    }
                  }
                  return;
                }
              }

              const qrAction = target?.closest("[data-qr-action]") as HTMLElement | null;
              if (qrAction) {
                event.preventDefault();
                event.stopPropagation();
                const action = qrAction.getAttribute("data-qr-action");
                if (action === "start") {
                  void this.startQrCamera(fieldConfig);
                } else if (action === "scan") {
                  void this.scanQrFromLiveVideo(fieldConfig);
                } else if (action === "stop") {
                  this.stopQrCamera(name);
                }
                return;
              }

              const documentScanSlotButton = target?.closest("[data-document-scan-slot]") as HTMLElement | null;
              if (documentScanSlotButton) {
                event.preventDefault();
                event.stopPropagation();
                const slotIndex = Number(documentScanSlotButton.getAttribute("data-document-scan-slot"));
                if (!Number.isNaN(slotIndex)) {
                  this.activeDocumentScanSlot[name] = slotIndex;
                  this.renderFileSelection(fieldConfig, this.getFieldValue(name), selectionElement);
                  if (input instanceof HTMLInputElement && input.type === "file") {
                    input.click();
                  }
                }
                return;
              }

              const removeButton = target?.closest("[data-remove-file-index]") as HTMLElement | null;
              if (!removeButton) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();

              const fileIndex = Number(removeButton.getAttribute("data-remove-file-index"));
              if (Number.isNaN(fileIndex)) {
                return;
              }

              this.removeSelectedFile(name, fileIndex);
            });
            if (isFileFieldType(fieldConfig.type)) {
              selectionElement.addEventListener("dragenter", (event) => {
                event.preventDefault();
                this.setFileDragState(name, true);
              });
              selectionElement.addEventListener("dragover", (event) => {
                event.preventDefault();
                this.setFileDragState(name, true);
              });
              selectionElement.addEventListener("dragleave", (event) => {
                const relatedTarget = event.relatedTarget as Node | null;
                if (relatedTarget && selectionElement.contains(relatedTarget)) {
                  return;
                }
                this.setFileDragState(name, false);
              });
              selectionElement.addEventListener("drop", (event) => {
                event.preventDefault();
                this.setFileDragState(name, false);
                const droppedFiles = Array.from(event.dataTransfer?.files || []);
                void this.applyDroppedFiles(name, droppedFiles);
              });
            }
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
        if (settingField) {
          if (inputElement instanceof HTMLInputElement) {
            inputElement.value = value === undefined || value === null
              ? ""
              : typeof value === "string"
                ? value
                : JSON.stringify(value);
          }
        } else if (fieldViewOnly) {
          this.applyFieldViewPresentation(fieldConfig, inputElement, selectionElement, errorElement, value);
        } else if (input.type === "checkbox") {
          (<HTMLInputElement>input).checked = value;
        } else if (input instanceof HTMLInputElement && input.type === "file") {
          this.renderFileSelection(fieldConfig, value, selectionElement);
          if (
            !value ||
            (Array.isArray(value) && !value.length) ||
            (typeof value === "string" && this.isQrScanField(fieldConfig))
          ) {
            input.value = "";
          }
        } else if (this.isProductListField(fieldConfig)) {
          this.renderProductListSelection(fieldConfig, value, selectionElement);
          input.value = JSON.stringify(this.getProductCartItems(value));
        } else if (this.isImageGalleryField(fieldConfig)) {
          this.renderImageGallerySelection(fieldConfig, value, selectionElement);
          input.value = JSON.stringify(this.getImageGallerySelectionItems(value));
        } else if (input instanceof HTMLSelectElement && input.multiple) {
          const selectedValues = Array.isArray(value)
            ? value.map((entry) => String(entry))
            : [];
          Array.from(input.options).forEach((option) => {
            option.selected = selectedValues.includes(option.value);
          });
        } else {
          input.value = value === undefined ? "" : value;
        }

        if (this.getRenderMode() === "hybrid" && inputElement) {
          this.renderViewField(
            fieldConfig,
            value,
            inputElement,
            undefined,
            this.form?.getState().values || {},
          );
          this.emitOutputSnapshot(this.form?.getState().values || {});
        }

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
