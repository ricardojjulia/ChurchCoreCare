import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServiceTelemetry, startNodeTelemetry } from '../../packages/telemetry/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT || 3002);
const apiBaseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3001';
const publicDir = path.join(__dirname, 'public');

await startNodeTelemetry({ serviceName: 'faith-web' });
const telemetry = createServiceTelemetry('faith-web');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const WEB_SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'x-xss-protection': '0',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'geolocation=(), microphone=(), camera=()',
  // Web app CSP: allow self-hosted scripts, styles, and same-origin API calls
  'content-security-policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-embedder-policy': 'require-corp',
};

function applyWebSecurityHeaders(response) {
  for (const [header, value] of Object.entries(WEB_SECURITY_HEADERS)) {
    response.setHeader(header, value);
  }
}

const server = http.createServer(async (request, response) => {
  applyWebSecurityHeaders(response);

  const requestScope = telemetry.beginRequest({
    method: request.method ?? 'GET',
    route: request.url?.startsWith('/api/') ? '/api/*' : request.url === '/' ? '/index.html' : request.url ?? '/',
  });

  if (request.url?.startsWith('/api/')) {
    try {
      await proxyApiRequest(request, response);
      return;
    } finally {
      requestScope.end(response.statusCode || 200);
    }
  }

  if (request.url === '/telemetry/summary') {
    writeJson(response, 200, {
      service: 'web',
      summary: telemetry.getSummary(),
    });
    requestScope.end(200);
    return;
  }

  try {
    const url = resolvePublicUrl(request.url);
    const requestedPath = path.normalize(url).replace(/^\.\.(\/|\\|$)/, '');
    const filePath = path.join(publicDir, requestedPath);

    if (!filePath.startsWith(publicDir)) {
      writeText(response, 403, 'Forbidden');
      return;
    }

    const file = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const shouldDisableCache = extension === '.html' || requestedPath.startsWith('assets/');
    response.writeHead(200, {
      'content-type': contentTypes[extension] ?? 'application/octet-stream',
      'cache-control': shouldDisableCache ? 'no-cache' : 'public, max-age=3600',
    });
    response.end(file);
  } catch {
    if (request.url !== '/index.html') {
      try {
        const indexHtml = await readFile(path.join(publicDir, 'index.html'));
        response.writeHead(200, {
          'content-type': contentTypes['.html'],
          'cache-control': 'no-cache',
        });
        response.end(indexHtml);
        return;
      } catch {
        writeText(response, 404, 'Not Found');
        return;
      }
    }

    writeText(response, 404, 'Not Found');
  } finally {
    requestScope.end(response.statusCode || 200);
  }
});

server.listen(port, () => {
  console.log(`Faith Counseling web app listening on port ${port}`);
});

function writeText(response, statusCode, text) {
  response.writeHead(statusCode, {
    'content-type': 'text/plain; charset=utf-8',
  });
  response.end(text);
}

function resolvePublicUrl(requestUrl) {
  if (!requestUrl || requestUrl === '/') return '/index.html';
  if (requestUrl === '/about' || requestUrl === '/about/') return '/about.html';
  if (requestUrl === '/monitor' || requestUrl === '/monitor/') return '/monitor.html';
  return requestUrl;
}

async function proxyApiRequest(request, response) {
  if (!request.method || !['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
    response.writeHead(405, {
      'content-type': 'application/json; charset=utf-8',
    });
    response.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const upstreamPath = request.url.replace('/api', '');
  const upstreamUrl = `${apiBaseUrl}${upstreamPath}`;

  try {
    const start = performance.now();
    const body = await readRequestBody(request);
    // Forward auth and tenant headers so the API RBAC / tenant-scope guards work
    const forwardHeaders = {
      accept: request.headers.accept ?? 'application/json',
      'content-type': request.headers['content-type'] ?? 'application/json; charset=utf-8',
    };
    for (const hdr of ['x-staff-role', 'x-tenant-id', 'x-actor-id', 'x-request-id']) {
      if (request.headers[hdr]) forwardHeaders[hdr] = request.headers[hdr];
    }

    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : body,
    });

    const responseText = await upstreamResponse.text();
    telemetry.recordProxy(performance.now() - start, upstreamPath);
    response.writeHead(upstreamResponse.status, {
      'content-type': upstreamResponse.headers.get('content-type') ?? 'application/json; charset=utf-8',
      'cache-control': 'no-cache',
    });
    response.end(responseText);
  } catch {
    response.writeHead(502, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache',
    });
    response.end(
      JSON.stringify({
        error: 'API unavailable',
      }),
    );
  }
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let buffer = '';

    request.on('data', (chunk) => {
      buffer += chunk;
      if (buffer.length > 1_000_000) {
        request.destroy();
        reject(new Error('Payload too large'));
      }
    });

    request.on('end', () => {
      resolve(buffer || undefined);
    });

    request.on('error', reject);
  });
}

function writeJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body, null, 2));
}
