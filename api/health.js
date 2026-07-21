const { allowMethods, json } = require('./_auth');

module.exports = function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'OPTIONS'])) return;

  json(res, 200, {
    admin: Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET),
    database: Boolean(process.env.DATABASE_URL),
    cloudinary: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ),
  });
};
