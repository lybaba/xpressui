import { buildSchema } from "./post";
import TFormConfig, { MULTI_STEP_FORM_TYPE } from "./TFormConfig";
import { ajv } from './frontend';
import { ValidateFunction } from "ajv";
import parseErrors from "./parse-errors";

export function getValidators(formConfig: TFormConfig): ValidateFunction<unknown>[] {
    const res: ValidateFunction<unknown>[] = [];
    if (formConfig.type !== MULTI_STEP_FORM_TYPE) {
        const schema = buildSchema(formConfig);
        const validator = ajv.compile(schema);
        res.push(validator);
    }

    return res;
}

export default function validate(
    validator: ValidateFunction<unknown>,
    formValues: Record<string, any>) {
    
    validator(formValues);

    const errors = parseErrors(validator.errors);

    console.log(errors);

    return errors;
}