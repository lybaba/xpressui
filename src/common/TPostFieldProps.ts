import { FormRenderProps } from "react-final-form";
import TFieldConfig from "./TFieldConfig";
import TPostConfig from "./TPostConfig";
import TBuilderMenu from "./TBuilderMenu";
import TMediaFile from "./TMediaFile";
import { ReactNode } from "react";
import TUser from "./TUser";
import TPostUIEvent from "./TPostUIEvent";
import TServerResponse from "./TServerResponse";
import TComponentType from "./TComponentType";

type TPostFieldProps =  {
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
    onPostUIEvent?: (event: TPostUIEvent) => Promise<TServerResponse>;
    renderComponent?: (postConfig: TPostConfig,
                    fieldConfig: TFieldConfig,
                    componentType: TComponentType, 
                    children: React.ReactNode | undefined) => React.ReactNode | undefined
}

export default TPostFieldProps;