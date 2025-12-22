import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgBuffer = readFileSync(join(__dirname, 'public/icons/icon.svg'));

console.log('Generating PWA icons...\n');

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(__dirname, `public/icons/icon-${size}x${size}.png`));

  console.log(`✓ Generated icon-${size}x${size}.png`);
}

console.log('\n✅ All icons generated successfully!');
