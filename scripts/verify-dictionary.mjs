import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = new Map();
let profile = { examenes_aprobados: [], senas_aprendidas: [] };
const mocks = {
  '@/lib/server/profile.actions': {
    getSession: async () => ({ id: 'dictionary-test' }),
    getProfile: async () => profile,
  },
  'next/navigation': {
    redirect: (url) => { throw new Error(`redirect:${url}`); },
    notFound: () => { throw new Error('not-found'); },
  },
};
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const evaluatedModule = { exports: {} };
  cache.set(file, evaluatedModule);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const localRequire = (id) => {
    if (mocks[id]) return mocks[id];
    if (id.endsWith('.css')) return {};
    // Componentes visuales no necesarios para verificar el control de acceso de la página.
    if (id.startsWith('@/components/') || id === './DictionaryWords') return { default: () => null };
    const target = id.startsWith('@/') ? path.join(root, id.slice(2)) : id.startsWith('.') ? path.resolve(path.dirname(file), id) : null;
    if (!target) return require(id);
    if (target.endsWith('.json')) return require(target);
    return load(['.ts', '.tsx'].map((ext) => target + ext).find(fs.existsSync));
  };
  new Function('require', 'module', 'exports', source)(localRequire, evaluatedModule, evaluatedModule.exports);
  return evaluatedModule.exports;
}

(async () => {
  const { getDictionaryLevels } = load(path.join(root, 'lib/dictionary.ts'));
  const { LEVELS, getLevelWords } = load(path.join(root, 'src/diccionario/diccionario.ts'));
  const Page = load(path.join(root, 'app/diccionario/page.tsx')).default;
  const page = (unidad) => Page({ searchParams: Promise.resolve(unidad === undefined ? {} : { unidad }) });

  assert(getDictionaryLevels(profile).every((level) => !level.unlocked && level.signs.length === 0));
  // Ver señas en juegos o entrenamiento no habilita una unidad pendiente.
  profile.senas_aprendidas = ['presentacion-1:Bien', 'presentacion-2:Cómo estás'];
  assert(getDictionaryLevels(profile).every((level) => level.signs.length === 0));
  await assert.rejects(() => page('1'), /redirect:\/diccionario/);
  profile.examenes_aprobados = [1];
  let levels = getDictionaryLevels(profile);
  assert.deepEqual(levels[0].signs.map((sign) => sign.label), ['Bien']);
  assert.equal(levels[0].signs[0].video, '/Presentacion%201/Bien.mp4');
  assert.equal(levels[1].unlocked, false);
  assert.equal(levels[1].signs.length, 0);
  await page('1');
  await assert.rejects(() => page('2'), /redirect:\/diccionario/);
  for (const invalid of ['0', '-1', '999', 'abc', '1.5']) await assert.rejects(() => page(invalid), /not-found/);

  // El examen guarda todas las señas de la unidad; comprobar rutas para los nueve niveles.
  profile = {
    examenes_aprobados: LEVELS.map((level) => level.id),
    senas_aprendidas: LEVELS.flatMap((level) => getLevelWords(level.id).map((word) => `${level.categoryId}:${word}`)),
  };
  levels = getDictionaryLevels(profile);
  for (const level of levels) {
    assert(level.unlocked);
    assert.equal(level.signs.length, getLevelWords(level.id).length);
    for (const sign of level.signs) assert(fs.existsSync(path.join(root, 'public', decodeURIComponent(sign.video))));
    await page(String(level.id));
  }
  console.log('OK: Diccionario filtra por examen aprobado y seña vista, bloquea acceso directo a unidades pendientes y resuelve los 419 videos.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
