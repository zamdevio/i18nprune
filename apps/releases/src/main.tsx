import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/app/App';
import { prepareThemeStorage } from '@/lib/theme-storage';
import '@i18nprune/ui/styles/tokens.css';
import '@i18nprune/ui/styles/runtime.css';
import '@/styles/index.css';

const THEME_STORAGE_KEY = 'i18nprune-releases-theme';
prepareThemeStorage(THEME_STORAGE_KEY);

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root');
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
