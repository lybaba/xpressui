import TChoice from "./TChoice";
import TFieldConfig from "./TFieldConfig";
import shortUUID from "short-uuid";
import { MAIN_SECTION } from "./Constants";
import { TMediaInfo } from "./TMediaFile";


export const CONTACTFORM_TYPE = 'contactform';
export const ADVANCEDFORM_TYPE = 'advancedform';
export const PRODUCTFORM_TYPE = 'productform';
export const MULTI_STEP_FORM_TYPE = 'multistepform';
export const CHOICE_FORM_TYPE = 'choiceform';

export type TFormSettings = {
    label: string;
    background?: string;
    logo?: string;
    header?: string;
    hero?: string;
    submitBtnLabel: string;
    errorMsg?: string;
    successMsg?: string;
    nextBtnLabel?: string;
    prevBtnLabel?: string;
    cLayout?: string;
    cClasses?: string;
    cSxProps?: string;
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
    background?: string;
    backgroundInfo?: TMediaInfo;
    logo?: string;
    logoInfo?: TMediaInfo 
    header?: string;
    headerInfo?: TMediaInfo
    hero?: string;
    heroInfo?: TMediaInfo;
    submitBtnLabel?: string;
    addBtnLabel?: string;
    modifyBtnLabel?: string;
    errorMsg?: string;
    successMsg?: string;
    nextBtnLabel?: string;
    prevBtnLabel?: string;
    choices?: TChoice[];
    backendController: string;
    renderingMode?: RenderingMode;
    cClasses?: string;
    cSxProps?: string;
}

export const DEFAULT_FORM_CONFIG: TFormConfig = {
    id: shortUUID.generate(),
    uid: shortUUID.generate(),
    timestamp: Math.floor(Date.now() / 1000),
    type: CONTACTFORM_TYPE,
    name: 'demo',
    label: 'demo',
    sections: {[MAIN_SECTION]: []},
    submitBtnLabel: 'Submit',
    addBtnLabel: 'Add',
    modifyBtnLabel: 'Modify',
    nextBtnLabel: 'Next',
    prevBtnLabel: 'Previous',
    backendController: 'controller-sample.php'
}

export default TFormConfig;