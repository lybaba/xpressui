import { FormRenderProps } from "react-final-form";
import TFieldConfig from "../types/TFieldConfig";
import TPostConfig from "../types/TPostConfig";
import TBuilderMenu from "../types/TBuilderMenu";
import TMediaFile from "../types/TMediaFile";
import { ReactNode } from "react";

type PostFieldProps =  {
    postConfig: TPostConfig;
    formName?: string;
    fieldConfig: TFieldConfig;
    fieldIndex: number;
    parentFieldConfig: TFieldConfig;
    hideLabel?: boolean;
    disabled?: boolean;
    isFirstInputfield?: boolean;
    builderMenu?: TBuilderMenu;
    isFieldOption?: boolean;
    isLivePreview?: boolean;
    normalizeFieldValue?: (value: any) => any,
    formProps: FormRenderProps<any, any>;
    mediaFilesMap: Record<string, TMediaFile>;
    elemProps?: any;
    children?: ReactNode | undefined;
}

export default PostFieldProps;