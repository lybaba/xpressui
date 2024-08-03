import { FieldInputProps, FormRenderProps } from "react-final-form";
import TFieldConfig from "./TFieldConfig";
import TBuilderMenu from "./TBuilderMenu";
import TPostConfig from "./TPostConfig";
import TMediaFile from "./TMediaFile";
import { ReactNode } from "react";
import TUser from "./TUser";
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
    normalizeFieldValue?: (value: any) => any,
    formProps: FormRenderProps<any, any>;
    parentFieldConfig: TFieldConfig;
    mediaFilesMap: Record<string, TMediaFile>;
    elemProps?: any;
    children?: ReactNode | undefined;
    onPostUIEvent?: (event: TPostUIEvent) => Promise<TServerResponse>;
    renderComponent?: (postConfig: TPostConfig,
                    fieldConfig: TFieldConfig,
                    componentType: TComponentType, 
                    children: React.ReactNode | undefined) => React.ReactNode | undefined
}

export default TFormFieldProps;
