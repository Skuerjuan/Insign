const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const cache = new Map();
const profile = { user_id: 'test-user', senas_aprendidas: [], examenes_aprobados: [], puntos: 35, nivel: 1,
  premios: 0, racha: 0, ultimo_dia_activo: null, juegos_jugados: 0, dias_activos: 0 };
let completions = 0;
let completedGames = [];
const attempts = new Map();
let attemptId = 0;
let activities = [];
const catalog = new Map();
const unlocked = new Map();
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
        profile[key] = value && typeof value === 'object' && !Array.isArray(value)
          ? 'push' in value ? [...profile[key], value.push] : profile[key] + value.increment
          : value;
      }
      return profile;
    },
  },
  juegos_completados: {
    findMany: async ({ where }) => completedGames.filter(row => !where?.nivel || row.nivel === where.nivel),
    findUnique: async () => null,
    upsert: async ({ create }) => { completions++; completedGames.push(create); },
    count: async () => completions,
  },
  actividades: { findMany: async () => activities, create: async ({ data }) => { activities.push(data); } },
  logros: {
    createMany: async ({ data }) => {
      for (const row of data) if (!catalog.has(row.id)) catalog.set(row.id, row);
    },
    findMany: async ({ where }) => [...catalog.values()].filter(row => where.id.in.includes(row.id)),
  },
  logros_desbloqueados: {
    createMany: async ({ data }) => {
      for (const row of data) {
        assert(catalog.has(row.logro_id), `Foreign key: missing achievement ${row.logro_id}`);
        if (!unlocked.has(row.logro_id)) unlocked.set(row.logro_id, { ...row, desbloqueado_at: new Date() });
      }
    },
    findMany: async () => [...unlocked.values()],
    count: async () => unlocked.size,
  },
  examenes_intentos: {
    updateMany: async ({ where, data }) => { for (const row of attempts.values()) if (row.usuario_id === where.usuario_id && row.estado === where.estado) Object.assign(row, data); },
    create: async ({ data }) => { const row = { ...data, id: `attempt-${++attemptId}`, ronda: 0, estado: 'activo' }; attempts.set(row.id, row); return row; },
    findFirst: async ({ where }) => { const row = attempts.get(where.id); return row?.usuario_id === where.usuario_id ? row : null; },
    update: async ({ where, data }) => Object.assign(attempts.get(where.id), data),
  },
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
  const { getSignProgress, getLevelSignProgress, getUnlockedLevel } = load(path.join(root, 'lib/sign-progress.ts'));
  const { LEVELS, getLevelWords } = load(path.join(root, 'src/diccionario/diccionario.ts'));
  const { recordLearnedSign, completeGame, getProfile, getAchievementProgress } = load(path.join(root, 'lib/server/profile.actions.ts'));
  const { createSignRecorder } = load(path.join(root, 'lib/client/learned-signs.ts'));
  const examRecorder = createSignRecorder(false);
  examRecorder.record(1, 'Hola');
  examRecorder.record(1, 'Bien');
  await examRecorder.flush();
  assert.equal(profile.senas_aprendidas.length, 0, 'El examen no dispara Server Actions al mostrar señas');
  const before = getSignProgress([]);
  assert.equal(before.total, 419);
  await Promise.all([recordLearnedSign(1, 'Hola'), recordLearnedSign(1, 'Hola')]);
  const after = getSignProgress(profile.senas_aprendidas);
  assert.equal(after.learned, 1);
  assert.equal(after.pending, before.pending - 1);
  await assert.rejects(recordLearnedSign(2, 'Hola'));
  assert.equal(getSignProgress(['invalid']).learned, 0);
  assert.equal(getSignProgress(profile.senas_aprendidas.concat(profile.senas_aprendidas)).learned, 1);
  for (const level of LEVELS) {
    const words = getLevelWords(level.id);
    const keys = words.map(word => `${level.categoryId}:${word}`);
    assert.equal(getLevelSignProgress(level.id, []).complete, false);
    assert.equal(getLevelSignProgress(level.id, keys.slice(1)).complete, false);
    assert.equal(getLevelSignProgress(level.id, keys).complete, true);
    assert.equal(getLevelSignProgress(level.id, [...keys, ...keys]).learned, words.length);
    assert.equal(getLevelSignProgress(level.id, words.map(word => `otra-categoria:${word}`)).complete, false);
  }
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
  await assert.rejects(completeGame('eleccion', 0, 'menu', 2), /aprobar el examen final/);
  for (const game of ['memoria', 'adivinar', 'completar']) await completeGame(game, 0, 'menu', 1);
  assert.equal(profile.nivel, 1, 'Completar los cuatro juegos no alcanza si faltan señas');
  const words = getLevelWords(1);
  const missing = words.find(word => word !== 'Hola');
  for (const word of words.filter(word => word !== missing)) await recordLearnedSign(1, word);
  assert.equal((await getProfile(profile.user_id)).nivel, 1, 'Una sola seña pendiente mantiene el bloqueo');
  await recordLearnedSign(1, 'Hola');
  assert.equal((await getProfile(profile.user_id)).nivel, 1, 'Las repeticiones no reemplazan una seña faltante');
  completions = 0;
  await recordLearnedSign(1, missing);
  assert.equal(profile.nivel, 1, 'Ver todas las señas no habilita el siguiente nivel');
  assert.equal((await getProfile(profile.user_id)).nivel, 1);
  const allKeys = LEVELS.flatMap(level => getLevelWords(level.id).map(word => `${level.categoryId}:${word}`));
  assert.equal(getUnlockedLevel(LEVELS.map(level => level.id)), 9);
  assert.equal(getUnlockedLevel([2, 3, 4]), 1, 'No permite saltar exámenes');
  profile.nivel = 9;
  assert.equal((await getProfile(profile.user_id)).nivel, 1, 'Los perfiles anteriores también necesitan exámenes');
  const { createExamPlan, EXAM_GAMES } = load(path.join(root, 'lib/exam.ts'));
  const { startExam, finishExamRound } = load(path.join(root, 'lib/server/exam.actions.ts'));
  for (const level of LEVELS) {
    const plan = createExamPlan(level.id);
    assert.deepEqual([...new Set(plan.flatMap(round => round.words))].sort(), getLevelWords(level.id).sort());
    assert.deepEqual(EXAM_GAMES, ['eleccion', 'completar', 'adivinar']);
    assert.deepEqual([...new Set(plan.map(round => round.game))].sort(), [...EXAM_GAMES].sort());
    assert.equal(plan.flatMap(round => round.words).length, getLevelWords(level.id).length, 'Cada seña aparece como objetivo una vez');
    for (const round of plan) assert(round.words.length > 0 && round.words.length <= 5);
  }
  await assert.rejects(startExam(2), /bloqueado/);
  await assert.rejects(completeGame('memoria', 0, 'exam', 1), /propio recorrido/);
  const savedGames = completedGames;
  completedGames = completedGames.filter(row => row.juego !== 'completar');
  await assert.rejects(startExam(1), /cuatro juegos/);
  completedGames = savedGames.filter(row => row.juego !== 'memoria');
  await assert.rejects(startExam(1), /cuatro juegos/, 'Memoria sigue siendo requisito normal, no forma parte del examen');
  completedGames = savedGames;
  const legacy = await startExam(1);
  attempts.get(legacy.id).plan[0].game = 'memoria';
  await assert.rejects(finishExamRound(legacy.id, 0, 0), /examen cambió/, 'Un intento anterior con Memoria debe reiniciarse');
  assert.equal((await getProfile(profile.user_id)).nivel, 1);
  const failed = await startExam(1);
  await assert.rejects(finishExamRound(failed.id, 1, 0), /en orden/);
  assert.equal((await finishExamRound(failed.id, 0, 0)).round, 1);
  assert.equal((await finishExamRound(failed.id, 0, 0)).round, 1, 'El reintento de red no duplica rondas');
  assert.equal((await finishExamRound(failed.id, 1, 1)).failed, true);
  assert.equal((await finishExamRound(failed.id, 1, 0)).failed, true, 'Un error invalida todo el intento');
  assert.equal((await getProfile(profile.user_id)).nivel, 1);
  const cancelled = await startExam(1);
  const exam = await startExam(1);
  assert.equal((await finishExamRound(cancelled.id, 0, 0)).failed, true, 'Una segunda pestaña cancela el intento anterior');
  await assert.rejects(finishExamRound('not-owned', 0, 0));
  await assert.rejects(finishExamRound(exam.id, 0, -1));
  for (let round = 0; round < exam.plan.length; round++) {
    const result = await finishExamRound(exam.id, round, 0);
    assert.equal(result.passed, round === exam.plan.length - 1);
    assert.equal((await getProfile(profile.user_id)).nivel, result.passed ? 2 : 1);
  }
  assert.deepEqual(profile.examenes_aprobados, [1]);
  const count = activities.length;
  await finishExamRound(exam.id, exam.plan.length - 1, 0);
  assert.equal(activities.length, count, 'Guardar de nuevo la aprobación es idempotente');
  assert.equal(getLevelSignProgress(1, profile.senas_aprendidas).complete, true);
  // Reproduce the malformed ID in the deployed catalog, with 25 learned signs.
  catalog.delete('gran-aprendiz');
  catalog.set('gran-aprendiz, Gran Aprendiz, Aprender 25 señas.', {
    id: 'gran-aprendiz, Gran Aprendiz, Aprender 25 señas.', name: 'Gran Aprendiz', description: 'Aprender 25 señas.',
  });
  profile.senas_aprendidas = allKeys.slice(0, 25);
  const progress = await getAchievementProgress(profile.user_id);
  assert.equal(progress.achievements.length, 14, 'El catálogo inválido no duplica logros');
  assert.equal(progress.achievements.find(row => row.id === 'gran-aprendiz').unlocked, true);
  const unlockedAt = unlocked.get('gran-aprendiz').desbloqueado_at;
  await Promise.all([getAchievementProgress(profile.user_id), getAchievementProgress(profile.user_id)]);
  assert.equal(unlocked.get('gran-aprendiz').desbloqueado_at, unlockedAt, 'Las visitas conservan la fecha de desbloqueo');
  catalog.clear();
  await completeGame('memoria', 0, 'training', 1);
  assert.equal(catalog.size, 14, 'Guardar una partida también repara un catálogo vacío');
  assert.equal(profile.premios, unlocked.size);
  console.log('OK: Perfil/Progreso reparan el ID de Gran Aprendiz, las visitas son idempotentes y las partidas funcionan con catálogo vacío.');
  console.log('OK: examen de tres juegos sin Memoria, cobertura de todas las señas en nueve niveles, error reinicia, intentos aislados, guardado idempotente y avance exclusivo al aprobar.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
