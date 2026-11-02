import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0");
const assets = tracked.filter((file) => /\.(png|jpe?g|svg|gif|bmp|tiff?|avif|ico)$/i.test(file));
const replacements = [];
let before = 0, after = 0, count = 0;
for (const file of assets) {
  const input = path.join(root, file);
  try { await fs.access(input); } catch { continue; }
  let output = file.replace(/\.[^.]+$/, ".webp");
  // Next's automatic metadata file convention does not accept WebP.
  if (file.startsWith("app/")) output = `public/${path.basename(output)}`;
  let buffer = await fs.readFile(input);
  before += buffer.length;
  if (file.endsWith(".ico")) {
    const entries = buffer.readUInt16LE(4);
    const entry = 6 + (entries - 1) * 16;
    buffer = buffer.subarray(buffer.readUInt32LE(entry + 12), buffer.readUInt32LE(entry + 12) + buffer.readUInt32LE(entry + 8));
  }
  const result = await sharp(buffer, file.endsWith(".svg") ? { density: 192 } : {})
    .webp({ lossless: true, effort: 6 }).toBuffer();
  await fs.writeFile(path.join(root, output), result);
  await fs.unlink(input);
  after += result.length;
  count++;
  replacements.push([file, output]);
}
// Update all application URLs/imports and tooling references to actual WebP assets.
const directories = ["app", "components", "lib", "src", "scripts", "media"];
async function walk(directory) {
  for (const item of await fs.readdir(path.join(root, directory), { withFileTypes: true })) {
    const file = `${directory}/${item.name}`;
    if (item.isDirectory()) { if (item.name !== "build") await walk(file); continue; }
    if (!/\.(tsx?|jsx?|mjs|cjs|css|json|md|ps1)$/.test(file) || file === "scripts/convert-images.mjs") continue;
    let text = await fs.readFile(path.join(root, file), "utf8");
    const original = text;
    for (const [from, to] of replacements) {
      const fromPublic = from.replace(/^public\//, "/");
      const toPublic = to.replace(/^public\//, "/");
      text = text.replaceAll(fromPublic, toPublic);
      text = text.replaceAll(path.basename(from), path.basename(to));
    }
    // Dynamically constructed level image URLs.
    text = text.replace(/(nivel-\$\{[^}]+\})\.png/g, "$1.webp");
    if (text !== original) await fs.writeFile(path.join(root, file), text);
  }
}
for (const directory of directories) await walk(directory);
console.log(JSON.stringify({ converted: count, beforeBytes: before, afterBytes: after, savedPercent: Math.round((1 - after / before) * 100) }));
