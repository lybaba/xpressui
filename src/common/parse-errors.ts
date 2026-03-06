import { ErrorObject } from 'ajv';
import TFieldConfig from './TFieldConfig';

export const REQUIRED_FIELD_MSG = "This field is required.";
export const FIELD_VALUE_TOO_LONG = "Too many characters (maximum: %s).";
export const FIELD_VALUE_TOO_SHORT = "Not enough characters (minimum: %s).";

function formatErrorTemplate(template: string, limit: number = 0): string {
    if (!template.includes("%s")) {
        return template;
    }

    return template.replace("%s", String(limit));
}

function getErrorLabel(errorKey: string, errorValue: string = "", limit: number = 0) : string {
    switch (errorKey) {
        case 'required':
            return REQUIRED_FIELD_MSG;

        case 'minLength':
            return formatErrorTemplate(FIELD_VALUE_TOO_SHORT, limit);

        case 'maxLength':
            return formatErrorTemplate(FIELD_VALUE_TOO_LONG, limit);


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
            const limit =
                typeof (error.params as any)?.limit === "number"
                    ? Number((error.params as any).limit)
                    : 0;

            const getFriendlyAjvMessage = (): string => {
                switch (error.keyword) {
                    case "required":
                        return REQUIRED_FIELD_MSG;
                    case "minLength":
                        return getErrorLabel("minLength", "", limit);
                    case "maxLength":
                        return getErrorLabel("maxLength", "", limit);
                    case "enum":
                        return "Please select a valid option.";
                    case "minimum":
                        return `Value must be greater than or equal to ${limit}.`;
                    case "maximum":
                        return `Value must be less than or equal to ${limit}.`;
                    case "format": {
                        const format = String((error.params as any)?.format || "").toLowerCase();
                        switch (format) {
                            case "email":
                                return "Please enter a valid email address.";
                            case "date":
                                return "Please enter a valid date (YYYY-MM-DD).";
                            case "time":
                                return "Please enter a valid time (HH:mm).";
                            case "date-time":
                                return "Please enter a valid date and time.";
                            case "uri":
                            case "url":
                                return "Please enter a valid URL.";
                            default:
                                return error.message || "Invalid format.";
                        }
                    }
                    case "type": {
                        const expectedType = String((error.params as any)?.type || "").toLowerCase();
                        switch (expectedType) {
                            case "number":
                            case "integer":
                                return "Please enter a valid number.";
                            case "boolean":
                                return "Please choose a valid yes/no value.";
                            case "array":
                                return "Please provide a valid list value.";
                            case "string":
                                return "Please enter a valid text value.";
                            default:
                                return error.message || "Invalid value type.";
                        }
                    }
                    default:
                        return error.message || "Invalid value.";
                }
            };

            if (error.keyword === 'required') {
                fieldName= error.params.missingProperty;
                errorMessage = getFriendlyAjvMessage();
            } else {
                fieldName = error.instancePath.slice(1).replace(/\//g, ".");
                errorMessage = getFriendlyAjvMessage();
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
