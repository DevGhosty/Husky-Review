/**
 * Updates Vercel Preview + Production Auth0 callback URL to match deployed origins.
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const productionOrigin = process.env.AUTH0_PRODUCTION_URL || 'https://husky-review.vercel.app';
const localCallback = process.env.AUTH0_LOCAL_CALLBACK || 'http://localhost:5173/app';
const productionCallback = `${productionOrigin.replace(/\/+$/, '')}/app`;
const callbackValue = `${localCallback},${productionCallback}`;

function run(args) {
  const result = spawnSync('npx', ['vercel', ...args], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const environment of ['preview', 'production']) {
  console.log(`Setting VITE_AUTH0_CALLBACK_URL for ${environment}…`);
  const update = spawnSync(
    'npx',
    ['vercel', 'env', 'update', 'VITE_AUTH0_CALLBACK_URL', environment, '--value', callbackValue, '--yes'],
    { cwd: root, stdio: 'inherit', shell: true },
  );
  if (update.status !== 0) {
    run(['env', 'add', 'VITE_AUTH0_CALLBACK_URL', environment, '--value', callbackValue, '--yes', '--force']);
  }
}

console.log('Done. Redeploy with: npm run deploy:prod');
