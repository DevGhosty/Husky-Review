import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import { TooltipProvider } from './components/ui/tooltip';
import { Auth0ProviderWithNavigate } from './auth/auth0-provider';
import { initTheme } from './lib/theme';
import './index.css';

initTheme();

const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <Auth0ProviderWithNavigate>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </Auth0ProviderWithNavigate>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
