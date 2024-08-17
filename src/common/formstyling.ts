import {
    BODY_TYPE,
    IMAGE_TYPE,
    SECTION_TYPE,
} from "./field";
import TFieldConfig from "./TFieldConfig";
import TFormConfig from "./TFormConfig";
import { getFieldConfigByName, getSectionByName } from "./post";

// ========================================================

export const BODY_SECTION_NAME = 'body';
export const BODY_SECTION_LABEL = 'Form Styling';

export const LOGO_FIELD_NAME = 'logo';
export const LOGO_FIELD_LABEL = 'Logo Image';

export const BG_FIELD_NAME = 'background';
export const BG_FIELD_LABEL = 'Background Image';

export const HEADER_FIELD_NAME = 'header';
export const HEADER_FIELD_LABEL = 'Header Image';

export const HERO_FIELD_NAME = 'hero';
export const HERO_FIELD_LABEL = 'Hero Image';

export const FOOTER_FIELD_NAME = 'footer';
export const NAV_FIELD_NAME = 'nav';
export const TITLE_FIELD_NAME = 'title';
export const DESC_FIELD_NAME = 'desc';


export type TFormStyling = {
    section: TFieldConfig;
    background: TFieldConfig;
    logo: TFieldConfig;
    fields: TFieldConfig[]
}

// ==========================================================

export function getBodySectionConfig(formConfig: TFormConfig) : TFieldConfig {
    const res = getSectionByName(formConfig, BODY_SECTION_NAME);
    if (res)
        return res;
    
    return {
        type: SECTION_TYPE,
        subType: BODY_TYPE,
        name: BODY_SECTION_NAME,
        label: BODY_SECTION_LABEL
    };
}


// ==========================================================
const LOGO_IMAGE_FIELD: TFieldConfig = {
    type: IMAGE_TYPE, 
    name: LOGO_FIELD_NAME,
    label: LOGO_FIELD_LABEL,
};
export function getLogoImageConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, BODY_SECTION_NAME, LOGO_IMAGE_FIELD.name);

    if (res)
        return res;

    return LOGO_IMAGE_FIELD;
}



// ==========================================================
const BACKGROUND_IMAGE_FIELD: TFieldConfig = {
    type: IMAGE_TYPE, 
    name: BG_FIELD_NAME,
    label: BG_FIELD_LABEL,
};
export function getBackgroundImageConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, BODY_SECTION_NAME, BACKGROUND_IMAGE_FIELD.name);

    if (res)
        return res;

    return BACKGROUND_IMAGE_FIELD;
}


// ==========================================================
const HEADER_IMAGE_FIELD: TFieldConfig = {
    type: IMAGE_TYPE, 
    name: HEADER_FIELD_NAME,
    label: HEADER_FIELD_LABEL,
};
export function getHeaderImageConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, BODY_SECTION_NAME, HEADER_IMAGE_FIELD.name);

    if (res)
        return res;

    return HEADER_IMAGE_FIELD;
}



// ==========================================================
const HERO_IMAGE_FIELD: TFieldConfig = {
    type: IMAGE_TYPE,
    name: HERO_FIELD_NAME,
    label: HERO_FIELD_LABEL
};
export function getHeroImageConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, BODY_SECTION_NAME, HERO_IMAGE_FIELD.name);

    if (res)
        return res;

    return HERO_IMAGE_FIELD;
}

export default function getFormStylingConfig(formConfig: TFormConfig) : TFormStyling {
    const fields = formConfig.sections.hasOwnProperty(BODY_SECTION_NAME) ? formConfig.sections[BODY_SECTION_NAME] : [];
    const section = getBodySectionConfig(formConfig);
    
    const background: TFieldConfig = {
        type: IMAGE_TYPE,
        name: BG_FIELD_NAME,
        label: formConfig.label,
        mediaId: section.background
    };

    const logo: TFieldConfig = {
        type: IMAGE_TYPE,
        name: LOGO_FIELD_NAME,
        label: formConfig.label,
        mediaId: section.logo
    }
    
    const res = {
        section,
        background,
        logo,
        fields
    }

    return res;
}