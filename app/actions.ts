"use server"

import { prisma } from "@/db"
     
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