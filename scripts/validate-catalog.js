const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { validateCatalog } = require('../api/_catalogValidation');

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

const { productos, categoriasBase } = loadCatalogFromSource();
const catalog = validateCatalog({ productos, categorias: categoriasBase });

console.log(`Catalogo valido: ${catalog.productos.length} productos y ${catalog.categorias.length} categorias.`);
