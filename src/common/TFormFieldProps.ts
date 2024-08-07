import { FieldInputProps, FormRenderProps } from "react-final-form";
import TFieldConfig from "./TFieldConfig";
import TFormConfig from "./TFormConfig";
import TBuilderMenu from "./TBuilderMenu";
import { ReactNode } from "react";
import TPostUIEvent from "./TPostUIEvent";
import TServerResponse from "./TServerResponse";
import TComponentType from "./TComponentType";

type TFormFieldProps =  {
    formConfig: TFormConfig;
    formName?: string;
    fieldConfig: TFieldConfig;
    fieldIndex: number;
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
    elemProps?: any;
    children?: ReactNode | undefined;
    componentType?: TComponentType
    onPostUIEvent?: (event: TPostUIEvent) => Promise<TServerResponse>;
    renderComponent?: (props: TFormFieldProps) => React.ReactNode | undefined
}

export default TFormFieldProps;