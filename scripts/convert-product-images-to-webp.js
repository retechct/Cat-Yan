const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsRoot = path.resolve(__dirname, '..', 'public', 'assets', 'productos');
const extensions = new Set(['.png', '.jpg', '.jpeg']);
const thumbnailSpecs = [
  { pattern: /^premium-portada.*\.webp$/i, width: 620, quality: 80 },
  { pattern: /^tarjeta-cuadrada.*\.webp$/i, width: 420, quality: 78 },
  { pattern: /^catalogo-limpio.*\.webp$/i, width: 520, quality: 80 },
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

function assertInsideAssets(filePath) {
  const relative = path.relative(assetsRoot, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Ruta fuera de assets: ${filePath}`);
  }
}

async function main() {
  const files = walk(assetsRoot).filter((file) => extensions.has(path.extname(file).toLowerCase()));
  let converted = 0;
  let thumbnails = 0;

  for (const file of files) {
    assertInsideAssets(file);
    const output = file.replace(/\.(png|jpe?g)$/i, '.webp');
    assertInsideAssets(output);

    await sharp(file)
      .rotate()
      .webp({ quality: 84, effort: 5 })
      .toFile(output);

    fs.unlinkSync(file);
    converted += 1;
  }

  const webpFiles = walk(assetsRoot).filter((file) => path.extname(file).toLowerCase() === '.webp');
  for (const file of webpFiles) {
    assertInsideAssets(file);
    const name = path.basename(file);
    if (name.includes('-thumb.webp')) continue;

    const spec = thumbnailSpecs.find((item) => item.pattern.test(name));
    if (!spec) continue;

    const output = file.replace(/\.webp$/i, '-thumb.webp');
    assertInsideAssets(output);

    await sharp(file)
      .resize({ width: spec.width, withoutEnlargement: true })
      .webp({ quality: spec.quality, effort: 5 })
      .toFile(output);
    thumbnails += 1;
  }

  console.log(`Convertidas ${converted} imagenes a WebP.`);
  console.log(`Miniaturas actualizadas: ${thumbnails}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
