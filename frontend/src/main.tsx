import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import 'antd/dist/reset.css';

import FontConfigProvider from '@/providers/FontConfigProvider';
import { store } from '@/redux/store/store';
import { Routes } from './routes.tsx';

const router = createBrowserRouter([...Routes]);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <FontConfigProvider>
        <RouterProvider router={router} />
      </FontConfigProvider>
    </Provider>
  </StrictMode>,
);
