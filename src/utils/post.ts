import TFieldConfig from "../common/TFieldConfig";
import TPostConfig from "../common/TPostConfig";
import { SECTION_TYPE, normalizeFieldName } from './field';
import { BACKEND_STORAGE_BASE_URL, BUILDER_TAB_FORMS } from '../common/Constants';
import { EMAIL_FIELD } from './default-fields';
import TMediaFile from '../common/TMediaFile';
import { TPostUIContext } from '../components/post-ui/TPostUIState';
import { isEmpty } from 'lodash';
import shortUUID from "short-uuid";
import LABELS from "./config/labels";

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

function storageURL(relativePath: string) {
   return BACKEND_STORAGE_BASE_URL + relativePath + '?alt=media'
}

export const buildImageUrl = (postUIContext: TPostUIContext, postConfig: TPostConfig, fileName: string): string => {
    if (isEmpty(postUIContext.postName)) {
        return storageURL(`static%2F${postConfig.uid}%2F${fileName}`);
    } else {
        const url = postUIContext.frontend.imagesClient.getUri({
            url: fileName
        });

        return url;
    }
}


export const getLargeImageUrl = (postUIContext: TPostUIContext, postConfig: TPostConfig, mediaFile: TMediaFile): string => {
    return buildImageUrl(postUIContext, postConfig, `${mediaFile.id}-large.${mediaFile.type}`);
}

const doGetImageUrl = (postUIContext: TPostUIContext, postConfig: TPostConfig, mediaFile: TMediaFile, prefix: string): string => {
    return buildImageUrl(postUIContext, postConfig, `${mediaFile.id}-${prefix}.${mediaFile.type}`);
}

export const getSmallImageUrl = (postUIContext: TPostUIContext, postConfig: TPostConfig, mediaFile: TMediaFile): string => {
    return doGetImageUrl(postUIContext, postConfig, mediaFile, "small");
}

export const getThumbImageUrl = (postUIContext: TPostUIContext, postConfig: TPostConfig, mediaFile: TMediaFile): string => {
    return doGetImageUrl(postUIContext, postConfig, mediaFile, "thumb");
}

export const getMediumImageUrl = (postUIContext: TPostUIContext, postConfig: TPostConfig, mediaFile: TMediaFile): string => {
    return doGetImageUrl(postUIContext, postConfig, mediaFile, "medium");
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
