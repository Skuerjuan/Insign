"use server"

import { prisma } from "@/db"
import { auth } from "@/lib/auth/server"
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocalDayNumber, registerActiveDay } from "./streak";

export type GameName = "eleccion" | "memoria";
export type GameOrigin = "menu" | "training";

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

    return profile;
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
){
    const user = await getSession();

    if (game !== "eleccion" && game !== "memoria") {
        throw new Error("Juego no válido");
    }

    const safeMistakes = Math.max(0, Math.trunc(Number(mistakes) || 0));
    const pointsAwarded = calculatePoints(game, safeMistakes);
    const today = getLocalDayNumber();

    await getProfile(user.id);

    const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT user_id FROM public.profiles WHERE user_id = ${user.id}::uuid FOR UPDATE`;

        const profile = await tx.profiles.findUniqueOrThrow({
            where: { user_id: user.id },
        });
        const streak = registerActiveDay(
            profile.racha,
            profile.ultimo_dia_activo,
            today,
            origin === "training",
        );
        const isNewActiveDay = profile.ultimo_dia_activo !== today;

        const updatedProfile = await tx.profiles.update({
            where: { user_id: user.id },
            data: {
                puntos: profile.puntos == null
                    ? pointsAwarded
                    : { increment: pointsAwarded },
                racha: streak.changed ? streak.value : undefined,
                juegos_jugados: { increment: 1 },
                dias_activos: isNewActiveDay ? { increment: 1 } : undefined,
                ultimo_dia_activo: isNewActiveDay ? today : undefined,
            },
        });

        return {
            pointsAwarded,
            totalPoints: updatedProfile.puntos ?? 0,
            streak: streak.count,
            gamesPlayed: updatedProfile.juegos_jugados,
            activeDays: updatedProfile.dias_activos,
        };
    });

    // La navegación de regreso puede reutilizar el Router Cache de Next.js.
    // Invalidamos todas las pantallas que muestran métricas del perfil para
    // que el día recién registrado aparezca apenas termina la partida.
    revalidatePath("/menu");
    revalidatePath("/perfil");
    revalidatePath("/entrenamiento");
    revalidatePath("/progreso");

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
