export function getProductThumbImage(image) {
  if (!image || !image.includes('/assets/productos/') || !image.endsWith('.webp')) {
    return image;
  }

  if (/\/(premium-portada|tarjeta-cuadrada|catalogo-limpio).*\.webp$/.test(image)) {
    return image.replace(/\.webp$/, '-thumb.webp');
  }

  return image;
}
