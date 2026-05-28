import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const ALLOWED_EMAIL_DOMAIN = 'uw.edu';
const GENERIC_UNAUTHORIZED = 'Unauthorized';
const DEFAULT_CLAIM_NAMESPACE = 'https://husky-review.app/claims';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getAuth0Config() {
  const domain = process.env.AUTH0_DOMAIN?.trim().replace(/^["']|["']$/g, '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const audience = process.env.AUTH0_AUDIENCE?.trim().replace(/^["']|["']$/g, '');

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
    const error = new Error(GENERIC_UNAUTHORIZED);
    (error as any).statusCode = 401;
    throw error;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    const error = new Error(GENERIC_UNAUTHORIZED);
    (error as any).statusCode = 401;
    throw error;
  }

  return token;
}

function getClaimNamespace() {
  return (process.env.AUTH0_CLAIM_NAMESPACE || DEFAULT_CLAIM_NAMESPACE).trim().replace(/\/+$/, '');
}

function getStringClaim(payload: JWTPayload, name: string): string | null {
  const namespaced = payload[`${getClaimNamespace()}/${name}`];
  if (typeof namespaced === 'string' && namespaced.trim()) {
    return namespaced.trim();
  }

  const email = payload[name];
  if (typeof email === 'string' && email.trim()) {
    return email.trim();
  }

  return null;
}

export function getTokenEmail(payload: JWTPayload): string | null {
  return getStringClaim(payload, 'email')?.toLowerCase() || null;
}

function assertAllowedEmail(payload: JWTPayload) {
  const email = getTokenEmail(payload);
  if (!email || !email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    console.error('Auth rejected: missing or non-uw.edu email claim on access token');
    const error = new Error(GENERIC_UNAUTHORIZED);
    (error as any).statusCode = 403;
    throw error;
  }
}

export interface Auth0Claims extends JWTPayload {
  sub: string;
  email?: string;
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
      console.error('Auth rejected: token missing subject');
      const error = new Error(GENERIC_UNAUTHORIZED);
      (error as any).statusCode = 401;
      throw error;
    }

    assertAllowedEmail(payload);

    return {
      ...payload,
      email: getTokenEmail(payload) || undefined,
    } as Auth0Claims;
  } catch (error) {
    if ((error as any).statusCode) {
      throw error;
    }

    console.error('Auth rejected: JWT verification failed', (error as Error).message);
    const unauthorized = new Error(GENERIC_UNAUTHORIZED);
    (unauthorized as any).statusCode = 401;
    throw unauthorized;
  }
}

export async function requireAuth(authHeader?: string) {
  const claims = await verifyAuth0Token(authHeader || '');
  return { claims, userId: claims.sub };
}
