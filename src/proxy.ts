import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    // Solo proteger la ruta /admin (pero permitir /admin/login)
    if (request.nextUrl.pathname === '/admin') {
        const sessionToken = request.cookies.get('admin_session')?.value;

        // Si no hay token de sesión (el email del admin), redirigir al login
        if (!sessionToken) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin',
};
