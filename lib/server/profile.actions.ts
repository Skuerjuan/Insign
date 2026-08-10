"use server"

import { prisma } from "@/db"
import { auth } from "@/lib/auth/server"
import { redirect } from "next/navigation";
import { getLocalDayNumber, registerActiveDay } from "./streak";

export type GameName = "eleccion" | "memoria";

export async function getSession(){
    const { data: session } = await auth.getSession();
    
    if (!session?.user) {
        redirect("/auth/sign-in");
    }
    return session.user;
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

export async function completeGame(game: GameName, mistakes = 0){
    const user = await getSession();

    if (game !== "eleccion" && game !== "memoria") {
        throw new Error("Juego no válido");
    }

    const safeMistakes = Math.max(0, Math.trunc(Number(mistakes) || 0));
    const pointsAwarded = calculatePoints(game, safeMistakes);
    const today = getLocalDayNumber();

    await getProfile(user.id);

    return prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT user_id FROM public.profiles WHERE user_id = ${user.id}::uuid FOR UPDATE`;

        const profile = await tx.profiles.findUniqueOrThrow({
            where: { user_id: user.id },
        });
        const streak = registerActiveDay(profile.racha, today);

        const updatedProfile = await tx.profiles.update({
            where: { user_id: user.id },
            data: {
                puntos: profile.puntos == null
                    ? pointsAwarded
                    : { increment: pointsAwarded },
                racha: streak.changed ? streak.value : undefined,
            },
        });

        return {
            pointsAwarded,
            totalPoints: updatedProfile.puntos ?? 0,
            streak: streak.count,
        };
    });
}
