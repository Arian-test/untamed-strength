// Generates PWA icons from an inline SVG using sharp.
// Run once:  node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");

const GREEN = "#22c55e";
const DARK = "#0b1220";

function dumbbell(color) {
  return `
    <g fill="${color}">
      <rect x="176" y="236" width="160" height="40" rx="10"/>
      <rect x="146" y="201" width="32" height="110" rx="10"/>
      <rect x="334" y="201" width="32" height="110" rx="10"/>
      <rect x="116" y="221" width="24" height="70" rx="8"/>
      <rect x="372" y="221" width="24" height="70" rx="8"/>
    </g>`;
}

const iconSvg = (bg, fg, radius) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${radius}" fill="${bg}"/>
  ${dumbbell(fg)}
</svg>`;

// Maskable: full-bleed background, dumbbell scaled into the safe zone.
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${GREEN}"/>
  <g transform="translate(256,256) scale(0.7) translate(-256,-256)">${dumbbell("#ffffff")}</g>
</svg>`;

async function render(svg, size, name) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(outDir, name));
  console.log("wrote", name);
}

await mkdir(outDir, { recursive: true });
await render(iconSvg(DARK, GREEN, 96), 192, "icon-192.png");
await render(iconSvg(DARK, GREEN, 96), 512, "icon-512.png");
await render(maskableSvg, 512, "icon-maskable-512.png");
await render(iconSvg(GREEN, "#ffffff", 110), 180, "apple-icon-180.png");
console.log("done");
