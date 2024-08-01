import { FieldInputProps, FormRenderProps } from "react-final-form";
import TFieldConfig from "../common/TFieldConfig";
import TBuilderMenu from "../common/TBuilderMenu";
import TPostConfig from "../common/TPostConfig";
import TMediaFile from "../common/TMediaFile";
import { ReactNode } from "react";
import TUser from "../common/TUser";

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
    user?: TUser | null;
}

export default FormFieldProps;
