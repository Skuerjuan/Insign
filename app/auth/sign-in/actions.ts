'use server';

import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

type AuthError = {
    code?: string;
    message?: string;
};

const TRANSIENT_AUTH_ERROR = /NETWORK_|timed out|timeout|connect|fetch|socket/i;
const MAX_SIGN_IN_ATTEMPTS = 3;

function isTransientAuthError(error: AuthError) {
    return TRANSIENT_AUTH_ERROR.test(`${error.code ?? ''} ${error.message ?? ''}`);
}

function waitBeforeRetry(attempt: number) {
    return new Promise((resolve) => setTimeout(resolve, 350 * attempt));
}

export async function signInWithEmail(
    _prevState: { error: string } | null,
    formData: FormData
) {
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    let lastError: AuthError | null = null;
    let signedIn = false;

    for (let attempt = 1; attempt <= MAX_SIGN_IN_ATTEMPTS; attempt += 1) {
        try {
            const { error } = await auth.signIn.email({ email, password });

            if (!error) {
                signedIn = true;
                break;
            }

            lastError = error;
        } catch (error) {
            lastError = error instanceof Error
                ? { message: error.message }
                : { message: 'Error de conexión desconocido' };
        }

        if (!isTransientAuthError(lastError) || attempt === MAX_SIGN_IN_ATTEMPTS) {
            break;
        }

        await waitBeforeRetry(attempt);
    }

    if (signedIn) redirect('/menu');

    console.error('No se pudo iniciar sesión', lastError);

    if (lastError && isTransientAuthError(lastError)) {
        return {
            error: 'El servidor de autenticación está tardando en responder. Intenta nuevamente en unos segundos.',
        };
    }

    return { error: lastError?.message || 'No se pudo iniciar sesión. Verifica tus datos.' };
}

export async function signInWithGoogle() {
    const { data, error } = await auth.signIn.social({
        provider: 'google',
        callbackURL: '/menu',
    });

    if (error) {
        console.error(error);
        throw new Error(error.message || 'Failed to sign in with Google');
    }

    if (data?.url) {
        redirect(data.url);
    }

    redirect('/menu');
}
