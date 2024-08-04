
import TFieldConfig from './TFieldConfig';

import slugify from 'slugify';
import { lowerCase } from 'lodash';
import TPostConfig from './TPostConfig';
import TChoice from './TChoice';

export const SECTION_TYPE = 'section';
export const FIELDGROUP_TYPE = 'fieldgroup';

export const MEDIA_TYPE = 'media';
export const CHECKBOX_TYPE = 'checkbox';
export const DATETIME_TYPE = 'datetime';
export const EMAIL_TYPE = 'email';
export const UPLOAD_FILE_TYPE = 'file';
export const UPLOAD_IMAGE_TYPE = 'upload-image';
export const IMAGE_TYPE = 'image';
export const IMAGE_URL_TYPE = 'image-url';
export const NUMBER_TYPE = 'number';
export const PRICE_TYPE = 'price';
export const PASSWORD_TYPE = 'password';
export const SINGLE_SELECT_TYPE = 'single-select';
export const RADIO_BUTTONS_TYPE = 'radio-buttons';

export const MULTI_SELECT_TYPE = 'multi-select';
export const CHECKBOXES_TYPE = 'checkboxes';

export const SUBMIT_TYPE = 'submit';
export const TEXT_TYPE = 'text';
export const TEXTAREA_TYPE = 'textarea';
export const TEL_TYPE = 'tel';
export const OUTPUT_TYPE = 'output';
export const RICH_EDITOR_TYPE = 'rich-editor';
export const FIELDGROUP_SELECT_TYPE = 'section-select';
export const URL_TYPE = 'url';

export const FIELDGROUP_TYPE_FIELD: TChoice = { name: SECTION_TYPE, label: 'Section' };
export const TEXT_TYPE_FIELD: TChoice = { name: TEXT_TYPE, label: 'Text Field' };
export const TEXTAREA_TYPE_FIELD: TChoice = { name: TEXTAREA_TYPE, label: 'Text Area' };
export const NUMBER_TYPE_FIELD: TChoice = { name: NUMBER_TYPE, label: 'Number' };
export const PRICE_TYPE_FIELD: TChoice = { name: PRICE_TYPE, label: 'Price' };
export const EMAIL_TYPE_FIELD: TChoice = { name: EMAIL_TYPE, label: 'Email' };
export const PASSWORD_TYPE_FIELD: TChoice = { name: PASSWORD_TYPE, label: 'Password' };
export const TEL_TYPE_FIELD: TChoice = { name: TEL_TYPE, label: 'Phone Number' };
export const SUBMIT_TYPE_FIELD: TChoice = { name: SUBMIT_TYPE, label: 'Submit button' };
export const CHECKBOX_TYPE_FIELD: TChoice = { name: CHECKBOX_TYPE, label: 'Checkbox' };
export const MULTI_SELECT_TYPE_FIELD: TChoice = { name: MULTI_SELECT_TYPE, label: 'Multi-select List' };
export const CHECKBOXES_TYPE_FIELD: TChoice = { name: CHECKBOXES_TYPE, label: 'Checkboxes' };
export const SINGLE_SELECT_TYPE_FIELD: TChoice = { name: SINGLE_SELECT_TYPE, label: 'Single-select List' };
export const RADIO_BUTTONS_TYPE_FIELD: TChoice = { name: RADIO_BUTTONS_TYPE, label: 'Radio Buttons' };
export const URL_TYPE_FIELD: TChoice = { name: URL_TYPE, label: 'URL' };
export const IMAGE_TYPE_FIELD: TChoice = { name: IMAGE_TYPE, label: 'Media File' };
export const IMAGE_URL_TYPE_FIELD: TChoice = { name: IMAGE_URL_TYPE, label: 'Media URL' };
export const UPLOAD_IMAGE_TYPE_FIELD: TChoice = { name: UPLOAD_IMAGE_TYPE, label: 'Image Upload' };
export const UPLOAD_FILE_TYPE_FIELD: TChoice = { name: UPLOAD_FILE_TYPE, label: 'File Upload' };
export const DATETIME_TYPE_FIELD: TChoice = { name: DATETIME_TYPE, label: 'Date / Time' };



export const REQUEST_FORM_FIELD_TYPES: Array<TChoice> = [
    TEXT_TYPE_FIELD,
    TEXTAREA_TYPE_FIELD,
    NUMBER_TYPE_FIELD,
    DATETIME_TYPE_FIELD,
    CHECKBOX_TYPE_FIELD,
    SINGLE_SELECT_TYPE_FIELD,
    MULTI_SELECT_TYPE_FIELD,
    IMAGE_TYPE_FIELD,
    IMAGE_URL_TYPE_FIELD,
    UPLOAD_FILE_TYPE_FIELD
];

export const DATA_TABLE_FIELD_TYPES: Array<TChoice> = [
    TEXT_TYPE_FIELD,
    TEXTAREA_TYPE_FIELD,
    NUMBER_TYPE_FIELD,
    CHECKBOX_TYPE_FIELD,
    DATETIME_TYPE_FIELD,
    SINGLE_SELECT_TYPE_FIELD,
    MULTI_SELECT_TYPE_FIELD,
    UPLOAD_FILE_TYPE_FIELD
];


export const getFieldSubTypes = (type: string): Array<TChoice> => {
    switch (type) {
        case TEXT_TYPE:
            return [
                TEXT_TYPE_FIELD,
                EMAIL_TYPE_FIELD,
                PASSWORD_TYPE_FIELD,
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

export const buildOptionName = (name: string) => {
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


export const getFieldTypes = (postConfig: TPostConfig): Array<TChoice> => {
    return REQUEST_FORM_FIELD_TYPES;
}

export const doNormalizeFieldValue = (fieldConfig: TFieldConfig, value: any) : any => {
    switch (fieldConfig.type) {
        case CHECKBOX_TYPE:
            return getBooleanValue(value);

        default:
            return value;

    }
};

