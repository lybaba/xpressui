import { createForm, FormApi } from "final-form";
import TFormConfig from "./common/TFormConfig";
import validate, { getValidators, TValidator } from "./common/Validator";
import getFormConfig, { getErrorClass, getFieldConfig } from "./dom-utils";
import TFieldConfig from "./common/TFieldConfig";
import { normalizeFormValues } from "./common/field";


class FormUI extends HTMLElement {
  form: FormApi<any, any> | null;
  registered: Record<string, boolean>;
  validators: TValidator[];
  formConfig: TFormConfig | null;
  inputFields: Record<string, TFieldConfig>;
  errors: Record<string, boolean>;

  constructor() {
    super();
    this.formConfig = null;
    this.validators = [];
    this.registered = {};
    this.inputFields = {};
    this.errors = {}
    this.form = null;

    let formElem: HTMLFormElement | null = null;

    if ("content" in document.createElement("template")) {
      const name = this.getAttribute("name");
      if (name) {
        const template = document.querySelector(`#${name}`) as HTMLTemplateElement;
        if (template) {
          this.appendChild(template?.content.cloneNode(true));
          formElem = document.querySelector(`#${name}_form`) as HTMLFormElement;
        }
      }
    }


    if (formElem) {
      this.formConfig = getFormConfig(formElem);
      this.validators = getValidators(this.formConfig);

      console.log('formConfig ', this.formConfig)

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
        this.registerField(fieldConfig, input);
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

  onSubmit = (values: Record<string, any>) => {
    const formValues = normalizeFormValues(this.inputFields, values);
    window.alert(JSON.stringify(formValues, undefined, 2));
  }

  registerField = (fieldConfig: TFieldConfig, input: any) => {
    const {
      name
    } = fieldConfig;

    this.form?.registerField(
      name,
      (fieldState) => {
        const { blur, change, error, focus, touched, value } = fieldState;
        const errorElement = document.getElementById(name + "_error");
        const inputElement = document.getElementById(name);


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
            console.log("errrrrrrrrrrrrror ", error)
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

window.customElements.define('form-ui', FormUI);