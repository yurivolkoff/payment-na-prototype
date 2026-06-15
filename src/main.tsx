import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import '@fontsource/golos-text/400.css';
import '@fontsource/golos-text/500.css';
import '@fontsource/golos-text/600.css';

import './styles/tokens.css';
import './styles/global.css';

import App from './App';
import { initHighContrastFromStorage } from './lib/theme';

initHighContrastFromStorage();

// Vite base; React Router needs the same prefix for asset/route resolution.
const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={base || undefined}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
