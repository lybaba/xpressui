import { FieldInputProps, FormRenderProps } from "react-final-form";
import TFieldConfig from "../types/TFieldConfig";
import TBuilderMenu from "../types/TBuilderMenu";
import TPostConfig from "../types/TPostConfig";
import TMediaFile from "../types/TMediaFile";
import { ReactNode } from "react";

type FormFieldProps =  {
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
}

export default FormFieldProps;
