import { Dispatch } from "react";
import TAction from "../../common/TAction";

import TFormConfig from '../../common/TFormConfig'
import { DEFAULT_FORM_CONFIG } from "../../common/TFormConfig";
import TMediaFile from "../../common/TMediaFile";
import FrontendClient from "../../common/frontend";
import TUser from "../../common/TUser";
import TServerResponse from "../../common/TServerResponse";

export interface TPostUIState {
    currentFormConfig: TFormConfig;
    rootFormConfig: TFormConfig;
    currentStepIndex: number;
    mediaFiles: TMediaFile[];
    mediaFilesMap : Record<string, TMediaFile>;
    serverErrors?: Record<string, string>;
    baseUrl: string;
    baseStorageUrl?: string;
    imagesBaseUrl: string;
    frontend: FrontendClient;
    user: TUser | null;
    isLoading: boolean;
    authChecking: boolean;
    serverResponse: TServerResponse;
    isLivePreview: boolean;
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
    mediaFiles: [],
    mediaFilesMap: {},
    dispatch: DEFAULT_DISPATCH_ACTION,
    baseUrl: '',
    imagesBaseUrl: '',
    baseStorageUrl: '',
    frontend: new FrontendClient({
        formConfig: DEFAULT_FORM_CONFIG,
        baseUrl: '',
        imagesBaseUrl: '',
    }),
    isLivePreview: false,
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