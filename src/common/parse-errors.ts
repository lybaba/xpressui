import { ErrorObject } from 'ajv';

const REQUIRED_FIELD_MSG = "This field is required.";
const FIELD_VALUE_TOO_LONG = "Data too long for field (max length : %s Characters)";
const FIELD_VALUE_TOO_SHORT = "Data too short for field (min length : %s Characters)";

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



export default function parseErrors(errors : null | undefined | ErrorObject[]) : Record<string, string>  {
    const res : Record<string, string> = {};

    if (errors) {
        errors.forEach(error => {
            switch (error.keyword) {
                case 'required':
                    res[error.params.missingProperty] = getErrorLabel(error.keyword);
                    break;

                case 'format':
                    res[error.instancePath.slice(1)] = getErrorLabel(error.keyword, error.message);
                    break;
        
                case 'minLength':
                    res[error.instancePath.slice(1)] = getErrorLabel(error.keyword, error.message, error.params.limit);
                    break;

                case 'maxLength':
                    res[error.instancePath.slice(1)] = getErrorLabel(error.keyword, error.message, error.params.limit);
                    break;

                
                case 'errorMessage':
                    res[error.instancePath.slice(1)] = getErrorLabel(error.keyword, error.message);
                    break;
                default:
                    break;
            }
        })
    }

    return res;
}