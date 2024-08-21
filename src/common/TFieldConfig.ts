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


export const HERO_CSS_CLASSES_FIELD_NAME = 'heroClasses';
export const HERO_SX_PROPS_FIELD_NAME = 'heroSxProps';
export const HERO_FIELD_NAME = 'hero';
export const HERO_FIELD_LABEL = 'Hero Image';

export type TCssProps = {
    cClassesProps?: CssClassesProps
    cElemProps?: CssElemProps;
    iClassesProps?: CssClassesProps 
    iElemProps?: CssElemProps;
    lClassesProps?: CssClassesProps
    lElemProps?: CssElemProps;
    heroClassesProps?: CssClassesProps
    heroSxProps?: CssElemProps;
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
    cLayout?: string;
    cClasses?: string
    cElemProps?: string;
    iClasses?: string
    iElemProps?: string;
    lClasses?: string;
    lElemProps?: string;
    [HERO_FIELD_NAME]?: string;
    [HERO_CSS_CLASSES_FIELD_NAME]?: string;
    [HERO_SX_PROPS_FIELD_NAME]?: string;
    isAdminField?: boolean;
    parent?: TFieldConfig;
    actionType?: string;
    actionTarget?: string;
};

export type TFieldConfigInfo = {
    fieldConfig: TFieldConfig;
    fieldIndex: number;
};


export default TFieldConfig;