const MAX_CATALOG_BYTES = 1_600_000;
const MAX_PRODUCTS = 250;
const MAX_CATEGORIES = 50;
const MAX_SUBCATEGORIES = 30;
const MAX_IMAGES = 6;
const MAX_NOTES = 12;

class CatalogValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CatalogValidationError';
  }
}

function fail(message) {
  throw new CatalogValidationError(message);
}

function cleanString(value, field, maxLength, required = true) {
  const text = String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (required && !text) fail(`${field} es obligatorio`);
  if (text.length > maxLength) fail(`${field} es demasiado largo`);
  return text;
}

function cleanId(value, field) {
  const isNumber = typeof value === 'number' && Number.isFinite(value);
  const isString = typeof value === 'string' && value.trim();
  if (!isNumber && !isString) fail(`${field} es obligatorio`);
  if (String(value).length > 80) fail(`${field} es demasiado largo`);
  return value;
}

function cleanMoney(value, field) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100000) fail(`${field} invalido`);
  return Math.round(number * 100) / 100;
}

function cleanStock(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 9999) fail('stock invalido');
  return number;
}

function cleanBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  return fallback;
}

function cleanColor(value) {
  const color = String(value || '#b76e79').trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '#b76e79';
}

function cleanImageUrl(value) {
  const image = cleanString(value, 'imagen', 700);
  const isLocalWebp = /^\/assets\/productos\/[a-z0-9/_-]+\.webp$/i.test(image);
  const isCloudinary = /^https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\/.+/i.test(image);

  if (!isLocalWebp && !isCloudinary) {
    fail('imagen invalida');
  }

  return image;
}

function cleanImageList(product) {
  const source = Array.isArray(product.imagenes)
    ? product.imagenes
    : product.imagen
      ? [product.imagen]
      : [];

  if (source.length > MAX_IMAGES) fail('demasiadas imagenes en un producto');

  return source
    .filter(Boolean)
    .map(cleanImageUrl);
}

function cleanNotes(value) {
  if (!Array.isArray(value)) return [];
  if (value.length > MAX_NOTES) fail('demasiadas notas en un producto');
  return value
    .map((note) => cleanString(note, 'nota', 45, false))
    .filter(Boolean);
}

function cleanCategories(categories, products) {
  if (!Array.isArray(categories)) fail('categorias debe ser una lista');
  if (categories.length > MAX_CATEGORIES) fail('demasiadas categorias');
  if (products.length && !categories.length) fail('agrega al menos una categoria');

  const seen = new Set();
  return categories.map((category, index) => {
    const nombre = cleanString(category?.nombre || category, `categoria ${index + 1}`, 60);
    const key = nombre.toLowerCase();
    if (seen.has(key)) fail(`categoria duplicada: ${nombre}`);
    seen.add(key);

    const subcategorias = Array.isArray(category?.subcategorias) ? category.subcategorias : [];
    if (subcategorias.length > MAX_SUBCATEGORIES) fail(`demasiadas subcategorias en ${nombre}`);

    const cleanSubcategories = [...new Set(subcategorias
      .map((subcategory) => cleanString(subcategory, 'subcategoria', 60, false))
      .filter(Boolean))];

    return {
      id: cleanString(category?.id || nombre, 'id de categoria', 80),
      nombre,
      subcategorias: cleanSubcategories.length ? cleanSubcategories : ['General'],
    };
  });
}

function cleanProducts(products, categories) {
  if (!Array.isArray(products)) fail('productos debe ser una lista');
  if (products.length > MAX_PRODUCTS) fail('demasiados productos');

  const categoryMap = new Map(categories.map((category) => [category.nombre.toLowerCase(), category]));
  const seenIds = new Set();

  return products.map((product, index) => {
    const id = cleanId(product?.id, `id del producto ${index + 1}`);
    const idKey = String(id);
    if (seenIds.has(idKey)) fail(`producto duplicado: ${idKey}`);
    seenIds.add(idKey);

    const nombre = cleanString(product?.nombre, `nombre del producto ${index + 1}`, 90);
    const categoria = cleanString(product?.categoria || 'Perfumes', `categoria de ${nombre}`, 60);
    const segmento = cleanString(product?.segmento || product?.subcategoria || 'General', `subcategoria de ${nombre}`, 60);
    const category = categoryMap.get(categoria.toLowerCase());

    if (categories.length && !category) fail(`categoria no registrada: ${categoria}`);
    if (category && category.subcategorias.length && !category.subcategorias.includes(segmento)) {
      fail(`subcategoria no registrada en ${categoria}: ${segmento}`);
    }

    const imagenes = cleanImageList(product);

    return {
      id,
      nombre,
      categoria,
      segmento,
      precio: cleanMoney(product?.precio, `precio de ${nombre}`),
      precioAntes: cleanMoney(product?.precioAntes, `precio anterior de ${nombre}`),
      stock: cleanStock(product?.stock),
      ml: cleanString(product?.ml, `tamano de ${nombre}`, 40),
      intensidad: cleanString(product?.intensidad, `intensidad de ${nombre}`, 70),
      descripcion: cleanString(product?.descripcion, `descripcion de ${nombre}`, 900),
      notas: cleanNotes(product?.notas),
      color: cleanColor(product?.color),
      imagen: imagenes[0] || '',
      imagenes,
      activo: cleanBoolean(product?.activo, true),
      destacado: cleanBoolean(product?.destacado, false),
    };
  });
}

function validateCatalog(payload) {
  if (!payload || typeof payload !== 'object') fail('catalogo invalido');
  if (Buffer.byteLength(JSON.stringify(payload), 'utf8') > MAX_CATALOG_BYTES) {
    fail('catalogo demasiado grande');
  }

  const rawProducts = Array.isArray(payload.productos) ? payload.productos : [];
  const categorias = cleanCategories(payload.categorias, rawProducts);
  const productos = cleanProducts(rawProducts, categorias);

  return { productos, categorias };
}

module.exports = {
  CatalogValidationError,
  validateCatalog,
};
