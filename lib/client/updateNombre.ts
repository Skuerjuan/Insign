"use client"

import { authClient } from "@/lib/auth/client"

export default async function updateNombre(nombre: string){
    const { error } = await authClient.updateUser({
        name: nombre,
    });
    if(error){
        console.error(error);
    }
}