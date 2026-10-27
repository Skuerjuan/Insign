const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const cache = new Map();
const profile = { user_id: 'test-user', senas_aprendidas: [], puntos: 35, nivel: 1,
  premios: 0, racha: 0, ultimo_dia_activo: null, juegos_jugados: 0, dias_activos: 0 };
let completions = 0;
let activities = [];
const db = {
  profiles: {
    findUnique: async () => profile,
    findUniqueOrThrow: async () => profile,
    updateMany: async ({ where, data }) => {
      if (!profile.senas_aprendidas.includes(where.NOT.senas_aprendidas.has)) {
        profile.senas_aprendidas.push(data.senas_aprendidas.push);
      }
    },
    update: async ({ data }) => {
      for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;
        profile[key] = typeof value === 'object' ? profile[key] + value.increment : value;
      }
      return profile;
    },
  },
  juegos_completados: {
    findMany: async () => [],
    findUnique: async () => null,
    upsert: async () => { completions++; },
    count: async () => completions,
  },
  actividades: { findMany: async () => activities, create: async ({ data }) => { activities.push(data); } },
  logros_desbloqueados: { createMany: async () => {}, count: async () => 0 },
  $queryRaw: async () => [],
  $transaction: async (fn) => fn(db),
};
const mocks = {
  '@/db': { prisma: db },
  '@/lib/auth/server': { auth: { getSession: async () => ({ data: { user: { id: 'test-user' } } }) } },
  'next/navigation': { redirect: () => { throw Error('Unauthenticated'); } },
  'next/cache': { revalidatePath: () => {} },
};
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const localRequire = (id) => {
    if (mocks[id]) return mocks[id];
    const target = id.startsWith('@/') ? path.join(root, id.slice(2)) : id.startsWith('.') ? path.resolve(path.dirname(file), id) : null;
    if (!target) return require(id);
    if (target.endsWith('.json')) return require(target);
    return load(target + '.ts');
  };
  new Function('require', 'module', 'exports', source)(localRequire, module, module.exports);
  return module.exports;
}

(async () => {
  const { getSignProgress } = load(path.join(root, 'lib/sign-progress.ts'));
  const { recordLearnedSign, completeGame } = load(path.join(root, 'lib/server/profile.actions.ts'));
  const before = getSignProgress([]);
  assert.equal(before.total, 419);
  await Promise.all([recordLearnedSign(1, 'Hola'), recordLearnedSign(1, 'Hola')]);
  const after = getSignProgress(profile.senas_aprendidas);
  assert.equal(after.learned, 1);
  assert.equal(after.pending, before.pending - 1);
  await assert.rejects(recordLearnedSign(2, 'Hola'));
  assert.equal(getSignProgress(['invalid']).learned, 0);
  assert.equal(getSignProgress(profile.senas_aprendidas.concat(profile.senas_aprendidas)).learned, 1);
  const practiced = await completeGame('memoria', 0, 'training', 9);
  assert.equal(practiced.pointsAwarded, 0);
  assert.equal(profile.puntos, 35);
  assert.equal(profile.nivel, 1);
  assert.equal(completions, 0);
  assert.equal(activities[0].origen, 'training');
  const played = await completeGame('eleccion', 0, 'menu', 1);
  assert.equal(played.pointsAwarded, 15);
  assert.equal(profile.puntos, 50);
  assert.equal(completions, 1);
  console.log('OK: aciertos únicos, contadores complementarios, validación de nivel, práctica sin puntos ni desbloqueos y juego normal con puntos.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
