const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsRoot = path.resolve(__dirname, '..', 'public', 'assets', 'productos');
const extensions = new Set(['.png', '.jpg', '.jpeg']);

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

  console.log(`Convertidas ${converted} imagenes a WebP.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
