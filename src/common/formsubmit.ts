import {
    BTNGROUP_TYPE,
    FORM_SUBMIT_TYPE,
    OUTPUT_TYPE,
    SECTION_TYPE,
    SUBMIT_TYPE,
    TEXTAREA_TYPE,
} from "./field";
import TFieldConfig from "./TFieldConfig";
import TFormConfig from "./TFormConfig";
import { getFieldConfigByName, getSectionByName } from "./post";

// ========================================================

export const FORMSUBMIT_SECTION_NAME = 'formsubmit';
export const FORMSUBMIT_SECTION_LABEL = 'Form Submit';

export const BTNGROUP_NAME = 'btnGroup';
export const BTNGROUP_LABEL = 'Form Buttons';

export const SUBMIT_BTN_NAME = 'submitBtn';
export const SUBMIT_BTN_LABEL = 'Submit';

export const NEXT_BTN_NAME = 'nextBtn';
export const NEXT_BTN_LABEL = 'Next';

export const PREV_BTN_NAME = 'prevBtn';
export const PREV_BTN_LABEL = 'Previous';


export const SUCCESS_MSG_FIELD_NAME = 'successMsg';
export const SUCCESS_MSG_FIELD_LABEL = 'Success Message';

export const ERROR_MSG_FIELD_NAME = 'errorMsg';
export const ERROR_MSG_FIELD_LABEL = 'Error Message';


export type TFormButtons = {
    section: TFieldConfig;
    btnGroup: TFieldConfig;
    submitBtn: TFieldConfig;
    nextBtn: TFieldConfig;
    prevBtn: TFieldConfig;
    successMsg: TFieldConfig;
    errorMsg: TFieldConfig;
}

// ==========================================================

export function getFooterSectionConfig(formConfig: TFormConfig) : TFieldConfig {
    const res = getSectionByName(formConfig, FORMSUBMIT_SECTION_NAME, true);
    if (res)
        return res;
    
    return {
        type: SECTION_TYPE,
        subType: FORM_SUBMIT_TYPE,
        name: FORMSUBMIT_SECTION_NAME,
        label: FORMSUBMIT_SECTION_LABEL
    };
}

// ==========================================================
const BTNGROUP_FIELD: TFieldConfig = {
    type: BTNGROUP_TYPE,
    name: BTNGROUP_NAME,
    label: BTNGROUP_LABEL,
};

export function getBtnGroupConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, FORMSUBMIT_SECTION_NAME, BTNGROUP_FIELD.name);

    if (res)
        return res;

    return BTNGROUP_FIELD;
}


// ==========================================================
const SUBMITBTN_FIELD: TFieldConfig = {
    type: SUBMIT_TYPE,
    name: SUBMIT_BTN_NAME,
    label: SUBMIT_BTN_LABEL,
};

export function getSubmitBtnConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, FORMSUBMIT_SECTION_NAME, SUBMITBTN_FIELD.name);

    if (res)
        return res;

    return SUBMITBTN_FIELD;
}


// ==========================================================
const NEXTBTN_FIELD: TFieldConfig = {
    type: SUBMIT_TYPE,
    name: NEXT_BTN_NAME,
    label: NEXT_BTN_LABEL,
};
export function getNextBtnConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, FORMSUBMIT_SECTION_NAME, NEXTBTN_FIELD.name);

    if (res)
        return res;

    return NEXTBTN_FIELD;
}


// ==========================================================
const PREVBTN_FIELD: TFieldConfig = {
    type: SUBMIT_TYPE,
    name: PREV_BTN_NAME,
    label: PREV_BTN_LABEL,
};
export function getPrevBtnConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, FORMSUBMIT_SECTION_NAME, PREVBTN_FIELD.name);

    if (res)
        return res;

    return PREVBTN_FIELD;
}

// ==========================================================
const ERROR_MSG_FIELD: TFieldConfig = {
    type: OUTPUT_TYPE,
    refType: TEXTAREA_TYPE,
    name: ERROR_MSG_FIELD_NAME,
    label: ERROR_MSG_FIELD_LABEL
};
export function getErrorMsgConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, FORMSUBMIT_SECTION_NAME, ERROR_MSG_FIELD.name);

    if (res)
        return res;

    return ERROR_MSG_FIELD;
}



// ==========================================================
const SUCCESS_MSG_FIELD: TFieldConfig = {
    type: OUTPUT_TYPE,
    refType: TEXTAREA_TYPE,
    name: SUCCESS_MSG_FIELD_NAME,
    label: SUCCESS_MSG_FIELD_LABEL,
 };
export function getSuccessMsgConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, FORMSUBMIT_SECTION_NAME, SUCCESS_MSG_FIELD.name);

    if (res)
        return res;

    return SUCCESS_MSG_FIELD;
}

// ==========================================================

export default function getFormButtonsConfig(formConfig: TFormConfig) : TFormButtons {
    const res = {
        section: getFooterSectionConfig(formConfig),
        [BTNGROUP_NAME]: getBtnGroupConfig(formConfig),
        [SUBMIT_BTN_NAME]: getSubmitBtnConfig(formConfig),
        [NEXT_BTN_NAME]: getNextBtnConfig(formConfig),
        [PREV_BTN_NAME]: getPrevBtnConfig(formConfig),
        [SUCCESS_MSG_FIELD_NAME]: getSuccessMsgConfig(formConfig),
        [ERROR_MSG_FIELD_NAME]: getErrorMsgConfig(formConfig)
    }

    return res;
}