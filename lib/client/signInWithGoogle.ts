'use client';

import { authClient } from '@/lib/auth/client';


export default async function signInWithGoogle() {
    const { data, error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: new URL('/menu', window.location.origin).toString(),
        newUserCallbackURL: new URL('/menu', window.location.origin).toString(),
        errorCallbackURL: new URL('/auth/sign-in', window.location.origin).toString(),
        disableRedirect: true,
    });

    if (error) {
        console.error(error);
        throw new Error(error.message || 'Failed to sign in with Google');
    }

    if (!data?.url) {
        throw new Error('No se recibió el enlace para continuar con Google.');
    }

    window.location.assign(data.url);
}
