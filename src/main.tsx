import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { TooltipProvider } from './components/ui/tooltip';
import { initTheme } from './lib/theme';
import { AUTH0_CONFIG } from './auth/auth0-config';
import './index.css';

initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={AUTH0_CONFIG.domain}
      clientId={AUTH0_CONFIG.clientId}
      authorizationParams={{
        redirect_uri: AUTH0_CONFIG.redirectUri,
        audience: AUTH0_CONFIG.audience,
      }}
      onRedirectCallback={(appState) => {
        const targetPath = appState?.returnTo || '/app';
        window.history.replaceState({}, document.title, targetPath);
      }}
    >
      <TooltipProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </TooltipProvider>
    </Auth0Provider>
  </React.StrictMode>,
);
