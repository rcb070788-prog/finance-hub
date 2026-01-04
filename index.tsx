import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

/**
 * START OF INITIALIZATION
 * This script connects the React code to the 'root' div in index.html
 */
const startApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Could not find root element to mount to");
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Start the app immediately
startApp();