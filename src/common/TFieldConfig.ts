import TChoice from "./TChoice";
import { TMediaInfo } from "./TMediaFile";

export type ImageSize = {
    width: number;
    height: number;
};

export type TStepTransition = {
    whenField?: string;
    operator?: 'equals' | 'not_equals' | 'in' | 'not_in' | 'truthy' | 'date_before' | 'date_after' | 'date_between';
    value?: any;
    logic?: 'AND' | 'OR';
    conditions?: Array<{
        whenField: string;
        operator?: 'equals' | 'not_equals' | 'in' | 'not_in' | 'truthy' | 'date_before' | 'date_after' | 'date_between';
        value?: any;
    }>;
    target: string;
};

export type TStepTransitionCondition = {
    whenField: string;
    operator?: 'equals' | 'not_equals' | 'in' | 'not_in' | 'truthy' | 'date_before' | 'date_after' | 'date_between';
    value?: any;
};

export const HERO_FIELD_NAME = 'hero';
export const HERO_FIELD_LABEL = 'Hero Image';

export const LOGO_FIELD_NAME = 'logo';
export const LOGO_FIELD_LABEL = 'Logo Image';

export const BG_FIELD_NAME = 'background';
export const BG_FIELD_LABEL = 'Background Image';


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
    accept?: string;
    capture?: 'user' | 'environment';
    multiple?: boolean;
    documentScanMode?: 'single' | 'double';
    enableDocumentOcr?: boolean;
    requireValidDocumentMrz?: boolean;
    documentTextTargetField?: string;
    documentMrzTargetField?: string;
    documentFirstNameTargetField?: string;
    documentLastNameTargetField?: string;
    documentNumberTargetField?: string;
    documentNationalityTargetField?: string;
    documentBirthDateTargetField?: string;
    documentExpiryDateTargetField?: string;
    documentSexTargetField?: string;
    fileDropMode?: 'replace' | 'append';
    minFiles?: number;
    maxFiles?: number;
    maxFileSizeMb?: number;
    maxTotalFileSizeMb?: number;
    formDataFieldName?: string;
    fileTypeErrorMsg?: string;
    fileSizeErrorMsg?: string;
    pattern?: string;
    mediaId?: string;
    background?: string;
    logo?: string;
    hero?: string;
    min?: any;
    max?: any;
    step?: any;
    defaultValue?: any;
    includeInSubmit?: boolean;
    minNumOfChoices?: number;
    maxNumOfChoices?: number;
    helpText?: string;
    errorMsg?: string;
    successMsg?: string;
    nextBtnLabel?: string;
    value?: any;
    viewMode?: 'view' | 'edit';
    viewTemplate?: string;
    viewTemplateUnsafe?: boolean;
    choices?: Array<TChoice>;
    mediaInfo?: TMediaInfo;
    mediaInfoList?: TMediaInfo[];
    isAdminField?: boolean;
    parent?: TFieldConfig;
    linkType?: string;
    linkPath?: string;
    width?: string;
    layout?: string;
    justifyContent?: string;
    alignItems?: string;
    spacing?: number;
    gap?: number;
    bgcolor?: string;
    textcolor?: string;
    maxWidth?: string;
    maxHeight?: string;
    subfields?: TChoice[];
    visibleWhenField?: string;
    visibleWhenEquals?: string;
    optionsEndpoint?: string;
    optionsDependsOn?: string;
    optionsLabelKey?: string;
    optionsValueKey?: string;
    stepSkippable?: boolean;
    stepValidateWhenWorkflowStates?: string[];
    stepSummary?: boolean;
    nextStepWhenField?: string;
    nextStepWhenEquals?: string | string[];
    nextStepWhenNotEquals?: string | string[];
    nextStepTarget?: string;
    stepTransitions?: TStepTransition[];
};

export type TFieldConfigInfo = {
    fieldConfig: TFieldConfig;
    fieldIndex: number;
};


export default TFieldConfig;
