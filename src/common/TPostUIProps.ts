import React from "react";
import TFormConfig from "./TFormConfig";
import TPostUIEvent from "./TPostUIEvent";
import TServerResponse from "./TServerResponse";
import TFormFieldProps from "./TFormFieldProps";


type TPostUIProps = {
    formConfig: TFormConfig;
    template?: string;
    baseUrl?: string;
    entry?: Record<string, any>;
    restartForm?: boolean;
    validate?: (values: Record<string, any>) => Record<string, string>;
    onPostUIEvent?: (event: TPostUIEvent) => Promise<TServerResponse>;
    renderComponent?: (props : TFormFieldProps) => React.ReactNode | undefined
}

export default TPostUIProps;