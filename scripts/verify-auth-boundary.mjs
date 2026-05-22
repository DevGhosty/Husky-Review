const baseUrl = process.env.API_BASE_URL || 'http://localhost:5173';

async function expectStatus(label, path, options, expectedStatus) {
  const response = await fetch(new URL(path, baseUrl), options);
  if (response.status !== expectedStatus) {
    throw new Error(`${label}: expected ${expectedStatus}, received ${response.status}`);
  }
  console.log(`${label}: ${response.status}`);
}

await expectStatus('missing token rejected', '/api/resumes', {}, 401);
await expectStatus(
  'invalid token rejected',
  '/api/resumes',
  { headers: { Authorization: 'Bearer invalid.jwt.token' } },
  401,
);

if (process.env.AUTH_TEST_TOKEN) {
  const response = await fetch(new URL('/api/resumes', baseUrl), {
    headers: { Authorization: `Bearer ${process.env.AUTH_TEST_TOKEN}` },
  });

  if (response.status !== 200) {
    throw new Error(`valid uw token list: expected 200, received ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('valid uw token list: expected JSON array');
  }

  console.log(`valid uw token list: ${response.status}`);
} else {
  console.log('valid uw token list: skipped because AUTH_TEST_TOKEN is not set');
}

if (process.env.AUTH_TEST_TOKEN_NON_UW) {
  await expectStatus(
    'non-uw token rejected',
    '/api/resumes',
    { headers: { Authorization: `Bearer ${process.env.AUTH_TEST_TOKEN_NON_UW}` } },
    403,
  );
} else {
  console.log('non-uw token rejected: skipped because AUTH_TEST_TOKEN_NON_UW is not set');
}
