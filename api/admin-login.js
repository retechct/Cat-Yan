const { allowMethods, createAdminToken, json, readJsonBody, safeEqual } = require('./_auth');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST', 'OPTIONS'])) return;

  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!adminPassword || !sessionSecret) {
    json(res, 503, { error: 'Dashboard privado no configurado' });
    return;
  }

  const body = await readJsonBody(req);
  if (!safeEqual(body.password, adminPassword)) {
    json(res, 401, { error: 'Clave incorrecta' });
    return;
  }

  json(res, 200, { token: createAdminToken() });
};
