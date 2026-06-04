/** Keep in sync with src/lib/resume-upload-limits.ts (API bundle cannot always import src). */
export const VERCEL_REQUEST_BODY_LIMIT_BYTES = Math.floor(4.5 * 1024 * 1024);
export const MAX_RESUME_FILE_BYTES = 3 * 1024 * 1024;
const JSON_UPLOAD_OVERHEAD_BYTES = 8 * 1024;
export const MAX_RESUME_BYTES_FOR_JSON_UPLOAD = Math.floor(
  ((VERCEL_REQUEST_BODY_LIMIT_BYTES - JSON_UPLOAD_OVERHEAD_BYTES) * 3) / 4,
);
export const MAX_RESUME_UPLOAD_BYTES = Math.min(MAX_RESUME_FILE_BYTES, MAX_RESUME_BYTES_FOR_JSON_UPLOAD);
