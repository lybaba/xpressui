import {
    BTNGROUP_TYPE,
    SECTION_TYPE,
    SUBMIT_TYPE,
} from "./field";
import TFieldConfig from "./TFieldConfig";
import TFormConfig from "./TFormConfig";
import { getFieldConfigByName, getSectionByName } from "./post";

// ========================================================

export const BTNGROUP_NAME = 'btngroup';
export const BTNGROUP_LABEL = 'Form Buttons';

export const SUBMIT_BTN_NAME = 'submitbtn';
export const SUBMIT_BTN_LABEL = 'Submit';

export const NEXT_BTN_NAME = 'nextbtn';
export const NEXT_BTN_LABEL = 'Next';

export const PREV_BTN_NAME = 'prevbtn';
export const PREV_BTN_LABEL = 'Previous';


export const SUCCESS_MSG_FIELD_NAME = 'successMsg';
export const SUCCESS_MSG_FIELD_LABEL = 'Success Message';

export const ERROR_MSG_FIELD_NAME = 'errorMsg';
export const ERROR_MSG_FIELD_LABEL = 'Error Message';


export type TFormButtons = {
    btngroup: TFieldConfig;
    submitbtn: TFieldConfig;
    nextbtn: TFieldConfig;
    prevbtn: TFieldConfig;
}

// ==========================================================

export function getBtnGroupSectionConfig(formConfig: TFormConfig) : TFieldConfig {
    const res = getSectionByName(formConfig, BTNGROUP_NAME, true);
    if (res)
        return res;
    
    return {
        type: SECTION_TYPE,
        subType: BTNGROUP_TYPE,
        name: BTNGROUP_NAME,
        label: BTNGROUP_LABEL
    };
}

// ==========================================================
const BTNGROUP_FIELD: TFieldConfig = {
    type: BTNGROUP_TYPE,
    name: BTNGROUP_NAME,
    label: BTNGROUP_LABEL,
};

export function getBtnGroupConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, BTNGROUP_NAME, BTNGROUP_FIELD.name);

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
    
    const res = getFieldConfigByName(formConfig, BTNGROUP_NAME, SUBMITBTN_FIELD.name);

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
    
    const res = getFieldConfigByName(formConfig, BTNGROUP_NAME, NEXTBTN_FIELD.name);

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
    
    const res = getFieldConfigByName(formConfig, BTNGROUP_NAME, PREVBTN_FIELD.name);

    if (res)
        return res;

    return PREVBTN_FIELD;
}


// ==========================================================

export default function getFormButtonsConfig(formConfig: TFormConfig) : TFormButtons {
    const res = {
        [BTNGROUP_NAME]: getBtnGroupSectionConfig(formConfig),
        [SUBMIT_BTN_NAME]: getSubmitBtnConfig(formConfig),
        [NEXT_BTN_NAME]: getNextBtnConfig(formConfig),
        [PREV_BTN_NAME]: getPrevBtnConfig(formConfig),
    }

    return res;
}