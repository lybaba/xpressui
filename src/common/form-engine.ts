import TFieldConfig from "./TFieldConfig";
import TFormConfig from "./TFormConfig";
import validate, { getValidators, TValidator } from "./Validator";
import { normalizeFormValues } from "./field";

export class FormEngineRuntime {
  formConfig: TFormConfig | null;
  validators: TValidator[];
  inputFields: Record<string, TFieldConfig>;

  constructor() {
    this.formConfig = null;
    this.validators = [];
    this.inputFields = {};
  }

  setFormConfig(formConfig: TFormConfig | null): void {
    this.formConfig = formConfig;
    this.validators = formConfig ? getValidators(formConfig) : [];
  }

  setField(fieldName: string, fieldConfig: TFieldConfig): void {
    this.inputFields[fieldName] = fieldConfig;
  }

  getField(fieldName: string): TFieldConfig | undefined {
    return this.inputFields[fieldName];
  }

  getFields(): Record<string, TFieldConfig> {
    return this.inputFields;
  }

  normalizeValues(values: Record<string, any>): Record<string, any> {
    return normalizeFormValues(this.inputFields, values);
  }

  validateValues(values: Record<string, any>): Record<string, any> {
    if (!this.validators.length) {
      return {};
    }

    const validator = this.validators[0];
    const formValues = this.normalizeValues(values);
    return validate(validator, formValues);
  }
}
