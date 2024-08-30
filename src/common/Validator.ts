import { buildSchema, getCustomSectionList } from "./post";
import TFormConfig, { MULTI_STEP_FORM_TYPE } from "./TFormConfig";
import { ajv } from './frontend';
import { ValidateFunction } from "ajv";
import parseErrors from "./parse-errors";
import TFieldConfig from "./TFieldConfig";

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
        console.log("ajvSchema  ", ajvSchema)
        const validate = ajv.compile(ajvSchema);
        res.push({
            validate,
            fieldMap
        });
    } else {
        const nbSteps = getCustomSectionList(formConfig).length;
        for (let sectionIndex = 0; sectionIndex < nbSteps; sectionIndex++) {
            const {
                ajvSchema,
                fieldMap
            } = buildSchema(formConfig, sectionIndex);
            const validate = ajv.compile(ajvSchema);
            res.push({
                validate,
                fieldMap
            });
        }
    }

    return res;
}


export default function validate(
    validator: TValidator,
    formValues: Record<string, any>) {
    
    console.log(999999, " ",formValues)
    validator.validate(formValues);

    const errors = parseErrors(validator.validate.errors, validator.fieldMap);
    
    console.log(errors);

    return errors;
}


