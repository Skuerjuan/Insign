
"use server"

import { prisma } from "@/db"
import { auth } from "@/lib/auth/server"
import { redirect } from "next/navigation";
import { getLevel, getLevelWords, LEVELS } from "@/src/diccionario/diccionario";
import { getSignProgress, getUnlockedLevel } from "@/lib/sign-progress";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/prisma/generated/client";
import { getLocalDayNumber, getWeeklyActivity, registerActiveDay } from "./streak";

export type GameName = "eleccion" | "memoria" | "adivinar" | "completar";
export type GameOrigin = "menu" | "training" | "exam";

const GAMES_PER_LEVEL = 4;

async function calculateAchievementSnapshot(
    db: Prisma.TransactionClient | typeof prisma,
    userId: string,
) {
    const [profile, completedGames, activities] = await Promise.all([
        db.profiles.findUniqueOrThrow({ where: { user_id: userId } }),
        db.juegos_completados.findMany({ where: { usuario_id: userId } }),
        db.actividades.findMany({
            where: { usuario_id: userId },
            orderBy: { completado_at: "asc" },
        }),
    ]);

    const completedByLevel = new Map<number, Set<string>>();
    for (const item of completedGames) {
        const games = completedByLevel.get(item.nivel) ?? new Set<string>();
        games.add(item.juego);
        completedByLevel.set(item.nivel, games);
    }

    const completedLevels = new Set(
        [...completedByLevel]
            .filter(([, games]) => games.size >= GAMES_PER_LEVEL)
            .map(([level]) => level),
    );
    const perfectGamesByLevel = new Map<number, Set<string>>();
    for (const activity of activities) {
        if (activity.origen !== "menu" || activity.nivel === null || activity.errores !== 0) continue;
        const games = perfectGamesByLevel.get(activity.nivel) ?? new Set<string>();
        games.add(activity.juego);
        perfectGamesByLevel.set(activity.nivel, games);
    }

    const learnedSigns = getSignProgress(profile.senas_aprendidas).learned;
    const completedTopics = completedLevels.size;
    const weeklyActivity = getWeeklyActivity(
        profile.racha,
        profile.ultimo_dia_activo,
    ).count;
    const unlocked = new Set<string>();

    if (profile.juegos_jugados >= 1) unlocked.add("primeras-senas");
    if (activities.some((activity) => activity.origen === "training")) unlocked.add("manos-a-la-obra");
    if (completedTopics >= 1) unlocked.add("pequeno-explorador");
    if (learnedSigns >= 10) unlocked.add("aprendiz");
    if (activities.some((activity) => activity.juego === "memoria" && activity.errores === 0)) unlocked.add("memoria-de-elefante");
    if (learnedSigns >= 25) unlocked.add("gran-aprendiz");
    if (learnedSigns >= 50) unlocked.add("maestro-de-senas");
    if (activities.length >= 3) unlocked.add("racha-imparable");
    if ([...perfectGamesByLevel.values()].some((games) => games.size >= GAMES_PER_LEVEL)) unlocked.add("todo-correcto");
    if (activities.some((activity) => activity.estrellas === 3)) unlocked.add("estrella-del-dia");
    if (completedTopics >= 5) unlocked.add("explorador-de-temas");
    if (activities.some((activity) => activity.origen === "exam" && activity.errores <= 2)) unlocked.add("lo-logre");
    if (completedTopics >= LEVELS.length) unlocked.add("campeon-de-insign");
    if (weeklyActivity >= 7) unlocked.add("on-fire");

    return { unlocked: [...unlocked], learnedSigns, completedTopics };
}

export async function getSession(){
    const { data: session } = await auth.getSession();
    
    if (!session?.user) {
        redirect("/auth/sign-in");
    }
    return session.user;
}

async function getFullSession() {
    const { data } = await auth.getSession();

    if (!data?.user || !data.session) {
        throw new Error("No hay una sesión activa");
    }

    return data;
}

export async function getProfile(userId: string){
    let profile = await prisma.profiles.findUnique({
        where: {
            user_id: userId
        }
    })

    if(profile == null){
        profile = await prisma.profiles.create({
            data: {
                user_id: userId,
                puntos: 0,
                premios: 0,
                juegos_jugados: 0,
                dias_activos: 0,
                tiempo_total_segundos: 0,
            }
        })
    }

    // El acceso depende de las señas vistas, también para perfiles anteriores
    // que pudieron avanzar con el criterio de completar cuatro juegos.
    return { ...profile, nivel: getUnlockedLevel(profile.senas_aprendidas) };
}

export async function getLearnedSignsCount(userId: string) {
    const profile = await getProfile(userId);
    return getSignProgress(profile.senas_aprendidas).learned;
}

export async function recordLearnedSign(levelIdentifier: number | string, word: string) {
    const user = await getSession();
    const level = getLevel(levelIdentifier);
    if (!level || !getLevelWords(level.id).includes(word)) {
        throw new Error("Seña no válida para este nivel");
    }
    await getProfile(user.id);
    const key = `${level.categoryId}:${word}`;
    await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT user_id FROM public.profiles WHERE user_id = ${user.id}::uuid FOR UPDATE`;
        const profile = await tx.profiles.findUniqueOrThrow({ where: { user_id: user.id } });
        if (profile.senas_aprendidas.includes(key)) return;
        const unlockedLevel = getUnlockedLevel([...profile.senas_aprendidas, key]);
        await tx.profiles.update({
            where: { user_id: user.id },
            data: { senas_aprendidas: { push: key }, nivel: unlockedLevel },
        });
    });
    revalidatePath("/progreso");
    revalidatePath("/perfil");
    return true;
}

export async function getLogros() {
    return prisma.logros.findMany({
        orderBy: { id: "asc" },
    });
}

export async function getAchievementProgress(userId: string) {
    await getProfile(userId);
    const snapshot = await calculateAchievementSnapshot(prisma, userId);
    const logros = await getLogros();

    if (snapshot.unlocked.length > 0) {
        await prisma.logros_desbloqueados.createMany({
            data: snapshot.unlocked.map((logro_id) => ({ usuario_id: userId, logro_id })),
            skipDuplicates: true,
        });
    }

    const unlockedRows = await prisma.logros_desbloqueados.findMany({
        where: { usuario_id: userId },
        select: { logro_id: true, desbloqueado_at: true },
    });
    const unlockedDates = new Map(
        unlockedRows.map((row) => [row.logro_id, row.desbloqueado_at]),
    );
    const totalSigns = getSignProgress([]).total;

    return {
        learnedSigns: snapshot.learnedSigns,
        totalSigns,
        completedTopics: snapshot.completedTopics,
        achievements: logros.map((logro) => ({
            id: logro.id,
            name: logro.name,
            description: logro.description,
            unlocked: unlockedDates.has(logro.id),
            unlockedAt: unlockedDates.get(logro.id) ?? null,
        })),
    };
}

export async function getCompletedGames(userId: string, level: number) {
    const completed = await prisma.juegos_completados.findMany({
        where: {
            usuario_id: userId,
            nivel: level,
        },
        select: { juego: true },
    });

    return completed.map(({ juego }) => juego as GameName);
}

function calculatePoints(game: GameName, mistakes: number) {
    if (game === "memoria") return 15;

    if (mistakes <= 0) return 15;
    if (mistakes === 1) return 10;
    if (mistakes === 2) return 5;
    return 0;
}

export async function completeGame(
    game: GameName,
    mistakes = 0,
    origin: GameOrigin = "menu",
    level?: number,
){
    const user = await getSession();

    if (!["eleccion", "memoria", "adivinar", "completar"].includes(game)) {
        throw new Error("Juego no válido");
    }

    const safeLevel = Number.isInteger(level) && Number(level) >= 1 && Number(level) <= 9
        ? Number(level)
        : undefined;

    const safeMistakes = Math.max(0, Math.trunc(Number(mistakes) || 0));
    const pointsAwarded = origin === "training" ? 0 : calculatePoints(game, safeMistakes);
    const starsAwarded = safeMistakes === 0 ? 3 : safeMistakes === 1 ? 2 : safeMistakes === 2 ? 1 : 0;
    const today = getLocalDayNumber();

    await getProfile(user.id);

    const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT user_id FROM public.profiles WHERE user_id = ${user.id}::uuid FOR UPDATE`;

        const profile = await tx.profiles.findUniqueOrThrow({
            where: { user_id: user.id },
        });
        const unlockedLevel = getUnlockedLevel(profile.senas_aprendidas);
        if (origin !== "training" && safeLevel && safeLevel > unlockedLevel) {
            throw new Error("Tenés que ver todas las señas del nivel anterior para avanzar");
        }
        const streak = registerActiveDay(
            profile.racha,
            profile.ultimo_dia_activo,
            today,
            origin === "training",
        );
        const isNewActiveDay = profile.ultimo_dia_activo !== today;

        let updatedProfile = await tx.profiles.update({
            where: { user_id: user.id },
            data: {
                nivel: unlockedLevel,
                puntos: profile.puntos == null
                    ? pointsAwarded
                    : { increment: pointsAwarded },
                racha: streak.changed ? streak.value : undefined,
                juegos_jugados: { increment: 1 },
                dias_activos: isNewActiveDay ? { increment: 1 } : undefined,
                ultimo_dia_activo: isNewActiveDay ? today : undefined,
            },
        });

        if (origin === "menu" && safeLevel) {
            await tx.juegos_completados.upsert({
                where: {
                    usuario_id_nivel_juego: {
                        usuario_id: user.id,
                        nivel: safeLevel,
                        juego: game,
                    },
                },
                update: { completado_at: new Date() },
                create: {
                    usuario_id: user.id,
                    nivel: safeLevel,
                    juego: game,
                },
            });
        }

        await tx.actividades.create({
            data: {
                usuario_id: user.id,
                juego: game,
                origen: origin,
                nivel: safeLevel,
                errores: safeMistakes,
                estrellas: starsAwarded,
            },
        });

        const achievementSnapshot = await calculateAchievementSnapshot(tx, user.id);
        if (achievementSnapshot.unlocked.length > 0) {
            await tx.logros_desbloqueados.createMany({
                data: achievementSnapshot.unlocked.map((logro_id) => ({
                    usuario_id: user.id,
                    logro_id,
                })),
                skipDuplicates: true,
            });
        }
        const achievementCount = await tx.logros_desbloqueados.count({
            where: { usuario_id: user.id },
        });
        if (updatedProfile.premios !== achievementCount) {
            updatedProfile = await tx.profiles.update({
                where: { user_id: user.id },
                data: { premios: achievementCount },
            });
        }

        return {
            pointsAwarded,
            starsAwarded,
            totalPoints: updatedProfile.puntos ?? 0,
            streak: streak.count,
            gamesPlayed: updatedProfile.juegos_jugados,
            activeDays: updatedProfile.dias_activos,
        };
    });

    return result;
}

export async function recordSessionEnd() {
    const { user, session } = await getFullSession();
    const startedAt = new Date(session.createdAt);
    const endedAt = new Date();
    const elapsedSeconds = Math.max(
        0,
        Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
    );

    await getProfile(user.id);

    return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT user_id FROM public.profiles WHERE user_id = ${user.id}::uuid FOR UPDATE`;

        const alreadyRecorded = await tx.sesiones_contabilizadas.findUnique({
            where: { session_id: session.id },
        });

        if (alreadyRecorded) {
            const profile = await tx.profiles.findUniqueOrThrow({
                where: { user_id: user.id },
            });
            return profile.tiempo_total_segundos;
        }

        await tx.sesiones_contabilizadas.create({
            data: {
                session_id: session.id,
                usuario_id: user.id,
                inicio: startedAt,
                fin: endedAt,
                segundos: elapsedSeconds,
            },
        });

        const profile = await tx.profiles.update({
            where: { user_id: user.id },
            data: {
                tiempo_total_segundos: { increment: elapsedSeconds },
            },
        });

        return profile.tiempo_total_segundos;
    });
}
