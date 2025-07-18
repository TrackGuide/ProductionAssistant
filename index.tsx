
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './src/App.refactored';
import { UserProvider } from './src/context/UserContext';
import { AppStateProvider } from './src/hooks/useAppState';
import './src/styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppStateProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </AppStateProvider>
  </React.StrictMode>
);