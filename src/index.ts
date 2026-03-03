import { createForm, FormApi } from "final-form";
import TFormConfig, { TFormSubmitRequest } from "./common/TFormConfig";
import validate, { getValidators, TValidator } from "./common/Validator";
import getFormConfig, { getErrorClass, getFieldConfig } from "./dom-utils";
import TFieldConfig from "./common/TFieldConfig";
import { normalizeFormValues, UNKNOWN_TYPE } from "./common/field";
import TChoice from "./common/TChoice";
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


export class FormUI extends HTMLElement {
  form: FormApi<any, any> | null;
  registered: Record<string, boolean>;
  validators: TValidator[];
  formConfig: TFormConfig | null;
  inputFields: Record<string, TFieldConfig>;
  errors: Record<string, boolean>;
  initialized: boolean;
  loadingOptions: Record<string, boolean>;

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
  }

  connectedCallback() {
    if (!this.initialized) {
      this.initialize();
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

      this.form = createForm({
        onSubmit: this.onSubmit,
        initialValues: {},
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
      if (this.formConfig.provider?.type === "reservation") {
        this.emitFormEvent("form-ui:reservation-success", {
          ...detail,
          response,
          result,
        });
      }
    } catch (error: any) {
      this.emitFormEvent("form-ui:submit-error", {
        ...detail,
        response: error?.response,
        result: error?.result,
        error,
      });
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
            this.updateConditionalFields();
            void this.refreshRemoteOptions(name);
          });
          input.addEventListener("change", () => {
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
