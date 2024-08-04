import { Dispatch } from "react";
import IAction from "../../common/IAction";

import TPostConfig from '../../common/TPostConfig'
import { DEFAULT_FORM_CONFIG } from "../../common/TPostConfig";
import TMediaFile from "../../common/TMediaFile";
import FrontendClient from "../../common/frontend";
import TUser from "../../common/TUser";
import TServerResponse from "../../common/TServerResponse";

export interface TPostUIState {
    currentPostConfig: TPostConfig;
    rootPostConfig: TPostConfig;
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
    dispatch: Dispatch<IAction>;
}

export type TPostUIContext = TPostUIState & TPostUIDispatch;

export type TPostUIReducer = (state: TPostUIState, action: IAction) => TPostUIState


const DEFAULT_DISPATCH_ACTION: Dispatch<IAction> = (value: IAction) => null


export const DEFAULT_POSTUI_CONTEXT: TPostUIContext = {
    currentPostConfig: DEFAULT_FORM_CONFIG,
    rootPostConfig: DEFAULT_FORM_CONFIG,
    currentStepIndex: 0,
    mediaFiles: [],
    mediaFilesMap: {},
    dispatch: DEFAULT_DISPATCH_ACTION,
    baseUrl: '',
    imagesBaseUrl: '',
    baseStorageUrl: '',
    frontend: new FrontendClient({
        postConfig: DEFAULT_FORM_CONFIG,
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
    dispatch: Dispatch<IAction>;
    postConfig: TPostConfig;
    groupName: string;
}

export type TDispatchConfigProps = {
    dispatch: Dispatch<IAction>;
    postConfig: TPostConfig;
    mediaFilesMap: Record<string, TMediaFile>;
}

export type TConfigProps = {
    postConfig: TPostConfig;
    mediaFilesMap: Record<string, TMediaFile>;
}


export default TPostUIState;