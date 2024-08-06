import TChoice from "./TChoice";
import { TMediaInfo } from "./TMediaFile";

export type ImageSize = {
    width: number;
    height: number;
};

type TFieldConfig = {
    type: string;
    label: string;
    name: string;
    subType?: string;
    refType?: string;
    desc?: string;
    canDelete?: boolean;
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
};

export type TFieldConfigInfo = {
    fieldConfig: TFieldConfig;
    fieldIndex: number;
};


export default TFieldConfig;