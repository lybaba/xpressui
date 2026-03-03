import { createForm, FormApi } from "final-form";
import TFormConfig, { TFormSubmitRequest } from "./common/TFormConfig";
import { TValidator } from "./common/Validator";
import getFormConfig, { getErrorClass, getFieldConfig } from "./dom-utils";
import TFieldConfig from "./common/TFieldConfig";
import { FormEngineRuntime } from "./common/form-engine";
import { UNKNOWN_TYPE } from "./common/field";
import { FormDynamicRuntime } from "./common/form-dynamic";
import {
  FormPersistenceRuntime,
  TFormQueueState,
  TFormStorageSnapshot,
} from "./common/form-persistence";
import { FormRuntime } from "./common/form-runtime";
import { validatePublicFormConfig } from "./common/public-schema";
import {
  getProviderErrorEventName,
  getProviderSuccessEventName,
  registerProvider,
} from "./common/provider-registry";
import { submitFormValues } from "./common/form-submit";
export {
  createFormConfig,
  createTemplateMarkup,
  mountFormUI,
} from "./common/form-builder";
export { createLocalFormAdmin } from "./common/form-admin";
export { FormEngineRuntime } from "./common/form-engine";
export { FormDynamicRuntime } from "./common/form-dynamic";
export { FormPersistenceRuntime } from "./common/form-persistence";
export { FormRuntime } from "./common/form-runtime";
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
export type { TFormQueueState, TFormStorageSnapshot } from "./common/form-persistence";

export type TFormUISubmitDetail = {
  values: Record<string, any>;
  formConfig: TFormConfig | null;
  submit?: TFormSubmitRequest;
  response?: Response;
  result?: any;
  error?: unknown;
};

export class FormUI extends HTMLElement {
  form: FormApi<any, any> | null;
  registered: Record<string, boolean>;
  formConfig: TFormConfig | null;
  engine: FormEngineRuntime;
  errors: Record<string, boolean>;
  initialized: boolean;
  dynamic: FormDynamicRuntime;
  persistence: FormPersistenceRuntime;

  constructor() {
    super();
    this.formConfig = null;
    this.engine = new FormEngineRuntime();
    this.registered = {};
    this.errors = {}
    this.form = null;
    this.initialized = false;
    this.dynamic = new FormDynamicRuntime({
      getFieldConfigs: () => Object.values(this.engine.getFields()),
      getFieldContainer: (fieldName) => this.getFieldContainer(fieldName),
      getFieldElement: (fieldName) => this.getFieldElement(fieldName),
      getFieldValue: (fieldName) => this.getFieldValue(fieldName),
      clearFieldValue: (fieldName) => {
        if (this.form) {
          this.form.change(fieldName, undefined);
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
    this.persistence.disconnect();
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

  validateForm = (values: Record<string, any>) => {
    return this.engine.validateValues(values);
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
    return submitFormValues(formValues, submitConfig);
  }

  onSubmit = async (values: Record<string, any>) => {
    const formValues = this.engine.normalizeValues(values);
    const detail: TFormUISubmitDetail = {
      values: formValues,
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
    };
    const shouldContinue = this.emitFormEvent("form-ui:submit", detail, true);

    if (!shouldContinue) {
      return;
    }

    if (!this.formConfig?.submit?.endpoint) {
      this.clearDraft();
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
      this.clearDraft();
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
        const inputElement = this.querySelector(`#${name}`) as HTMLElement | null;


        if (!this.registered[name]) {
          // first time, register event listeners
          input.addEventListener("blur", () => blur());
          input.addEventListener("input", (event: any) => {
            const nextValue =
              input.type === "checkbox"
                ? (<HTMLInputElement>event.target)?.checked
                : (<HTMLInputElement>event.target)?.value;
            change(nextValue);
            this.scheduleDraftSave();
            this.updateConditionalFields();
            void this.refreshRemoteOptions(name);
          });
          input.addEventListener("change", () => {
            this.scheduleDraftSave();
            this.updateConditionalFields();
            void this.refreshRemoteOptions(name);
          });
          input.addEventListener("focus", () => focus());
          this.registered[name] = true;
          this.engine.setField(name, fieldConfig);
        }

        // update value
        if (input.type === "checkbox") {
          (<HTMLInputElement>input).checked = value;
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
