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
export const BLOCK_CLASSES_PROP = 'blockClasses';
export const BLOCK_PROPS_PROP = 'blockProps';

export const LABEL_CLASSES_PROP = 'labelClasses';
export const LABEL_PROPS_PROP = 'labelProps';

export const INPUT_CLASSES_PROP = 'inputClasses';
export const INPUT_PROPS_PROP = 'inputProps';

export const LIST_ITEM_CLASSES_PROP = 'listItemClasses';
export const LIST_ITEM_PROPS_PROP = 'listItemProps';

export const SELECTED_CLASSES_PROP = 'selectedClasses';
export const SELECTED_PROPS_PROP = 'selectedProps';

export const MEDIA_CLASSES_PROP = 'mediaClasses';
export const MEDIA_PROPS_PROP = 'mediaProps';

export const BTNGROUP_CLASSES_PROP = 'btnGroupClasses';
export const BTNGROUP_PROPS_PROP = 'btnGroupProps';

export const LOGO_FIELD_NAME = 'logo';
export const LOGO_CSS_CLASSES_FIELD_NAME = 'logoClasses';
export const LOGO_SX_PROPS_FIELD_NAME = 'logoSxProps';
export const LOGO_FIELD_LABEL = 'Logo Image';

export const BG_FIELD_NAME = 'background';
export const BG_FIELD_LABEL = 'Background Image';
export const BG_CSS_CLASSES_FIELD_NAME = 'bgClasses';
export const BG_SX_PROPS_FIELD_NAME = 'bgSxProps';


export type TCssProps = {
    blockClasses?: CssClassesProps
    blockProps?: CssElemProps;
    inputClasses?: CssClassesProps 
    inputProps?: CssElemProps;
    labelClasses?: CssClassesProps
    labelProps?: CssElemProps;
    mediaClasses?: CssClassesProps
    mediaProps?: CssElemProps;
    listItemClasses?: CssClassesProps;
    listItemProps?: CssElemProps;
    selectedClasses?: CssClassesProps;
    selectedProps?: CssElemProps;
    btnGroupClasses?: CssClassesProps;
    btnGroupProps?: CssElemProps;
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
    [BLOCK_CLASSES_PROP]?: string
    [BLOCK_PROPS_PROP]?: string;
    [INPUT_CLASSES_PROP]?: string 
    [INPUT_PROPS_PROP]?: string;
    [LABEL_CLASSES_PROP]?: string
    [LABEL_PROPS_PROP]?: string;
    [MEDIA_CLASSES_PROP]?: string
    [MEDIA_PROPS_PROP]?: string;
    [LIST_ITEM_CLASSES_PROP]?: string;
    [LIST_ITEM_PROPS_PROP]?: string;
    [SELECTED_CLASSES_PROP]?: string;
    [SELECTED_PROPS_PROP]?: string;
    [BTNGROUP_CLASSES_PROP]?: string;
    [BTNGROUP_PROPS_PROP]?: string;
    isAdminField?: boolean;
    parent?: TFieldConfig;
    linkType?: string;
    linkPath?: string;
};

export type TFieldConfigInfo = {
    fieldConfig: TFieldConfig;
    fieldIndex: number;
};


export default TFieldConfig;