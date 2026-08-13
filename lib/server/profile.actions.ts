"use server"

import { prisma } from "@/db"
import { auth } from "@/lib/auth/server"
import { redirect } from "next/navigation";

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
                dias_activos: 0,
                racha: 0,
            }
        })
    }

    return profile;
}

export async function addPoints(newPoints: number, userId: string){
    let { puntos } = await getProfile(userId);
    if(puntos == null) puntos = 0;
    const updatedProfile = await prisma.profiles.update({
        where:{
            user_id: userId,
        },
        data:{
            puntos: puntos+newPoints
        }
    });

    return updatedProfile;

}

export async function addXp(newXp: number, userId: string){
    let { experiencia, nivel } = await getProfile(userId);
    if(experiencia == null) experiencia = 0;
    if(nivel == null) nivel = 1;
    let xpSumada = experiencia+newXp;
    if(xpSumada >= 100){
        nivel++;
        xpSumada -= 100;
    }
    const updatedProfile = await prisma.profiles.update({
        where:{
            user_id: userId,
        },
        data:{
            experiencia: xpSumada,
            nivel: nivel,
        }
    });

    return updatedProfile;

}