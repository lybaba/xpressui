import {
    NAVBAR_LABEL,
    NAVBAR_TYPE,
    NAVIGATION_MENU_LABEL,
    NAVIGATION_MENU_TYPE,
    SECTION_TYPE,
} from "./field";
import TFieldConfig from "./TFieldConfig";
import TFormConfig from "./TFormConfig";
import { getFieldConfigByName, getSectionByName } from "./post";

// ========================================================

export const NAVBAR_NAME = NAVBAR_TYPE;
export const NAVIGATION_MENU_NAME = 'navMenu';

export type TNavBar = {
    section: TFieldConfig;
    navMenu: TFieldConfig;
}

// ==========================================================

export function getNavBarSectionConfig(formConfig: TFormConfig) : TFieldConfig {
    const res = getSectionByName(formConfig, NAVBAR_NAME, true);
    if (res)
        return res;
    
    return {
        type: SECTION_TYPE,
        subType: NAVBAR_TYPE,
        name: NAVBAR_NAME,
        label: NAVBAR_LABEL
    };
}

// ==========================================================
const NAVIGATION_MENU_FIELD: TFieldConfig = {
    type: NAVIGATION_MENU_TYPE,
    name: NAVIGATION_MENU_NAME,
    label: NAVIGATION_MENU_LABEL,
};

export function getNavMenuConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, NAVBAR_NAME, NAVIGATION_MENU_FIELD.name);

    if (res)
        return res;

    return NAVIGATION_MENU_FIELD;
}



// ==========================================================

export default function getNavBarConfig(formConfig: TFormConfig) : TNavBar {
    const res = {
        section: getNavBarSectionConfig(formConfig),
        [NAVIGATION_MENU_NAME]: getNavMenuConfig(formConfig),
    }

    return res;
}