import { getLevelWords } from "@/src/diccionario/diccionario";
import type { GameName } from "@/lib/server/profile.actions";

export type ExamGame = Exclude<GameName, "memoria">;
export type ExamRound = { game: ExamGame; words: string[] };
// Los cuatro juegos normales habilitan el examen; Memoria queda fuera del examen.
export const LEVEL_GAMES: GameName[] = ["memoria", "eleccion", "completar", "adivinar"];
export const EXAM_GAMES: ExamGame[] = ["eleccion", "completar", "adivinar"];
export const EXAM_LABELS: Record<ExamGame, string> = {
  eleccion: "Elección", completar: "Completar", adivinar: "Múltiple elección",
};

// Cada seña es un objetivo, no solamente una opción distractora.
// Los tres juegos se repiten hasta agotar el catálogo completo del nivel.
export function createExamPlan(level: number): ExamRound[] {
  const buckets = EXAM_GAMES.map(() => [] as string[]);
  getLevelWords(level).forEach((word, index) => buckets[index % EXAM_GAMES.length].push(word));
  const plan: ExamRound[] = [];
  while (buckets.some((words) => words.length)) {
    EXAM_GAMES.forEach((game, index) => {
      const words = buckets[index].splice(0, 5);
      if (words.length) plan.push({ game, words });
    });
  }
  return plan;
}
