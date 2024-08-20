import { Dispatch } from "react";
import TAction from "../../common/TAction";

import TFormConfig from '../../common/TFormConfig'
import { DEFAULT_FORM_CONFIG } from "../../common/TFormConfig";
import TMediaFile from "../../common/TMediaFile";
import TUser from "../../common/TUser";
import TServerResponse from "../../common/TServerResponse";

export interface TPostUIState {
    currentFormConfig: TFormConfig;
    rootFormConfig: TFormConfig;
    currentStepIndex: number;
    serverErrors?: Record<string, string>;
    baseUrl: string;
    user: TUser | null;
    isLoading: boolean;
    authChecking: boolean;
    serverResponse: TServerResponse;
}
export type TPostUIDispatch = {
    dispatch: Dispatch<TAction>;
}

export type TPostUIContext = TPostUIState & TPostUIDispatch;

export type TPostUIReducer = (state: TPostUIState, action: TAction) => TPostUIState


const DEFAULT_DISPATCH_ACTION: Dispatch<TAction> = (value: TAction) => null


export const DEFAULT_POSTUI_CONTEXT: TPostUIContext = {
    currentFormConfig: DEFAULT_FORM_CONFIG,
    rootFormConfig: DEFAULT_FORM_CONFIG,
    currentStepIndex: 0,

    dispatch: DEFAULT_DISPATCH_ACTION,
    baseUrl: '',
    isLoading: false,
    authChecking: false,
    serverResponse: {
        success: true,
        statusCode: 200,
        message: '',
    },
    user: null,
};

export type TDispatchFieldGroupProps = {
    dispatch: Dispatch<TAction>;
    formConfig: TFormConfig;
    groupName: string;
}

export type TDispatchConfigProps = {
    dispatch: Dispatch<TAction>;
    formConfig: TFormConfig;
    mediaFilesMap: Record<string, TMediaFile>;
}

export type TConfigProps = {
    formConfig: TFormConfig;
    mediaFilesMap: Record<string, TMediaFile>;
}


export default TPostUIState;