export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

const MAX_JSON_BODY_BYTES = 1_000_000;

export function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const contentLength = Number(request.headers['content-length'] || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BODY_BYTES) {
      reject(new HttpError(413, 'Payload too large'));
      return;
    }

    let buffer = '';
    let size = 0;

    request.on('data', (chunk) => {
      buffer += chunk;
      size += Buffer.byteLength(chunk);
      if (size > MAX_JSON_BODY_BYTES) {
        request.destroy(new HttpError(413, 'Payload too large'));
        reject(new HttpError(413, 'Payload too large'));
      }
    });

    request.on('end', () => {
      if (!buffer.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(buffer));
      } catch (error) {
        reject(new HttpError(400, 'Malformed JSON body'));
      }
    });

    request.on('error', reject);
  });
}

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'x-xss-protection': '0',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'geolocation=(), microphone=(), camera=()',
  'content-security-policy': "default-src 'none'",
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'cross-origin-resource-policy': 'same-origin',
};

export function writeJson(response, statusCode, body) {
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.setHeader(header, value);
  }
  response.setHeader('cache-control', 'no-store');
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body, null, 2));
}