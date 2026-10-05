const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const productsRoot = path.join(root, "public", "assets", "productos");

const products = [
  ["osadia-eau-de-parfum", "https://www.yanbal.com/es/corporate/p/20013197/osadia-mujer-eau-de-parfum-"],
  ["gaia-elixir", "https://www.yanbal.com/es/corporate/p/20013293/gaia-elixir-parfum"],
  ["a-la-vida", "https://www.yanbal.com/mx/corporate/p/20013275/a-la-vida-eau-de-toilette"],
  ["gaia-parfum", "https://www.yanbal.com/es/corporate/p/20013428/gaia-parfum"],
  [
    "xiss-active",
    "https://www.yanbal.com/ec/corporate/p/20014066/xiss-active-eau-de-toilette",
    "https://oechsle.vteximg.com.br/arquivos/ids/24868562-800-800/imageUrl_1.jpg?v=639115740312800000",
  ],
  ["viva-liberatta", "https://www.yanbal.com/ec/corporate/p/20012682/viva-liberatta-parfum"],
  ["liberatta-parfum", "https://www.yanbal.com/pe/corporate/p/20011583/liberatta-parfum"],
  ["di-que-si", "https://www.yanbal.com/es/corporate/p/20014202/di-que-si-eau-de-parfum"],
  [
    "oh-la-la-eau-de-parfum",
    "https://www.yanbal.com/pe/corporate/p/20012007/oh-la-la-eau-de-parfum",
    "https://www.yanbal.com/medias/20012007-01.jpg-Yanbal-OriginalFormat-500Wx500H?context=bWFzdGVyfGltYWdlc3wzOTE5MXxpbWFnZS9qcGVnfGhiNC9oOWEvMTAwNzM3OTIwMjA1MTAvMjAwMTIwMDdfMDEuanBnX1lhbmJhbC1PcmlnaW5hbEZvcm1hdF81MDBXeDUwMEh8MDI5NmYzNmY0MWE2ZTNkM2RkMTEzNDBhZTM5NzZiN2E0Yjc1NDZiNjhlMGMyOTE1OWUzOGIzZmZjYjk1MTQ1Yw",
  ],
  ["cielo-en-rosa", "https://www.yanbal.com/ec/corporate/p/20013982/cielo-en-rosa-eau-de-parfum"],
  ["cielo-eau-de-parfum", "https://www.yanbal.com/es/corporate/p/20013641/cielo-eau-de-parfum"],
  ["ccori-parfum", "https://www.yanbal.com/mx/corporate/p/20012906/ccori-parfum"],
  ["temptation-mujer-eau-de-parfum", "https://www.yanbal.com/mx/corporate/p/20014143/temptation-mujer-eau-de-parfum"],
  ["temptation-mystic-eau-de-parfum", "https://www.yanbal.com/mx/corporate/p/20013695/temptation-mystic-eau-de-parfum"],
  ["temptation-eau-de-parfum", "https://www.yanbal.com/pe/corporate/p/20012785/temptation-eau-de-parfum"],
  [
    "ccori-cristal-parfum",
    null,
    "https://media.falabella.com/falabellaCO/121377995_01/w=800,h=800,fit=pad",
  ],
  ["ccori-rubi-parfum", "https://www.yanbal.com/co/corporate/p/20014215/ccori-rubi-parfum"],
  ["soy-unica-colonia", "https://www.yanbal.com/ec/corporate/p/20013946/colonia-soy-unica"],
  ["soy-sexy-colonia", "https://www.yanbal.com/ec/corporate/p/20013948/colonia-soy-sexy"],
  ["soy-glow-colonia", "https://www.yanbal.com/ec/corporate/p/20013949/colonia-soy-glow"],
  ["soy-poderosa-colonia", "https://www.yanbal.com/ec/corporate/p/20013947/colonia-soy-poderosa"],
  [
    "agua-de-seda-colonia",
    null,
    "https://media.falabella.com/falabellaPE/149901252_01/w=1500,h=1500,fit=cover",
  ],
  ["lessence-violeta-salvaje", "https://www.yanbal.com/pe/corporate/p/20013545/l%27essence-colonia-violeta-salvaje"],
  ["lessence-flor-de-cerezo-silvestre", "https://www.yanbal.com/ec/corporate/p/20013558/l%27essence-colonia-flor-de-cerezo"],
  ["lessence-orquidea-exotica", "https://www.yanbal.com/ec/corporate/p/20013557/l%27essence-colonia-orquidea-exotica"],
  ["lessence-mimosa-radiante", "https://www.yanbal.com/pe/corporate/p/20014187/l%27essence-colonia-mimosa-radiante"],
  ["aires-del-caribe", "https://www.yanbal.com/pe/corporate/p/20013588/aires-del-caribe-eau-fraiche"],
  ["mix-chic-apple-tonic", "https://www.yanbal.com/pe/corporate/p/20013393/mix-%26-chic-apple-tonic-colonia"],
];

async function downloadBottle(slug, productUrl, fallbackImageUrl) {
  let imageUrl;

  if (productUrl) {
    const pageResponse = await fetch(productUrl);
    if (pageResponse.ok) {
      const html = await pageResponse.text();
      const imageMatch = html.match(/data-zoom-image="([^"]+)"/);
      if (imageMatch) {
        imageUrl = new URL(imageMatch[1].replaceAll("&amp;", "&"), productUrl);
      }
    }
  }

  if (!imageUrl && fallbackImageUrl) {
    imageUrl = new URL(fallbackImageUrl);
  }

  if (!imageUrl) {
    throw new Error("product image not found");
  }

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`image returned ${imageResponse.status}`);
  }

  const input = Buffer.from(await imageResponse.arrayBuffer());
  const output = path.join(productsRoot, slug, "botella.webp");
  await fs.mkdir(path.dirname(output), { recursive: true });
  await sharp(input)
    .resize(1200, 1200, {
      fit: "contain",
      background: { r: 248, g: 244, b: 239, alpha: 1 },
      withoutEnlargement: false,
    })
    .webp({ quality: 92, effort: 5 })
    .toFile(output);

  return { slug, source: imageUrl.toString() };
}

async function main() {
  const completed = [];
  const failed = [];

  for (const [slug, productUrl, fallbackImageUrl] of products) {
    try {
      completed.push(await downloadBottle(slug, productUrl, fallbackImageUrl));
      console.log(`OK ${slug}`);
    } catch (error) {
      failed.push({ slug, productUrl, error: error.message });
      console.error(`FAIL ${slug}: ${error.message}`);
    }
  }

  await fs.writeFile(
    path.join(outputRoot(), "perfume-bottle-sources.json"),
    JSON.stringify({ completed, failed }, null, 2),
    "utf8"
  );

  if (failed.length) {
    process.exitCode = 1;
  }
}

function outputRoot() {
  return path.join(root, "public", "assets", "social");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
