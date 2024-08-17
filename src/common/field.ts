
import TFieldConfig, { CssClassesProps, CssElemProps, TCssProps } from './TFieldConfig';

import slugify from 'slugify';
import { isEmpty, isObject, lowerCase } from 'lodash';
import TFieldType from './TFieldType';

export const SECTION_TYPE = 'section';
export const PRODUCTFORM_TYPE = 'productform';
export const PRODUCTLIST_TYPE = 'productlist';
export const PRODUCTITEM_TYPE = 'productitem';


export const MEDIA_TYPE = 'media';
export const CHECKBOX_TYPE = 'checkbox';
export const DATE_TYPE = 'date';
export const TIME_TYPE = 'time';
export const REGEX_TYPE = 'regex';
export const DATETIME_TYPE = 'datetime';
export const EMAIL_TYPE = 'email';
export const UPLOAD_FILE_TYPE = 'file';
export const UPLOAD_IMAGE_TYPE = 'upload-image';
export const IMAGE_TYPE = 'image';
export const NUMBER_TYPE = 'number';
export const POSITIVE_INTEGER_TYPE = 'integer';
export const PRICE_TYPE = 'price';
export const PASSWORD_TYPE = 'password';
export const SINGLE_SELECT_TYPE = 'single-select';
export const RADIO_BUTTONS_TYPE = 'radio-buttons';

export const MULTI_SELECT_TYPE = 'multi-select';
export const CHECKBOXES_TYPE = 'checkboxes';

export const SUBMIT_TYPE = 'submit';
export const BTN_TYPE = 'btn';
export const TEXT_TYPE = 'text';
export const SLUG_TYPE = 'slug';
export const TEXTAREA_TYPE = 'textarea';
export const TEL_TYPE = 'tel';
export const OUTPUT_TYPE = 'output';
export const RICH_EDITOR_TYPE = 'rich-editor';
export const FIELDGROUP_SELECT_TYPE = 'section-select';
export const URL_TYPE = 'url';
export const TAX_TYPE = 'tax';
export const SWITCH_TYPE = 'switch';
export const GRID_SIZE_TYPE = 'grid-size';
export const SLIDER_TYPE = 'slider';

export const LOGO_TYPE = 'logo';
export const BODY_TYPE = 'body';
export const HEADER_TYPE = 'header';
export const HERO_TYPE = 'hero';
export const FORM_SUBMIT_TYPE = 'formsubmit';
export const FOOTER_TYPE = 'footer';
export const NAVIGATION_TYPE = 'nav';
export const TITLE_TYPE = 'title';
export const HTML_TYPE = 'html';

export const FORM_SECTION_LABEL = 'Form Section';
export const LOGO_LABEL = 'Logo';
export const BODY_LABEL = 'Body';
export const HEADER_LABEL = 'Header';
export const HERO_LABEL = 'Hero';
export const FORM_SUBMIT_LABEL = 'Form Submit';
export const FOOTER_LABEL = 'Footer';
export const NAV_LABEL = 'Navigation';


export const FIELDGROUP_TYPE_FIELD: TFieldType = { type: SECTION_TYPE, subType: SECTION_TYPE, name: FORM_SECTION_LABEL };
export const LOGO_TYPE_FIELD: TFieldType = { type: SECTION_TYPE, subType: LOGO_TYPE, name: LOGO_LABEL, adminLabel: LOGO_LABEL };
export const BODY_TYPE_FIELD: TFieldType = { type: SECTION_TYPE, subType: BODY_TYPE, name: BODY_LABEL, adminLabel: BODY_LABEL };
export const HEADER_TYPE_FIELD: TFieldType = { type: SECTION_TYPE, subType: HEADER_TYPE, name: HEADER_LABEL, adminLabel: HEADER_LABEL };
export const HERO_TYPE_FIELD: TFieldType = { type: SECTION_TYPE, subType: HERO_TYPE, name: HERO_LABEL, adminLabel: HERO_LABEL };
export const FORM_SUBMIT_TYPE_FIELD: TFieldType = { type: SECTION_TYPE, subType: FORM_SUBMIT_TYPE, name: FORM_SUBMIT_LABEL, adminLabel: FORM_SUBMIT_LABEL };
export const FOOTER_TYPE_FIELD: TFieldType = { type: SECTION_TYPE, subType: FOOTER_TYPE, name: FOOTER_LABEL, adminLabel: FOOTER_LABEL };
export const NAVIGATION_TYPE_FIELD: TFieldType = { type: SECTION_TYPE, subType: NAVIGATION_TYPE, name: NAV_LABEL, adminLabel: NAV_LABEL };



export const TEXT_TYPE_FIELD: TFieldType = { type: TEXT_TYPE, name: 'Text Field' };
export const TEXTAREA_TYPE_FIELD: TFieldType = { type: TEXTAREA_TYPE, name: 'Text Area' };
export const NUMBER_TYPE_FIELD: TFieldType = { type: NUMBER_TYPE, name: 'Number' };
export const PRICE_TYPE_FIELD: TFieldType = { type: PRICE_TYPE, name: 'Price' };
export const EMAIL_TYPE_FIELD: TFieldType = { type: EMAIL_TYPE, name: 'Email' };
export const PASSWORD_TYPE_FIELD: TFieldType = { type: PASSWORD_TYPE, name: 'Password' };
export const TEL_TYPE_FIELD: TFieldType = { type: TEL_TYPE, name: 'Phone Number' };
export const SUBMIT_TYPE_FIELD: TFieldType = { type: SUBMIT_TYPE, name: 'Submit button' };
export const CHECKBOX_TYPE_FIELD: TFieldType = { type: CHECKBOX_TYPE, name: 'Checkbox' };
export const MULTI_SELECT_TYPE_FIELD: TFieldType = { type: MULTI_SELECT_TYPE, name: 'Multi-select List' };
export const CHECKBOXES_TYPE_FIELD: TFieldType = { type: CHECKBOXES_TYPE, name: 'Checkboxes' };
export const SINGLE_SELECT_TYPE_FIELD: TFieldType = { type: SINGLE_SELECT_TYPE, name: 'Single-select List' };
export const RADIO_BUTTONS_TYPE_FIELD: TFieldType = { type: RADIO_BUTTONS_TYPE, name: 'Radio Buttons' };
export const URL_TYPE_FIELD: TFieldType = { type: URL_TYPE, name: 'URL' };
export const IMAGE_TYPE_FIELD: TFieldType = { type: IMAGE_TYPE, name: 'Insert Picture' };
export const UPLOAD_IMAGE_TYPE_FIELD: TFieldType = { type: UPLOAD_IMAGE_TYPE, name: 'Upload Picture' };
export const UPLOAD_FILE_TYPE_FIELD: TFieldType = { type: UPLOAD_FILE_TYPE, name: 'Upload File' };
export const DATETIME_TYPE_FIELD: TFieldType = { type: DATETIME_TYPE, name: 'Date / Time' };
export const DATE_TYPE_FIELD: TFieldType = { type: DATE_TYPE, name: 'Date' };
export const TIME_TYPE_FIELD: TFieldType = { type: TIME_TYPE, name: 'Time' };
export const REGEX_TYPE_FIELD: TFieldType = { type: REGEX_TYPE, name: 'Regex' };
export const TAX_TYPE_FIELD: TFieldType = { type: TAX_TYPE, name: 'Tax' };
export const SWITCH_TYPE_FIELD: TFieldType = { type: SWITCH_TYPE, name: 'Switch' };
export const GRID_SIZE_TYPE_FIELD: TFieldType = { type: GRID_SIZE_TYPE, name: 'Grid Size' };
export const SLIDER_TYPE_FIELD: TFieldType = { type: SLIDER_TYPE, name: 'Slider' };
export const HTML_TYPE_FIELD: TFieldType = { type: HTML_TYPE, name: 'Html Content' };
export const BTN_TYPE_FIELD: TFieldType = { type: BTN_TYPE, name: 'Button' };

export const REQUEST_FORM_FIELD_TYPES: Array<TFieldType> = [
    TEXT_TYPE_FIELD,
    TEXTAREA_TYPE_FIELD,
    NUMBER_TYPE_FIELD,
    DATETIME_TYPE_FIELD,
    CHECKBOX_TYPE_FIELD,
    SINGLE_SELECT_TYPE_FIELD,
    MULTI_SELECT_TYPE_FIELD,
    IMAGE_TYPE_FIELD,
    UPLOAD_IMAGE_TYPE_FIELD,
    UPLOAD_FILE_TYPE_FIELD,
];

export const LAYOUT_SECTION_TYPES: Array<TFieldType> = [
    HEADER_TYPE_FIELD,
    HERO_TYPE_FIELD,
    NAVIGATION_TYPE_FIELD,
    FOOTER_TYPE_FIELD,
];


export const getFieldSubTypes = (type: string): Array<TFieldType> => {
    switch (type) {
        case TEXT_TYPE:
            return [
                TEXT_TYPE_FIELD,
                EMAIL_TYPE_FIELD,
                TEL_TYPE_FIELD,
                URL_TYPE_FIELD
            ];

        case NUMBER_TYPE:
            return [
                NUMBER_TYPE_FIELD,
                PRICE_TYPE_FIELD,
            ];
            

        case SINGLE_SELECT_TYPE:
            return [
                SINGLE_SELECT_TYPE_FIELD,
                RADIO_BUTTONS_TYPE_FIELD,
            ];

        case MULTI_SELECT_TYPE:
            return [
                MULTI_SELECT_TYPE_FIELD,
                CHECKBOXES_TYPE_FIELD,
            ];

        case UPLOAD_FILE_TYPE:
            return [
                UPLOAD_FILE_TYPE_FIELD,
                UPLOAD_IMAGE_TYPE_FIELD,
            ];


        default:
            return [];
    }
}

export const PRICING_DECIMAL_VALUES = [
    { value: "0", label: "0" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7" },
    { value: "8", label: "8" },
];



export const getIsChoiceField = (type: string): boolean => {
    return type === MULTI_SELECT_TYPE || type === SINGLE_SELECT_TYPE;
}

export const buildSlug = (name: string) => {
    return slugify(lowerCase(name), { replacement: '-' });
}

export const normalizeFormName = (name: string) => {
    return slugify(lowerCase(name), { replacement: '-' });
}

export const normalizeFieldName = (name: string) => {
    return slugify(lowerCase(name), { replacement: '_' });
}

export const getFieldName = (fieldIndex: number, fieldConfig: TFieldConfig): string => {
    if (fieldConfig.name) return normalizeFieldName(fieldConfig.name);

    return `field${fieldIndex}`;
}

export const getBooleanValue  = (value: any) : boolean => {
    if (typeof value === 'boolean')
      return value;
  
    if (typeof value === 'string')
      return value === 'true' ? true : false;
  
    if (typeof value === 'number')
      return value === 0 ? false : true;
  
    return false;
  }


export const doNormalizeFieldValue = (fieldConfig: TFieldConfig, value: any) : any => {
    switch (fieldConfig.type) {
        case CHECKBOX_TYPE:
        case SWITCH_TYPE:
            return getBooleanValue(value);

        default:
            return value;

    }
};


const TEXT_TYPES : string[] = [
    TEXT_TYPE,
    EMAIL_TYPE,
    TEL_TYPE,
    URL_TYPE,
    SLUG_TYPE
]

export function isTextField(fieldType: string) : boolean {
    return TEXT_TYPES.includes(fieldType);
}


const NUMBER_TYPES : string[] = [
    NUMBER_TYPE,
    PRICE_TYPE,
    TAX_TYPE,
]

export function isNumberField(fieldType: string) : boolean {
    return NUMBER_TYPES.includes(fieldType);
}

export function isBooleanField(fieldType: string) : boolean {
    return fieldType === CHECKBOX_TYPE || fieldType === SWITCH_TYPE;
}

export function isDateTimeField(fieldType: string) : boolean {
    return fieldType === DATETIME_TYPE;
}

export function isDateField(fieldType: string) : boolean {
    return fieldType === DATE_TYPE;
}

export function isTimeField(fieldType: string) : boolean {
    return fieldType === TIME_TYPE;
}

export function isImageField(fieldType: string) : boolean {
    return fieldType === UPLOAD_IMAGE_TYPE;
}

export function isSingleSelectField(fieldType: string) : boolean {
    return fieldType === SINGLE_SELECT_TYPE || fieldType == RADIO_BUTTONS_TYPE;
}


export function isMultiSelectField(fieldType: string) : boolean {
    return fieldType === MULTI_SELECT_TYPE || fieldType == CHECKBOXES_TYPE;
}


export function strToClasses(str: string | Record<string, any> | undefined | null) : CssClassesProps {
    if (!str)
        return {}

    if (isObject(str))
        return str;
    
    const res = str ? {className: str} : {};
    return res;
}

export function strToSxProps(str: string | Record<string, any> | undefined | null) : CssElemProps {
    if (!str)
        return {}

    if (isObject(str))
        return str;

    try {
        const obj = JSON.parse(str);
        if(isObject(obj) && !isEmpty(obj)) 
            return obj
    } catch (e) {
    }

    return {}
}


export function getCssProps(fieldConfig: TFieldConfig) : TCssProps {
    
    const res: TCssProps = {
        cClassesProps: strToClasses(fieldConfig.cClasses),
        cElemProps: strToSxProps(fieldConfig.cElemProps),
        iClassesProps: strToClasses(fieldConfig.iClasses),
        iElemProps: strToSxProps(fieldConfig.iElemProps),
        lClassesProps: strToClasses(fieldConfig.lClasses),
        lElemProps: strToSxProps(fieldConfig.lElemProps),
    }

    return res;
}