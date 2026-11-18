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

  let levels = getDictionaryLevels(profile);
  assert.equal(levels[0].unlocked, true);
  assert.equal(levels[0].signs.length, getLevelWords(1).length);
  assert.equal(levels[0].signs.find((sign) => sign.label === 'Bien').video, '/Presentacion%201/Bien.mp4');
  assert(levels.slice(1).every((level) => !level.unlocked && level.signs.length === 0));
  await page('1');
  await assert.rejects(() => page('2'), /redirect:\/diccionario/);

  // Ver señas en entrenamiento no habilita niveles que siguen bloqueados en Inicio.
  profile.senas_aprendidas = ['presentacion-2:Cómo estás'];
  assert.equal(getDictionaryLevels(profile)[1].unlocked, false);
  await assert.rejects(() => page('2'), /redirect:\/diccionario/);

  // Aprobar el nivel 1 habilita todas las señas del 2, aunque aún no se haya jugado.
  profile = { examenes_aprobados: [1], senas_aprendidas: [] };
  levels = getDictionaryLevels(profile);
  assert.deepEqual(levels.map((level) => level.unlocked), [true, true, false, false, false, false, false, false, false]);
  assert.equal(levels[1].signs.length, getLevelWords(2).length);
  await page('2');
  await assert.rejects(() => page('3'), /redirect:\/diccionario/);
  assert.deepEqual(profile.senas_aprendidas, [], 'Consultar no marca señas como aprendidas');
  for (const invalid of ['0', '-1', '999', 'abc', '1.5']) await assert.rejects(() => page(invalid), /not-found/);

  // Cada examen aprobado habilita el siguiente diccionario con la misma regla de Inicio.
  for (let passed = 0; passed <= LEVELS.length; passed++) {
    profile = { examenes_aprobados: LEVELS.slice(0, passed).map((level) => level.id), senas_aprendidas: [] };
    for (const level of getDictionaryLevels(profile)) {
      assert.equal(level.unlocked, level.id <= Math.min(passed + 1, LEVELS.length));
      assert.equal(level.signs.length, level.unlocked ? getLevelWords(level.id).length : 0);
    }
  }

  // Comprobar rutas para los nueve niveles, sin depender del registro de señas vistas.
  profile = {
    examenes_aprobados: LEVELS.map((level) => level.id),
    senas_aprendidas: [],
  };
  levels = getDictionaryLevels(profile);
  for (const level of levels) {
    assert(level.unlocked);
    assert.equal(level.signs.length, getLevelWords(level.id).length);
    for (const sign of level.signs) assert(fs.existsSync(path.join(root, 'public', decodeURIComponent(sign.video))));
    await page(String(level.id));
  }
  console.log('OK: Diccionario habilita todos los videos de los mismos niveles que Inicio, permite consultar el nivel actual y bloquea los futuros; 419 rutas verificadas.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
