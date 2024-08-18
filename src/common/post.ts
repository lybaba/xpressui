import {
    BODY_TYPE,
    CHECKBOX_TYPE,
    DATETIME_TYPE,
    DATE_TYPE,
    EMAIL_TYPE,
    FORM_SUBMIT_TYPE,
    MULTI_SELECT_TYPE,
    NAVBAR_TYPE,
    NUMBER_TYPE,
    POSITIVE_INTEGER_TYPE,
    PRICE_TYPE,
    SINGLE_SELECT_TYPE,
    SLUG_TYPE,
    SWITCH_TYPE,
    TAX_TYPE,
    TIME_TYPE,
} from "./field";
import { ValidateFunction } from "ajv";
import TFieldConfig from "./TFieldConfig";
import TFormConfig, { RenderingMode } from "./TFormConfig";
import { GLOBAL_SECTION, CUSTOM_SECTION } from './Constants';
import TMediaFile, { TMediaInfo, TMediaFileMetadata, MediaSizeType, MEDIA_FILE_PREFIX } from './TMediaFile';
import { TPostUIContext } from '../components/ui/TPostUIState';
import { isEmpty, isObject } from 'lodash';
import TChoice from "./TChoice";
import parseErrors from "./parse-errors";
import TFormFieldProps from "./TFormFieldProps";

export const FORM_ID = "form";
export const SECTION_ID = 'attrgroup';
export const FIELD_ID = "field";
export const LABEL_ID = "label";
export const INPUT_ID = "input";

export const DATA_FORM_CONTROL_ID = 'data-form-control';

export const TOP_ALIGNED_LABELS = 'tal';
export const LEFT_ALIGNED_LABELS = 'lal';
export const RIGHT_ALIGNED_LABELS = 'ral';
export const BOTTOM_ALIGNED_LABELS = 'bal';
export const LABELS_WITHIN_INPUTS = 'lwi';



export type TFormType = {
    type: string,
    label: string,
    description: string,
    icon: string
}

export type TGetPostAssetsResult = {
    mediaFiles: TMediaFile[];
    mediaFilesMap: Record<string, TMediaFile>;
}

function storageURL(storageUrl: string, relativePath: string) {
    return storageUrl + relativePath + '?alt=media'
}

export const buildImageUrl = (postUIContext: TPostUIContext, formConfig: TFormConfig, fileMeta: TMediaFileMetadata): string => {
    const {
        baseStorageUrl = '',
        user
    } = postUIContext;

    let filePath = fileMeta.filePath

    if (!isEmpty(baseStorageUrl) && user) {
        return storageURL(baseStorageUrl, `static%2F${user.uid}%2F${fileMeta.filePath}`);
    } else {
        const baseUrl = postUIContext.frontend.imagesBaseUrl;
        if (baseUrl.endsWith('/'))
            return `${baseUrl}static${formConfig.uid}/${fileMeta.filePath}`;
        else
            return `${baseUrl}/static/${formConfig.uid}/${fileMeta.filePath}`;

    }
}

function parseFilePath(postUIContext: TPostUIContext,  formConfig: TFormConfig, filePath: string) {
    if (filePath.startsWith(MEDIA_FILE_PREFIX)) {
        const fp = filePath.substring(MEDIA_FILE_PREFIX.length);
        return buildImageUrl(postUIContext, formConfig, {filePath: fp})
    }

    return filePath;
}

export const getLargeImageUrl = (postUIContext: TPostUIContext,  formConfig: TFormConfig, mediaFile: TMediaInfo): string => {
    if (isEmpty(mediaFile.large))
        return mediaFile.filePath ? parseFilePath(postUIContext, formConfig, mediaFile.filePath) : '';

    return buildImageUrl(postUIContext, formConfig, mediaFile.large);
}

export const getSmallImageUrl = (postUIContext: TPostUIContext,  formConfig: TFormConfig, mediaFile: TMediaInfo): string => {
    if (!isEmpty(mediaFile.small))
        return buildImageUrl(postUIContext, formConfig, mediaFile.small);

    if (!isEmpty(mediaFile.thumb))
        return buildImageUrl(postUIContext, formConfig, mediaFile.thumb);

    if (!isEmpty(mediaFile.medium))
        return buildImageUrl(postUIContext, formConfig, mediaFile.medium);

    if (!isEmpty(mediaFile.large))
        return buildImageUrl(postUIContext, formConfig, mediaFile.large);


    return mediaFile.filePath ? parseFilePath(postUIContext, formConfig, mediaFile.filePath) : '';
}

export const getThumbImageUrl = (postUIContext: TPostUIContext,  formConfig: TFormConfig, mediaFile: TMediaInfo): string => {
    if (!isEmpty(mediaFile.thumb))
        return buildImageUrl(postUIContext, formConfig, mediaFile.thumb);

    if (!isEmpty(mediaFile.medium))
        return buildImageUrl(postUIContext, formConfig, mediaFile.medium);

    if (!isEmpty(mediaFile.large))
        return buildImageUrl(postUIContext, formConfig, mediaFile.large);

    return mediaFile.filePath ? parseFilePath(postUIContext, formConfig, mediaFile.filePath) : '';
}

export const getMediumImageUrl = (postUIContext: TPostUIContext,  formConfig: TFormConfig, mediaFile: TMediaInfo): string => {
    if (!isEmpty(mediaFile.medium))
        return buildImageUrl(postUIContext, formConfig, mediaFile.medium);

    if (!isEmpty(mediaFile.large))
        return buildImageUrl(postUIContext, formConfig, mediaFile.large);

    return mediaFile.filePath ? parseFilePath(postUIContext, formConfig, mediaFile.filePath) : '';
}


export const getCustomSectionList = (formConfig: TFormConfig): Array<TFieldConfig> => {
    return formConfig.sections.hasOwnProperty(CUSTOM_SECTION) ? formConfig.sections[CUSTOM_SECTION] : []
}

export const getGlobalSectionList = (formConfig: TFormConfig): Array<TFieldConfig> => {
    return formConfig.sections.hasOwnProperty(GLOBAL_SECTION) ? formConfig.sections[GLOBAL_SECTION] : []
}


export const getSectionFields = (formConfig: TFormConfig, sectionName: string): Array<TFieldConfig> => {
    return formConfig.sections.hasOwnProperty(sectionName) ? formConfig.sections[sectionName] : [];
}

export const getSectionHasFields = (formConfig: TFormConfig, sectionName: string): boolean => {
    const fields = getSectionFields(formConfig, sectionName);
    return fields.length != 0;
}


export const getSectionByIndex = (formConfig: TFormConfig, index: number, isGlobalSection: boolean = false): TFieldConfig | null => {
    const mainSection = isGlobalSection ? GLOBAL_SECTION : CUSTOM_SECTION;

    if (!formConfig || index < 0 || index >= formConfig.sections[mainSection].length)
        return null;

    return formConfig.sections[mainSection][index];
}


export const getFieldConfigByIndex = (formConfig: TFormConfig, sectionIndex: number, fieldIndex: number): TFieldConfig | null => {
    const sectionConfig = getSectionByIndex(formConfig, sectionIndex);

    if (sectionConfig) {
        if (fieldIndex < 0 || fieldIndex >= formConfig.sections[sectionConfig.name].length)
            return null;

        return formConfig.sections[sectionConfig.name][fieldIndex];
    }

    return null;
}

export const getSectionByName = (formConfig: TFormConfig, sectionName: string, isGlobalSection: boolean = false) => {
    let groupIndex = -1;
    const mainSection = isGlobalSection ? GLOBAL_SECTION : CUSTOM_SECTION;

    if (formConfig.sections[mainSection]) {
        formConfig.sections[mainSection].every((tmp: TFieldConfig, index: number) => {

            if (tmp.name === sectionName) {
                groupIndex = index;
                return false;
            }

            return true;
        });
    }

    return groupIndex >= 0 ? formConfig.sections[mainSection][groupIndex] : null;
}




type ValidatorProps = {
    validator: ValidateFunction<any>;
    formConfig: TFormConfig;
    values: Record<string, any>;
}


function toAjvFieldType(fieldConfig: TFieldConfig): object | null {
    const res: any = {};

    switch (fieldConfig.type) {
        case NUMBER_TYPE:
            res.type = "number";
            break;

        case PRICE_TYPE:
            res.type = "number";
            res.minimum = 0;
            break;

        case TAX_TYPE:
            res.type = "number";
            res.minimum = 0;
            res.maximum = 1;
            break;

        case POSITIVE_INTEGER_TYPE:
            res.type = "integer";
            res.minimum = 0;
            break;

        case CHECKBOX_TYPE:
        case SWITCH_TYPE:
            res.type = "boolean";
            break;

        case MULTI_SELECT_TYPE:
            res.type = "array";
            res.items = {
                "type": "string"
            }
            break;



        case SINGLE_SELECT_TYPE:
            res.type = "string"
            if (fieldConfig.choices)
                res.enum = fieldConfig.choices.map((opt: TChoice) => opt.id);
            break;

        case DATETIME_TYPE:
            res.type = "string";
            res.format = "date-time"
            break;

        case DATE_TYPE:
            res.type = "string";
            res.format = "date"
            break;

        case TIME_TYPE:
            res.type = "string";
            res.format = "time"
            break;


        case EMAIL_TYPE:
            res.type = "string";
            res.format = "email"
            break;


        default:
            res.type = "string";
            break;
    }



    if (fieldConfig.pattern)
        res.pattern = fieldConfig.pattern;

    if (fieldConfig.minLen)
        res.minLength = Number(fieldConfig.minLen);

    if (fieldConfig.maxLen)
        res.maxLength = Number(fieldConfig.maxLen);


    return res;
}

export function shouldRenderField(formConfig: TFormConfig, fieldConfig: TFieldConfig): boolean {
    const {
        renderingMode = RenderingMode.CREATE_ENTRY as RenderingMode
    } = formConfig;

    const {
        canEdit = true
    } = fieldConfig;

    if (renderingMode === RenderingMode.MODIFY_ENTRY && (!canEdit || fieldConfig.type === SLUG_TYPE))
        return false;


    return true;
}

export function getHideLabel(props: TFormFieldProps): boolean {
    const {
        fieldConfig,
        hideLabel = false
    } = props;
    

    return hideLabel ||
        fieldConfig.type === CHECKBOX_TYPE || 
        fieldConfig.type === SWITCH_TYPE;
}


export function buildSchema(formConfig: TFormConfig, sectionIdex: number): object {
    const currentSection = getSectionByIndex(formConfig, sectionIdex);

    const fields: TFieldConfig[] = currentSection && formConfig.sections.hasOwnProperty(currentSection.name)
        ? formConfig.sections[currentSection.name] : [];

    const required: string[] = [];
    const errorMessage: Record<string, string> = {};
    const properties: Record<string, any> = {};

    for (const fieldConfig of fields) {
        if (shouldRenderField(formConfig, fieldConfig)) {
            const ajvType = toAjvFieldType(fieldConfig);

            if (!isEmpty(ajvType)) {
                properties[fieldConfig.name] = ajvType;

                if (fieldConfig.required)
                    required.push(fieldConfig.name);

                if (fieldConfig.errorMsg)
                    errorMessage[fieldConfig.name] = fieldConfig.errorMsg;
            }
        }
    }

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

    validator(values);
    const errors = parseErrors(validator.errors);

    return errors;
}



export const getMediaUrlByMediaId = (postUIContext: TPostUIContext,  formConfig: TFormConfig, fieldConfig: TFieldConfig, mediaSize: MediaSizeType = MediaSizeType.Small): string => {

    const mediaInfo: TMediaInfo = fieldConfig.mediaInfo ? fieldConfig.mediaInfo : { filePath: fieldConfig.mediaId };

    switch (mediaSize) {
        case MediaSizeType.Small:
            return getSmallImageUrl(postUIContext, formConfig, mediaInfo);

        case MediaSizeType.Thumb:
            return getThumbImageUrl(postUIContext, formConfig, mediaInfo);

        case MediaSizeType.Medium:
            return getMediumImageUrl(postUIContext, formConfig, mediaInfo);

        case MediaSizeType.Large:
            return getLargeImageUrl(postUIContext, formConfig, mediaInfo);

        default:
            return '';
    }
}

export function getBodyFormConfig(formConfig: TFormConfig) : TFormConfig {
    const mainSections : TFieldConfig[] = [];
    
    formConfig.sections[CUSTOM_SECTION].forEach((sectionConfig: TFieldConfig) => {
        const {
            isAdminField = false
        } = sectionConfig

        if (!isAdminField)
            mainSections.push(sectionConfig);
    });

    const res = {
        ...formConfig,
        sections: {...formConfig.sections, [CUSTOM_SECTION]: mainSections}
    };

    return res;

}


export function isJSON(str: string) {
    try {
        const obj = JSON.parse(str);
        return isObject(obj);
    } catch (e) {
        return false;
    }
}


// ======================================================

export function getFieldConfigByName(formConfig: TFormConfig, sectionName: string, fieldName: string) : TFieldConfig | null {
    if (formConfig.sections[sectionName]) {
        let fieldIndex = -1;
        const fields =  formConfig.sections[sectionName];
        fields.every((tmpFieldConfig: TFieldConfig, index: number) => {
            if (tmpFieldConfig.name === fieldName) {
                fieldIndex = index;
                return false;
            }
    
            return true;
        });
    
        return fieldIndex >=0 ? fields[fieldIndex] : null;
    }

    return null;
}


export function getFirstSectionIndexBySubType(formConfig: TFormConfig, subType: string, isGlobalSection: boolean = false): number {
    const mainSection = isGlobalSection ? GLOBAL_SECTION : CUSTOM_SECTION;

    const sections = formConfig.sections.hasOwnProperty(mainSection) ? formConfig.sections[mainSection] : [];

    let fieldIndex = -1;
    sections.every((tmpFieldConfig: TFieldConfig, index: number) => {
        if (tmpFieldConfig.subType === subType) {
            fieldIndex = index;
            return false;
        }

        return true;
    });


    return fieldIndex;
}

export function getFormStylingSectionIndex(formConfig: TFormConfig): number {
    return getFirstSectionIndexBySubType(formConfig, BODY_TYPE, true);
}

export function getFormSubmitSectionIndex(formConfig: TFormConfig): number {
    return getFirstSectionIndexBySubType(formConfig, FORM_SUBMIT_TYPE, true);
}

export function getFormNavSectionIndex(formConfig: TFormConfig): number {
    return getFirstSectionIndexBySubType(formConfig, NAVBAR_TYPE, true);
}
