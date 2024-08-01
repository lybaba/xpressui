import { 
    CHECKBOX_TYPE,
    DATETIME_TYPE,
    EMAIL_TYPE,
    MULTI_SELECT_TYPE,
    NUMBER_TYPE,
    PASSWORD_TYPE,
    PRICE_TYPE,
    SINGLE_SELECT_TYPE,
    TEL_TYPE,
    TEXTAREA_TYPE,
    TEXT_TYPE,
    URL_TYPE 
} from "./field";
import { ValidateFunction } from "ajv";
import TFieldConfig from "./TFieldConfig";
import TPostConfig from "./TPostConfig";
import { BUILDER_TAB_FORMS } from './Constants';
import TMediaFile from './TMediaFile';
import { TPostUIContext } from '../components/post-ui/TPostUIState';
import { isEmpty } from 'lodash';
import TChoice from "./TChoice";
import parseErrors from "./parse-errors";
import TUser from "./TUser";

export const FORM_ID = "form";
export const SECTION_ID = 'attrgroup';
export const FIELD_ID = "field";
export const LABEL_ID = "label";
export const INPUT_ID = "input";

export const DATA_FORM_CONTROL_ID = 'data-form-control';


export type TPostType = {
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

export const buildImageUrl = (postUIContext: TPostUIContext, postConfig: TPostConfig, fileName: string, user: TUser | null): string => {
    const {
        baseStorageUrl = ''
    } = postUIContext;

    if (!isEmpty(baseStorageUrl) && user) {
        return storageURL(baseStorageUrl, `static%2F${user.uid}%2F${fileName}`);
    } else {
        const url = postUIContext.frontend.imagesClient.getUri({
            url: fileName
        });

        return url;
    }
}


export const getLargeImageUrl = (postUIContext: TPostUIContext, postConfig: TPostConfig, mediaFile: TMediaFile, user: TUser | null = null): string => {
    return buildImageUrl(postUIContext, postConfig, `${mediaFile.id}-large.${mediaFile.type}`, user);
}

const doGetImageUrl = (postUIContext: TPostUIContext, postConfig: TPostConfig, mediaFile: TMediaFile, prefix: string, user: TUser | null = null): string => {
    return buildImageUrl(postUIContext,  postConfig, `${mediaFile.id}-${prefix}.${mediaFile.type}`, user);
}

export const getSmallImageUrl = (postUIContext: TPostUIContext, postConfig: TPostConfig, mediaFile: TMediaFile,user: TUser | null = null): string => {
    return doGetImageUrl(postUIContext,  postConfig, mediaFile, "small", user);
}

export const getThumbImageUrl = (postUIContext: TPostUIContext, postConfig: TPostConfig, mediaFile: TMediaFile, user: TUser | null = null): string => {
    return doGetImageUrl(postUIContext,  postConfig, mediaFile, "thumb", user);
}

export const getMediumImageUrl = (postUIContext: TPostUIContext, postConfig: TPostConfig, mediaFile: TMediaFile, user: TUser | null = null): string => {
    return doGetImageUrl(postUIContext, postConfig, mediaFile, "medium", user);
}


export const getSectionList = (postConfig: TPostConfig): Array<TFieldConfig> => {
    return postConfig.fields.hasOwnProperty(BUILDER_TAB_FORMS) ? postConfig.fields[BUILDER_TAB_FORMS] : []
}

export const getSectionFields = (postConfig: TPostConfig, sectionName: string): Array<TFieldConfig> => {
    return postConfig.fields.hasOwnProperty(sectionName) ? postConfig.fields[sectionName] : [];
}

export const getSectionHasFields = (postConfig: TPostConfig, sectionName: string): boolean => {
    const fields = getSectionFields(postConfig, sectionName);
    return fields.length != 0;
}


export const getSectionByIndex = (postConfig: TPostConfig, index: number): TFieldConfig | null => {
    if (!postConfig || index < 0 || index >= postConfig.fields[BUILDER_TAB_FORMS].length)
        return null;

    return postConfig.fields[BUILDER_TAB_FORMS][index];
}


export const getFieldConfigByIndex = (postConfig: TPostConfig, sectionIndex: number, fieldIndex: number): TFieldConfig | null => {
    const sectionConfig = getSectionByIndex(postConfig, sectionIndex);

    if (sectionConfig) {
        if (fieldIndex < 0 || fieldIndex >= postConfig.fields[sectionConfig.name].length)
            return null;

        return postConfig.fields[sectionConfig.name][fieldIndex];
    }

    return null;
}

export const getSectionByName = (postConfig: TPostConfig, groupName: string) => {
    let groupIndex = -1;

    if (postConfig.fields[BUILDER_TAB_FORMS]) {
        postConfig.fields[BUILDER_TAB_FORMS].every((tmp: TFieldConfig, index: number) => {

            if (tmp.name === groupName) {
                groupIndex = index;
                return false;
            }

            return true;
        });
    }

    return groupIndex >= 0 ? postConfig.fields[BUILDER_TAB_FORMS][groupIndex] : null;
}




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