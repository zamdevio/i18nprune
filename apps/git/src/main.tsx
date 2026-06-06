import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { prepareThemeStorage } from './lib/theme-storage';
import '@i18nprune/ui/styles/tokens.css';
import '@i18nprune/ui/styles/runtime.css';
import '@i18nprune/ui/styles/scrollbars.css';
import './styles.css';

const THEME_STORAGE_KEY = 'i18nprune-git-theme';

prepareThemeStorage(THEME_STORAGE_KEY);

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Missing #root element');
}

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
