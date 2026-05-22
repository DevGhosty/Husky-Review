import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const path = resolve(root, '.env.local');
if (!existsSync(path)) {
  console.log('missing .env.local');
  process.exit(1);
}
const keys = [
  'VITE_AUTH0_DOMAIN',
  'VITE_AUTH0_CLIENT_ID',
  'VITE_AUTH0_CALLBACK_URL',
  'VITE_AUTH0_AUDIENCE',
  'AUTH0_DOMAIN',
  'AUTH0_MGMT_CLIENT_ID',
];
for (const key of keys) {
  const match = readFileSync(path, 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'));
  const value = match?.[1]?.replace(/^["']|["']$/g, '') ?? '';
  console.log(`${key}: ${value ? `${value.slice(0, 24)}${value.length > 24 ? '…' : ''}` : '(empty)'}`);
}
