'use client';

import { authClient } from '@/lib/auth/client';


export default async function signInWithGoogle() {
    const { error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/menu',
    });

    if (error) {
        console.error(error);
        throw new Error(error.message || 'Failed to sign in with Google');
    }
}