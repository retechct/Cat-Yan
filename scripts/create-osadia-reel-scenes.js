const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const sourceDir = path.join(
  root,
  "public",
  "assets",
  "productos",
  "osadia-eau-de-parfum"
);
const outputDir = path.join(root, "public", "assets", "social");

const width = 1080;
const height = 1920;

function textOverlay({ eyebrow = "", title, subtitle = "", dark = false }) {
  const primary = dark ? "#fffaf4" : "#54131f";
  const secondary = dark ? "#ead5d0" : "#8f5c62";

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .eyebrow { font-family: Arial, sans-serif; font-size: 27px; font-weight: 700; letter-spacing: 8px; fill: ${secondary}; }
        .title { font-family: Georgia, serif; font-size: 76px; font-weight: 400; fill: ${primary}; }
        .subtitle { font-family: Arial, sans-serif; font-size: 29px; font-weight: 400; letter-spacing: 4px; fill: ${secondary}; }
      </style>
      <text x="72" y="500" class="eyebrow">${eyebrow}</text>
      <text x="72" y="590" class="title">${title}</text>
      <text x="72" y="1450" class="subtitle">${subtitle}</text>
    </svg>
  `);
}

async function createScene(source, output, overlay, layout) {
  const foreground = await sharp(path.join(sourceDir, source))
    .resize(layout.width, layout.height, { fit: "contain" })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: layout.background,
    },
  })
    .composite([
      { input: foreground, left: layout.left, top: layout.top },
      { input: textOverlay(overlay), top: 0, left: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, output));
}

async function main() {
  await createScene("premium-portada.webp", "osadia-reel-v2-scene-01.png", {
    eyebrow: "YANBAL",
    title: "Osadía",
    subtitle: "",
    dark: true,
  }, {
    width: 535,
    height: 950,
    left: 272,
    top: 560,
    background: "#170307",
  });

  await createScene("catalogo-limpio.webp", "osadia-reel-v2-scene-02.png", {
    eyebrow: "UNA FRAGANCIA CON CARÁCTER",
    title: "Intensa. Elegante.",
    subtitle: "",
    dark: false,
  }, {
    width: 535,
    height: 950,
    left: 272,
    top: 560,
    background: "#f7e5ca",
  });

  await createScene("tarjeta-cuadrada.webp", "osadia-reel-v2-scene-03.png", {
    eyebrow: "DISPONIBLE",
    title: "Conoce Osadía",
    subtitle: "ESCRÍBEME POR MENSAJE",
    dark: false,
  }, {
    width: 700,
    height: 700,
    left: 190,
    top: 650,
    background: "#f7e5ca",
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
