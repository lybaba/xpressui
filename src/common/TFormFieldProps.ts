import { FieldInputProps, FormRenderProps } from "react-final-form";
import TFieldConfig from "./TFieldConfig";
import TBuilderMenu from "./TBuilderMenu";
import TPostConfig from "./TPostConfig";
import { ReactNode } from "react";
import TPostUIEvent from "./TPostUIEvent";
import TServerResponse from "./TServerResponse";
import TComponentType from "./TComponentType";

type TFormFieldProps =  {
    postConfig: TPostConfig;
    fieldConfig: TFieldConfig;
    fieldIndex: number;
    hasError?: boolean;
    errorText?: string;
    hideLabel?: boolean;
    disabled?: boolean;
    input: FieldInputProps<any, HTMLElement>;
    isFirstInputfield?: boolean;
    builderMenu?: TBuilderMenu;
    normalizeFieldValue?: (value: any) => any;
    formProps?: FormRenderProps<any, any>;
    elemProps?: any;
    children?: ReactNode | undefined;
    startDecorator?: React.ReactNode;
    endDecorator?: React.ReactNode;
    onPostUIEvent?: (event: TPostUIEvent) => Promise<TServerResponse>;
    renderComponent?: (postConfig: TPostConfig,
                    fieldConfig: TFieldConfig,
                    componentType: TComponentType, 
                    children: React.ReactNode | undefined) => React.ReactNode | undefined
}

export default TFormFieldProps;
