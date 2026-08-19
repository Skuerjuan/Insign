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

export async function handleResend(email: string) {
    if (!email) {
        return {
            success: false,
            message: 'Enter your email address to resend the verification code.',
        };
    }

    try {
        const { error } = await auth.emailOtp.sendVerificationOtp({
            email,
            type: 'email-verification',
        });
        if (error) throw error;

        return {
            success: true,
            message: 'Verification code sent! Check your inbox.',
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'An error occurred',
        };
    }
}
