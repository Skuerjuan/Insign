import { getLevel, getLevelWords, LEVELS } from "@/src/diccionario/diccionario";

const signKeys = new Set(LEVELS.flatMap((level) =>
  level.palabras.map((word) => `${level.categoryId}:${word}`)
));

export function getSignProgress(savedKeys: string[]) {
  const learned = new Set(savedKeys.filter((key) => signKeys.has(key))).size;
  const total = signKeys.size;
  return { learned, total, pending: total - learned, percent: total ? learned / total * 100 : 0 };
}

export function getLevelSignProgress(levelIdentifier: number | string, savedKeys: string[]) {
  const level = getLevel(levelIdentifier);
  const words = level ? getLevelWords(level.id) : [];
  const saved = new Set(savedKeys);
  const learned = level
    ? words.filter((word) => saved.has(`${level.categoryId}:${word}`)).length
    : 0;
  const total = words.length;
  return { learned, total, pending: total - learned, complete: total > 0 && learned === total };
}

export function getUnlockedLevel(savedKeys: string[]) {
  let unlocked = 1;
  for (const level of LEVELS.slice(0, -1)) {
    if (!getLevelSignProgress(level.id, savedKeys).complete) break;
    unlocked = level.id + 1;
  }
  return unlocked;
}
