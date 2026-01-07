import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /th-manager paths, but EXCLUDE the login page itself
    // to avoid infinite redirection loops
    if (pathname.startsWith('/th-manager') && pathname !== '/th-manager/login') {
        const session = request.cookies.get('admin_session');

        if (!session) {
            // Redirect to login if no session cookie is found
            const loginUrl = new URL('/th-manager/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ['/th-manager/:path*'],
};
