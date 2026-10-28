import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'public/loro-saludando.png');
const sizes = [16, 32, 48, 64, 128, 256];
const images = await Promise.all(sizes.map(size => sharp(source).resize(size, size, {
  fit: 'contain', background: '#00000000',
}).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * images.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index] === 256 ? 0 : sizes[index];
  header[entry + 1] = header[entry];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await fs.writeFile(path.join(root, 'app/favicon.ico'), Buffer.concat([header, ...images]));
await sharp(source).resize(256, 256, { fit: 'contain', background: '#00000000' }).png().toFile(path.join(root, 'app/icon.png'));
await sharp(source).resize(180, 180, { fit: 'contain', background: '#00000000' }).png().toFile(path.join(root, 'app/apple-icon.png'));
console.log('Favicon de Waki: ICO de 16 a 256 px, icon.png y apple-icon.png.');
