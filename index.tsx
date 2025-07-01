
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UserProvider } from './src/context/UserContext';
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