import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getAuth0Config() {
  const domain = process.env.AUTH0_DOMAIN?.trim().replace(/^["']|["']$/g, '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const audience = (process.env.AUTH0_AUDIENCE || process.env.VITE_AUTH0_AUDIENCE)?.trim().replace(/^["']|["']$/g, '');

  if (!domain || !audience) {
    const error = new Error('Auth0 server configuration is missing');
    (error as any).statusCode = 500;
    throw error;
  }

  const issuer = `https://${domain}/`;
  return {
    audience,
    issuer,
    jwksUrl: new URL(`${issuer}.well-known/jwks.json`),
  };
}

function getBearerToken(authHeader?: string) {
  if (!authHeader) {
    const error = new Error('Authorization header missing');
    (error as any).statusCode = 401;
    throw error;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    const error = new Error('Authorization header must be a Bearer token');
    (error as any).statusCode = 401;
    throw error;
  }

  return token;
}

export interface Auth0Claims extends JWTPayload {
  sub: string;
}

export async function verifyAuth0Token(authHeader: string): Promise<Auth0Claims> {
  const token = getBearerToken(authHeader);
  const config = getAuth0Config();

  jwks ??= createRemoteJWKSet(config.jwksUrl);

  try {
    const { payload } = await jwtVerify(token, jwks, {
      audience: config.audience,
      issuer: config.issuer,
    });

    if (!payload.sub) {
      const error = new Error('Token is missing subject');
      (error as any).statusCode = 401;
      throw error;
    }

    return payload as Auth0Claims;
  } catch (error) {
    if ((error as any).statusCode) {
      throw error;
    }

    const unauthorized = new Error(`Unauthorized: ${(error as Error).message}`);
    (unauthorized as any).statusCode = 401;
    throw unauthorized;
  }
}

export async function requireAuth(authHeader?: string) {
  const claims = await verifyAuth0Token(authHeader || '');
  return { claims, userId: claims.sub };
}
