const { allowMethods, createAdminToken, json, readJsonBody, safeEqual } = require('./_auth');
const { clearFailedLogins, getLoginLimit, recordFailedLogin } = require('./_rateLimit');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST', 'OPTIONS'])) return;

  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!adminPassword || !sessionSecret) {
    json(res, 503, { error: 'Dashboard privado no configurado' });
    return;
  }

  const limit = getLoginLimit(req);
  if (limit.limited) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    json(res, 429, { error: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.' });
    return;
  }

  const body = await readJsonBody(req);
  if (!safeEqual(body.password, adminPassword)) {
    recordFailedLogin(req);
    json(res, 401, { error: 'Clave incorrecta' });
    return;
  }

  clearFailedLogins(req);
  json(res, 200, { token: createAdminToken() });
};
