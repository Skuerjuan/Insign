"use client"

import { authClient } from "@/lib/auth/client";
import { recordSessionEnd } from "@/lib/server/profile.actions";

type RouterNavegacion = {
    push: (href: string) => void;
    refresh: () => void;
};

export default async function cerrarSesion(router: RouterNavegacion) {
    try {
        await recordSessionEnd();
    } catch (error) {
        console.error("No se pudo guardar el tiempo de la sesión", error);
    }

    await authClient.signOut();
    router.push("/auth/sign-in");
    router.refresh();
}
