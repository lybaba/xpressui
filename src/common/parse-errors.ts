import { ErrorObject } from 'ajv';
import TFieldConfig from './TFieldConfig';

export const REQUIRED_FIELD_MSG = "This field is required.";
export const FIELD_VALUE_TOO_LONG = "Data too long for field (max length : %s Characters)";
export const FIELD_VALUE_TOO_SHORT = "Data too short for field (min length : %s Characters)";

function getErrorLabel(errorKey: string, errorValue: string = "", limit: number = 0) : string {
    switch (errorKey) {
        case 'required':
            return REQUIRED_FIELD_MSG;

        case 'minLength':
            return FIELD_VALUE_TOO_SHORT;

        case 'maxLength':
            return FIELD_VALUE_TOO_LONG;


        default:
            if (errorValue) {
                return errorValue;
            } else {
                return errorKey;
            }
    }
}

export function parseServerErrors(errors: Record<string, string>) : Record<string, string> {
    const res : Record<string, string> = {};
    Object.entries(errors).forEach((value: [string, string], index: number) => {
        const fieldName = value[0];
        const errorTab : Array<string> = value[1].split(':');
        const errorKey = errorTab[0];
        const limit : number = errorTab.length > 1 ? Number(errorTab[1]) : 0;

        res[fieldName] = getErrorLabel(errorKey, "", limit);
    })

    return res;
}



export default function parseErrors(errors : null | undefined | ErrorObject[], fieldMap?: Record<string, TFieldConfig>) : Record<string, TValidationError>  {
    const res : Record<string, TValidationError> = {};

    if (errors) {
        errors.forEach(error => {
            let fieldName : string | null = null;
            let errorMessage : string | null = null;
            console.log(error.keyword, "   ", error)

            if (error.keyword === 'required') {
                fieldName= error.params.missingProperty;
                errorMessage = getErrorLabel(error.keyword);
            } else {
                fieldName = error.instancePath.slice(1);
                errorMessage = error.message || '';
            }

            if (fieldName && errorMessage) {
                const fieldConfig = fieldMap && fieldMap.hasOwnProperty(fieldName) ? fieldMap[fieldName] : null;
                errorMessage = fieldConfig ? fieldConfig.errorMsg || errorMessage : errorMessage;
                res[fieldName] = {
                    errorMessage,
                    errorData: error
                }
            }

        })
    }

    return res;
}