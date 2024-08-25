import TFieldConfig, { TCssProps } from "./TFieldConfig";
import TFormConfig from "./TFormConfig";
import TBuilderMenu from "./TBuilderMenu";
import TPostUIEvent from "./TPostUIEvent";
import TServerResponse from "./TServerResponse";
import TComponentType from "./TComponentType";
import { TFormButtons } from "./formsubmit";


type TFormFieldProps =  {
    formConfig: TFormConfig;
    formName?: string;
    fieldConfig: TFieldConfig;
    fieldIndex?: number;
    hideLabel?: boolean;
    disabled?: boolean;
    isFirstInputfield?: boolean;
    builderMenu?: TBuilderMenu;
    isFieldOption?: boolean;
    normalizeFieldValue?: (value: any) => any,
    componentType?: TComponentType;
    isLivePreview?: boolean;
    formButtons?: TFormButtons;
    cssProps?: TCssProps;
    onClickEvent?: () => void;
    onPostUIEvent?: (event: TPostUIEvent) => Promise<TServerResponse>;
}

export default TFormFieldProps;