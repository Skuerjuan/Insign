import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'public/loro-saludando.webp');
for (const [name, size] of [['icon', 256], ['apple-icon', 180], ['favicon', 256]]) {
  await sharp(source).resize(size, size, { fit: 'contain', background: '#00000000' })
    .webp({ lossless: true }).toFile(path.join(root, `public/${name}.webp`));
}
console.log('Íconos de Waki en formato WebP.');
