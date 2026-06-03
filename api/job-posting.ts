import { lookup as dnsLookup } from 'node:dns/promises';
import net from 'node:net';

export const MIN_JOB_DESCRIPTION_CHARS = 80;
export const MAX_JOB_DESCRIPTION_CHARS = 12000;
export const MAX_POSTING_URL_CHARS = 2048;
export const MAX_POSTING_RESPONSE_BYTES = 512 * 1024;

type LookupAddress = { address: string; family?: number };
type LookupFn = (hostname: string) => Promise<LookupAddress[] | LookupAddress>;
type FetchFn = typeof fetch;

function inputError(message: string) {
  const error = new Error(message);
  (error as any).statusCode = 400;
  return error;
}

export function normalizeJobPostingUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.length > MAX_POSTING_URL_CHARS) {
    throw inputError('Job posting URL is too long');
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
  } catch {
    throw inputError('Enter a valid job posting URL');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw inputError('Job posting URL must use http or https');
  }

  if (parsed.username || parsed.password || !parsed.hostname.includes('.')) {
    throw inputError('Enter a valid job posting URL');
  }

  return parsed.toString();
}

function ipv4Private(address: string) {
  const parts = address.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

function ipv6Private(address: string) {
  const lower = address.toLowerCase();
  return (
    lower === '::1' ||
    lower === '::' ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe8') ||
    lower.startsWith('fe9') ||
    lower.startsWith('fea') ||
    lower.startsWith('feb') ||
    lower.startsWith('::ffff:127.') ||
    lower.startsWith('::ffff:10.') ||
    lower.startsWith('::ffff:192.168.') ||
    /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(lower)
  );
}

export function isPublicAddress(address: string) {
  const family = net.isIP(address);
  if (family === 4) {
    return !ipv4Private(address);
  }
  if (family === 6) {
    return !ipv6Private(address);
  }
  return false;
}

async function assertPublicPostingUrl(url: URL, lookupFn: LookupFn) {
  if (!url.hostname.includes('.')) {
    throw inputError('Enter a valid job posting URL');
  }

  const directIpFamily = net.isIP(url.hostname);
  if (directIpFamily && !isPublicAddress(url.hostname)) {
    throw inputError('Job posting URL must be publicly reachable');
  }

  if (directIpFamily) {
    return;
  }

  let records: LookupAddress[] | LookupAddress;
  try {
    records = await lookupFn(url.hostname);
  } catch {
    throw inputError('Could not resolve the job posting URL');
  }

  const addresses = Array.isArray(records) ? records : [records];
  if (!addresses.length || addresses.some((record) => !isPublicAddress(record.address))) {
    throw inputError('Job posting URL must be publicly reachable');
  }
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(Number.parseInt(code, 16)));
}

export function postingHtmlToText(value: string) {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<\/(p|div|section|article|li|h[1-6]|br|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_JOB_DESCRIPTION_CHARS);
}

async function readBoundedResponseText(response: Response) {
  if (!response.body) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > MAX_POSTING_RESPONSE_BYTES) {
      throw inputError('Job posting URL returned too much data');
    }
    return text;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > MAX_POSTING_RESPONSE_BYTES) {
          await reader.cancel();
          throw inputError('Job posting URL returned too much data');
        }
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(combined);
}

export async function fetchJobPostingText(
  postingUrl: string,
  options: { fetchFn?: FetchFn; lookupFn?: LookupFn } = {},
) {
  const fetchFn = options.fetchFn || fetch;
  const lookupFn = options.lookupFn || ((hostname: string) => dnsLookup(hostname, { all: true, verbatim: true }));
  let currentUrl = new URL(normalizeJobPostingUrl(postingUrl));

  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    await assertPublicPostingUrl(currentUrl, lookupFn);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    let response: Response;
    try {
      response = await fetchFn(currentUrl.toString(), {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,text/plain,application/xhtml+xml',
          'User-Agent': 'Husky-Review/1.0 (+https://husky-review.app)',
        },
      });
    } catch {
      throw inputError('Could not fetch the job posting URL');
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw inputError('Job posting URL redirected without a destination');
      }
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    if (!response.ok) {
      throw inputError('Could not fetch the job posting URL');
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType && !/text\/html|text\/plain|application\/xhtml\+xml/i.test(contentType)) {
      throw inputError('Job posting URL did not return readable text');
    }

    const text = postingHtmlToText(await readBoundedResponseText(response));
    if (text.length < MIN_JOB_DESCRIPTION_CHARS) {
      throw inputError('Could not read enough text from the job posting URL');
    }

    return text;
  }

  throw inputError('Job posting URL redirected too many times');
}

export async function resolveJobDescription(
  input: { jobDescription: string; jobPostingUrl: string },
  options: { fetchFn?: FetchFn; lookupFn?: LookupFn } = {},
) {
  const pasted = input.jobDescription.trim();
  if (pasted.length > MAX_JOB_DESCRIPTION_CHARS) {
    throw inputError('Job description is too long');
  }

  const normalizedUrl = normalizeJobPostingUrl(input.jobPostingUrl || '');
  if (pasted.length >= MIN_JOB_DESCRIPTION_CHARS) {
    return { jobDescription: pasted.slice(0, MAX_JOB_DESCRIPTION_CHARS), jobPostingUrl: normalizedUrl };
  }

  if (!normalizedUrl) {
    throw inputError('Paste a job description or provide a posting URL');
  }

  const fetched = await fetchJobPostingText(normalizedUrl, options);
  return {
    jobDescription: [pasted, fetched].filter(Boolean).join('\n\n').slice(0, MAX_JOB_DESCRIPTION_CHARS),
    jobPostingUrl: normalizedUrl,
  };
}
