import TChoice from "./TChoice";
import { TMediaInfo } from "./TMediaFile";

export type ImageSize = {
    width: number;
    height: number;
};

export type CssClassesProps = {
    className?: string
};

export type CssElemProps = Record<string, any>;



export const HERO_FIELD_NAME = 'hero';
export const HERO_FIELD_LABEL = 'Hero Image';


export const LAYOUT_PROP = 'layout';
export const FIELD_CLASSES_PROP = 'fieldClasses';
export const FIELD_PROPS_PROP = 'fieldProps';

export const LABEL_CLASSES_PROP = 'labelClasses';
export const LABEL_PROPS_PROP = 'labelProps';

export const INPUT_CLASSES_PROP = 'inputClasses';
export const INPUT_PROPS_PROP = 'inputProps';

export const LIST_ITEM_CLASSES_PROP = 'listItemClasses';
export const LIST_ITEM_PROPS_PROP = 'listItemProps';

export const SELECTED_CLASSES_PROP = 'selectedClasses';
export const SELECTED_PROPS_PROP = 'selectedProps';

export const HERO_CLASSES_PROP = 'heroClasses';
export const HERO_PROPS_PROP = 'heroProps';

export type TCssProps = {
    [FIELD_CLASSES_PROP]?: CssClassesProps
    [FIELD_PROPS_PROP]?: CssElemProps;
    [INPUT_CLASSES_PROP]?: CssClassesProps 
    [INPUT_PROPS_PROP]?: CssElemProps;
    [LABEL_CLASSES_PROP]?: CssClassesProps
    [LABEL_PROPS_PROP]?: CssElemProps;
    [HERO_CLASSES_PROP]?: CssClassesProps
    [HERO_PROPS_PROP]?: CssElemProps;
    [LIST_ITEM_CLASSES_PROP]?: CssClassesProps;
    [LIST_ITEM_PROPS_PROP]?: CssElemProps;
    [SELECTED_CLASSES_PROP]?: CssClassesProps;
    [SELECTED_PROPS_PROP]?: CssElemProps;
}

type TFieldConfig = {
    type: string;
    label: string;
    adminLabel?: string;
    name: string;
    subType?: string;
    refType?: string;
    desc?: string;
    canDelete?: boolean;
    canEdit?: boolean;
    required?: boolean;
    unique?: boolean;
    minLen?: number;
    maxLen?: number;
    placeholder?: string;
    pattern?: string;
    mediaId?: string;
    background?: string;
    logo?: string;
    minValue?: number;
    maxValue?: number;
    stepValue?: number;
    defaultValue?: number;
    minNumOfChoices?: number;
    maxNumOfChoices?: number;
    helpText?: string;
    errorMsg?: string;
    successMsg?: string;
    nextBtnLabel?: string;
    choiceGroupId?: string;
    choices?: Array<TChoice>;
    mediaInfo?: TMediaInfo;
    mediaInfoList?: TMediaInfo[];
    [HERO_FIELD_NAME]?: string;
    [LAYOUT_PROP]?: string;
    [FIELD_CLASSES_PROP]?: CssClassesProps
    [FIELD_PROPS_PROP]?: CssElemProps;
    [INPUT_CLASSES_PROP]?: CssClassesProps 
    [INPUT_PROPS_PROP]?: CssElemProps;
    [LABEL_CLASSES_PROP]?: CssClassesProps
    [LABEL_PROPS_PROP]?: CssElemProps;
    [HERO_CLASSES_PROP]?: CssClassesProps
    [HERO_PROPS_PROP]?: CssElemProps;
    [LIST_ITEM_CLASSES_PROP]?: CssClassesProps;
    [LIST_ITEM_PROPS_PROP]?: CssElemProps;
    [SELECTED_CLASSES_PROP]?: CssClassesProps;
    [SELECTED_PROPS_PROP]?: CssElemProps;
    isAdminField?: boolean;
    parent?: TFieldConfig;
    menuType?: string;
    menuLink?: string;
};

export type TFieldConfigInfo = {
    fieldConfig: TFieldConfig;
    fieldIndex: number;
};


export default TFieldConfig;