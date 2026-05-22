import { Auth0Provider, type AppState } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AUTH0_CONFIG, getAuth0ProviderAuthorizationParams } from './auth0-config';

interface Auth0ProviderWithNavigateProps {
  children: ReactNode;
}

export function Auth0ProviderWithNavigate({ children }: Auth0ProviderWithNavigateProps) {
  const navigate = useNavigate();

  return (
    <Auth0Provider
      domain={AUTH0_CONFIG.domain}
      clientId={AUTH0_CONFIG.clientId}
      authorizationParams={getAuth0ProviderAuthorizationParams()}
      cacheLocation="memory"
      useRefreshTokens
      onRedirectCallback={(appState?: AppState) => {
        const targetPath = appState?.returnTo || '/app';
        const hashIndex = targetPath.indexOf('#');
        const pathname = hashIndex >= 0 ? targetPath.slice(0, hashIndex) : targetPath;
        const hash = hashIndex >= 0 ? targetPath.slice(hashIndex) : '';
        navigate({ pathname: pathname || '/app', hash, search: '' }, { replace: true });
      }}
    >
      {children}
    </Auth0Provider>
  );
}
