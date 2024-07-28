import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './demo/App';
import TPostUIEvent from './types/TPostUIEvent';
import { EVENT_HANDLERS } from './components/post-ui/Actions';
import { TPostConfigWitBaseUrl, getPostConfigAndAssets } from './components/post-ui/post-utils';
import { isEmpty } from 'lodash';
import TMediaFile from './types/TMediaFile';


const rootElem = document.getElementById('xpress') as HTMLElement

if (rootElem) {
    const postName = rootElem.getAttribute("data-post-name") || '';

    const root = ReactDOM.createRoot(
        rootElem
    );

    const postConfigFileName = `config/${postName}.json`;
    const postAssetsFileName = `config/assets.json`;
    
    getPostConfigAndAssets(postConfigFileName, postAssetsFileName).then((data) => {
        if (data.length === 2 && !isEmpty(data[0]) && !isEmpty(data[1])) {
            const postConfigWithBaseUrl = data[0] as TPostConfigWitBaseUrl;

            const {
                postConfig,
                baseUrl
            } = postConfigWithBaseUrl;

            const mediaFiles = data[1] as TMediaFile[]; 

            root.render(
                <React.StrictMode>
                    <App 
                        rootPostName={postName}
                        postConfig={postConfig}
                        mediaFiles={mediaFiles}
                        baseUrl={baseUrl}
                    />
                </React.StrictMode>
            );
        }
    });
}


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();


const xpress = {
    addEventHandler: (eventhandler: (event: TPostUIEvent) => Promise<any>) => {
        EVENT_HANDLERS.push(
            async function (
                event: TPostUIEvent,
                onSuccess: (data: any) => void,
                onError: (data: any) => void) {
                try {
                    const res = await eventhandler(event);
                    onSuccess(res);
                } catch (reason: any) {
                    onError(reason);
                }
            });
    }
}

export default xpress;