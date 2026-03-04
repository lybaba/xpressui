import TFieldConfig from "./TFieldConfig";
import TFormConfig, { TFormSubmitRequest } from "./TFormConfig";
import { FormDynamicRuntime, TFormActiveTemplateWarning } from "./form-dynamic";
import { FormEngineRuntime } from "./form-engine";
import {
  FormPersistenceRuntime,
  TFormQueueState,
  TFormStorageSnapshot,
} from "./form-persistence";
import { submitFormValues } from "./form-submit";

export type TFormRuntimeSubmitResult = {
  response: Response;
  result: any;
};

export type TFormRuntimeEmitEvent = (
  eventName: string,
  detail: Record<string, any>,
) => boolean;

export type TFormRuntimeSubmitValues = (
  values: Record<string, any>,
  submitConfig: TFormSubmitRequest,
) => Promise<TFormRuntimeSubmitResult>;

export type TFormRuntimeDynamicAdapters = {
  getFieldContainer(fieldName: string): HTMLElement | null;
  getFieldElement(
    fieldName: string,
  ): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  getFieldValue(fieldName: string): any;
  clearFieldValue(fieldName: string): void;
};

export type TFormRuntimeOptions = {
  getValues?: () => Record<string, any>;
  emitEvent?: TFormRuntimeEmitEvent;
  submitValues?: TFormRuntimeSubmitValues;
  dynamic?: TFormRuntimeDynamicAdapters;
};

function noopEmitEvent(): boolean {
  return true;
}

export type TFormRuntimePublicApi = Pick<
  FormRuntime,
  | "setFormConfig"
  | "setField"
  | "getFields"
  | "normalizeValues"
  | "validateValues"
  | "loadDraftValues"
  | "saveDraft"
  | "clearDraft"
  | "scheduleDraftSave"
  | "shouldUseQueue"
  | "enqueueSubmission"
  | "getQueueState"
  | "getStorageSnapshot"
  | "clearDeadLetterQueue"
  | "requeueDeadLetterEntry"
  | "replayDeadLetterEntry"
  | "flushSubmissionQueue"
  | "connectPersistence"
  | "disconnectPersistence"
  | "updateConditionalFields"
  | "refreshRemoteOptions"
  | "getActiveTemplateWarnings"
>;

export class FormRuntime {
  formConfig: TFormConfig | null;
  engine: FormEngineRuntime;
  persistence: FormPersistenceRuntime;
  dynamic: FormDynamicRuntime | null;
  options: Required<Pick<TFormRuntimeOptions, "emitEvent" | "getValues" | "submitValues">>;

  constructor(formConfig: TFormConfig | null = null, options: TFormRuntimeOptions = {}) {
    this.formConfig = null;
    this.engine = new FormEngineRuntime();
    this.options = {
      emitEvent: options.emitEvent || noopEmitEvent,
      getValues: options.getValues || (() => ({})),
      submitValues: options.submitValues || submitFormValues,
    };
    this.persistence = new FormPersistenceRuntime({
      getFormConfig: () => this.formConfig,
      getValues: () => this.options.getValues(),
      emitEvent: (eventName, detail) => this.options.emitEvent(eventName, detail),
      submitValues: (values, submitConfig) => this.options.submitValues(values, submitConfig),
    });
    this.dynamic = options.dynamic
      ? new FormDynamicRuntime({
          getFieldConfigs: () => Object.values(this.engine.getFields()),
          getRules: () => this.formConfig?.rules || [],
          getFieldContainer: (fieldName) => options.dynamic!.getFieldContainer(fieldName),
          getFieldElement: (fieldName) => options.dynamic!.getFieldElement(fieldName),
          setFieldDisabled: (fieldName, disabled) => {
            const fieldElement = options.dynamic!.getFieldElement(fieldName);
            if (fieldElement) {
              fieldElement.disabled = disabled;
            }
          },
          getFieldValue: (fieldName) => options.dynamic!.getFieldValue(fieldName),
          clearFieldValue: (fieldName) => options.dynamic!.clearFieldValue(fieldName),
          setFieldValue: (fieldName, value) => {
            options.dynamic!.clearFieldValue(fieldName);
            const fieldElement = options.dynamic!.getFieldElement(fieldName);
            if (fieldElement) {
              if (fieldElement instanceof HTMLInputElement && fieldElement.type === "checkbox") {
                fieldElement.checked = Boolean(value);
              } else {
                fieldElement.value = value === undefined ? "" : String(value);
              }
            }
          },
          getFormValues: () => this.options.getValues(),
          emitEvent: (eventName, detail) => this.options.emitEvent(eventName, detail),
          getEventContext: () => ({
            formConfig: this.formConfig,
            submit: this.formConfig?.submit,
          }),
        })
      : null;

    this.setFormConfig(formConfig);
  }

  setFormConfig(formConfig: TFormConfig | null): void {
    this.formConfig = formConfig;
    this.engine.setFormConfig(formConfig);
    this.persistence.setFormConfig(formConfig);
  }

  setField(fieldName: string, fieldConfig: TFieldConfig): void {
    this.engine.setField(fieldName, fieldConfig);
  }

  getFields(): Record<string, TFieldConfig> {
    return this.engine.getFields();
  }

  normalizeValues(values: Record<string, any>): Record<string, any> {
    return this.engine.normalizeValues(values);
  }

  validateValues(values: Record<string, any>): Record<string, any> {
    return this.engine.validateValues(values);
  }

  loadDraftValues(): Record<string, any> {
    return this.persistence.loadDraftValues();
  }

  saveDraft(values?: Record<string, any>): void {
    this.persistence.saveDraft(values);
  }

  clearDraft(): void {
    this.persistence.clearDraft();
  }

  scheduleDraftSave(): void {
    this.persistence.scheduleDraftSave();
  }

  shouldUseQueue(): boolean {
    return this.persistence.shouldUseQueue();
  }

  enqueueSubmission(values: Record<string, any>): void {
    this.persistence.enqueueSubmission(values);
  }

  getQueueState(): TFormQueueState {
    return this.persistence.getQueueState();
  }

  getStorageSnapshot(): TFormStorageSnapshot {
    return this.persistence.getStorageSnapshot();
  }

  clearDeadLetterQueue(): void {
    this.persistence.clearDeadLetterQueue();
  }

  requeueDeadLetterEntry(entryId: string): boolean {
    return this.persistence.requeueDeadLetterEntry(entryId);
  }

  replayDeadLetterEntry(entryId: string): Promise<boolean> {
    return this.persistence.replayDeadLetterEntry(entryId);
  }

  flushSubmissionQueue(): Promise<void> {
    return this.persistence.flushSubmissionQueue();
  }

  connectPersistence(): void {
    this.persistence.connect();
  }

  disconnectPersistence(): void {
    this.persistence.disconnect();
  }

  updateConditionalFields(): void {
    this.dynamic?.updateConditionalFields();
  }

  refreshRemoteOptions(sourceFieldName?: string): Promise<void> {
    if (!this.dynamic) {
      return Promise.resolve();
    }

    return this.dynamic.refreshRemoteOptions(sourceFieldName);
  }

  getActiveTemplateWarnings(): TFormActiveTemplateWarning[] {
    return this.dynamic?.getActiveTemplateWarnings() || [];
  }
}
