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
import { SECTION_TYPE, normalizeFieldName } from './field';
import { BUILDER_TAB_FORMS } from './Constants';
import { EMAIL_FIELD } from './default-fields';
import TMediaFile from './TMediaFile';
import { TPostUIContext } from '../components/post-ui/TPostUIState';
import { isEmpty } from 'lodash';
import shortUUID from "short-uuid";
import LABELS from "./labels";
import TChoice from "./TChoice";
import parseErrors from "./parse-errors";

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

export const CONTACTFORM_TYPE = 'contactform';
export const ADVANCEDFORM_TYPE = 'advancedform';
export const ONLINESTORE_TYPE = 'onlinestore';
export const MULTI_STEP_FORM_TYPE = 'multistepform';


export const CONTACT_FORM: TPostType = {
    type: CONTACTFORM_TYPE,
    label: LABELS.contactform,
    description: LABELS.contactformDesc,
    icon: 'address.png'
};

export const ADVANCED_FORM: TPostType = {
    type: ADVANCEDFORM_TYPE,
    label: LABELS.advancedform,
    description: LABELS.advancedformDesc,
    icon: 'ico_advanced_forms.png'
};

export const ONLINESTORE_POST: TPostType = {
    type: ONLINESTORE_TYPE,
    label: LABELS.onlinestore,
    description: LABELS.onlinestoreDesc,
    icon: 'product.png'
};

export const MULTI_STEP_FORM_POST: TPostType = {
    type: MULTI_STEP_FORM_TYPE,
    label: LABELS.multistepform,
    description: LABELS.multistepformDesc,
    icon: 'process.png'
};

export const POST_TYPES: Array<TPostType> = [
    CONTACT_FORM,
    ADVANCED_FORM,
    MULTI_STEP_FORM_POST,
    ONLINESTORE_POST,
];

export const POST_TYPES_MAP: Record<string, TPostType> = {};
POST_TYPES.forEach((postType) => {
    POST_TYPES_MAP[postType.type] = postType;
});

export const DEFAULT_FORM_CONFIG: TPostConfig = {
    id: shortUUID.generate(),
    uid: shortUUID.generate(),
    timestamp: Math.floor(Date.now() / 1000),
    type: CONTACTFORM_TYPE,
    name: 'demo',
    label: 'demo',
    fields: {[BUILDER_TAB_FORMS]: []},
    background: '',
    logo: '',
    header: '',
    hero: '',
    submitBtnLabel: 'Submit',
    errorMsg: '',
    successMsg: '',
    nextBtnLabel: 'Next',
    prevBtnLabel: 'Previous',
    choices: [],
    frontendController: 'controller-sample.js',
    backendController: 'controller-sample.php'
}

function storageURL(storageUrl: string, relativePath: string) {
   return storageUrl + relativePath + '?alt=media'
}

export const buildImageUrl = (postUIContext: TPostUIContext, storageUrl: string, postConfig: TPostConfig, fileName: string): string => {
    if (isEmpty(postUIContext.postName)) {
        return storageURL(storageUrl, `static%2F${postConfig.uid}%2F${fileName}`);
    } else {
        const url = postUIContext.frontend.imagesClient.getUri({
            url: fileName
        });

        return url;
    }
}


export const getLargeImageUrl = (postUIContext: TPostUIContext, storageUrl: string, postConfig: TPostConfig, mediaFile: TMediaFile): string => {
    return buildImageUrl(postUIContext, storageUrl, postConfig, `${mediaFile.id}-large.${mediaFile.type}`);
}

const doGetImageUrl = (postUIContext: TPostUIContext, storageUrl: string, postConfig: TPostConfig, mediaFile: TMediaFile, prefix: string): string => {
    return buildImageUrl(postUIContext,  storageUrl, postConfig, `${mediaFile.id}-${prefix}.${mediaFile.type}`);
}

export const getSmallImageUrl = (postUIContext: TPostUIContext, storageUrl: string, postConfig: TPostConfig, mediaFile: TMediaFile): string => {
    return doGetImageUrl(postUIContext,  storageUrl, postConfig, mediaFile, "small");
}

export const getThumbImageUrl = (postUIContext: TPostUIContext, storageUrl: string, postConfig: TPostConfig, mediaFile: TMediaFile): string => {
    return doGetImageUrl(postUIContext,  storageUrl, postConfig, mediaFile, "thumb");
}

export const getMediumImageUrl = (postUIContext: TPostUIContext, storageUrl: string, postConfig: TPostConfig, mediaFile: TMediaFile): string => {
    return doGetImageUrl(postUIContext, storageUrl, postConfig, mediaFile, "medium");
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

export const getDefaultFields = (postConfig: TPostConfig): Record<string, TFieldConfig[]> => {
    // create and add default form config
    const defaultFormConfig: TFieldConfig = {
        type: SECTION_TYPE,
        label: postConfig.label,
        name: normalizeFieldName(postConfig.label),
        choices: [],
        canDelete: false
    };

    const fields: Record<string, TFieldConfig[]> = {
        [BUILDER_TAB_FORMS]: [defaultFormConfig]
    };

    if (postConfig.type === CONTACTFORM_TYPE || postConfig.type === ADVANCEDFORM_TYPE) {
        fields[defaultFormConfig.name] = [
            EMAIL_FIELD,
        ];
    }

    return fields;
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