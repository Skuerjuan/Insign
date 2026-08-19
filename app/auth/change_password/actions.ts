"use server"

import { auth } from "@/lib/auth/server";

export default async function handleChangePassword(
    currentPassword: string,
    newPassword: string,
) {
    if (!currentPassword || !newPassword) {
        return {
            success: false,
            message: "Enter your current and new password.",
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
            message: "Password changed successfully!",
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Password change failed",
        };
    }
}
