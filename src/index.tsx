import React from 'react';
import ReactDOM from 'react-dom/client';


import PostUIWebComponent from './PostUIComponent';
import App from './demo/App';
import TPostUIEvent from './types/TPostUIEvent';
import { EVENT_HANDLERS } from './components/post-ui/Actions';


if (!customElements.get('iak-post-ui')) { customElements.define('iak-post-ui', PostUIWebComponent); }


const root = ReactDOM.createRoot(
    document.getElementById('xpress-root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

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