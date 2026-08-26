"use server"

import { auth } from "@/lib/auth/server";

export default async function handleChangePassword(
    currentPassword: string,
    newPassword: string,
) {
    if (!currentPassword || !newPassword) {
        return {
            success: false,
            message: "Ingresá tu contraseña actual y la nueva contraseña.",
        };
    }

    try {
        const { error } = await auth.changePassword({
            currentPassword,
            newPassword,
        });
        if (error) throw error;

        return {
            success: true,
            message: "¡Contraseña actualizada correctamente!",
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "No se pudo cambiar la contraseña.",
        };
    }
}
