import {
    HEADER_NAV_TYPE,
    HERO_TYPE,
    CALL2ACTION_GROUP_TYPE,
    HEADER_TYPE,
    FOOTER_TYPE,
} from "./field";
import TFieldConfig from "./TFieldConfig";
import TFormConfig from "./TFormConfig";
import { getCustomSectionList, getSectionByName } from "./post";

// ========================================================

export const NAVBAR_NAME = HEADER_NAV_TYPE;
export const NAVIGATION_MENU_NAME = 'navMenu';

export type TPageConfig = {
    headerTitleConfig?: TFieldConfig;
    heroSectionConfig?: TFieldConfig;
    headerMenuConfig?: TFieldConfig;
    heroActionsConfig?: TFieldConfig;
    footerConfig?: TFieldConfig;
    otherSections: TFieldConfig[]; 
}

const ADMIN_SECTIONS : string[] =  [
    HEADER_NAV_TYPE,
    HERO_TYPE,
    CALL2ACTION_GROUP_TYPE,
    HEADER_TYPE,
    FOOTER_TYPE,
];

// ===========================================================
export default function getPageConfig(formConfig: TFormConfig) : TPageConfig {
    const res : TPageConfig = {
        otherSections: []
    };

    // Header Section
    {
        const fieldConfig = getSectionByName(formConfig, HEADER_TYPE);
        if (fieldConfig) {
            res.headerTitleConfig = fieldConfig;
        }
    }


    // Hero Section
    {
        const fieldConfig = getSectionByName(formConfig, HERO_TYPE);

        if (fieldConfig) {
            res.heroSectionConfig = fieldConfig;
        }
    }

    // Navigation Menu Section
    {
        const fieldConfig = getSectionByName(formConfig, HEADER_NAV_TYPE);
        if (fieldConfig) {
            res.headerMenuConfig = fieldConfig;
        }
    }

    // Hero Actions section
    {
        const fieldConfig = getSectionByName(formConfig, CALL2ACTION_GROUP_TYPE);
        if (fieldConfig) {
            res.heroActionsConfig = fieldConfig;
        }
    }

    // Footer section
    {
        const fieldConfig = getSectionByName(formConfig, FOOTER_TYPE);
        if (fieldConfig) {
            res.footerConfig = fieldConfig;
        }
    }

    const sections = getCustomSectionList(formConfig);

    res.otherSections = [];
    sections.forEach((fieldConfig: TFieldConfig) => {
        if (fieldConfig.subType && !ADMIN_SECTIONS.includes(fieldConfig.subType)) {
            res.otherSections.push(fieldConfig);
        }
    })
    

    return res;
}