import TChoice from "./TChoice";
import TFieldConfig from "./TFieldConfig";
import shortUUID from "short-uuid";
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

export const BODY_CSS_CLASSES_FIELD_NAME = 'bClasses';
export const BODY_SX_PROPS_FIELD_NAME = 'bSxProps';

export const LOGO_FIELD_NAME = 'logo';
export const LOGO_CSS_CLASSES_FIELD_NAME = 'logoClasses';
export const LOGO_SX_PROPS_FIELD_NAME = 'logoSxProps';
export const LOGO_FIELD_LABEL = 'Logo Image';

export const BG_FIELD_NAME = 'background';
export const BG_FIELD_LABEL = 'Background Image';
export const BG_CSS_CLASSES_FIELD_NAME = 'bgClasses';
export const BG_SX_PROPS_FIELD_NAME = 'bgSxProps';


export type TFormSettings = {
    label: string;
    [BODY_CSS_CLASSES_FIELD_NAME]?: string;
    [BODY_SX_PROPS_FIELD_NAME]?: string;
    [LOGO_FIELD_NAME]?: string;
    [LOGO_CSS_CLASSES_FIELD_NAME]?: string;
    [LOGO_SX_PROPS_FIELD_NAME]?: string;
    [BG_FIELD_NAME]?: string;
    [BG_CSS_CLASSES_FIELD_NAME]?: string;
    [BG_SX_PROPS_FIELD_NAME]?: string;
    subforms?: TChoice[];
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
    [BODY_CSS_CLASSES_FIELD_NAME]?: string;
    [BODY_SX_PROPS_FIELD_NAME]?: string;
    [LOGO_FIELD_NAME]?: string;
    [LOGO_CSS_CLASSES_FIELD_NAME]?: string;
    [LOGO_SX_PROPS_FIELD_NAME]?: string;
    [BG_FIELD_NAME]?: string;
    [BG_CSS_CLASSES_FIELD_NAME]?: string;
    [BG_SX_PROPS_FIELD_NAME]?: string;
    timestamp?: number;
    sections: Record<string, TFieldConfig[]>;
    subforms?: TChoice[];
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