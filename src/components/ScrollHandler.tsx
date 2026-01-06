'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollHandler() {
    const pathname = usePathname();

    useEffect(() => {
        // Map routes to section IDs
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
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [pathname]);

    return null;
}
