import { FieldInputProps, FormRenderProps } from "react-final-form";
import TFieldConfig, { TCssProps } from "./TFieldConfig";
import TFormConfig from "./TFormConfig";
import TBuilderMenu from "./TBuilderMenu";
import { ReactNode } from "react";
import TPostUIEvent from "./TPostUIEvent";
import TServerResponse from "./TServerResponse";
import TComponentType from "./TComponentType";
import { TFormSubmit } from "./formsubmit";
import { TFormStyling } from "./formstyling";


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
    startDecorator?: React.ReactNode;
    endDecorator?: React.ReactNode;
    normalizeFieldValue?: (value: any) => any,
    formProps?: FormRenderProps<any, any>;
    input?: FieldInputProps<any, HTMLElement>;
    children?: ReactNode | undefined;
    componentType?: TComponentType;
    isLivePreview?: boolean;
    formSubmitConfig?: TFormSubmit;
    formStylingConfig?: TFormStyling;
    cssProps?: TCssProps;
    onClickEvent?: () => void;
    onPostUIEvent?: (event: TPostUIEvent) => Promise<TServerResponse>;
    renderField?: (props: TFormFieldProps) => React.ReactNode | undefined
    renderSection?: (props: TFormFieldProps, fields: TFieldConfig[]) => React.ReactNode | undefined
}

export default TFormFieldProps;