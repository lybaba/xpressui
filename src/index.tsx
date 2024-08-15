import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'
import App from './App';

const rootElem = document.getElementById('root') as HTMLElement

if (rootElem) {
    const root = ReactDOM.createRoot(
        rootElem
    );

    root.render(
        <React.StrictMode>
             <h1 className="text-3xl font-bold underline">
      Hello world!
    </h1>
            <App />
        </React.StrictMode>
    );
}
