import TFormConfig from "./TFormConfig";
import TPostUIEvent from "./TPostUIEvent";
import TServerResponse from "./TServerResponse";

type TPostUIProps = {
    formConfig: TFormConfig;
    template?: string;
    baseUrl?: string;
    entry?: Record<string, any>;
    restartForm?: boolean;
    validate?: (values: Record<string, any>) => Record<string, string>;
    onPostUIEvent?: (event: TPostUIEvent) => Promise<TServerResponse>;
}

export default TPostUIProps;