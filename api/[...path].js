const http = require('http');

const TARGET_HOST = 'alhendalcompany-001-site12.jtempurl.com';
const SKIP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function headerValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function authFromRequest(req) {
  const direct = headerValue(req.headers.authorization) || headerValue(req.headers['x-authorization']);
  if (direct) return String(direct);
  const token = headerValue(req.headers['x-token']);
  if (token) {
    const value = String(token);
    return /^bearer\s+/i.test(value) ? value : `Bearer ${value}`;
  }
  const packed = headerValue(req.headers['x-vercel-sc-headers']);
  if (packed) {
    try {
      const json = JSON.parse(packed);
      if (json.Authorization) return String(json.Authorization);
      if (json.authorization) return String(json.authorization);
    } catch {
      /* ignore */
    }
  }
  return '';
}

function destinationPath(req) {
  const raw = req.url || '/';
  const url = raw.startsWith('http') ? new URL(raw) : new URL(raw, `http://${TARGET_HOST}`);
  let pathname = url.pathname || '/';
  const segs = req.query && req.query.path;
  const parts = Array.isArray(segs) ? segs : segs ? [String(segs)] : [];
  if (parts.length && (pathname === '/' || pathname === '/api' || pathname === '/api/[...path]')) {
    pathname = `/api/${parts.join('/')}`;
  }
  if (!pathname.startsWith('/api')) {
    pathname = `/api${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  }
  return `${pathname}${url.search}`;
}

function readBody(req) {
  if (req.body != null) {
    if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
    if (typeof req.body === 'string') return Promise.resolve(Buffer.from(req.body));
    if (typeof req.body === 'object') return Promise.resolve(Buffer.from(JSON.stringify(req.body)));
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const headers = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (!value || SKIP_HEADERS.has(key.toLowerCase())) continue;
    headers[key] = value;
  }
  const auth = authFromRequest(req);
  if (auth) {
    headers.authorization = auth;
    headers['x-authorization'] = auth;
  }
  headers.host = TARGET_HOST;
  headers.connection = 'close';

  const method = req.method || 'GET';
  const body = ['GET', 'HEAD'].includes(method) ? undefined : await readBody(req);
  if (body && body.length) headers['content-length'] = String(body.length);

  await new Promise((resolve) => {
    const up = http.request(
      {
        hostname: TARGET_HOST,
        port: 80,
        path: destinationPath(req),
        method,
        headers,
      },
      (upRes) => {
        res.statusCode = upRes.statusCode || 502;
        for (const [key, value] of Object.entries(upRes.headers || {})) {
          if (!value) continue;
          const name = key.toLowerCase();
          if (name === 'transfer-encoding' || name === 'connection') continue;
          res.setHeader(key, value);
        }
        upRes.pipe(res);
        upRes.on('end', resolve);
      }
    );
    up.on('error', (err) => {
      res.statusCode = 502;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ message: 'تعذر الوصول للخادم.', detail: err.message }));
      resolve();
    });
    if (body && body.length) up.end(body);
    else up.end();
  });
};
