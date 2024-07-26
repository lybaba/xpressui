import React from 'react';
import ReactDOM from 'react-dom/client';

import PostUIProvider from './components/post-ui/PostUIProvider';
import ModalProvider from './common/ModalProvider';

import { ThemeProvider } from '@mui/joy/styles';
import theme from './components/post-ui/styles/default';
import { HashRouter } from 'react-router-dom';
import { isEmpty } from 'lodash';
import TPostConfig from './types/TPostConfig';
import TMediaFile from './types/TMediaFile';
import TPostUIEvent, { TPostUIEventType } from './types/TPostUIEvent';
import { BUILDER_TAB_FORMS, IAK_POST_UI_EVENT } from './types/Constants';
import FrontendClient from './api/frontend';
import { MULTI_STEP_FORM_TYPE } from './api/post';
import TPostUIState from './components/post-ui/TPostUIState';
import PostUI from './components/post-ui/PostUI';

type TPostConfigWitBaseUrl = {
    postConfig: TPostConfig;
    baseUrl: string;
}

async function fetchPostConfig(fileName: string): Promise<TPostConfigWitBaseUrl | null> {
    try {
        const response = await fetch(`./${fileName}`);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const url = response.url;
        const index = url.lastIndexOf(fileName);
        const baseUrl = url.substring(0, index);

        const postConfig = await response.json();
        return {
            postConfig,
            baseUrl
        };
    } catch (reason: any) {
        console.error(reason);
    }

    return null;
}

async function fetchPostAssets(fileName: string): Promise<TMediaFile[] | null> {
    try {
        const response = await fetch(`./${fileName}`);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const mediaFiles = await response.json();
        return mediaFiles;
    } catch (reason: any) {
        console.error(reason);
    }

    return null;
}

async function getConfig(postConfigFileName: string, postAssetsFileName: string = "") {
    if (!isEmpty(postAssetsFileName)) {
        const res = await Promise.all([
            fetchPostConfig(postConfigFileName),
            fetchPostAssets(postAssetsFileName)]);
    
        return res;
    } else {
        const res = await fetchPostConfig(postConfigFileName);
    
        return [res, []];
    }
}

type RenderPostUIProps = {
    postConfig: TPostConfig;
    baseUrl: string;
    template: string;
    mediaFiles: TMediaFile[];
    mediaFilesMap: Record<string, TMediaFile>;
}

function renderPostUI(props: RenderPostUIProps) {
    const {
        postConfig,
        baseUrl,
        template,
        mediaFiles,
        mediaFilesMap,
    } = props;

    const imagesBaseUrl = `${baseUrl}static/images`;

    const steps = postConfig.fields[BUILDER_TAB_FORMS];
    const isMultiStepForm = postConfig.type === MULTI_STEP_FORM_TYPE;

    const dataProps = isMultiStepForm ? {
        data: {
            currentStepIndex: 0,
            steps
        }
    } :
        {
            data: {}
        }


    const postName = postConfig.name;

    const FrontendClientArgs = {
        template,
        postName,
        baseUrl,
        imagesBaseUrl,
        postConfig,
        mediaFiles,
        mediaFilesMap,
    }

    const frontend = new FrontendClient(FrontendClientArgs);

    const initialState: TPostUIState = {
        ...FrontendClientArgs,
        frontend,
        currentStepIndex: 0
    }


    const eventData: TPostUIEvent = {
        frontend,
        eventType: TPostUIEventType.InitEvent,
        onSuccess: (data: any) => null,
        onError: (data: any) => null,
        ...dataProps
    }

    const event = new CustomEvent(IAK_POST_UI_EVENT, { detail: eventData });
    document.dispatchEvent(event);

    return (
        <PostUIProvider
            initialState={initialState}
        >
            <PostUI />
        </PostUIProvider>
    );
}

type PostUIProps = {
    mountNodeId: string;
    postConfig: TPostConfig;
    baseUrl?: string;
    template?: string;
    mediaFiles?: TMediaFile[];
}

export function render(props: PostUIProps) {
    const {
        postConfig,
        baseUrl = '',
        template = '',
        mediaFiles = [],
        mountNodeId
    } = props;

    const mediaFilesMap: Record<string, TMediaFile> = {};

    mediaFiles.forEach((mediaFile: TMediaFile) => {
        mediaFilesMap[mediaFile.id] = mediaFile;
    });

    const root = ReactDOM.createRoot(
        document.getElementById(mountNodeId) as HTMLElement
    );

    root.render(
        <React.StrictMode>
            <ThemeProvider theme={theme}>
                <HashRouter>
                    <ModalProvider>
                        {
                            renderPostUI({
                                postConfig,
                                baseUrl,
                                template,
                                mediaFiles,
                                mediaFilesMap
                            })
                        }
                    </ModalProvider>
                </HashRouter>
            </ThemeProvider>
        </React.StrictMode>
    );
}

class PostUIComponent extends HTMLElement {
    private name: string;

    constructor (_name: string) {
        super();
        this.name = _name;
    }

    connectedCallback() {
        const root = ReactDOM.createRoot(this);
        
        const postName = this.getAttribute("name") ?? '';

        // Get the reference to the template
        const templateReference: any = document.querySelector(`#${postName}`);

        // Get the content node
        const template = templateReference?.innerHTML ?? '';

        getConfig(`static/${postName}-config.json`, `static/${postName}-assets.json`).then((data) => {
            if (!isEmpty(data[0]) && !isEmpty(data[1])) {
                const postConfigWithBaseUrl = data[0] as TPostConfigWitBaseUrl;

                const {
                    postConfig,
                    baseUrl
                } = postConfigWithBaseUrl;

                const mediaFiles = data[1] as TMediaFile[];

                const mediaFilesMap: Record<string, TMediaFile> = {};

                mediaFiles.forEach((mediaFile: TMediaFile) => {
                    mediaFilesMap[mediaFile.id] = mediaFile;
                });


                root.render(
                    <React.StrictMode>
                        <ThemeProvider theme={theme}>
                            <HashRouter>
                                <ModalProvider>
                                    {
                                        renderPostUI({
                                            postConfig,
                                            baseUrl,
                                            template,
                                            mediaFiles,
                                            mediaFilesMap
                                        })
                                    }
                                </ModalProvider>
                            </HashRouter>
                        </ThemeProvider>
                    </React.StrictMode>
                );
            }
        })
    }
}

export default PostUIComponent;