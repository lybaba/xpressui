import { createForm, FormApi } from "final-form";
import TFormConfig, { TFormSubmitRequest } from "./common/TFormConfig";
import { TValidator } from "./common/Validator";
import getFormConfig, { getErrorClass, getFieldConfig } from "./dom-utils";
import TFieldConfig from "./common/TFieldConfig";
import { FormEngineRuntime } from "./common/form-engine";
import {
  APPROVAL_STATE_TYPE,
  DOCUMENT_SCAN_TYPE,
  isFileLikeValue,
  QR_SCAN_TYPE,
  UNKNOWN_TYPE,
} from "./common/field";
import { FormDynamicRuntime } from "./common/form-dynamic";
import type { TFormActiveTemplateWarning } from "./common/form-dynamic";
import {
  FormPersistenceRuntime,
  TFormQueueState,
  TFormStorageHealth,
  TFormStorageSnapshot,
} from "./common/form-persistence";
import { getRestorableStorageValues } from "./common/form-storage";
import { FormRuntime } from "./common/form-runtime";
import { FormUploadRuntime, TFormUploadState } from "./common/form-upload";
import { validatePublicFormConfig } from "./common/public-schema";
import {
  getProviderErrorEventName,
  getProviderSuccessEventName,
  registerProvider,
} from "./common/provider-registry";
export {
  createFormConfig,
  createTemplateMarkup,
  mountFormUI,
} from "./common/form-builder";
export { createFormPreset, fieldFactory } from "./common/form-presets";
export { createLocalFormAdmin } from "./common/form-admin";
export { attachFormDebugObserver } from "./common/form-debug";
export { createFormDebugPanel } from "./common/form-debug-panel";
export { FormEngineRuntime } from "./common/form-engine";
export { FormDynamicRuntime } from "./common/form-dynamic";
export { FormPersistenceRuntime } from "./common/form-persistence";
export { FormRuntime } from "./common/form-runtime";
export { FormUploadRuntime } from "./common/form-upload";
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
  registerProvider,
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
export type {
  TFormQueueState,
  TFormStorageHealth,
  TFormStorageSnapshot,
} from "./common/form-persistence";
export type { TCreateFormPresetOptions, TFormPresetName } from "./common/form-presets";
export type {
  TFormRuntimeDynamicAdapters,
  TFormRuntimeEmitEvent,
  TFormRuntimeOptions,
  TFormRuntimePublicApi,
  TFormRuntimeSubmitResult,
  TFormRuntimeSubmitValues,
} from "./common/form-runtime";
export type { TStoredDocumentData } from "./common/form-engine";

export type TFormUISubmitDetail = {
  values: Record<string, any>;
  formConfig: TFormConfig | null;
  submit?: TFormSubmitRequest;
  response?: Response;
  result?: any;
  error?: unknown;
};

export type TFormApprovalState = {
  status: string;
  approvalId?: string;
  result?: any;
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
  filePreviewUrls: Record<string, string[]>;
  fileDragActive: Record<string, boolean>;
  fileUploadState: Record<string, TFormUploadState | null>;
  qrScannerState: Record<string, TQrScannerState>;
  qrScannerStreams: Record<string, MediaStream | null>;
  qrScannerTimers: Record<string, number | null>;
  qrScannerRunning: Record<string, boolean>;
  activeDocumentScanSlot: Record<string, number>;
  documentScanInsights: Record<string, TDocumentScanInsight>;
  approvalState: TFormApprovalState | null;
  workflowState: TFormWorkflowState;

  constructor() {
    super();
    this.formConfig = null;
    this.engine = new FormEngineRuntime();
    this.registered = {};
    this.errors = {}
    this.form = null;
    this.initialized = false;
    this.fileUploadState = {};
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
    this.persistence = new FormPersistenceRuntime({
      getFormConfig: () => this.formConfig,
      getValues: () => this.form?.getState().values || {},
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
    this.persistence.disconnect();
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
    this.initialized = true;

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


    if (formElem) {
      this.formConfig = validatePublicFormConfig(getFormConfig(formElem) as unknown as Record<string, any>);
      this.engine.setFormConfig(this.formConfig);
      this.persistence.setFormConfig(this.formConfig);
      const draftValues = this.persistence.loadDraftValues();

      this.form = createForm({
        onSubmit: this.onSubmit,
        initialValues: draftValues,
        validate: (values: Record<string, any>) => this.validateForm(values),

      });


      formElem.addEventListener("submit", (event) => {
        event.preventDefault();
        this.form?.submit();
      });

      Array.from(formElem.elements).forEach(input => {
        const fieldConfig = getFieldConfig(input);
        if (fieldConfig.type !== UNKNOWN_TYPE) {
          this.registerField(fieldConfig, input);
        }
      });

      this.dynamic.updateConditionalFields();
      void this.dynamic.refreshRemoteOptions();

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
  ) => {
    if (this.workflowState === nextState) {
      return;
    }

    this.workflowState = nextState;
    this.emitFormEvent("form-ui:workflow-state", {
      ...detail,
      response,
      result: {
        state: nextState,
        approvalState: this.approvalState,
      },
    });
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
    const errors = this.engine.validateValues(values);

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
    response?: Response,
  ) => {
    const action = this.formConfig?.submit?.action;
    if (
      (action !== "approval-request" && action !== "approval-decision") ||
      !result ||
      typeof result !== "object"
    ) {
      return;
    }

    const status = typeof result.status === "string" ? result.status : "";
    this.approvalState = {
      status: status || "unknown",
      approvalId:
        typeof result.approvalId === "string"
          ? result.approvalId
          : this.approvalState?.approvalId,
      result,
    };
    this.emitFormEvent("form-ui:approval-state", {
      ...detail,
      response,
      result: this.approvalState,
    });
    this.syncApprovalStateFields();

    if (status === "pending_approval") {
      this.setWorkflowState("pending_approval", detail, response, result);
      this.emitFormEvent("form-ui:approval-requested", {
        ...detail,
        response,
        result,
      });
      return;
    }

    if (status === "approved" || status === "completed") {
      this.setWorkflowState(status as "approved" | "completed", detail, response, result);
      this.emitFormEvent("form-ui:approval-complete", {
        ...detail,
        response,
        result,
      });
      return;
    }

    if (status === "rejected") {
      this.setWorkflowState("rejected", detail, response, result);
    }
  }

  onSubmit = async (values: Record<string, any>) => {
    const formValues = this.engine.buildSubmissionValues(
      values,
      Boolean(this.formConfig?.submit?.includeDocumentData),
      this.formConfig?.submit?.documentDataMode || "full",
      this.formConfig?.submit?.documentFieldPaths,
    );
    const detail: TFormUISubmitDetail = {
      values: formValues,
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
    };
    const shouldContinue = this.emitFormEvent("form-ui:submit", detail, true);

    if (!shouldContinue) {
      return;
    }
    this.setWorkflowState("submitting", detail);

    if (!this.formConfig?.submit?.endpoint) {
      this.clearDraft();
      this.setWorkflowState("submitted", detail);
      this.emitFormEvent("form-ui:submit-success", detail);
      return;
    }

    try {
      const { response, result } = await this.submitToApi(formValues, this.formConfig.submit);
      this.emitFormEvent("form-ui:submit-success", {
        ...detail,
        response,
        result,
      });
      if (this.formConfig?.submit?.action !== "approval-request" && this.formConfig?.submit?.action !== "approval-decision") {
        this.setWorkflowState("submitted", detail, response, result);
      }
      this.clearDraft();
      this.emitApprovalStateEvents(detail, result, response);
      const providerSuccessEvent = getProviderSuccessEventName(this.formConfig?.submit?.action);
      if (providerSuccessEvent) {
        this.emitFormEvent(providerSuccessEvent, {
          ...detail,
          response,
          result,
        });
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

      this.emitFormEvent("form-ui:submit-error", {
        ...detail,
        response: error?.response,
        result: error?.result,
        error,
      });
      this.setWorkflowState("error", detail, error?.response, error?.result);
      const providerErrorEvent = getProviderErrorEventName(this.formConfig?.submit?.action);
      if (providerErrorEvent) {
        this.emitFormEvent(providerErrorEvent, {
          ...detail,
          response: error?.response,
          result: error?.result,
          error,
        });
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


        if (!this.registered[name]) {
          // first time, register event listeners
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
          if (selectionElement) {
            selectionElement.addEventListener("click", (event) => {
              const target = event.target as HTMLElement | null;
              const qrAction = target?.closest("[data-qr-action]") as HTMLElement | null;
              if (qrAction) {
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

              const fileIndex = Number(removeButton.getAttribute("data-remove-file-index"));
              if (Number.isNaN(fileIndex)) {
                return;
              }

              this.removeSelectedFile(name, fileIndex);
            });
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
          this.registered[name] = true;
          this.engine.setField(name, fieldConfig);
        }

        // update value
        if (input.type === "checkbox") {
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

        // show/hide errors
        if (errorElement && inputElement) {
          if (touched && error) {
            const errorClass = getErrorClass(inputElement)
            errorElement.innerHTML = (error as TValidationError).errorMessage;
            errorElement.style.display = "block";
            inputElement.classList.add(errorClass);
            this.errors[name] = true;
          } else {
            if (this.errors[name]) {
              errorElement.innerHTML = "";
              errorElement.style.display = "none";
              const errorClass = getErrorClass(inputElement)
              inputElement.classList.remove(errorClass);
            }
            this.errors[name] = false;
          }
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
