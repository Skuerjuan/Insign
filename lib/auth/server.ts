import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET!,
        // OAuth vuelve desde otro sitio; la cookie de desafío debe viajar
        // durante esa navegación para que el middleware pueda completar la sesión.
        sameSite: 'lax',
    },
});
