import React from "react";
import TComponentType from "./TComponentType";
import TFieldConfig from "./TFieldConfig";
import TPostConfig from "./TPostConfig";
import TPostUIEvent from "./TPostUIEvent";
import TServerResponse from "./TServerResponse";

type TPostUIProps = {
    postConfig: TPostConfig;
    baseUrl?: string;
    onPostUIEvent: (event: TPostUIEvent) => Promise<TServerResponse>;
    renderComponent?: (postConfig: TPostConfig,
                    fieldConfig: TFieldConfig,
                    componentType: TComponentType, 
                    children: React.ReactNode | undefined) => React.ReactNode | undefined
}

export default TPostUIProps;