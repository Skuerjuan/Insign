"use client"

import { authClient } from "@/lib/auth/client"

export default async function updateFoto(foto: string){
    const { error } = await authClient.updateUser({
        image: foto,
    });
    if(error){
        console.error(error);
    }
}