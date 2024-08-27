import {
    CHECKBOX_TYPE,
    DATETIME_TYPE,
    DATE_TYPE,
    EMAIL_TYPE,
    FORM_SUBMIT_TYPE,
    MULTI_SELECT_TYPE,
    HEADER_NAV_TYPE,
    NUMBER_TYPE,
    POSITIVE_INTEGER_TYPE,
    PRICE_TYPE,
    SINGLE_SELECT_TYPE,
    SLUG_TYPE,
    SWITCH_TYPE,
    TAX_TYPE,
    TIME_TYPE,
} from "./field";
import TFieldConfig from "./TFieldConfig";
import TFormConfig, { RenderingMode } from "./TFormConfig";
import { GLOBAL_SECTION, CUSTOM_SECTION } from './Constants';
import TMediaFile, { TMediaInfo, MediaSizeType } from './TMediaFile';
import { isEmpty, isObject } from 'lodash';
import TChoice from "./TChoice";

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


export const getLargeImageUrl = (mediaFile: TMediaInfo): string => {
    if (mediaFile.large)
        return mediaFile.large.publicUrl;


    return mediaFile.publicUrl ? mediaFile.publicUrl : '';
}

export const getSmallImageUrl = (mediaFile: TMediaInfo): string => {
    if (mediaFile.small)
        return mediaFile.small.publicUrl

    if (mediaFile.thumb)
        return mediaFile.thumb.publicUrl

    if (mediaFile.medium)
        return mediaFile.medium.publicUrl;

    if (mediaFile.large)
        return mediaFile.large.publicUrl;


    return mediaFile.publicUrl ? mediaFile.publicUrl : '';
}

export const getThumbImageUrl = (mediaFile: TMediaInfo): string => {
    if (mediaFile.thumb)
        return mediaFile.thumb.publicUrl

    if (mediaFile.medium)
        return mediaFile.medium.publicUrl;

    if (mediaFile.large)
        return mediaFile.large.publicUrl;

    return mediaFile.publicUrl ? mediaFile.publicUrl : '';
}

export const getMediumImageUrl = (mediaFile: TMediaInfo): string => {
    if (mediaFile.medium)
        return mediaFile.medium.publicUrl;

    if (mediaFile.large)
        return mediaFile.large.publicUrl;

    return mediaFile.publicUrl ? mediaFile.publicUrl : '';
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
    const groupIndex = getSectionIndex(formConfig, sectionName, isGlobalSection);
    const mainSection = isGlobalSection ? GLOBAL_SECTION : CUSTOM_SECTION;
    return groupIndex >= 0 ? formConfig.sections[mainSection][groupIndex] : null;
}

export const getSectionIndex = (formConfig: TFormConfig, sectionName: string, isGlobalSection: boolean = false) => {
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

    return groupIndex;
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



export function buildSchema(formConfig: TFormConfig, sectionIdex?: number): object {
    let fields: TFieldConfig[] = [];

    if (sectionIdex) {
        const currentSection = getSectionByIndex(formConfig, sectionIdex);

        fields = currentSection && formConfig.sections.hasOwnProperty(currentSection.name)
            ? formConfig.sections[currentSection.name] : [];
    } else { // get all fields
        const sectionList = getCustomSectionList(formConfig);
        sectionList.forEach((sectionConfig: TFieldConfig) => {
            if (!sectionConfig.subType) {
                const currentFields = formConfig.sections.hasOwnProperty(sectionConfig.name)
                                    ? formConfig.sections[sectionConfig.name] : [];
                fields.push(...currentFields);
            }
        })
    }


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


export const getMediaUrlByMediaId = (fieldConfig: TFieldConfig, mediaSize: MediaSizeType = MediaSizeType.Small): string => {

    const mediaInfo: TMediaInfo = fieldConfig.mediaInfo ? fieldConfig.mediaInfo : { publicUrl: fieldConfig.mediaId };

    switch (mediaSize) {
        case MediaSizeType.Small:
            return getSmallImageUrl(mediaInfo);

        case MediaSizeType.Thumb:
            return getThumbImageUrl(mediaInfo);

        case MediaSizeType.Medium:
            return getMediumImageUrl(mediaInfo);

        case MediaSizeType.Large:
            return getLargeImageUrl(mediaInfo);

        default:
            return '';
    }
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

export function getFormSubmitSectionIndex(formConfig: TFormConfig): number {
    return getFirstSectionIndexBySubType(formConfig, FORM_SUBMIT_TYPE, true);
}

export function getFormNavSectionIndex(formConfig: TFormConfig): number {
    return getFirstSectionIndexBySubType(formConfig, HEADER_NAV_TYPE, true);
}
