import { buildSchema } from "./post";
import TFormConfig, { MULTI_STEP_FORM_TYPE } from "./TFormConfig";
import { ajv } from './frontend';
import { ValidateFunction } from "ajv";
import parseErrors, { REQUIRED_FIELD_MSG } from "./parse-errors";
import TFieldConfig from "./TFieldConfig";
import { getBooleanValue } from "./field";
import { isEmpty } from "lodash";

export type TValidator = {
    validate: ValidateFunction<unknown>;
    fieldMap: Record<string, TFieldConfig>;
}

export function getValidators(formConfig: TFormConfig): TValidator[] {
    const res: TValidator[] = [];
    if (formConfig.type !== MULTI_STEP_FORM_TYPE) {
        const {
            ajvSchema,
            fieldMap
        } = buildSchema(formConfig);
        const validate = ajv.compile(ajvSchema);
        res.push({
            validate,
            fieldMap
        });
    }

    return res;
}

export default function validate(
    validator: TValidator,
    formValues: Record<string, any>) {
    
    validator.validate(formValues);

    const errors = parseErrors(validator.validate.errors, validator.fieldMap);

    for (const [fieldName, fieldConfig] of Object.entries(validator.fieldMap)) {
        const required = getBooleanValue(fieldConfig.required);
        if (required && isEmpty(formValues[fieldName]) && !errors[fieldName]) {
            errors[fieldName] =  fieldConfig.errorMsg || REQUIRED_FIELD_MSG;
        }
    }
    
    console.log(errors);

    return errors;
}