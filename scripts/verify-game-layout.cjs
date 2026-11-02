const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}
const { getSpellingLayout, getChoiceLayout, getMultipleChoiceLayout, getMemoryPairPreview } = load('lib/client/game-layout.ts');
const { getPalabraCompletar } = load('src/diccionario/textos.ts');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/diccionario/videos.json'), 'utf8'));
const sizes = [[1920, 700], [1920, 400], [1366, 590], [1024, 600], [768, 640], [390, 650], [320, 520], [844, 330], [320, 300]];
function intersects(a, b) {
  return a.x < b.x + b.width - 0.01 && b.x < a.x + a.width - 0.01 && a.y < b.y + b.height - 0.01 && b.y < a.y + a.height - 0.01;
}
function check(rects, width, height, frame, label) {
  for (const rect of rects) {
    assert(rect.width > 0 && rect.height > 0, `${label}: tamaño positivo`);
    assert(rect.x >= -0.01 && rect.x + rect.width <= width + 0.01, `${label}: sin recortes horizontales`);
    assert(rect.y >= frame.headerBottom && rect.y + rect.height < frame.footerTop, `${label}: separado del encabezado y los indicadores`);
  }
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    assert(!intersects(rects[i], rects[j]), `${label}: no se superponen las regiones ${i} y ${j}`);
  }
}
let checked = 0;
for (const [width, height] of sizes) {
  for (const category of catalog) for (const word of Object.keys(category.videos)) {
    const target = getPalabraCompletar(word).normalize('NFD').replace(/[\u0300-\u0302\u0304-\u036f]/g, '').normalize('NFC').toUpperCase();
    const layout = getSpellingLayout(width, height, target);
    const rect = cell => ({ x: cell.x - cell.size / 2, y: cell.y - cell.size / 2, width: cell.size, height: cell.size });
    const input = layout.inputCells.map(rect), keyboard = layout.keyboardCells.map(rect);
    check([layout.video, ...input, ...keyboard], width, height, layout, `Completar ${width}x${height}: ${word}`);
    assert.equal(input.length, target.replace(/ /g, '').length);
    assert.equal(keyboard.length, input.length);
    assert(layout.questionY + 12 * layout.scale < layout.video.y, 'Consigna separada del video');
    checked++;
  }
  const pair = getMemoryPairPreview(width, height, 115, 115);
  const pairRects = pair.map(card => ({ x: card.x - card.width / 2, y: card.y - card.height / 2, width: card.width, height: card.height }));
  assert(!intersects(pairRects[0], pairRects[1]), 'La pareja ampliada no se superpone');
  for (const rect of pairRects) {
    assert(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= width && rect.y + rect.height <= height, 'Pareja ampliada visible dentro de la pantalla');
    assert(rect.width > 115, 'La pareja se agranda');
  }
  const choice = getChoiceLayout(width, height);
  check(choice.cards, width, height, choice, `Elección ${width}x${height}`);
  for (let count = 1; count <= 6; count++) {
    const multiple = getMultipleChoiceLayout(width, height, count);
    check([multiple.video, ...multiple.buttons], width, height, multiple, `Múltiple elección ${width}x${height}`);
  }
}
console.log(`OK: ${checked} combinaciones de seña y pantalla sin superposiciones en Completar; Elección y Múltiple elección sin recortes ni cruces con el encabezado o los indicadores.`);
