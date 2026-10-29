const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { EventEmitter } = require('node:events');
const root = path.resolve(__dirname, '..');

async function checkGame(name) {
  let slots = [], cursor = 0, effects = [], created = 0, destroyed = 0, scenes;
  const same = (a, b) => a && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useRef(initial) { const i = cursor++; return (slots[i] ??= { current: initial }); },
    useState(initial) { cursor++; return [initial, () => {}]; },
    useMemo(fn, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useEffect(fn, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) { const previous = slots[i]; effects.push(() => { previous?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); } },
  };
  const router = { push() {} };
  const mocks = {
    react,
    'react/jsx-runtime': { jsx() {}, jsxs() {} },
    'next/navigation': { useRouter: () => router },
    '@/lib/client/learned-signs': { createSignRecorder: () => ({ record() {}, async flush() {} }) },
    '@/lib/server/profile.actions': { completeGame: async () => ({ pointsAwarded: 15 }) },
    phaser: {
      __esModule: true, Scene: class {}, AUTO: 0, Scale: { RESIZE: 0 },
      Scenes: { Events: { SHUTDOWN: 'shutdown' } },
      Math: { Clamp: (value, min, max) => Math.min(max, Math.max(min, value)) },
      Utils: { Array: { Shuffle: items => items.reverse() } },
      Game: class { constructor(config) { created++; scenes = config.scene; this.events = { on() {} }; } destroy() { destroyed++; } },
    },
  };
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const localRequire = id => {
      if (mocks[id]) return mocks[id];
      if (id.endsWith('.png') || id.endsWith('/Perder')) return { default: { src: '/test.png' } };
      const target = id.startsWith('@/') ? path.join(root, id.slice(2)) : path.resolve(path.dirname(file), id);
      if (id.endsWith('.json')) return require(target);
      return load(target + '.ts');
    };
    new Function('require', 'module', 'exports', source)(localRequire, mod, mod.exports);
    return mod.exports;
  }
  const Component = load(path.join(root, 'src/juegos', name + '.tsx')).default;
  async function render(props) {
    cursor = 0; effects = []; Component(props);
    // React mounts the host div before running passive effects.
    for (const slot of slots) if (slot && 'current' in slot && slot.current === null) { slot.current = {}; break; }
    effects.forEach(run => run());
    await new Promise(resolve => setImmediate(resolve));
  }
  const props = { level: 1, palabras: ['Hola', 'Bien'], points: 50 };
  await render(props);
  assert.equal(created, 1, name + ': inicia una partida');
  // Simula respuestas de Server Actions que reenvían props serializadas.
  for (let i = 0; i < 5; i++) await render({ ...props, palabras: [...props.palabras] });
  assert.equal(created, 1, name + ': mantiene la partida tras guardar señas');
  assert.equal(destroyed, 0, name + ': no destruye su estado');
  await render({ ...props, level: 2, palabras: ['Gracias'] });
  assert.equal(created, 2, name + ': cambiar de nivel sí inicia otra partida');
  assert.equal(destroyed, 1, name + ': libera la partida anterior');
  if (name === 'JuegoMemoria') {
    const scene = new scenes[0]();
    const image = { setOrigin() { return this; }, setDisplaySize() { return this; } };
    scene.add = { image: () => image };
    scene.scale = Object.assign(new EventEmitter(), { width: 1200, height: 800 });
    scene.events = new EventEmitter();
    scene.scene = { restart() { scene.events.emit('shutdown'); scene.create(); } };
    scene.crearGrupo = () => {};
    scene.crearHud = () => {};
    scene.crearEncabezadoColumnas = () => {};
    scene.create();
    const deck = [...scene.pares];
    scene.aciertos = 1;
    scene.errores = 2;
    scene.paresEncontrados.add(deck[0]);
    for (let i = 0; i < 5; i++) scene.scale.emit('resize');
    assert.equal(scene.aciertos, 1, 'Memoria: conserva los pares acertados al redimensionar');
    assert.equal(scene.errores, 2, 'Memoria: conserva los errores al redimensionar');
    assert.deepEqual(scene.pares, deck, 'Memoria: conserva el mazo');
    assert.equal(scene.paresEncontrados.has(deck[0]), true);
    assert.equal(scene.scale.listenerCount('resize'), 1, 'Memoria: no acumula listeners');
    console.log('OK: Memoria conserva aciertos, errores y mazo tras cinco cambios de tamaño.');
  }
  console.log('OK:', name, 'conserva la instancia después de cinco actualizaciones y cambia al elegir otro nivel.');
}

global.document = { fonts: { ready: Promise.resolve(), load: async () => {} }, documentElement: { dataset: {} } };
global.getComputedStyle = () => ({ getPropertyValue: () => 'Arial' });
(async () => { for (const name of ['JuegoEleccion', 'JuegoAdivinar', 'JuegoCompletar', 'JuegoMemoria']) await checkGame(name); })().catch(error => { console.error(error); process.exitCode = 1; });
