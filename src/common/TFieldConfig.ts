import TChoice from "./TChoice";
import { TMediaInfo } from "./TMediaFile";

export type ImageSize = {
    width: number;
    height: number;
};

export type CssClassesProp = {
    className: string
};

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
    cClasses?: string | CssClassesProp | {} 
    cSxProps?: string | Record<string, any>;
    iClasses?: string | CssClassesProp | {} 
    iSxProps?: string | Record<string, any>;
    lClasses?: string | CssClassesProp | {} ;
    lSxProps?: string | Record<string, any>;
    isAdminField?: boolean;
};

export type TFieldConfigInfo = {
    fieldConfig: TFieldConfig;
    fieldIndex: number;
};


export default TFieldConfig;