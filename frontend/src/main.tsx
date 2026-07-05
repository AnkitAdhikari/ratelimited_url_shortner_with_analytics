import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import 'antd/dist/reset.css';

import App from './App';
import FontConfigProvider from './providers/FontConfigProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <FontConfigProvider>
      <App />
    </FontConfigProvider>
  </StrictMode>,
);
