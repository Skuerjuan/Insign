import { LEVELS } from "@/src/diccionario/diccionario";

const signKeys = new Set(LEVELS.flatMap((level) =>
  level.palabras.map((word) => `${level.categoryId}:${word}`)
));

export function getSignProgress(savedKeys: string[]) {
  const learned = new Set(savedKeys.filter((key) => signKeys.has(key))).size;
  const total = signKeys.size;
  return { learned, total, pending: total - learned, percent: total ? learned / total * 100 : 0 };
}
