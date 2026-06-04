/** Vercel serverless request body maximum (base64 JSON uploads must fit below this). */
export const VERCEL_REQUEST_BODY_LIMIT_BYTES = Math.floor(4.5 * 1024 * 1024);

/** Marketing copy / target max for readable resumes (PDF/DOCX). */
export const MAX_RESUME_FILE_BYTES = 3 * 1024 * 1024;

/** JSON { file: base64, filename, ... } overhead reserved before encoding. */
const JSON_UPLOAD_OVERHEAD_BYTES = 8 * 1024;

/**
 * Largest raw file size safe to POST as base64 inside a JSON body on Vercel (~4.5 MB cap).
 * Base64 expands payload by 4/3.
 */
export const MAX_RESUME_BYTES_FOR_JSON_UPLOAD = Math.floor(
  ((VERCEL_REQUEST_BODY_LIMIT_BYTES - JSON_UPLOAD_OVERHEAD_BYTES) * 3) / 4,
);

/** Enforced on client and server — min of product limit and platform-safe limit. */
export const MAX_RESUME_UPLOAD_BYTES = Math.min(MAX_RESUME_FILE_BYTES, MAX_RESUME_BYTES_FOR_JSON_UPLOAD);

export function formatResumeUploadLimitMb(bytes = MAX_RESUME_UPLOAD_BYTES) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 && Number.isInteger(mb) ? `${mb} MB` : `${mb.toFixed(1)} MB`;
}

export const RESUME_UPLOAD_LIMIT_LABEL = formatResumeUploadLimitMb();

export function validateResumeFileSize(byteLength: number): string | null {
  if (!Number.isFinite(byteLength) || byteLength <= 0) {
    return 'Choose a non-empty PDF or Word document.';
  }

  if (byteLength > MAX_RESUME_UPLOAD_BYTES) {
    return `This file is too large (${formatResumeUploadLimitMb()} max). Use a smaller export or remove embedded images from the PDF.`;
  }

  return null;
}

export function isPayloadTooLargeHttpStatus(status: number) {
  return status === 413;
}

export function messageForUploadHttpStatus(status: number, fallback: string) {
  if (isPayloadTooLargeHttpStatus(status)) {
    return `Upload is too large for the server (${RESUME_UPLOAD_LIMIT_LABEL} max after encoding). Try a smaller PDF or Word file.`;
  }
  return fallback;
}
