import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Solo proteger la ruta /admin (pero permitir /admin/login)
    if (request.nextUrl.pathname === '/admin') {
        const sessionToken = request.cookies.get('admin_session')?.value;
        const adminPasswordEnv = process.env.ADMIN_PASSWORD;

        // Si no hay token de sesión, redirigir al login
        if (!sessionToken || sessionToken !== adminPasswordEnv) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin',
};
