import { 
    CHECKBOX_TYPE,
    DATETIME_TYPE,
    EMAIL_TYPE,
    MULTI_SELECT_TYPE,
    NUMBER_TYPE,
    PASSWORD_TYPE,
    PRICE_TYPE,
    SINGLE_SELECT_TYPE,
    SLUG_TYPE,
    TEL_TYPE,
    TEXTAREA_TYPE,
    TEXT_TYPE,
    URL_TYPE 
} from "./field";
import { ValidateFunction } from "ajv";
import TFieldConfig from "./TFieldConfig";
import TFormConfig, { CHOICE_FORM_TYPE, PRODUCTFORM_TYPE, RenderingMode } from "./TFormConfig";
import { MAIN_SECTION } from './Constants';
import TMediaFile, { TMediaInfo, TMediaFileMetadata } from './TMediaFile';
import { TPostUIContext } from '../components/ui/TPostUIState';
import { isEmpty } from 'lodash';
import TChoice from "./TChoice";
import parseErrors from "./parse-errors";

export const FORM_ID = "form";
export const SECTION_ID = 'attrgroup';
export const FIELD_ID = "field";
export const LABEL_ID = "label";
export const INPUT_ID = "input";

export const DATA_FORM_CONTROL_ID = 'data-form-control';


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

export const buildImageUrl = (postUIContext: TPostUIContext, fileMeta: TMediaFileMetadata): string => {
    const {
        baseStorageUrl = '',
        user
    } = postUIContext;

    if (!isEmpty(baseStorageUrl) && user) {
        return storageURL(baseStorageUrl, `static%2F${user.uid}%2F${fileMeta.filePath}`);
    } else {
        const baseUrl = postUIContext.frontend.imagesBaseUrl;
        if (baseUrl.endsWith('/'))
            return `${baseUrl}${fileMeta.filePath}`;
        else
            return `${baseUrl}/${fileMeta.filePath}`;

    }
}

export const getLargeImageUrl = (postUIContext: TPostUIContext, mediaFile: TMediaInfo): string => {
    if (isEmpty(mediaFile.largeMeta))
        return mediaFile.filePath ? mediaFile.filePath : '';
    
    return buildImageUrl(postUIContext, mediaFile.largeMeta);
}

export const getSmallImageUrl = (postUIContext: TPostUIContext, mediaFile: TMediaInfo): string => {
    if (isEmpty(mediaFile.smallMeta))
        return mediaFile.filePath ? mediaFile.filePath : '';
    
    return buildImageUrl(postUIContext, mediaFile.smallMeta);
}

export const getThumbImageUrl = (postUIContext: TPostUIContext, mediaFile: TMediaInfo): string => {
    if (isEmpty(mediaFile.thumbMeta))
        return mediaFile.filePath ? mediaFile.filePath : '';
    
    return buildImageUrl(postUIContext, mediaFile.thumbMeta);
}

export const getMediumImageUrl = (postUIContext: TPostUIContext, mediaFile: TMediaInfo): string => {
    if (isEmpty(mediaFile.mediumMeta))
        return mediaFile.filePath ? mediaFile.filePath : '';
    
    return buildImageUrl(postUIContext, mediaFile.mediumMeta);
}


export const getSectionList = (formConfig: TFormConfig): Array<TFieldConfig> => {
    return formConfig.sections.hasOwnProperty(MAIN_SECTION) ? formConfig.sections[MAIN_SECTION] : []
}

export const getSectionFields = (formConfig: TFormConfig, sectionName: string): Array<TFieldConfig> => {
    return formConfig.sections.hasOwnProperty(sectionName) ? formConfig.sections[sectionName] : [];
}

export const getSectionHasFields = (formConfig: TFormConfig, sectionName: string): boolean => {
    const fields = getSectionFields(formConfig, sectionName);
    return fields.length != 0;
}


export const getSectionByIndex = (formConfig: TFormConfig, index: number): TFieldConfig | null => {
    if (!formConfig || index < 0 || index >= formConfig.sections[MAIN_SECTION].length)
        return null;

    return formConfig.sections[MAIN_SECTION][index];
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

export const getSectionByName = (formConfig: TFormConfig, groupName: string) => {
    let groupIndex = -1;

    if (formConfig.sections[MAIN_SECTION]) {
        formConfig.sections[MAIN_SECTION].every((tmp: TFieldConfig, index: number) => {

            if (tmp.name === groupName) {
                groupIndex = index;
                return false;
            }

            return true;
        });
    }

    return groupIndex >= 0 ? formConfig.sections[MAIN_SECTION][groupIndex] : null;
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
            if (fieldConfig.choices)
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

export function shouldRenderField(formConfig: TFormConfig, fieldConfig: TFieldConfig) : boolean {
    const {
        renderingMode = RenderingMode.CREATE_ENTRY
    } = formConfig;

    const {
        canEdit = true
    } = fieldConfig;

    if (renderingMode == RenderingMode.MODIFY_ENTRY && (!canEdit || fieldConfig.type === SLUG_TYPE))
        return false;

    if (formConfig.type === CHOICE_FORM_TYPE || formConfig.type === PRODUCTFORM_TYPE) {
        if (renderingMode === RenderingMode.CREATE_ENTRY && fieldConfig.name === LABEL_ID)
            return false;
    }

    return true;
}

export function buildSchema(formConfig: TFormConfig, sectionIdex: number): object {
    const currentSection = getSectionByIndex(formConfig, sectionIdex);
    
    const fields: TFieldConfig[] = currentSection && formConfig.sections.hasOwnProperty(currentSection.name) 
                                    ? formConfig.sections[currentSection.name] : [];

    const required: string[] = [];
    const errorMessage: Record<string, string> = {};
    const properties: Record<string, any> = {};

    for(const fieldConfig of fields)  {
        if (!shouldRenderField(formConfig, fieldConfig))
            continue;

        const ajvType = toAjvFieldType(fieldConfig);

        if (!isEmpty(ajvType)) {
            properties[fieldConfig.name] = ajvType;

            if (fieldConfig.required)
                required.push(fieldConfig.name);

            if (fieldConfig.errorMsg)
                errorMessage[fieldConfig.name] = fieldConfig.errorMsg;
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
    console.log("___validator ", validator);
    console.log("___values ", values);
    validator(values);
    const errors = parseErrors(validator.errors);
    console.log("___errors ", errors);

    return errors;
}