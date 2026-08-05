"use client"

import { authClient } from "@/lib/auth/client";

type RouterNavegacion = {
    push: (href: string) => void;
    refresh: () => void;
};

export default async function cerrarSesion(router: RouterNavegacion) {
    await authClient.signOut();
    router.push("/auth/sign-in");
    router.refresh();
}
