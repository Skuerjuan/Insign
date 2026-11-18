import { getLevelWords, getVideoPath, LEVELS } from "@/src/diccionario/diccionario";
import { getTextoSena } from "@/src/diccionario/textos";
import { getUnlockedLevel } from "@/lib/sign-progress";

export function getDictionaryLevels(profile: { examenes_aprobados: number[] }) {
  const unlockedLevel = getUnlockedLevel(profile.examenes_aprobados);
  return LEVELS.map((level) => {
    const unlocked = level.id <= unlockedLevel;
    // Usa el mismo desbloqueo que los juegos y permite consultar toda la unidad.
    const signs = unlocked ? getLevelWords(level.id)
      .map((word) => ({ word, label: getTextoSena(word), video: getVideoPath(level.id, word)! }))
      .sort((a, b) => a.label.localeCompare(b.label, "es")) : [];
    return { id: level.id, title: level.title, colorClass: level.colorClass, unlocked, signs };
  });
}
