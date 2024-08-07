import React from "react";
import TComponentType from "./TComponentType";
import TFieldConfig from "./TFieldConfig";
import TFormConfig from "./TFormConfig";
import TPostUIEvent from "./TPostUIEvent";
import TServerResponse from "./TServerResponse";

type TPostUIProps = {
    formConfig: TFormConfig;
    template?: string;
    baseUrl?: string;
    onPostUIEvent?: (event: TPostUIEvent) => Promise<TServerResponse>;
    renderComponent?: (formConfig: TFormConfig,
                    fieldConfig: TFieldConfig,
                    componentType: TComponentType, 
                    children: React.ReactNode | undefined) => React.ReactNode | undefined
}

export default TPostUIProps;