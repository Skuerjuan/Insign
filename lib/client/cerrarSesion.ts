"use client"

import { authClient } from "@/lib/auth/client";

type RouterNavegacion = {
    push: (href: string) => void;
    refresh: () => void;
};

export default async function cerrarSesion(router: RouterNavegacion) {
    try {
        const response = await fetch("/api/session/end", { method: "POST" });

        if (!response.ok) {
            throw new Error("No se pudo guardar el tiempo de la sesión");
        }
    } catch (error) {
        console.error("No se pudo guardar el tiempo de la sesión", error);
    }

    await authClient.signOut();
    router.push("/auth/sign-in");
    router.refresh();
}
