import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { GlobalErrorSurface, RootErrorBoundary } from './components/error/root.js';
import '@i18nprune/ui/styles/runtime.css';
import './styles/global.css';

const el = document.getElementById('root');
if (!el) throw new Error('Missing #root');

createRoot(el).render(
  <StrictMode>
    <GlobalErrorSurface>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </GlobalErrorSurface>
  </StrictMode>,
);
