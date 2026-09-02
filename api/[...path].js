const http = require('http');

const TARGET_HOST = 'alhendalcompany-001-site12.jtempurl.com';

function destinationPath(req) {
  const raw = req.url || '/';
  const path = raw.startsWith('http') ? new URL(raw).pathname + new URL(raw).search : raw;
  return path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
}

function hopByHop() {
  return new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'host',
    'content-length',
  ]);
}

function forwardHeaders(req) {
  const skip = hopByHop();
  const headers = {};
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (!value || skip.has(key.toLowerCase())) continue;
    headers[key] = value;
  }
  const auth = headers.authorization || headers['x-authorization'];
  if (auth) {
    headers.authorization = auth;
    headers['x-authorization'] = auth;
    const token = String(auth).replace(/^Bearer\s+/i, '').trim();
    if (token) headers['x-token'] = token;
  }
  headers.host = TARGET_HOST;
  return headers;
}

function rewriteCookies(value) {
  const list = Array.isArray(value) ? value : [value];
  return list.map((cookie) =>
    String(cookie)
      .replace(/;\s*Secure/gi, '')
      .replace(/;\s*Domain=[^;]*/gi, '')
      .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
  );
}

module.exports = async function handler(req, res) {
  const path = destinationPath(req);
  const proxyReq = http.request(
    {
      protocol: 'http:',
      hostname: TARGET_HOST,
      port: 80,
      path,
      method: req.method,
      headers: forwardHeaders(req),
    },
    (proxyRes) => {
      const headers = { ...proxyRes.headers };
      if (headers['set-cookie']) headers['set-cookie'] = rewriteCookies(headers['set-cookie']);
      res.writeHead(proxyRes.statusCode || 502, headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', () => {
    if (res.headersSent) return;
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'تعذر الاتصال بالخادم.' }));
  });

  req.pipe(proxyReq);
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
