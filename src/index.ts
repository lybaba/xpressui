import { createForm, FormApi } from "final-form";
import TFormConfig from "./common/TFormConfig";
import { ValidateFunction } from "ajv";
import validate, { getValidators } from "./common/Validator";

declare var formConfigMap : Record<string, TFormConfig>;

class FormUI extends HTMLElement {
  form: FormApi<any, any>;
  registered: Record<string, boolean>;
  validators: ValidateFunction<unknown>[];
  formConfig: TFormConfig | null;

  constructor() {
    super();
    this.validators = [];
    this.registered = {};
    this.formConfig = null;

    this.form = createForm({
      onSubmit: this.onSubmit,
      initialValues: {},
      validate: (values: Record<string, any>) => this.validateForm(values)
    })

    //this.attachShadow({ mode: 'open' });
    if ("content" in document.createElement("template")) {
      const name = this.getAttribute("name");
      if (name) {
        if (formConfigMap && formConfigMap.hasOwnProperty(name)) {
          this.formConfig = formConfigMap[name];
          this.validators = getValidators(this.formConfig);
        }

        const template = document.querySelector(`#${name}`) as HTMLTemplateElement;
        if (template) {
          this.appendChild(template?.content.cloneNode(true));

          const formElem = document.querySelector(`#${name}_form`) as HTMLFormElement;
          if (formElem) {
            console.log(111111111111, formElem.elements)
            formElem.addEventListener("submit", (event) => {
              event.preventDefault();
              this.form.submit();
            });

            Array.from(formElem.elements).forEach(input => {
              if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
                this.registerField(input);
              }
            });
          }
        }
      }
    }
  }

  validateForm = (values: Record<string, any>) => {
    if (this.validators.length) {
      const validator = this.validators[0];
      return validate(validator, values);
    }

    return {}
  }

  onSubmit = (values: Record<string, any>) => {
    window.alert(JSON.stringify(values, undefined, 2));
  }

  registerField = (input: HTMLInputElement | HTMLTextAreaElement) => {
    const {
      name
    } = input;

    this.form.registerField(
      name,
      (fieldState) => {
        const { blur, change, error, focus, touched, value } = fieldState;
        const errorElement = document.getElementById(name + "_error");

        if (!this.registered[name]) {
          // first time, register event listeners
          input.addEventListener("blur", () => blur());
          input.addEventListener("input", (event) =>
            change(
              input.type === "checkbox"
                ? (<HTMLInputElement>event.target)?.checked
                : (<HTMLInputElement>event.target)?.value,
            ),
          );
          input.addEventListener("focus", () => focus());
          this.registered[name] = true;
        }

        // update value
        if (input.type === "checkbox") {
          (<HTMLInputElement>input).checked = value;
        } else {
          input.value = value === undefined ? "" : value;
        }

        // show/hide errors
        if (errorElement) {
          if (touched && error) {
            errorElement.innerHTML = error;
            errorElement.style.display = "block";
          } else {
            errorElement.innerHTML = "";
            errorElement.style.display = "none";
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