import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '@i18nprune/ui/styles/tokens.css';
import '@i18nprune/ui/styles/runtime.css';
import '@i18nprune/ui/styles/scrollbars.css';
import './styles.css';

function syncThemeClass(): void {
  document.documentElement.classList.toggle(
    'dark',
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
}

syncThemeClass();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncThemeClass);

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
