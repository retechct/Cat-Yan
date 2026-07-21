const crypto = require('crypto');

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function getBearerToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return String(req.headers['x-admin-token'] || '').trim();
}

function createAdminToken() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is missing');

  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const payload = `admin.${exp}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function verifyAdminToken(req) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = getBearerToken(req);
  if (!secret || !token) return false;

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'admin') return false;

  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  const payload = `${parts[0]}.${parts[1]}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return safeEqual(parts[2], expected);
}

function requireAdmin(req, res) {
  if (verifyAdminToken(req)) return true;
  json(res, 401, { error: 'No autorizado' });
  return false;
}

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.resolve({});
    }
  }

  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function allowMethods(req, res, methods) {
  res.setHeader('Allow', methods.join(', '));
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return false;
  }
  if (!methods.includes(req.method)) {
    json(res, 405, { error: 'Metodo no permitido' });
    return false;
  }
  return true;
}

module.exports = {
  allowMethods,
  createAdminToken,
  json,
  readJsonBody,
  requireAdmin,
  safeEqual,
};
