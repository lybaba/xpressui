import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './demo/App';

const rootElem = document.getElementById('xpress') as HTMLElement

if (rootElem) {
    const postName = rootElem.getAttribute("data-post-name") || '';

    const root = ReactDOM.createRoot(
        rootElem
    );

    root.render(
        <React.StrictMode>
            <App 
                rootPostName={postName}
            />
        </React.StrictMode>
    );
}


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
