"use server"

import { auth } from "@/lib/auth/server";

export default async function handleVerify(email: string, code: string){
    if (!email || !code) {
        return {
            success: false,
            message: 'Enter your email address and verification code.',
        };
    }

    try {
        const { error } = await auth.emailOtp.verifyEmail({
            email,
            otp: code,
        });
        if (error) throw error;

        return {
            success: true,
            message: 'Email verified! You can now sign in.',
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'An error occurred',
        };
    }
};
