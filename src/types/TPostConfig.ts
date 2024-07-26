import TChoice from "./TChoice";
import TFieldConfig from "./TFieldConfig";

export type TPostSettings = {
    label: string;
    background: string;
    logo: string;
    header: string;
    hero: string;
    submitBtnLabel: string;
    errorMsg: string;
    successMsg: string;
    nextBtnLabel: string;
    prevBtnLabel: string;
    frontendController: string;
    backendController: string;
};

type TPostConfig = {
    id: string;
    uid: string;
    type: string;
    name: string;
    label: string;
    timestamp: number;
    fields: Record<string, Array<TFieldConfig>>;
    background: string;
    logo: string;
    header: string;
    hero: string;
    submitBtnLabel: string;
    errorMsg: string;
    successMsg: string;
    nextBtnLabel: string;
    prevBtnLabel: string;
    choices: TChoice[];
    frontendController: string;
    backendController: string;
}

export default TPostConfig;