import TChoice from "./TChoice";
import TFieldConfig from "./TFieldConfig";
import shortUUID from "short-uuid";
import { CUSTOM_SECTION } from "./Constants";


export const CONTACTFORM_TYPE = 'contactform';
export const ADVANCEDFORM_TYPE = 'advancedform';
export const PRODUCTFORM_TYPE = 'productform';
export const WEBAPP_TYPE = 'webapp';
export const SIGNUPFORM_TYPE = 'signupform';
export const MULTI_STEP_FORM_TYPE = 'multistepform';
export const CHOICE_FORM_TYPE = 'choiceform';

export type TFormSettings = {
    label: string;
    logo?: string;
    background?: string;
};

export enum RenderingMode {
    CREATE_ENTRY,
    MODIFY_ENTRY,
    VIEW_ENTRY
}


type TFormConfig = {
    id: string;
    uid: string;
    type: string;
    name: string;
    label: string;
    logo?: string;
    background?: string;
    timestamp?: number;
    sections: Record<string, TFieldConfig[]>;   
    choices?: TChoice[];
    renderingMode?: RenderingMode;
}

export const DEFAULT_FORM_CONFIG: TFormConfig = {
    id: shortUUID.generate(),
    uid: shortUUID.generate(),
    timestamp: Math.floor(Date.now() / 1000),
    type: CONTACTFORM_TYPE,
    name: 'demo',
    label: 'demo',
    sections: {[CUSTOM_SECTION]: []},
}

export default TFormConfig;