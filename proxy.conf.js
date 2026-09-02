function headerValue(req, name) {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

function copyHeader(proxyReq, req, name) {
  const value = headerValue(req, name);
  if (value) proxyReq.setHeader(name, value);
}

function rewriteCookies(proxyRes) {
  const raw = proxyRes.headers['set-cookie'];
  if (!raw) return;
  const list = Array.isArray(raw) ? raw : [raw];
  proxyRes.headers['set-cookie'] = list.map((cookie) =>
    String(cookie)
      .replace(/;\s*Secure/gi, '')
      .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
      .replace(/;\s*Domain=[^;]*/gi, '')
  );
}

const PROXY_CONFIG = {
  '/api': {
    target: 'http://alhendalcompany-001-site12.jtempurl.com',
    secure: false,
    changeOrigin: true,
    logLevel: 'warn',
    cookieDomainRewrite: '',
    cookiePathRewrite: '/',
    onProxyReq(proxyReq, req) {
      copyHeader(proxyReq, req, 'Authorization');
      copyHeader(proxyReq, req, 'X-Authorization');
      copyHeader(proxyReq, req, 'X-Token');
      copyHeader(proxyReq, req, 'Cookie');
    },
    onProxyRes: rewriteCookies,
  },
};

module.exports = PROXY_CONFIG;
