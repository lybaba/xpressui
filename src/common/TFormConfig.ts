import TChoice from "./TChoice";
import TFieldConfig from "./TFieldConfig";
import * as shortUUID from "short-uuid";
import { CUSTOM_SECTION } from "./Constants";


export const BODY_SECTION_NAME = 'body';
export const BODY_SECTION_LABEL = 'Form Styling';

export const FOOTER_FIELD_NAME = 'footer';
export const NAV_FIELD_NAME = 'nav';
export const TITLE_FIELD_NAME = 'title';
export const DESC_FIELD_NAME = 'desc';


export const CONTACTFORM_TYPE = 'contactform';
export const ADVANCEDFORM_TYPE = 'advancedform';
export const PRODUCTFORM_TYPE = 'productform';
export const WEBAPP_TYPE = 'webapp';
export const SIGNUPFORM_TYPE = 'signupform';
export const MULTI_STEP_FORM_TYPE = 'multistepform';
export const CHOICE_FORM_TYPE = 'choiceform';


export type TFormSettings = {
    title: string;
    subforms?: TChoice[];
    background?: string;
    bgcolor?: string;
    textcolor?: string;
    justifyContent?: string;
    alignItems?: string;
    spacing?: number;
    gap?: number;
    maxWidth?: string;
    maxHeight?: string;
};

export enum RenderingMode {
    CREATE_ENTRY,
    MODIFY_ENTRY,
    VIEW_ENTRY
}

export type TFormSubmitRequest = {
    endpoint: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    mode?: 'json' | 'form-data';
    action?: string;
};

export type TFormProviderRequest = {
    type: string;
    endpoint: string;
    method?: 'POST' | 'PUT' | 'PATCH';
    headers?: Record<string, string>;
};

export type TFormStorageConfig = {
    mode: 'none' | 'draft' | 'queue' | 'draft-and-queue';
    adapter?: 'local-storage';
    key?: string;
    autoSaveMs?: number;
};

export type TFormRuleCondition = {
    field: string;
    operator?: 'equals' | 'not_equals' | 'contains' | 'in' | 'gt' | 'lt';
    value?: any;
};

export type TFormRuleAction = {
    type: 'show' | 'hide' | 'enable' | 'disable' | 'clear-value' | 'set-value' | 'fetch-options';
    field: string;
    value?: any;
};

export type TFormRule = {
    id?: string;
    logic?: 'AND' | 'OR';
    conditions: TFormRuleCondition[];
    actions: TFormRuleAction[];
};

type TFormConfig = {
    version: number;
    id: string;
    uid: string;
    type: string;
    name: string;
    title: string;
    timestamp?: number;
    sections: Record<string, TFieldConfig[]>;
    subforms?: TChoice[];
    choices?: TChoice[];
    background?: string;
    renderingMode?: RenderingMode;
    justifyContent?: string;
    alignItems?: string;
    spacing?: number;
    gap?: number;
    maxWidth?: string;
    maxHeight?: string;
    bgcolor?: string;
    textcolor?: string;
    submit?: TFormSubmitRequest;
    provider?: TFormProviderRequest;
    storage?: TFormStorageConfig;
    rules?: TFormRule[];
    successMsg?: string;
    errorMsg?: string;
}

export const DEFAULT_FORM_CONFIG: TFormConfig = {
    version: 1,
    id: shortUUID.generate(),
    uid: shortUUID.generate(),
    timestamp: Math.floor(Date.now() / 1000),
    type: CONTACTFORM_TYPE,
    name: 'demo',
    title: 'demo',
    sections: {[CUSTOM_SECTION]: []},
}

export default TFormConfig;
