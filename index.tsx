
import React from 'react';
import ReactDOM from 'react-dom/client';
<<<<<<< HEAD
import { App } from './src/App.refactored';
=======
import { App } from './src/App.refactored';
import { UserProvider } from './src/context/UserContext';
>>>>>>> b8fad199 (commit "07.01")
import './src/styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);