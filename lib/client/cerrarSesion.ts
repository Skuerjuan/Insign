"use client"

import { authClient } from "@/lib/auth/client";

export default async function cerrarSesion(router:any) {
    await authClient.signOut();
    router.push("/auth/sign-in");
    router.refresh();
}