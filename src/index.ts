import { createForm, FormApi } from "final-form";
import TFormConfig, { TFormSubmitRequest } from "./common/TFormConfig";
import validate, { getValidators, TValidator } from "./common/Validator";
import getFormConfig, { getErrorClass, getFieldConfig } from "./dom-utils";
import TFieldConfig from "./common/TFieldConfig";
import { normalizeFormValues, UNKNOWN_TYPE } from "./common/field";
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


export class FormUI extends HTMLElement {
  form: FormApi<any, any> | null;
  registered: Record<string, boolean>;
  validators: TValidator[];
  formConfig: TFormConfig | null;
  inputFields: Record<string, TFieldConfig>;
  errors: Record<string, boolean>;
  initialized: boolean;

  constructor() {
    super();
    this.formConfig = null;
    this.validators = [];
    this.registered = {};
    this.inputFields = {};
    this.errors = {}
    this.form = null;
    this.initialized = false;
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

    if (method === "GET") {
      const searchParams = new URLSearchParams();
      Object.entries(formValues).forEach(([key, value]) => {
        searchParams.set(key, String(value));
      });
      const query = searchParams.toString();
      if (query) {
        url += (url.includes("?") ? "&" : "?") + query;
      }
    } else if (mode === "form-data") {
      const body = new FormData();
      Object.entries(formValues).forEach(([key, value]) => {
        body.append(key, String(value));
      });
      init.body = body;
    } else {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
      init.body = JSON.stringify(formValues);
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
          input.addEventListener("input", (event: any) =>
            change(
              input.type === "checkbox"
                ? (<HTMLInputElement>event.target)?.checked
                : (<HTMLInputElement>event.target)?.value
            ),
          );
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
