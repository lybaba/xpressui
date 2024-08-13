import {
    getFieldConfigWithCssProps,
    IMAGE_TYPE,
    SECTION_TYPE,
} from "./field";
import TFieldConfig from "./TFieldConfig";
import TFormConfig from "./TFormConfig";
import { getFieldConfigByName, getSectionByName } from "./post";

// ========================================================

export const HEADING_SECTION_NAME = 'heading';
export const HEADING_SECTION_LABEL = 'Heading';

export const LOGO_FIELD_NAME = 'logo';
export const LOGO_FIELD_LABEL = 'Logo Image';

export const BG_FIELD_NAME = 'background';
export const BG_FIELD_LABEL = 'Background Image';

export const HEADER_FIELD_NAME = 'header';
export const HEADER_FIELD_LABEL = 'Header Image';

export const HERO_FIELD_NAME = 'hero';
export const HERO_FIELD_LABEL = 'Hero Image';


export type THeadingConfig = {
    heading: TFieldConfig;
    logo: TFieldConfig;
    background: TFieldConfig;
    header: TFieldConfig;
    hero: TFieldConfig;
}

// ==========================================================

export function getHeadingSectionConfig(formConfig: TFormConfig) : TFieldConfig {
    const res = getSectionByName(formConfig, HEADING_SECTION_NAME);
    if (res)
        return getFieldConfigWithCssProps(res);
    
    return {
        type: SECTION_TYPE,
        name: HEADING_SECTION_NAME,
        label: HEADING_SECTION_LABEL
    };
}


// ==========================================================
const LOGO_IMAGE_FIELD: TFieldConfig = {
    type: IMAGE_TYPE, 
    name: LOGO_FIELD_NAME,
    label: LOGO_FIELD_LABEL,
};
export function getLogoImageConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, HEADING_SECTION_NAME, LOGO_IMAGE_FIELD.name);

    if (res)
        return getFieldConfigWithCssProps(res);

    return LOGO_IMAGE_FIELD;
}



// ==========================================================
const BACKGROUND_IMAGE_FIELD: TFieldConfig = {
    type: IMAGE_TYPE, 
    name: BG_FIELD_NAME,
    label: BG_FIELD_LABEL,
};
export function getBackgroundImageConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, HEADING_SECTION_NAME, BACKGROUND_IMAGE_FIELD.name);

    if (res)
        return getFieldConfigWithCssProps(res);

    return BACKGROUND_IMAGE_FIELD;
}


// ==========================================================
const HEADER_IMAGE_FIELD: TFieldConfig = {
    type: IMAGE_TYPE, 
    name: HEADER_FIELD_NAME,
    label: HEADER_FIELD_LABEL,
};
export function getHeaderImageConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, HEADING_SECTION_NAME, HEADER_IMAGE_FIELD.name);

    if (res)
        return getFieldConfigWithCssProps(res);

    return HEADER_IMAGE_FIELD;
}



// ==========================================================
const HERO_IMAGE_FIELD: TFieldConfig = {
    type: IMAGE_TYPE,
    name: HERO_FIELD_NAME,
    label: HERO_FIELD_LABEL
};
export function getHeroImageConfig(formConfig: TFormConfig) : TFieldConfig {
    
    const res = getFieldConfigByName(formConfig, HEADING_SECTION_NAME, HERO_IMAGE_FIELD.name);

    if (res)
        return getFieldConfigWithCssProps(res);

    return HERO_IMAGE_FIELD;
}

export default function getHeadingConfig(formConfig: TFormConfig) : THeadingConfig {
    const res = {
        [HEADING_SECTION_NAME]: getHeadingSectionConfig(formConfig),
        [LOGO_FIELD_NAME]: getLogoImageConfig(formConfig),
        [BG_FIELD_NAME]: getBackgroundImageConfig(formConfig),
        [HEADER_FIELD_NAME]: getHeaderImageConfig(formConfig),
        [HERO_FIELD_NAME]: getHeroImageConfig(formConfig)
    }

    return res;
}