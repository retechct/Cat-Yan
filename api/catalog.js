const { allowMethods, json, readJsonBody, requireAdmin } = require('./_auth');
const { CatalogValidationError, validateCatalog } = require('./_catalogValidation');
const { getCatalog, saveCatalog } = require('./_db');

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'PUT', 'OPTIONS'])) return;
  res.setHeader('Cache-Control', 'no-store');

  if (!process.env.DATABASE_URL) {
    json(res, 503, { error: 'Base de datos no configurada' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const catalog = await getCatalog();
      json(res, 200, catalog || { productos: [], categorias: [], empty: true });
      return;
    }

    if (!requireAdmin(req, res)) return;

    const body = await readJsonBody(req);
    const catalog = validateCatalog(body);

    await saveCatalog({
      productos: catalog.productos,
      categorias: catalog.categorias,
      updatedAt: new Date().toISOString(),
    });
    json(res, 200, { ok: true });
  } catch (error) {
    if (error instanceof CatalogValidationError) {
      json(res, 400, { error: error.message });
      return;
    }

    json(res, 500, { error: 'No se pudo procesar el catalogo' });
  }
};
