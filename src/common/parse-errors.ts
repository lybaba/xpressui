import { ErrorObject } from 'ajv';
import TFieldConfig from './TFieldConfig';
import { TFormValidationI18nConfig } from './TFormConfig';

export const REQUIRED_FIELD_MSG = "This field is required.";
export const FIELD_VALUE_TOO_LONG = "Too many characters (maximum: %s).";
export const FIELD_VALUE_TOO_SHORT = "Not enough characters (minimum: %s).";

const DEFAULT_VALIDATION_MESSAGES: Record<string, Record<string, string>> = {
    en: {
        required: REQUIRED_FIELD_MSG,
        minLength: "Not enough characters (minimum: {limit}).",
        maxLength: "Too many characters (maximum: {limit}).",
        minItems: "Not enough selections (minimum: {limit}).",
        maxItems: "Too many selections (maximum: {limit}).",
        enum: "Please select a valid option.",
        minimum: "Value must be greater than or equal to {limit}.",
        maximum: "Value must be less than or equal to {limit}.",
        "format.email": "Please enter a valid email address.",
        "format.date": "Please enter a valid date (YYYY-MM-DD).",
        "format.time": "Please enter a valid time (HH:mm).",
        "format.date-time": "Please enter a valid date and time.",
        "format.uri": "Please enter a valid URL.",
        "format.url": "Please enter a valid URL.",
        "invalid.format": "Invalid format.",
        "type.number": "Please enter a valid number.",
        "type.integer": "Please enter a valid number.",
        "type.boolean": "Please choose a valid yes/no value.",
        "type.array": "Please provide a valid list value.",
        "type.string": "Please enter a valid text value.",
        "invalid.type": "Invalid value type.",
        "invalid.value": "Invalid value.",
    },
    fr: {
        required: "Ce champ est obligatoire.",
        minLength: "Pas assez de caracteres (minimum : {limit}).",
        maxLength: "Trop de caracteres (maximum : {limit}).",
        minItems: "Pas assez de selections (minimum : {limit}).",
        maxItems: "Trop de selections (maximum : {limit}).",
        enum: "Veuillez selectionner une option valide.",
        minimum: "La valeur doit etre superieure ou egale a {limit}.",
        maximum: "La valeur doit etre inferieure ou egale a {limit}.",
        "format.email": "Veuillez saisir une adresse e-mail valide.",
        "format.date": "Veuillez saisir une date valide (YYYY-MM-DD).",
        "format.time": "Veuillez saisir une heure valide (HH:mm).",
        "format.date-time": "Veuillez saisir une date et une heure valides.",
        "format.uri": "Veuillez saisir une URL valide.",
        "format.url": "Veuillez saisir une URL valide.",
        "invalid.format": "Format invalide.",
        "type.number": "Veuillez saisir un nombre valide.",
        "type.integer": "Veuillez saisir un nombre entier valide.",
        "type.boolean": "Veuillez choisir une valeur oui/non valide.",
        "type.array": "Veuillez fournir une liste valide.",
        "type.string": "Veuillez saisir un texte valide.",
        "invalid.type": "Type de valeur invalide.",
        "invalid.value": "Valeur invalide.",
    },
};

function formatErrorTemplate(template: string, limit: number = 0): string {
    if (!template.includes("%s")) {
        return template;
    }

    return template.replace("%s", String(limit));
}

function interpolateMessage(template: string, values: Record<string, any>): string {
    const withNamedTokens = template.replace(/\{(\w+)\}/g, (_, token: string) => {
        if (!Object.prototype.hasOwnProperty.call(values, token)) {
            return '';
        }
        const value = values[token];
        return value === undefined || value === null ? '' : String(value);
    });

    if (!withNamedTokens.includes("%s")) {
        return withNamedTokens;
    }

    const limit = Number(values.limit ?? 0);
    return formatErrorTemplate(withNamedTokens, Number.isFinite(limit) ? limit : 0);
}

function normalizeLocale(locale?: string): string {
    return String(locale || "en").trim().toLowerCase() || "en";
}

function resolveLocaleCandidates(locale: string): string[] {
    const normalized = normalizeLocale(locale);
    const baseLocale = normalized.includes("-") ? normalized.split("-")[0] : normalized;
    return normalized === baseLocale ? [normalized] : [normalized, baseLocale];
}

function getMessageFromCatalog(
    messages: Record<string, Record<string, string>> | undefined,
    locale: string,
    key: string,
): string | undefined {
    if (!messages) {
        return undefined;
    }

    const localeCandidates = resolveLocaleCandidates(locale);
    for (const candidate of localeCandidates) {
        const catalog = messages[candidate];
        if (catalog && Object.prototype.hasOwnProperty.call(catalog, key)) {
            return catalog[key];
        }
    }

    return undefined;
}

function resolveValidationMessage(
    key: string,
    fallbackMessage: string,
    values: Record<string, any>,
    i18n?: TFormValidationI18nConfig,
    fieldName?: string | null,
    error?: ErrorObject,
): string {
    const locale = normalizeLocale(i18n?.locale);
    const fallbackLocale = normalizeLocale(i18n?.fallbackLocale || "en");

    const defaultTemplate =
        getMessageFromCatalog(DEFAULT_VALIDATION_MESSAGES, locale, key)
        || getMessageFromCatalog(DEFAULT_VALIDATION_MESSAGES, fallbackLocale, key)
        || getMessageFromCatalog(DEFAULT_VALIDATION_MESSAGES, "en", key)
        || fallbackMessage;

    const customTemplate =
        getMessageFromCatalog(i18n?.messages, locale, key)
        || getMessageFromCatalog(i18n?.messages, fallbackLocale, key);

    const candidateTemplate = customTemplate || defaultTemplate;
    const defaultMessage = interpolateMessage(candidateTemplate, values);

    const resolvedMessage = i18n?.resolveMessage?.({
        key,
        locale,
        fallbackLocale,
        defaultMessage,
        values,
        fieldName,
        error,
    });

    if (typeof resolvedMessage === "string" && resolvedMessage.trim()) {
        return resolvedMessage;
    }

    return defaultMessage;
}

function getErrorLabel(
    errorKey: string,
    errorValue: string = "",
    limit: number = 0,
    i18n?: TFormValidationI18nConfig,
) : string {
    switch (errorKey) {
        case 'required':
            return resolveValidationMessage("required", REQUIRED_FIELD_MSG, { limit }, i18n);

        case 'minLength':
            return resolveValidationMessage("minLength", FIELD_VALUE_TOO_SHORT, { limit }, i18n);

        case 'maxLength':
            return resolveValidationMessage("maxLength", FIELD_VALUE_TOO_LONG, { limit }, i18n);


        default:
            if (errorValue) {
                return errorValue;
            } else {
                return errorKey;
            }
    }
}

export function parseServerErrors(
    errors: Record<string, string>,
    i18n?: TFormValidationI18nConfig,
) : Record<string, string> {
    const res : Record<string, string> = {};
    Object.entries(errors).forEach((value: [string, string], index: number) => {
        const fieldName = value[0];
        const errorTab : Array<string> = value[1].split(':');
        const errorKey = errorTab[0];
        const limit : number = errorTab.length > 1 ? Number(errorTab[1]) : 0;

        res[fieldName] = getErrorLabel(errorKey, "", limit, i18n);
    })

    return res;
}



export default function parseErrors(
    errors : null | undefined | ErrorObject[],
    fieldMap?: Record<string, TFieldConfig>,
    i18n?: TFormValidationI18nConfig,
) : Record<string, TValidationError>  {
    const res : Record<string, TValidationError> = {};

    if (errors) {
        errors.forEach(error => {
            let fieldName : string | null = null;
            let errorMessage : string | null = null;
            const limit =
                typeof (error.params as any)?.limit === "number"
                    ? Number((error.params as any).limit)
                    : 0;

            const getFriendlyAjvMessage = (resolvedFieldName?: string | null): string => {
                switch (error.keyword) {
                    case "required":
                        return resolveValidationMessage(
                            "required",
                            REQUIRED_FIELD_MSG,
                            { limit },
                            i18n,
                            resolvedFieldName,
                            error,
                        );
                    case "minLength":
                        return resolveValidationMessage(
                            "minLength",
                            FIELD_VALUE_TOO_SHORT,
                            { limit },
                            i18n,
                            resolvedFieldName,
                            error,
                        );
                    case "maxLength":
                        return resolveValidationMessage(
                            "maxLength",
                            FIELD_VALUE_TOO_LONG,
                            { limit },
                            i18n,
                            resolvedFieldName,
                            error,
                        );
                    case "minItems":
                        return resolveValidationMessage(
                            "minItems",
                            `Not enough selections (minimum: ${limit}).`,
                            { limit },
                            i18n,
                            resolvedFieldName,
                            error,
                        );
                    case "maxItems":
                        return resolveValidationMessage(
                            "maxItems",
                            `Too many selections (maximum: ${limit}).`,
                            { limit },
                            i18n,
                            resolvedFieldName,
                            error,
                        );
                    case "enum":
                        return resolveValidationMessage(
                            "enum",
                            "Please select a valid option.",
                            { limit },
                            i18n,
                            resolvedFieldName,
                            error,
                        );
                    case "minimum":
                        return resolveValidationMessage(
                            "minimum",
                            `Value must be greater than or equal to ${limit}.`,
                            { limit },
                            i18n,
                            resolvedFieldName,
                            error,
                        );
                    case "maximum":
                        return resolveValidationMessage(
                            "maximum",
                            `Value must be less than or equal to ${limit}.`,
                            { limit },
                            i18n,
                            resolvedFieldName,
                            error,
                        );
                    case "format": {
                        const format = String((error.params as any)?.format || "").toLowerCase();
                        switch (format) {
                            case "email":
                                return resolveValidationMessage(
                                    "format.email",
                                    "Please enter a valid email address.",
                                    { format, limit },
                                    i18n,
                                    resolvedFieldName,
                                    error,
                                );
                            case "date":
                                return resolveValidationMessage(
                                    "format.date",
                                    "Please enter a valid date (YYYY-MM-DD).",
                                    { format, limit },
                                    i18n,
                                    resolvedFieldName,
                                    error,
                                );
                            case "time":
                                return resolveValidationMessage(
                                    "format.time",
                                    "Please enter a valid time (HH:mm).",
                                    { format, limit },
                                    i18n,
                                    resolvedFieldName,
                                    error,
                                );
                            case "date-time":
                                return resolveValidationMessage(
                                    "format.date-time",
                                    "Please enter a valid date and time.",
                                    { format, limit },
                                    i18n,
                                    resolvedFieldName,
                                    error,
                                );
                            case "uri":
                            case "url":
                                return resolveValidationMessage(
                                    `format.${format}`,
                                    "Please enter a valid URL.",
                                    { format, limit },
                                    i18n,
                                    resolvedFieldName,
                                    error,
                                );
                            default:
                                return resolveValidationMessage(
                                    "invalid.format",
                                    error.message || "Invalid format.",
                                    { format, limit },
                                    i18n,
                                    resolvedFieldName,
                                    error,
                                );
                        }
                    }
                    case "type": {
                        const expectedType = String((error.params as any)?.type || "").toLowerCase();
                        switch (expectedType) {
                            case "number":
                            case "integer":
                                return resolveValidationMessage(
                                    `type.${expectedType}`,
                                    "Please enter a valid number.",
                                    { type: expectedType, limit },
                                    i18n,
                                    resolvedFieldName,
                                    error,
                                );
                            case "boolean":
                                return resolveValidationMessage(
                                    "type.boolean",
                                    "Please choose a valid yes/no value.",
                                    { type: expectedType, limit },
                                    i18n,
                                    resolvedFieldName,
                                    error,
                                );
                            case "array":
                                return resolveValidationMessage(
                                    "type.array",
                                    "Please provide a valid list value.",
                                    { type: expectedType, limit },
                                    i18n,
                                    resolvedFieldName,
                                    error,
                                );
                            case "string":
                                return resolveValidationMessage(
                                    "type.string",
                                    "Please enter a valid text value.",
                                    { type: expectedType, limit },
                                    i18n,
                                    resolvedFieldName,
                                    error,
                                );
                            default:
                                return resolveValidationMessage(
                                    "invalid.type",
                                    error.message || "Invalid value type.",
                                    { type: expectedType, limit },
                                    i18n,
                                    resolvedFieldName,
                                    error,
                                );
                        }
                    }
                    default:
                        return resolveValidationMessage(
                            "invalid.value",
                            error.message || "Invalid value.",
                            { limit },
                            i18n,
                            resolvedFieldName,
                            error,
                        );
                }
            };

            if (error.keyword === 'required') {
                fieldName= error.params.missingProperty;
                errorMessage = getFriendlyAjvMessage(fieldName);
            } else {
                fieldName = error.instancePath.slice(1).replace(/\//g, ".");
                errorMessage = getFriendlyAjvMessage(fieldName);
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
