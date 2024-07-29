import { isEmpty } from "lodash";
import TFieldConfig from "../../types/TFieldConfig";
import TChoice from "../../types/TChoice";
import TPostConfig from "../../types/TPostConfig";
import { CHECKBOX_TYPE, DATETIME_TYPE, EMAIL_TYPE, MULTI_SELECT_TYPE, NUMBER_TYPE, PASSWORD_TYPE, PRICE_TYPE, SINGLE_SELECT_TYPE, TEL_TYPE, TEXTAREA_TYPE, TEXT_TYPE, URL_TYPE } from "../field";
import { ValidateFunction } from "ajv";
import parseErrors from "../parse-errors";
import { getSectionByIndex } from "../post";

type ValidatorProps = {
    validator: ValidateFunction<any>;
    postConfig: TPostConfig;
    values: Record<string, any>;
}


function toAjvFieldType(fieldConfig: TFieldConfig): object | null {
    const res: any = {};

    switch (fieldConfig.type) {
        case NUMBER_TYPE:
            res.type = "int32";
            break;

        case PRICE_TYPE:
            res.type = "float32";
            break;

        case CHECKBOX_TYPE:
            res.type = "boolean";
            break;

        case SINGLE_SELECT_TYPE:
        case MULTI_SELECT_TYPE:
            if (isEmpty(fieldConfig.choices))
                return null;
            
            res.enum = fieldConfig.choices.map((opt: TChoice) => opt.name);
            break;


        case TEXT_TYPE:
        case TEXTAREA_TYPE:
        case EMAIL_TYPE:
        case PASSWORD_TYPE:
        case TEL_TYPE:
        case URL_TYPE:
        case DATETIME_TYPE:
            res.type = "string";
            break;

        default:
            return res;
    }


    if (fieldConfig.type === EMAIL_TYPE)
        res.format = "email";

    if (fieldConfig.pattern)
        res.pattern = fieldConfig.pattern;

    if (fieldConfig.minLen)
        res.minLength = Number(fieldConfig.minLen);

    if (fieldConfig.maxLen)
        res.maxLength = Number(fieldConfig.maxLen);


    return res;
}


export function buildSchema(postConfig: TPostConfig, sectionIdex: number): object {
    const currentSection = getSectionByIndex(postConfig, sectionIdex);
    
    const fields: TFieldConfig[] = currentSection && postConfig.fields.hasOwnProperty(currentSection.name) 
                                    ? postConfig.fields[currentSection.name] : [];

    const required: string[] = [];
    const errorMessage: Record<string, string> = {};
    const properties: Record<string, any> = {};

    fields.forEach((fieldConfig: TFieldConfig) => {
        const ajvType = toAjvFieldType(fieldConfig);
        if (!isEmpty(ajvType)) {
            properties[fieldConfig.name] = ajvType;

            if (fieldConfig.required)
                required.push(fieldConfig.name);

            if (fieldConfig.errorMsg)
                errorMessage[fieldConfig.name] = fieldConfig.errorMsg;
        }
    });

    const requiredProps = !isEmpty(required) ? { required } : {};

    const errorMessageProps = !isEmpty(errorMessage) ? { errorMessage: { properties: errorMessage } } : {}

    return {
        type: "object",
        properties,
        ...requiredProps,
        additionalProperties: true,
        ...errorMessageProps
    };
}

export default function validate(props: ValidatorProps): Record<string, string> {
    const {
        validator,
        values
    } = props;
    console.log("___validator ", validator);
    console.log("___values ", values);
    validator(values);
    const errors = parseErrors(validator.errors);
    console.log("___errors ", errors);

    return errors;
}