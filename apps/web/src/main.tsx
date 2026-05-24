import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@i18nprune/ui/styles/runtime.css';
import './styles.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root');
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
