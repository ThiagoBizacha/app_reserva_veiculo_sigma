/**
 * Gera os icones PWA com fundo verde e logo centralizado.
 * Saida: public/icons/icon-192.png e public/icons/icon-512.png
 *
 * Uso: node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import path from "node:path";
import { mkdirSync } from "node:fs";

const rootDir = process.cwd();
const logoPath = path.join(rootDir, "assets", "logo2.png");
const outputDir = path.join(rootDir, "public", "icons");

mkdirSync(outputDir, { recursive: true });

const BACKGROUND_COLOR = { r: 14, g: 95, b: 71, alpha: 1 }; // #0E5F47

async function generateIcon(sizePx, outputFilename) {
  // Reduz o logo para 70% do tamanho do icone (margem de 15% em cada lado)
  const logoSize = Math.round(sizePx * 0.7);

  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: "inside" })
    .toBuffer();

  await sharp({
    create: {
      width: sizePx,
      height: sizePx,
      channels: 4,
      background: BACKGROUND_COLOR,
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(path.join(outputDir, outputFilename));

  console.log(`Gerado: ${outputFilename} (${sizePx}x${sizePx})`);
}

console.log("Gerando icones PWA...\n");

await generateIcon(192, "icon-192.png");
await generateIcon(512, "icon-512.png");

// Gera tambem o icon.png e adaptive-icon.png para o app nativo
await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: BACKGROUND_COLOR },
})
  .composite([
    {
      input: await sharp(logoPath)
        .resize(720, 720, { fit: "inside" })
        .toBuffer(),
      gravity: "center",
    },
  ])
  .png()
  .toFile(path.join(rootDir, "assets", "icon.png"));

console.log("Gerado: assets/icon.png (1024x1024)");

await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: { r: 14, g: 95, b: 71, alpha: 0 } },
})
  .composite([
    {
      input: await sharp(logoPath)
        .resize(720, 720, { fit: "inside" })
        .toBuffer(),
      gravity: "center",
    },
  ])
  .png()
  .toFile(path.join(rootDir, "assets", "adaptive-icon.png"));

console.log("Gerado: assets/adaptive-icon.png (1024x1024)");

console.log("\nIcones gerados com sucesso.");
