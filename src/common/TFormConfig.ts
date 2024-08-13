import TChoice from "./TChoice";
import TFieldConfig from "./TFieldConfig";
import shortUUID from "short-uuid";
import { MAIN_SECTION } from "./Constants";


export const CONTACTFORM_TYPE = 'contactform';
export const ADVANCEDFORM_TYPE = 'advancedform';
export const PRODUCTFORM_TYPE = 'productform';
export const MULTI_STEP_FORM_TYPE = 'multistepform';
export const CHOICE_FORM_TYPE = 'choiceform';

export type TFormSettings = {
    label: string;
    bClasses?: string;
    bSxProps?: string;
    fClasses?: string;
    fSxProps?: string;
    tClasses?: string;
    tSxProps?: string;
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
    timestamp?: number;
    sections: Record<string, TFieldConfig[]>;   
    choices?: TChoice[];
    renderingMode?: RenderingMode;
    bClasses?: string;
    bSxProps?: string | Record<string, any>
    fClasses?: string;
    fSxProps?: string | Record<string, any>
    tClasses?: string;
    tSxProps?: string | Record<string, any>
}

export const DEFAULT_FORM_CONFIG: TFormConfig = {
    id: shortUUID.generate(),
    uid: shortUUID.generate(),
    timestamp: Math.floor(Date.now() / 1000),
    type: CONTACTFORM_TYPE,
    name: 'demo',
    label: 'demo',
    sections: {[MAIN_SECTION]: []},
}

export default TFormConfig;