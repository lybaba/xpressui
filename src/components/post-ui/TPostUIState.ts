import { Dispatch } from "react";
import IAction from "../../common/IAction";

import TPostConfig from '../../common/TPostConfig'
import { DEFAULT_FORM_CONFIG } from "../../common/TPostConfig";
import TMediaFile from "../../common/TMediaFile";
import FrontendClient from "../../common/frontend";

export interface TPostUIState {
    postConfig: TPostConfig;
    template?: string;
    currentStepIndex: number;
    mediaFiles: TMediaFile[];
    mediaFilesMap : Record<string, TMediaFile>;
    serverErrors?: Record<string, string>;
    baseUrl: string;
    imagesBaseUrl: string;
    postName: string;
    frontend: FrontendClient;
}
export type TPostUIDispatch = {
    dispatch: Dispatch<IAction>;
}

export type TPostUIContext = TPostUIState & TPostUIDispatch;

export type TPostUIReducer = (state: TPostUIState, action: IAction) => TPostUIState


const DEFAULT_DISPATCH_ACTION: Dispatch<IAction> = (value: IAction) => null


export const DEFAULT_POSTUI_CONTEXT: TPostUIContext = {
    postConfig: DEFAULT_FORM_CONFIG,
    template: '',
    currentStepIndex: 0,
    mediaFiles: [],
    mediaFilesMap: {},
    postName: '',
    dispatch: DEFAULT_DISPATCH_ACTION,
    baseUrl: '',
    imagesBaseUrl: '',
    frontend: new FrontendClient({
        postConfig: DEFAULT_FORM_CONFIG,
        baseUrl: '',
        imagesBaseUrl: '',
        mediaFiles: [],
        mediaFilesMap: {}
    }),
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