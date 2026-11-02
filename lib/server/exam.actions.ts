"use server";

import { prisma } from "@/db";
import { revalidatePath } from "next/cache";
import { getProfile, getSession } from "./profile.actions";
import { createExamPlan, EXAM_GAMES, LEVEL_GAMES, type ExamRound } from "@/lib/exam";
import { getLevel, getLevelWords } from "@/src/diccionario/diccionario";
import { getUnlockedLevel } from "@/lib/sign-progress";
import { getLocalDayNumber, registerActiveDay } from "./streak";

export async function startExam(level: number) {
  const user = await getSession();
  if (!getLevel(level)) throw new Error("Nivel no válido");
  await getProfile(user.id);
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT user_id FROM public.profiles WHERE user_id = ${user.id}::uuid FOR UPDATE`;
    const profile = await tx.profiles.findUniqueOrThrow({ where: { user_id: user.id } });
    if (level > getUnlockedLevel(profile.examenes_aprobados)) throw new Error("Nivel bloqueado");
    const completed = await tx.juegos_completados.findMany({ where: { usuario_id: user.id, nivel: level } });
    if (!LEVEL_GAMES.every((game) => completed.some((row) => row.juego === game))) {
      throw new Error("Completá los cuatro juegos antes de rendir el examen final");
    }
    // Un reinicio o una segunda pestaña invalida el intento anterior.
    await tx.examenes_intentos.updateMany({
      where: { usuario_id: user.id, estado: "activo" }, data: { estado: "cancelado" },
    });
    const plan = createExamPlan(level);
    const attempt = await tx.examenes_intentos.create({ data: { usuario_id: user.id, nivel: level, plan } });
    return { id: attempt.id, plan };
  });
}

export async function finishExamRound(id: string, round: number, mistakes: number) {
  const user = await getSession();
  if (!Number.isInteger(round) || round < 0 || !Number.isInteger(mistakes) || mistakes < 0) {
    throw new Error("Resultado no válido");
  }
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT user_id FROM public.profiles WHERE user_id = ${user.id}::uuid FOR UPDATE`;
    const attempt = await tx.examenes_intentos.findFirst({ where: { id, usuario_id: user.id } });
    if (!attempt) throw new Error("Intento no válido");
    if (attempt.estado === "aprobado") return { passed: true, failed: false, round: attempt.ronda };
    if (attempt.estado !== "activo") return { passed: false, failed: true, round: attempt.ronda };
    const plan = attempt.plan as ExamRound[];
    if (plan.some((item) => !EXAM_GAMES.includes(item.game))) {
      throw new Error("El examen cambió. Iniciá un nuevo intento");
    }
    if (mistakes > 0) {
      await tx.examenes_intentos.update({ where: { id }, data: { estado: "fallido" } });
      return { passed: false, failed: true, round: attempt.ronda };
    }
    // Reintentar un guardado por problemas de conexión no cuenta dos veces.
    if (round < attempt.ronda) return { passed: false, failed: false, round: attempt.ronda };
    if (round !== attempt.ronda) throw new Error("Terminá los juegos en orden");
    const next = round + 1;
    if (next > plan.length) throw new Error("Ronda no válida");
    const passed = next === plan.length;
    if (passed) {
      const covered = new Set(plan.flatMap((item) => item.words));
      if (!EXAM_GAMES.every((game) => plan.some((item) => item.game === game)) ||
          !getLevelWords(attempt.nivel).every((word) => covered.has(word))) {
        throw new Error("Faltan señas o juegos en el examen");
      }
      const profile = await tx.profiles.findUniqueOrThrow({ where: { user_id: user.id } });
      if (attempt.nivel > getUnlockedLevel(profile.examenes_aprobados)) throw new Error("Nivel bloqueado");
      const approved = [...new Set([...profile.examenes_aprobados, attempt.nivel])];
      const level = getLevel(attempt.nivel)!;
      const signs = [...new Set([...profile.senas_aprendidas, ...getLevelWords(level.id).map((word) => `${level.categoryId}:${word}`)])];
      const today = getLocalDayNumber();
      const streak = registerActiveDay(profile.racha, profile.ultimo_dia_activo, today, false);
      await tx.profiles.update({ where: { user_id: user.id }, data: {
        examenes_aprobados: approved, nivel: getUnlockedLevel(approved), senas_aprendidas: signs,
        racha: streak.changed ? streak.value : undefined,
        ultimo_dia_activo: today,
        dias_activos: profile.ultimo_dia_activo !== today ? { increment: 1 } : undefined,
      } });
      await tx.actividades.create({ data: { usuario_id: user.id, juego: "final", origen: "exam", nivel: level.id, errores: 0, estrellas: 3 } });
    }
    await tx.examenes_intentos.update({ where: { id }, data: { ronda: next, estado: passed ? "aprobado" : "activo" } });
    return { passed, failed: false, round: next };
  });
  for (const path of ["/menu", "/nivel", "/progreso", "/perfil"]) revalidatePath(path, "layout");
  return result;
}
