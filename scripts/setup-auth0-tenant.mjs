/**
 * Configures Husky-Review Auth0 SPA URLs and deploys the post-login Action via Management API.
 *
 * Required env (from .env.local or shell):
 *   AUTH0_DOMAIN or VITE_AUTH0_DOMAIN
 *   VITE_AUTH0_CLIENT_ID
 *   AUTH0_MGMT_CLIENT_ID
 *   AUTH0_MGMT_CLIENT_SECRET
 *
 * Optional:
 *   AUTH0_PRODUCTION_URL (default https://husky-review.vercel.app)
 *   AUTH0_LOCAL_ORIGIN (default http://localhost:5173)
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(root, '.env.local'));
loadEnvFile(resolve(root, '.env'));

const domain = (process.env.AUTH0_DOMAIN || process.env.VITE_AUTH0_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
const clientId = process.env.VITE_AUTH0_CLIENT_ID || '';
const mgmtClientId = process.env.AUTH0_MGMT_CLIENT_ID || '';
const mgmtClientSecret = process.env.AUTH0_MGMT_CLIENT_SECRET || '';
const productionOrigin = (process.env.AUTH0_PRODUCTION_URL || 'https://husky-review.vercel.app').replace(/\/+$/, '');
const localOrigin = (process.env.AUTH0_LOCAL_ORIGIN || 'http://localhost:5173').replace(/\/+$/, '');

const callbacks = [
  `${localOrigin}/app`,
  `${productionOrigin}/app`,
  'https://*.vercel.app/app',
];

const logoutUrls = [localOrigin, productionOrigin, 'https://*.vercel.app'];

const webOrigins = [localOrigin, productionOrigin, 'https://*.vercel.app'];

function requireConfig() {
  const missing = [];
  if (!domain) missing.push('AUTH0_DOMAIN or VITE_AUTH0_DOMAIN');
  if (!clientId) missing.push('VITE_AUTH0_CLIENT_ID');
  if (!mgmtClientId) missing.push('AUTH0_MGMT_CLIENT_ID');
  if (!mgmtClientSecret) missing.push('AUTH0_MGMT_CLIENT_SECRET');
  if (missing.length) {
    console.error('Missing configuration:\n  - ' + missing.join('\n  - '));
    console.error('\nCreate a Machine-to-Machine app in Auth0 with Management API access (update:clients, create:actions, read:actions, update:actions).');
    console.error('Then add AUTH0_MGMT_CLIENT_ID and AUTH0_MGMT_CLIENT_SECRET to .env.local and re-run: npm run auth0:setup');
    process.exit(1);
  }
}

async function getManagementToken() {
  const response = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: mgmtClientId,
      client_secret: mgmtClientSecret,
      audience: `https://${domain}/api/v2/`,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Management API token failed (${response.status}): ${body}`);
  }

  const json = await response.json();
  return json.access_token;
}

async function mgmtFetch(token, path, options = {}) {
  const response = await fetch(`https://${domain}/api/v2${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`Management API ${path} (${response.status}): ${text}`);
  }

  return json;
}

async function updateSpaClient(token) {
  const client = await mgmtFetch(token, `/clients/${clientId}`, { method: 'GET' });
  console.log(`Updating SPA client: ${client.name || clientId}`);

  await mgmtFetch(token, `/clients/${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      callbacks,
      allowed_logout_urls: logoutUrls,
      web_origins: webOrigins,
      allowed_origins: webOrigins,
      oidc_conformant: true,
      grant_types: ['authorization_code', 'refresh_token'],
    }),
  });

  console.log('  Callback URLs:', callbacks.join(', '));
  console.log('  Logout URLs:', logoutUrls.join(', '));
  console.log('  Web Origins:', webOrigins.join(', '));
}

async function ensurePostLoginAction(token) {
  const actionCode = readFileSync(resolve(root, 'auth0/actions/post-login-uw-google.js'), 'utf8');
  const actionName = 'Husky-Review UW Google Post-Login';

  const actions = await mgmtFetch(token, '/actions/actions?per_page=100');
  let action = actions.actions?.find((item) => item.name === actionName);

  if (!action) {
    action = await mgmtFetch(token, '/actions/actions', {
      method: 'POST',
      body: JSON.stringify({
        name: actionName,
        supported_triggers: [{ id: 'post-login', version: 'v3' }],
        code: actionCode,
        runtime: 'node22',
        deploy: true,
      }),
    });
    console.log(`Created action: ${actionName}`);
  } else {
    const draft = await mgmtFetch(token, `/actions/actions/${action.id}/versions`, {
      method: 'POST',
      body: JSON.stringify({ code: actionCode, runtime: 'node22' }),
    });
    await mgmtFetch(token, `/actions/actions/${action.id}/deploy`, {
      method: 'POST',
      body: JSON.stringify({ code: draft.code }),
    });
    console.log(`Updated action: ${actionName}`);
  }

  const bindings = await mgmtFetch(token, '/actions/triggers/post-login/bindings');
  const alreadyBound = bindings.bindings?.some((b) => b.action?.name === actionName);

  if (!alreadyBound) {
    await mgmtFetch(token, '/actions/triggers/post-login/bindings', {
      method: 'POST',
      body: JSON.stringify({
        bindings: [{ display_name: actionName, ref: { type: 'action_id', value: action.id } }],
      }),
    });
    console.log('Attached action to post-login flow.');
  } else {
    console.log('Post-login action already bound.');
  }
}

async function main() {
  requireConfig();
  console.log(`Auth0 tenant: ${domain}`);
  const token = await getManagementToken();
  await updateSpaClient(token);
  await ensurePostLoginAction(token);
  console.log('\nAuth0 tenant setup complete.');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
