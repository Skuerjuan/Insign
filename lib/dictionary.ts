import { getLevelWords, getVideoPath, LEVELS } from "@/src/diccionario/diccionario";
import { getTextoSena } from "@/src/diccionario/textos";

export function getDictionaryLevels(profile: { examenes_aprobados: number[]; senas_aprendidas: string[] }) {
  const learned = new Set(profile.senas_aprendidas);
  return LEVELS.map((level) => {
    const unlocked = profile.examenes_aprobados.includes(level.id);
    // El servidor sólo entrega videos de señas vistas en unidades aprobadas.
    const signs = unlocked ? getLevelWords(level.id)
      .filter((word) => learned.has(`${level.categoryId}:${word}`))
      .map((word) => ({ word, label: getTextoSena(word), video: getVideoPath(level.id, word)! }))
      .sort((a, b) => a.label.localeCompare(b.label, "es")) : [];
    return { id: level.id, title: level.title, colorClass: level.colorClass, unlocked, signs };
  });
}
