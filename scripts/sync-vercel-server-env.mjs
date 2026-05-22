/**
 * Syncs server-only env vars from .env.local to Vercel Preview + Production.
 * Generates CRON_SECRET and AUTH0_ALLOWED_ORIGINS when missing locally.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = resolve(root, '.env.local');
const productionOrigin = process.env.AUTH0_PRODUCTION_URL || 'https://husky-review.vercel.app';

const SERVER_VARS = [
  'AUTH0_DOMAIN',
  'AUTH0_AUDIENCE',
  'AUTH0_ALLOWED_ORIGINS',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CRON_SECRET',
];

function parseEnvFile(path) {
  const values = {};
  if (!existsSync(path)) {
    return values;
  }

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }
    const [, key, raw] = match;
    values[key] = raw.trim().replace(/^["']|["']$/g, '');
  }
  return values;
}

function writeEnvFile(path, values) {
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  writeFileSync(path, `${lines.join('\n')}\n`, 'utf8');
}

function ensureLocalEnv(values) {
  if (!values.AUTH0_ALLOWED_ORIGINS) {
    values.AUTH0_ALLOWED_ORIGINS = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      productionOrigin,
    ].join(',');
  }

  if (!values.CRON_SECRET) {
    values.CRON_SECRET = randomBytes(32).toString('hex');
  }

  if (!values.AUTH0_DOMAIN && values.VITE_AUTH0_DOMAIN) {
    values.AUTH0_DOMAIN = values.VITE_AUTH0_DOMAIN;
  }
  if (!values.AUTH0_AUDIENCE && values.VITE_AUTH0_AUDIENCE) {
    values.AUTH0_AUDIENCE = values.VITE_AUTH0_AUDIENCE;
  }
  if (!values.SUPABASE_URL && values.VITE_SUPABASE_URL) {
    values.SUPABASE_URL = values.VITE_SUPABASE_URL;
  }

  return values;
}

function runVercel(args) {
  const result = spawnSync('npx', ['vercel', ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  return result.status ?? 1;
}

function setVercelEnv(name, value, environment) {
  const previewBranch = environment === 'preview' ? 'development' : null;
  const baseArgs = previewBranch
    ? ['vercel', 'env', 'update', name, environment, previewBranch]
    : ['vercel', 'env', 'update', name, environment];

  const update = spawnSync('npx', [...baseArgs, '--value', value, '--yes', '--non-interactive'], {
    cwd: root,
    stdio: 'pipe',
    shell: true,
  });

  if (update.status === 0) {
    console.log(`  updated ${name} (${environment})`);
    return 0;
  }

  const addArgs = previewBranch
    ? ['vercel', 'env', 'add', name, environment, previewBranch]
    : ['vercel', 'env', 'add', name, environment];

  const add = spawnSync('npx', [...addArgs, '--value', value, '--yes', '--force', '--non-interactive'], {
    cwd: root,
    stdio: 'pipe',
    shell: true,
  });

  if (add.status === 0) {
    console.log(`  added ${name} (${environment})`);
    return 0;
  }

  console.error(`  failed ${name} (${environment})`);
  return add.status ?? 1;
}

const local = ensureLocalEnv(parseEnvFile(envFile));
writeEnvFile(envFile, { ...parseEnvFile(envFile), ...local });
console.log('Updated .env.local with CRON_SECRET and AUTH0_ALLOWED_ORIGINS when missing.');

const requiredAuth = ['AUTH0_DOMAIN', 'AUTH0_AUDIENCE'];
const missingAuth = requiredAuth.filter((key) => !local[key]);
if (missingAuth.length) {
  console.error(`Missing required Auth0 values in .env.local: ${missingAuth.join(', ')}`);
  process.exit(1);
}

const toSync = {};
for (const name of SERVER_VARS) {
  if (local[name]) {
    toSync[name] = local[name];
  }
}

if (!toSync.SUPABASE_URL || !toSync.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Skipping empty Supabase vars locally (keep existing encrypted values on Vercel).');
  delete toSync.SUPABASE_URL;
  delete toSync.SUPABASE_SERVICE_ROLE_KEY;
}

let failed = 0;
for (const environment of ['preview', 'production']) {
  console.log(`\nSyncing ${environment}…`);
  for (const [name, value] of Object.entries(toSync)) {
    if (setVercelEnv(name, value, environment) !== 0) {
      failed += 1;
    }
  }
}

if (failed) {
  console.error(`\n${failed} Vercel env operation(s) failed.`);
  process.exit(1);
}

console.log('\nDone. Redeploy for functions to pick up new env: npm run deploy:prod');
