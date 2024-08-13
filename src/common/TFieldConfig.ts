import { SxProps } from "@mui/joy/styles/types";
import TChoice from "./TChoice";
import { TMediaInfo } from "./TMediaFile";

export type ImageSize = {
    width: number;
    height: number;
};

export type CssClassesProps = {
    className?: string
};

export type SxPropsProps = {
    sx?: SxProps
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
    cClassesProps?: CssClassesProps
    cSxProps?: string;
    cSxPropsProps?: SxPropsProps;
    iClasses?: string
    iClassesProps?: CssClassesProps 
    iSxProps?: string;
    iSxPropsProps?: SxPropsProps;
    lClasses?: string
    lClassesProps?: CssClassesProps
    lSxProps?: string;
    lSxPropsProps?: SxPropsProps;
    isAdminField?: boolean;
};

export type TFieldConfigInfo = {
    fieldConfig: TFieldConfig;
    fieldIndex: number;
};


export default TFieldConfig;