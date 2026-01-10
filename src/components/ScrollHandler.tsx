'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollHandler() {
    const pathname = usePathname();

    useEffect(() => {
        // LEGACY HASH REDIRECT: If someone enters via /#something, redirect to /something
        if (pathname === '/' && window.location.hash) {
            const hash = window.location.hash.replace('#', '');
            const validRoutes = ['sistemas', 'garantia', 'sucursales', 'cotizador', 'blog'];

            if (validRoutes.includes(hash)) {
                // Remove hash and navigate to clean URL
                window.location.replace(`/${hash}`);
                return;
            }
        }

        // Map routes to section IDs for internal scrolling (SPA feel)
        const routeMap: Record<string, string> = {
            '/sistemas': 'sistemas',
            '/garantia': 'garantia',
            '/sucursales': 'sucursales',
            '/cotizador': 'cotizador',
        };

        const targetId = routeMap[pathname];

        if (targetId) {
            // Small timeout to ensure DOM is ready and layout is stable
            const timer = setTimeout(() => {
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [pathname]);

    return null;
}
