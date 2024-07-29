import TChoice from "./TChoice";
import TFieldConfig from "./TFieldConfig";
import TAppPage from "./TAppPage";
import shortUUID from "short-uuid";
import { BUILDER_TAB_FORMS } from "./Constants";


export const CONTACTFORM_TYPE = 'contactform';
export const ADVANCEDFORM_TYPE = 'advancedform';
export const ONLINESTORE_TYPE = 'onlinestore';
export const MULTI_STEP_FORM_TYPE = 'multistepform';

export type TPostSettings = {
    label: string;
    background: string;
    logo: string;
    header: string;
    hero: string;
    submitBtnLabel: string;
    errorMsg: string;
    successMsg: string;
    nextBtnLabel: string;
    prevBtnLabel: string;
    frontendController: string;
    backendController: string;
};

type TPostConfig = {
    id: string;
    uid: string;
    type: string;
    name: string;
    label: string;
    timestamp: number;
    fields: Record<string, Array<TFieldConfig>>;
    background: string;
    logo: string;
    header: string;
    hero: string;
    submitBtnLabel: string;
    errorMsg: string;
    successMsg: string;
    nextBtnLabel: string;
    prevBtnLabel: string;
    choices: TChoice[];
    appPages?: TAppPage[];
    frontendController: string;
    backendController: string;
}

export const DEFAULT_FORM_CONFIG: TPostConfig = {
    id: shortUUID.generate(),
    uid: shortUUID.generate(),
    timestamp: Math.floor(Date.now() / 1000),
    type: CONTACTFORM_TYPE,
    name: 'demo',
    label: 'demo',
    fields: {[BUILDER_TAB_FORMS]: []},
    background: '',
    logo: '',
    header: '',
    hero: '',
    submitBtnLabel: 'Submit',
    errorMsg: '',
    successMsg: '',
    nextBtnLabel: 'Next',
    prevBtnLabel: 'Previous',
    choices: [],
    frontendController: 'controller-sample.js',
    backendController: 'controller-sample.php'
}

export default TPostConfig;