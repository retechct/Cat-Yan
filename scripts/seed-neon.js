const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { saveCatalog, getCatalog } = require('../api/_db');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index <= 0) return;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    if (!process.env[key]) process.env[key] = value;
  });
}

function loadCatalogFromSource() {
  const filePath = path.join(__dirname, '..', 'src', 'data', 'productos.js');
  const source = fs.readFileSync(filePath, 'utf8')
    .replace('export const categoriasBase =', 'const categoriasBase =')
    .replace('export default productos;', 'module.exports = { productos, categoriasBase };');

  const sandbox = {
    module: { exports: {} },
    exports: {},
  };
  vm.runInNewContext(source, sandbox, { filename: filePath });
  return sandbox.module.exports;
}

async function main() {
  loadLocalEnv();
  const { productos, categoriasBase } = loadCatalogFromSource();

  if (!Array.isArray(productos) || !Array.isArray(categoriasBase)) {
    throw new Error('No se pudo leer el catalogo base.');
  }

  await saveCatalog({
    productos,
    categorias: categoriasBase,
    updatedAt: new Date().toISOString(),
  });

  const saved = await getCatalog();
  console.log(`Neon actualizado: ${saved.productos.length} productos y ${saved.categorias.length} categorias.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
