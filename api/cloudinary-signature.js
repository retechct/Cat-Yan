const crypto = require('crypto');
const { allowMethods, json, readJsonBody, requireAdmin } = require('./_auth');

function signUpload(params, apiSecret) {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto.createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex');
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['POST', 'OPTIONS'])) return;
  if (!requireAdmin(req, res)) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const defaultFolder = process.env.CLOUDINARY_FOLDER || 'beaulyx/productos';

  if (!cloudName || !apiKey || !apiSecret) {
    json(res, 503, { error: 'Cloudinary no configurado' });
    return;
  }

  const body = await readJsonBody(req);
  const folder = String(body.folder || defaultFolder).replace(/^\/+|\/+$/g, '');
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };

  json(res, 200, {
    apiKey,
    cloudName,
    folder,
    timestamp,
    signature: signUpload(params, apiSecret),
  });
};
