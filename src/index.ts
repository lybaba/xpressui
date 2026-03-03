import { createForm, FormApi } from "final-form";
import TFormConfig, { TFormSubmitRequest } from "./common/TFormConfig";
import validate, { getValidators, TValidator } from "./common/Validator";
import getFormConfig, { getErrorClass, getFieldConfig } from "./dom-utils";
import TFieldConfig from "./common/TFieldConfig";
import { normalizeFormValues, UNKNOWN_TYPE } from "./common/field";
import TChoice from "./common/TChoice";
import {
  createStorageAdapter,
  TFormStorageAdapter,
  TQueuedSubmission,
} from "./common/form-storage";
export {
  createFormConfig,
  createTemplateMarkup,
  mountFormUI,
} from "./common/form-builder";

export type TFormUISubmitDetail = {
  values: Record<string, any>;
  formConfig: TFormConfig | null;
  submit?: TFormSubmitRequest;
  response?: Response;
  result?: any;
  error?: unknown;
};

type TFormUIRemoteOptionsDetail = {
  field: string;
  options: TChoice[];
  sourceField?: string;
};

type TFormUIQueueState = {
  queueLength: number;
  deadLetterLength: number;
  nextAttemptAt?: number;
  attempts?: number;
};


export class FormUI extends HTMLElement {
  form: FormApi<any, any> | null;
  registered: Record<string, boolean>;
  validators: TValidator[];
  formConfig: TFormConfig | null;
  inputFields: Record<string, TFieldConfig>;
  errors: Record<string, boolean>;
  initialized: boolean;
  loadingOptions: Record<string, boolean>;
  storageAdapter: TFormStorageAdapter | null;
  draftSaveTimer: number | null;
  syncInFlight: boolean;
  onlineHandler: (() => void) | null;

  constructor() {
    super();
    this.formConfig = null;
    this.validators = [];
    this.registered = {};
    this.inputFields = {};
    this.errors = {}
    this.form = null;
    this.initialized = false;
    this.loadingOptions = {};
    this.storageAdapter = null;
    this.draftSaveTimer = null;
    this.syncInFlight = false;
    this.onlineHandler = null;
  }

  connectedCallback() {
    if (!this.initialized) {
      this.initialize();
    }
  }

  disconnectedCallback() {
    if (this.draftSaveTimer !== null) {
      window.clearTimeout(this.draftSaveTimer);
      this.draftSaveTimer = null;
    }

    if (this.onlineHandler) {
      window.removeEventListener("online", this.onlineHandler);
      this.onlineHandler = null;
    }
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
      this.formConfig = getFormConfig(formElem);
      this.validators = getValidators(this.formConfig);
      this.storageAdapter = createStorageAdapter(this.formConfig);
      const draftValues = this.storageAdapter?.loadDraft() || {};

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

      this.updateConditionalFields();
      this.refreshRemoteOptions();

      if (!this.onlineHandler) {
        this.onlineHandler = () => {
          void this.flushSubmissionQueue();
        };
        window.addEventListener("online", this.onlineHandler);
      }

      void this.flushSubmissionQueue();

      if (Object.keys(draftValues).length) {
        this.emitFormEvent("form-ui:draft-restored", {
          values: draftValues,
          formConfig: this.formConfig,
          submit: this.formConfig?.submit,
        });
      }

      this.emitQueueState();
    }
  }

  getDraftAutoSaveMs = () => {
    return this.formConfig?.storage?.autoSaveMs ?? 300;
  }

  getRetryDelayMs = (attempts: number) => {
    const baseDelayMs = 1000;
    const maxDelayMs = 30000;
    return Math.min(baseDelayMs * Math.pow(2, Math.max(0, attempts - 1)), maxDelayMs);
  }

  getMaxRetryAttempts = () => {
    return 3;
  }

  saveDraft = (values?: Record<string, any>) => {
    if (!this.storageAdapter) {
      return;
    }

    const draftValues = values || this.form?.getState().values || {};
    this.storageAdapter.saveDraft(draftValues);
    this.emitFormEvent("form-ui:draft-saved", {
      values: draftValues,
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
    });
  }

  scheduleDraftSave = () => {
    if (!this.storageAdapter) {
      return;
    }

    if (this.draftSaveTimer !== null) {
      window.clearTimeout(this.draftSaveTimer);
    }

    this.draftSaveTimer = window.setTimeout(() => {
      this.saveDraft();
      this.draftSaveTimer = null;
    }, this.getDraftAutoSaveMs());
  }

  clearDraft = () => {
    if (!this.storageAdapter) {
      return;
    }

    if (this.draftSaveTimer !== null) {
      window.clearTimeout(this.draftSaveTimer);
      this.draftSaveTimer = null;
    }

    this.storageAdapter.clearDraft();
    this.emitFormEvent("form-ui:draft-cleared", {
      values: {},
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
    });
  }

  shouldUseQueue = () => {
    const mode = this.formConfig?.storage?.mode;
    return mode === "queue" || mode === "draft-and-queue";
  }

  enqueueSubmission = (values: Record<string, any>) => {
    if (!this.storageAdapter || !this.shouldUseQueue()) {
      return;
    }

    const queue = this.storageAdapter.enqueueSubmission(values);
    const nextEntry = queue[0];
    this.emitFormEvent("form-ui:queued", {
      values,
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
      result: {
        queueLength: queue.length,
        deadLetterLength: this.storageAdapter.loadDeadLetterQueue().length,
        nextAttemptAt: nextEntry?.nextAttemptAt,
        attempts: nextEntry?.attempts,
      } satisfies TFormUIQueueState,
    });
    this.emitQueueState();
  }

  getQueueState = (): TFormUIQueueState => {
    const queue = this.storageAdapter?.loadQueue() || [];
    const nextEntry = queue[0];
    return {
      queueLength: queue.length,
      deadLetterLength: this.storageAdapter?.loadDeadLetterQueue().length || 0,
      nextAttemptAt: nextEntry?.nextAttemptAt,
      attempts: nextEntry?.attempts,
    };
  }

  emitQueueState = () => {
    if (!this.shouldUseQueue()) {
      return;
    }

    this.emitFormEvent("form-ui:queue-state", {
      values: this.form?.getState().values || {},
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
      result: this.getQueueState(),
    });
  }

  getStorageSnapshot = () => {
    return {
      draft: this.storageAdapter?.loadDraft() || null,
      queue: this.storageAdapter?.loadQueue() || [],
      deadLetter: this.storageAdapter?.loadDeadLetterQueue() || [],
    };
  }

  clearDeadLetterQueue = () => {
    if (!this.storageAdapter) {
      return;
    }

    this.storageAdapter.clearDeadLetterQueue();
    this.emitFormEvent("form-ui:dead-letter-cleared", {
      values: {},
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
      result: this.getQueueState(),
    });
    this.emitQueueState();
  }

  requeueDeadLetterEntry = (entryId: string) => {
    if (!this.storageAdapter) {
      return false;
    }

    const entry = this.storageAdapter.removeDeadLetterEntry(entryId);
    if (!entry) {
      return false;
    }

    const resetEntry: Record<string, any> = entry.values;
    const queue = this.storageAdapter.enqueueSubmission(resetEntry);
    this.emitFormEvent("form-ui:dead-letter-requeued", {
      values: resetEntry,
      formConfig: this.formConfig,
      submit: this.formConfig?.submit,
      result: {
        queueLength: queue.length,
        deadLetterLength: this.storageAdapter.loadDeadLetterQueue().length,
        entryId,
      },
    });
    this.emitQueueState();
    return true;
  }

  replayDeadLetterEntry = async (entryId: string) => {
    if (!this.storageAdapter || !this.formConfig?.submit?.endpoint) {
      return false;
    }

    const entry = this.storageAdapter.removeDeadLetterEntry(entryId);
    if (!entry) {
      return false;
    }

    try {
      const { response, result } = await this.submitToApi(entry.values, this.formConfig.submit);
      this.emitFormEvent("form-ui:dead-letter-replayed-success", {
        values: entry.values,
        formConfig: this.formConfig,
        submit: this.formConfig.submit,
        response,
        result,
      });
      this.emitQueueState();
      return true;
    } catch (error: any) {
      const replayEntry: TQueuedSubmission = {
        ...entry,
        attempts: entry.attempts + 1,
        updatedAt: Date.now(),
        nextAttemptAt: Date.now() + this.getRetryDelayMs(entry.attempts + 1),
        lastError: error?.result?.message || error?.message || "replay_error",
      };
      const deadLetter = this.storageAdapter.enqueueDeadLetter(replayEntry);
      this.emitFormEvent("form-ui:dead-letter-replayed-error", {
        values: entry.values,
        formConfig: this.formConfig,
        submit: this.formConfig.submit,
        response: error?.response,
        result: {
          deadLetterLength: deadLetter.length,
          entry: replayEntry,
        },
        error,
      });
      this.emitQueueState();
      return false;
    }
  }

  flushSubmissionQueue = async () => {
    if (
      !this.storageAdapter ||
      !this.formConfig?.submit?.endpoint ||
      !this.shouldUseQueue() ||
      this.syncInFlight
    ) {
      return;
    }

    const pending = this.storageAdapter.loadQueue();
    if (!pending.length) {
      return;
    }

    this.syncInFlight = true;
    try {
      while (true) {
        const entry = this.storageAdapter.loadQueue()[0];
        if (!entry) {
          this.emitQueueState();
          break;
        }

        if (entry.nextAttemptAt > Date.now()) {
          break;
        }

        try {
          const { response, result } = await this.submitToApi(entry.values, this.formConfig.submit);
          this.storageAdapter.dequeueSubmission();
          this.emitFormEvent("form-ui:sync-success", {
            values: entry.values,
            formConfig: this.formConfig,
            submit: this.formConfig.submit,
            response,
            result,
          });
          this.emitQueueState();
        } catch (error: any) {
          const attempts = entry.attempts + 1;
          const nextEntry: TQueuedSubmission = {
            ...entry,
            attempts,
            updatedAt: Date.now(),
            nextAttemptAt: Date.now() + this.getRetryDelayMs(attempts),
            lastError: error?.result?.message || error?.message || "sync_error",
          };
          if (attempts >= this.getMaxRetryAttempts()) {
            this.storageAdapter.dequeueSubmission();
            const deadLetter = this.storageAdapter.enqueueDeadLetter(nextEntry);
            this.emitFormEvent("form-ui:dead-lettered", {
              values: entry.values,
              formConfig: this.formConfig,
              submit: this.formConfig.submit,
              response: error?.response,
              result: {
                deadLetterLength: deadLetter.length,
                entry: nextEntry,
              },
              error,
            });
          } else {
            this.storageAdapter.updateQueueEntry(nextEntry);
          }
          this.emitFormEvent("form-ui:sync-error", {
            values: entry.values,
            formConfig: this.formConfig,
            submit: this.formConfig.submit,
            response: error?.response,
            result: error?.result,
            error,
          });
          this.emitQueueState();
          break;
        }
      }
    } finally {
      this.syncInFlight = false;
    }
  }

  validateForm = (values: Record<string, any>) => {
    if (this.validators.length) {
      const validator = this.validators[0];
      const formValues = normalizeFormValues(this.inputFields, values);
      return validate(validator, formValues);
    }

    return {}
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
    const method = submitConfig.method || "POST";
    const mode = submitConfig.mode || "json";
    const headers = { ...(submitConfig.headers || {}) };
    let url = submitConfig.endpoint;
    const init: RequestInit = { method, headers };

    const payload =
      submitConfig.action === "reservation"
        ? {
            action: "reservation",
            reservation: formValues,
          }
        : submitConfig.action === "payment"
          ? {
              action: "payment",
              payment: formValues,
            }
          : submitConfig.action === "payment-stripe"
            ? {
                action: "payment-stripe",
                payment: formValues,
              }
        : formValues;

    if (method === "GET") {
      const searchParams = new URLSearchParams();
      Object.entries(payload).forEach(([key, value]) => {
        searchParams.set(key, String(value));
      });
      const query = searchParams.toString();
      if (query) {
        url += (url.includes("?") ? "&" : "?") + query;
      }
    } else if (mode === "form-data") {
      const body = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        body.append(key, String(value));
      });
      init.body = body;
    } else {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      init.body = JSON.stringify(payload);
    }

    const response = await fetch(url, init);
    const contentType = response.headers.get("content-type") || "";
    let result: any = null;

    if (contentType.includes("application/json")) {
      result = await response.json();
    } else if (contentType.startsWith("text/")) {
      result = await response.text();
    }

    if (!response.ok) {
      throw { response, result };
    }

    return { response, result };
  }

  onSubmit = async (values: Record<string, any>) => {
    const formValues = normalizeFormValues(this.inputFields, values);
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
      if (this.formConfig?.submit?.action === "reservation") {
        this.emitFormEvent("form-ui:reservation-success", {
          ...detail,
          response,
          result,
        });
      } else if (this.formConfig?.submit?.action === "payment") {
        this.emitFormEvent("form-ui:payment-success", {
          ...detail,
          response,
          result,
        });
      } else if (this.formConfig?.submit?.action === "payment-stripe") {
        this.emitFormEvent("form-ui:payment-stripe-success", {
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
      if (this.formConfig?.submit?.action === "payment") {
        this.emitFormEvent("form-ui:payment-error", {
          ...detail,
          response: error?.response,
          result: error?.result,
          error,
        });
      } else if (this.formConfig?.submit?.action === "payment-stripe") {
        this.emitFormEvent("form-ui:payment-stripe-error", {
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
    Object.values(this.inputFields).forEach((fieldConfig) => {
      if (!fieldConfig.visibleWhenField) {
        return;
      }

      const container = this.getFieldContainer(fieldConfig.name);
      const fieldElement = this.getFieldElement(fieldConfig.name);
      if (!container || !fieldElement) {
        return;
      }

      const currentValue = this.getFieldValue(fieldConfig.visibleWhenField);
      const expectedValue = fieldConfig.visibleWhenEquals;
      const isVisible = expectedValue === undefined
        ? Boolean(currentValue)
        : String(currentValue ?? "") === String(expectedValue);

      container.style.display = isVisible ? "" : "none";
      fieldElement.disabled = !isVisible;
      if (!isVisible && this.form) {
        this.form.change(fieldConfig.name, undefined);
      }
    });
  }

  normalizeRemoteChoices = (payload: any, fieldConfig: TFieldConfig): TChoice[] => {
    const optionList = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.options)
          ? payload.options
          : [];
    const labelKey = fieldConfig.optionsLabelKey || "label";
    const valueKey = fieldConfig.optionsValueKey || "value";

    return optionList
      .map((item: any) => {
        if (typeof item === "string") {
          return { value: item, label: item };
        }

        return {
          value: String(item?.[valueKey] ?? item?.value ?? ""),
          label: String(item?.[labelKey] ?? item?.label ?? item?.[valueKey] ?? ""),
        };
      })
      .filter((choice: TChoice) => Boolean(choice.value));
  }

  populateSelectOptions = (fieldName: string, options: TChoice[]) => {
    const fieldElement = this.getFieldElement(fieldName);
    if (!(fieldElement instanceof HTMLSelectElement)) {
      return;
    }

    const currentValue = fieldElement.value;
    fieldElement.innerHTML = "";

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "";
    fieldElement.appendChild(emptyOption);

    options.forEach((choice) => {
      const option = document.createElement("option");
      option.value = choice.value;
      option.textContent = choice.label;
      fieldElement.appendChild(option);
    });

    if (currentValue && options.some((choice) => choice.value === currentValue)) {
      fieldElement.value = currentValue;
    }

      const result: TFormUIRemoteOptionsDetail = {
        field: fieldName,
        options,
      };

      this.emitFormEvent("form-ui:options-loaded", {
      values: this.form?.getState().values || {},
      formConfig: this.formConfig,
      result,
    });
  }

  refreshRemoteOptions = async (sourceFieldName?: string) => {
    const fieldConfigs = Object.values(this.inputFields).filter(
      (fieldConfig) =>
        Boolean(fieldConfig.optionsEndpoint) &&
        (!sourceFieldName || fieldConfig.optionsDependsOn === sourceFieldName),
    );

    await Promise.all(fieldConfigs.map(async (fieldConfig) => {
      if (this.loadingOptions[fieldConfig.name]) {
        return;
      }

      const dependencyValue = fieldConfig.optionsDependsOn
        ? this.getFieldValue(fieldConfig.optionsDependsOn)
        : undefined;

      if (fieldConfig.optionsDependsOn && !dependencyValue) {
        this.populateSelectOptions(fieldConfig.name, []);
        return;
      }

      this.loadingOptions[fieldConfig.name] = true;
      try {
        let url = fieldConfig.optionsEndpoint as string;
        if (fieldConfig.optionsDependsOn) {
          const query = new URLSearchParams({
            [fieldConfig.optionsDependsOn]: String(dependencyValue),
          }).toString();
          url += (url.includes("?") ? "&" : "?") + query;
        }

        const response = await fetch(url);
        const payload = await response.json();
        const options = this.normalizeRemoteChoices(payload, fieldConfig);
        this.populateSelectOptions(fieldConfig.name, options);
      } catch {
        this.populateSelectOptions(fieldConfig.name, []);
      } finally {
        this.loadingOptions[fieldConfig.name] = false;
      }
    }));
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
          this.inputFields[name] = fieldConfig;
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
