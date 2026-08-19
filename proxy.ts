import { auth } from '@/lib/auth/server';

export default auth.middleware({
    loginUrl: '/auth/sign-in',
});

export const config = {
    matcher: [
        '/menu',
        '/entrenamiento/:path*',
        '/progreso/:path*',
        '/perfil/:path*',
        '/configuracion/:path*',
        '/juego-eleccion/:path*',
        '/juego-memoria/:path*',
        '/account/:path*',
    ],
};