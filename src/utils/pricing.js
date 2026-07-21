export function hasReferencePrice(product) {
  const value = Number(product?.precio);
  return Number.isFinite(value) && value > 0;
}

export function formatPrice(value) {
  return `S/ ${Number(value).toFixed(2)}`;
}

export function productPriceLabel(product, suffix = '') {
  return hasReferencePrice(product) ? `${formatPrice(product.precio)}${suffix}` : 'Consultar';
}

export function productPriceBeforeLabel(product) {
  return product?.precioAntes ? formatPrice(product.precioAntes) : '';
}

export function consultaPriceLine(product) {
  return hasReferencePrice(product)
    ? `Precio ref. ${formatPrice(product.precio)}`
    : 'Precio por confirmar';
}
