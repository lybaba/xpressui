import shortUUID from "short-uuid"
import { TEXT_TYPE, TEXTAREA_TYPE, UNKNOWN_TYPE } from "./common/field"
import TFieldConfig from "./common/TFieldConfig"
import TFormConfig, { DEFAULT_FORM_CONFIG } from "./common/TFormConfig"
import { CUSTOM_SECTION } from "./common/Constants"

export const HTML_ATTR_PREFIX = "data-"

export const ATTR_TYPE = "type"
export const ATTR_LABEL = "label"
export const ATTR_ADMIN_LABEL = "adminLabel"
export const ATTR_NAME = "name"
export const ATTR_SUB_TYPE = "subType"
export const ATTR_REF_TYPE = "refType"
export const ATTR_DESC = "desc"
export const ATTR_CAN_DELETE = "canDelete"
export const ATTR_CAN_EDIT = "canEdit"
export const ATTR_REQUIRED = "required"
export const ATTR_UNIQUE = "unique"
export const ATTR_MIN_LEN = "minLen"
export const ATTR_MAX_LEN = "maxLen"
export const ATTR_PLACEHOLDER = "placeholder"
export const ATTR_PATTERN = "pattern"
export const ATTR_MEDIA_ID = "mediaId"
export const ATTR_BACKGROUND = "background"
export const ATTR_LOGO = "logo"
export const ATTR_HERO = "hero"
export const ATTR_MIN_VALUE = "min"
export const ATTR_MAX_VALUE = "max"
export const ATTR_STEP_VALUE = "step"
export const ATTR_DEFAULT_VALUE = "defaultValue"
export const ATTR_MIN_NUM_OF_CHOICES = "minNumOfChoices"
export const ATTR_MAX_NUM_OF_CHOICES = "maxNumOfChoices"
export const ATTR_HELP_TEXT = "helpText"
export const ATTR_ERROR_MSG = "errorMsg"
export const ATTR_SUCCESS_MSG = "successMsg"
export const ATTR_NEXT_BTN_LABEL = "nextBtnLabel"
export const ATTR_CHOICE_GROUP_ID = "choiceGroupId"
export const ATTR_CHOICES = "choices"
export const ATTR_MEDIA_INFO = "mediaInfo"
export const ATTR_MEDIA_INFO_LIST = "mediaInfoList"
export const ATTR_IS_ADMIN_FIELD = "isAdminField"
export const ATTR_PARENT = "parent"
export const ATTR_LINK_TYPE = "linkType"
export const ATTR_LINK_PATH = "linkPath"
export const ATTR_ID = "id"
export const ATTR_UID = "uid"
export const ATTR_TIMESTAMP = "timestamp"
export const ATTR_SECTIONS = "sections"
export const ATTR_SUBFORMS = "subforms"
export const ATTR_RENDERING_MODE = "RenderingMode"


export const HTML_ATTR_TYPE = `${HTML_ATTR_PREFIX}type`
export const HTML_ATTR_LABEL = `${HTML_ATTR_PREFIX}label`
export const HTML_ATTR_ADMIN_LABEL = `${HTML_ATTR_PREFIX}admin-label`
export const HTML_ATTR_NAME = `${HTML_ATTR_PREFIX}name`
export const HTML_ATTR_SUB_TYPE = `${HTML_ATTR_PREFIX}sub-type`
export const HTML_ATTR_REF_TYPE = `${HTML_ATTR_PREFIX}ref-type`
export const HTML_ATTR_DESC = `${HTML_ATTR_PREFIX}desc`
export const HTML_ATTR_CAN_DELETE = `${HTML_ATTR_PREFIX}can-delete`
export const HTML_ATTR_CAN_EDIT = `${HTML_ATTR_PREFIX}can-edit`
export const HTML_ATTR_REQUIRED = `${HTML_ATTR_PREFIX}required`
export const HTML_ATTR_UNIQUE = `${HTML_ATTR_PREFIX}unique`
export const HTML_ATTR_MIN_LEN = `${HTML_ATTR_PREFIX}min-len`
export const HTML_ATTR_MAX_LEN = `${HTML_ATTR_PREFIX}max-len`
export const HTML_ATTR_PLACEHOLDER = `${HTML_ATTR_PREFIX}placeholder`
export const HTML_ATTR_PATTERN = `${HTML_ATTR_PREFIX}pattern`
export const HTML_ATTR_MEDIA_ID = `${HTML_ATTR_PREFIX}media-id`
export const HTML_ATTR_BACKGROUND = `${HTML_ATTR_PREFIX}background`
export const HTML_ATTR_LOGO = `${HTML_ATTR_PREFIX}logo`
export const HTML_ATTR_HERO = `${HTML_ATTR_PREFIX}hero`
export const HTML_ATTR_MIN_VALUE = `${HTML_ATTR_PREFIX}min`
export const HTML_ATTR_MAX_VALUE = `${HTML_ATTR_PREFIX}max`
export const HTML_ATTR_STEP_VALUE = `${HTML_ATTR_PREFIX}step`
export const HTML_ATTR_DEFAULT_VALUE = `${HTML_ATTR_PREFIX}default-value`
export const HTML_ATTR_MIN_NUM_OF_CHOICES = `${HTML_ATTR_PREFIX}min-num-of-choices`
export const HTML_ATTR_MAX_NUM_OF_CHOICES = `${HTML_ATTR_PREFIX}max-num-of-choices`
export const HTML_ATTR_HELP_TEXT = `${HTML_ATTR_PREFIX}help-text`
export const HTML_ATTR_ERROR_MSG = `${HTML_ATTR_PREFIX}error-msg`
export const HTML_ATTR_SUCCESS_MSG = `${HTML_ATTR_PREFIX}success-msg`
export const HTML_ATTR_NEXT_BTN_LABEL = `${HTML_ATTR_PREFIX}next-btn-label`
export const HTML_ATTR_CHOICE_GROUP_ID = `${HTML_ATTR_PREFIX}choice-group-id`
export const HTML_ATTR_CHOICES = `${HTML_ATTR_PREFIX}choices`
export const HTML_ATTR_MEDIA_INFO = `${HTML_ATTR_PREFIX}media-info`
export const HTML_ATTR_MEDIA_INFO_LIST = `${HTML_ATTR_PREFIX}media-info-list`
export const HTML_ATTR_IS_ADMIN_FIELD = `${HTML_ATTR_PREFIX}is-admin-field`
export const HTML_ATTR_PARENT = `${HTML_ATTR_PREFIX}parent`
export const HTML_ATTR_LINK_TYPE = `${HTML_ATTR_PREFIX}link-type`
export const HTML_ATTR_LINK_PATH = `${HTML_ATTR_PREFIX}link-path`
export const HTML_ATTR_ID = `${HTML_ATTR_PREFIX}id`
export const HTML_ATTR_UID = `${HTML_ATTR_PREFIX}uid`
export const HTML_ATTR_TIMESTAMP = `${HTML_ATTR_PREFIX}timestamp`
export const HTML_ATTR_SECTIONS = `${HTML_ATTR_PREFIX}sections`
export const HTML_ATTR_SUBFORMS = `${HTML_ATTR_PREFIX}subforms`
export const HTML_ATTR_RENDERING_MODE = `${HTML_ATTR_PREFIX}rendering-mode`

export const ATTR_MAP = {
    [HTML_ATTR_TYPE]: ATTR_TYPE,
    [HTML_ATTR_LABEL]: ATTR_LABEL,
    [HTML_ATTR_ADMIN_LABEL]: ATTR_ADMIN_LABEL,
    [HTML_ATTR_NAME]: ATTR_NAME,
    [HTML_ATTR_SUB_TYPE]: ATTR_SUB_TYPE,
    [HTML_ATTR_REF_TYPE]: ATTR_REF_TYPE,
    [HTML_ATTR_DESC]: ATTR_DESC,
    [HTML_ATTR_CAN_DELETE]: ATTR_CAN_DELETE,
    [HTML_ATTR_CAN_EDIT]: ATTR_CAN_EDIT,
    [HTML_ATTR_REQUIRED]: ATTR_REQUIRED,
    [HTML_ATTR_UNIQUE]: ATTR_UNIQUE,
    [HTML_ATTR_MIN_LEN]: ATTR_MIN_LEN,
    [HTML_ATTR_MAX_LEN]: ATTR_MAX_LEN,
    [HTML_ATTR_PLACEHOLDER]: ATTR_PLACEHOLDER,
    [HTML_ATTR_PATTERN]: ATTR_PATTERN,
    [HTML_ATTR_MEDIA_ID]: ATTR_MEDIA_ID,
    [HTML_ATTR_BACKGROUND]: ATTR_MEDIA_ID,
    [HTML_ATTR_LOGO]: ATTR_LOGO,
    [HTML_ATTR_HERO]: ATTR_HERO,
    [HTML_ATTR_MIN_VALUE]: ATTR_MIN_VALUE,
    [HTML_ATTR_MAX_VALUE]: ATTR_MAX_VALUE,
    [HTML_ATTR_STEP_VALUE]: ATTR_STEP_VALUE,
    [HTML_ATTR_DEFAULT_VALUE]: ATTR_DEFAULT_VALUE,
    [HTML_ATTR_MIN_NUM_OF_CHOICES]: ATTR_MIN_NUM_OF_CHOICES,
    [HTML_ATTR_MAX_NUM_OF_CHOICES]: ATTR_MAX_NUM_OF_CHOICES,
    [HTML_ATTR_HELP_TEXT]: ATTR_HELP_TEXT,
    [HTML_ATTR_ERROR_MSG]: ATTR_ERROR_MSG,
    [HTML_ATTR_SUCCESS_MSG]: ATTR_SUCCESS_MSG,
    [HTML_ATTR_NEXT_BTN_LABEL]: ATTR_NEXT_BTN_LABEL,
    [HTML_ATTR_CHOICE_GROUP_ID]: ATTR_CHOICE_GROUP_ID,
    [HTML_ATTR_CHOICES]: ATTR_CHOICES,
    [HTML_ATTR_MEDIA_INFO]: ATTR_MEDIA_INFO,
    [HTML_ATTR_MEDIA_INFO_LIST]: ATTR_MEDIA_INFO_LIST,
    [HTML_ATTR_IS_ADMIN_FIELD]: ATTR_IS_ADMIN_FIELD,
    [HTML_ATTR_PARENT]: ATTR_PARENT,
    [HTML_ATTR_LINK_TYPE]: ATTR_LINK_TYPE,
    [HTML_ATTR_LINK_PATH]: ATTR_LINK_PATH,
    [HTML_ATTR_ID]: ATTR_ID,
    [HTML_ATTR_UID]: ATTR_UID,
    [HTML_ATTR_TIMESTAMP]: ATTR_TIMESTAMP,
    [HTML_ATTR_SECTIONS]: ATTR_SECTIONS,
    [HTML_ATTR_SUBFORMS]: ATTR_SUBFORMS,
    [HTML_ATTR_RENDERING_MODE]: ATTR_RENDERING_MODE,
}




function getFieldConfigList(nodes: NodeListOf<Element>): TFieldConfig[] {
    const res: TFieldConfig[] = [];

    nodes.forEach((node) => {
        const fieldConfig: TFieldConfig = getFieldConfig(node);
        res.push(fieldConfig)
    })

    return res;
}

export function getFieldConfig(node: Element): TFieldConfig {
    const randomId = shortUUID.generate();
    const fieldConfig: TFieldConfig = { type: UNKNOWN_TYPE, name: randomId, label: randomId }
    for (const [dashKey, camelKey] of Object.entries(ATTR_MAP)) {
        const attrValue = node.getAttribute(dashKey)
        if (attrValue) {
            (fieldConfig as any)[camelKey] = attrValue;
        }
    }

    return fieldConfig;
}


export default function getFormConfig(node: Element): TFormConfig {
    const formConfig: TFormConfig = DEFAULT_FORM_CONFIG;

    for (const [dashKey, camelKey] of Object.entries(ATTR_MAP)) {
        const attrValue = node.getAttribute(dashKey)
        if (attrValue) {
            (formConfig as any)[camelKey] = attrValue;
        }
    }

    const sectionNodes = node.querySelectorAll('[data-type="section"]');
    const sectionList = getFieldConfigList(sectionNodes);
    formConfig.sections[CUSTOM_SECTION] = sectionList;

    sectionList.forEach((sectionConfig: TFieldConfig) => {
        const fieldNodes = node.querySelectorAll(`[data-section-name="${sectionConfig.name}"]`);
        const fieldList = getFieldConfigList(fieldNodes);
        formConfig.sections[sectionConfig.name] = fieldList;
    })


    return formConfig;
}


export function getErrorClass(input: any): string {
    switch (input.type) {
        case 'textarea':
            return 'textarea-error'

        case 'select-one':
            return 'select-error'

        default:
            return 'input-error'
    }
}