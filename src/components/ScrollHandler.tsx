'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function ScrollHandler() {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // Handle Hash Redirection (Legacy)
        if (pathname === '/' && window.location.hash) {
            const hash = window.location.hash.replace('#', '');
            const validRoutes = ['sistemas', 'garantia', 'sucursales', 'cotizador', 'blog'];

            if (validRoutes.includes(hash)) {
                // We use replace instead of push to avoid history bloat
                router.replace(`/${hash}`);
                return;
            }
        }

        const routeMap: Record<string, string> = {
            '/': 'inicio',
            '/sistemas': 'sistemas',
            '/metodo': 'metodo',
            '/garantia': 'garantia',
            '/sucursales': 'sucursales',
            '/cotizador': 'cotizador',
        };

        const targetId = routeMap[pathname];

        if (targetId) {
            const scrollToElement = () => {
                const element = document.getElementById(targetId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (Math.abs(rect.top) > 5) {
                        element.scrollIntoView({
                            behavior: pathname === '/' && !window.location.hash ? 'auto' : 'smooth',
                            block: 'start'
                        });
                    }
                    return true;
                }
                return false;
            };

            // Delay execution slightly to ensure DOM is ready and avoid "update while rendering" errors
            const timeoutId = setTimeout(() => {
                if (!scrollToElement()) {
                    let attempts = 0;
                    const intervalId = setInterval(() => {
                        if (scrollToElement() || attempts > 10) {
                            clearInterval(intervalId);
                        }
                        attempts++;
                    }, 100);
                }
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    }, [pathname, router]);

    return null;
}
