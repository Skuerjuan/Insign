'use client';

import { authClient } from '@/lib/auth/client';

export default async function signInWithGoogle() {
    const appOrigin = window.location.origin;

    try {
        const { error } = await authClient.signIn.social({
            provider: 'google',
            callbackURL: `${appOrigin}/menu`,
            errorCallbackURL: `${appOrigin}/auth/sign-in`,
        });

        if (error) {
            console.error('Google sign-in error:', error);
        }
    } catch (error) {
        console.error('Google sign-in error:', error);
    }
}
