const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { EventEmitter } = require('node:events');
const root = path.resolve(__dirname, '..');

async function checkGame(name) {
  let slots = [], cursor = 0, effects = [], created = 0, destroyed = 0, scenes, lastConfig;
  const same = (a, b) => a && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const react = {
    useRef(initial) { const i = cursor++; return (slots[i] ??= { current: initial }); },
    useState(initial) { cursor++; return [initial, () => {}]; },
    useMemo(fn, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useEffect(fn, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) { const previous = slots[i]; effects.push(() => { previous?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); } },
  };
  let navigated;
  const router = { push(href) { navigated = href; } };
  const mocks = {
    react,
    'react/jsx-runtime': { jsx() {}, jsxs() {} },
    'next/navigation': { useRouter: () => router },
    '@/lib/client/learned-signs': { createSignRecorder: () => ({ record() {}, async flush() {} }) },
    '@/lib/server/profile.actions': { completeGame: async () => ({ pointsAwarded: 15 }) },
    phaser: {
      __esModule: true, Scene: class {}, AUTO: 0, Scale: { RESIZE: 0, FIT: 1, CENTER_BOTH: 2, NO_CENTER: 3 },
      Scenes: { Events: { SHUTDOWN: 'shutdown' } },
      Math: { Clamp: (value, min, max) => Math.min(max, Math.max(min, value)) },
      Utils: { Array: { Shuffle: items => items.reverse() } },
      Game: class { constructor(config) { created++; lastConfig = config; scenes = config.scene; this.events = { on() {} }; } destroy() { destroyed++; } },
    },
  };
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const localRequire = id => {
      if (mocks[id]) return mocks[id];
      if (id.endsWith('.webp') || id.endsWith('/Perder')) return { default: { src: '/test.png' } };
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
    for (const slot of slots) if (slot && 'current' in slot && slot.current === null) { slot.current = { clientWidth: 1200, clientHeight: 800 }; break; }
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
  // La pantalla final habilita un botón explícito de regreso al inicio.
  const finishMenu = new scenes[1]();
  finishMenu.init({ errores: 0 });
  finishMenu.scale = { width: 1200, height: 800 };
  const texts = [];
  const image = { setOrigin() { return this; }, setDisplaySize() { return this; } };
  const graphic = { fillStyle() {}, fillRoundedRect() {}, lineStyle() {}, strokeRoundedRect() {} };
  finishMenu.add = { image: () => image, graphics: () => graphic, text(x, y, label) {
    const item = { label, handlers: {}, setOrigin() { return this; }, setText(value) { this.label = value; return this; }, setBackgroundColor() { return this; }, setInteractive() { return this; }, once(event, callback) { this.handlers[event] = callback; return this; } };
    texts.push(item); return item;
  } };
  finishMenu.create();
  assert(!texts.some(text => text.handlers.pointerdown), name + ': espera a guardar antes de salir');
  await new Promise(resolve => setImmediate(resolve));
  const back = texts.find(text => text.label === 'Volver al inicio');
  assert(back, name + ': muestra el botón Volver al inicio');
  back.handlers.pointerdown();
  assert.equal(navigated, '/menu', name + ': vuelve al inicio, no al selector del nivel');

  if (name === 'JuegoMemoria') {
    const memory = new scenes[0]();
    memory.scale = { width: 1200, height: 800 };
    const delayed = [], tweens = [];
    let backdropDestroyed = false, done = 0;
    memory.time = { delayedCall(delay, callback) { delayed.push({ delay, callback }); } };
    memory.tweens = { add(config) { tweens.push(config); } };
    memory.add = { rectangle() { return { setDepth() { return this; }, destroy() { backdropDestroyed = true; } }; } };
    const card = (type, x, y) => ({
      carta: { x, y, width: 115, height: 115, scaleX: 1, scaleY: 1, depth: 3, alpha: 1,
        getData: key => key === 'tipo' ? type : 'Hola', setDepth(value) { this.depth = value; return this; }, setAlpha(value) { this.alpha = value; return this; } },
      fondoObj: { setTint() {} },
      contenidoVisible: { depth: 7, setDepth(value) { this.depth = value; return this; } },
    });
    const meaning = card('significado', 120, 250), sign = card('senia', 900, 420), other = card('significado', 400, 250);
    // Las selecciones y las entradas del tablero envuelven las mismas fichas en objetos distintos.
    memory.cartas = [{ ...meaning }, { ...sign }, { ...other }];
    memory.bloqueado = true;
    memory.mostrarParejaAmpliada(sign, meaning, () => { done++; memory.bloqueado = false; });
    assert.equal(tweens.length, 2);
    assert.equal(tweens[0].targets, meaning.carta, 'El significado queda a la izquierda');
    assert(tweens[0].x < tweens[1].x);
    assert(tweens.every(tween => tween.scaleX > 1 && tween.y === 400));
    assert.equal(meaning.carta.alpha, 1, 'La pareja ampliada mantiene su visibilidad');
    assert.equal(other.carta.alpha, 0, 'Las otras señas no se superponen a la pareja ampliada');
    assert.equal(done, 0);
    const completeTween = tween => {
      for (const key of ['x', 'y', 'scaleX', 'scaleY']) tween.targets[key] = tween[key];
      tween.onComplete();
    };
    completeTween(tweens[0]);
    assert.equal(delayed.length, 0, 'Espera a que ambas fichas terminen de ampliarse');
    completeTween(tweens[1]);
    assert.equal(delayed.length, 1);
    assert.equal(delayed[0].delay, 1500, 'La pareja se mantiene grande durante 1,5 segundos');
    assert.equal(memory.bloqueado, true);
    delayed[0].callback();
    completeTween(tweens[2]);
    assert.equal(done, 0, 'No continúa hasta devolver las dos fichas');
    completeTween(tweens[3]);
    assert.equal(done, 1);
    assert.equal(memory.bloqueado, false);
    assert(backdropDestroyed);
    assert.equal(other.carta.alpha, 1);
    for (const [item, x, y] of [[meaning, 120, 250], [sign, 900, 420]]) {
      assert.equal(item.carta.x, x); assert.equal(item.carta.y, y);
      assert.equal(item.carta.scaleX, 1); assert.equal(item.carta.scaleY, 1);
      assert.equal(item.carta.depth, 3); assert.equal(item.contenidoVisible.depth, 7);
    }
    // La última pareja también se muestra completa antes de abrir la felicitación.
    const last = new scenes[0]();
    let afterPreview, endStarted = false;
    last.primeraCarta = meaning;
    last.totalPares = 1;
    last.lanzarConfeti = () => {};
    last.time = { delayedCall(delay, callback) { callback(); } };
    last.mostrarParejaAmpliada = (first, second, callback) => { afterPreview = callback; };
    last.scene = { start(name) { endStarted = name === 'PantallaFin'; } };
    last.verificarPar(sign.carta, sign.fondoObj, sign.contenidoVisible);
    assert.equal(last.aciertos, 1);
    assert.equal(last.bloqueado, true);
    assert.equal(endStarted, false);
    afterPreview();
    assert.equal(endStarted, true);
    console.log('OK: Memoria amplía la pareja durante 1,5 segundos, restaura las fichas y espera también en la última pareja.');
    return;
  }

  const results = [];
  const onExamResult = async mistakes => { results.push(mistakes); };
  await render({ ...props, origin: 'exam', palabras: ['Hola', 'Bien'], onExamResult });
  assert.equal(lastConfig.scale.mode, mocks.phaser.Scale.FIT, name + ': el examen adapta la escala sin recrear escenas');
  assert.equal(lastConfig.scale.width, 1200);
  assert.equal(lastConfig.scale.height, 800);
  const createdBeforeRefresh = created;
  const destroyedBeforeRefresh = destroyed;
  for (let i = 0; i < 5; i++) await render({ ...props, origin: 'exam', palabras: ['Hola', 'Bien'], onExamResult });
  assert.equal(created, createdBeforeRefresh, name + ': conserva la partida de examen tras actualizaciones de React');
  assert.equal(destroyed, destroyedBeforeRefresh);
  {
    const active = new scenes[0]();
    const image = { setOrigin() { return this; }, setDisplaySize() { return this; } };
    let restarts = 0, questions = 0;
    active.add = { image: () => image };
    active.scale = Object.assign(new EventEmitter(), { width: 1200, height: 800 });
    active.events = new EventEmitter();
    active.input = { on() {}, keyboard: { on() {} } };
    active.scene = { restart() { restarts++; active.events.emit('shutdown'); active.create(); } };
    active.crearHud = () => {};
    active.generarNuevaRonda = () => { questions++; };
    active.create();
    for (let i = 0; i < 5; i++) active.scale.emit('resize');
    active.scale.width = 900;
    active.scale.height = 600;
    active.scale.emit('resize');
    assert.equal(restarts, 0, name + ': redimensionar el examen no reinicia los videos');
    assert.equal(questions, 1, name + ': conserva la pregunta hasta responder');
  }
  const finish = new scenes[1]();
  finish.init({ errores: 0 });
  finish.create();
  assert.deepEqual(results, [0], name + ': el examen informa éxito sin guardar puntos normales');
  const scene = new scenes[0]();
  if (name === 'JuegoCompletar') {
    scene.palabraObjetivoNormalizada = 'HOLA';
    scene.inputtedChars = [{ char: 'M' }, { char: 'A' }, { char: 'L' }];
    scene.validarRespuestaConDelay();
  } else {
    scene.palabraObjetivo = 'Hola';
    const graphic = { clear() {}, lineStyle() {}, strokeRoundedRect() {}, fillStyle() {}, fillRoundedRect() {} };
    scene.validarRespuesta({ getData: () => 'Bien' }, graphic, 100, 100, 1);
  }
  assert.deepEqual(results, [0, 1], name + ': falla inmediatamente en el primer error');
  console.log('OK:', name, 'mantiene videos y pregunta tras seis eventos de tamaño y cinco actualizaciones; falla en el primer error.');
}

global.document = { fonts: { ready: Promise.resolve(), load: async () => {} }, documentElement: { dataset: {} } };
global.getComputedStyle = () => ({ getPropertyValue: () => 'Arial' });
(async () => { for (const name of ['JuegoEleccion', 'JuegoAdivinar', 'JuegoCompletar', 'JuegoMemoria']) await checkGame(name); })().catch(error => { console.error(error); process.exitCode = 1; });
