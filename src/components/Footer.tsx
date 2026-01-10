'use client';

import { useState, useEffect } from 'react';
import { getLocations } from '@/app/actions/admin-locations';
import { Location } from '@/types';
import Image from 'next/image';

import Link from 'next/link';
import packageInfo from '../../package.json';

export default function Footer() {
    const [branches, setBranches] = useState<Location[]>([]);

    useEffect(() => {
        const fetchBranches = async () => {
            const res = await getLocations();
            if (res.success && res.data) {
                // Filter only locations marked as branches
                setBranches(res.data.filter((l: Location) => l.is_branch));
            }
        };
        fetchBranches();
    }, []);

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        const routeToId: Record<string, string> = {
            '/sistemas': 'sistemas',
            '/garantia': 'garantia',
            '/cotizador': 'cotizador',
            '/sucursales': 'sucursales',
            '/blog': 'blog'
        };
        const targetId = routeToId[href];

        if (window.location.pathname === '/' && targetId) {
            e.preventDefault();
            const elem = document.getElementById(targetId);
            if (elem) {
                elem.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <footer className="bg-slate-950 py-20 border-t border-white/5 font-sans rounded-[2rem] md:rounded-t-[4rem] md:rounded-b-none w-full mb-8 md:mb-0 scroll-snap-align-end text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            <div className="max-w-5xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Image
                                src="/logo.png"
                                alt="Thermo House"
                                width={32}
                                height={32}
                                className="h-8 w-auto filter brightness-0 invert"
                            />
                            <span className="text-xl font-black uppercase tracking-tighter">Thermo<span className="text-primary">House</span></span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Líderes en aislamiento y protección térmica de alta gama para la Península de Yucatán.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Navegación</h2>
                        <ul className="space-y-3 text-slate-400 text-sm font-bold uppercase tracking-widest">
                            <li><Link href="/sistemas" onClick={(e) => handleNavigation(e, '/sistemas')} className="hover:text-primary transition-colors">Sistemas</Link></li>
                            <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                            <li><Link href="/garantia" onClick={(e) => handleNavigation(e, '/garantia')} className="hover:text-primary transition-colors">Garantía</Link></li>
                            <li><Link href="/sucursales" onClick={(e) => handleNavigation(e, '/sucursales')} className="hover:text-primary transition-colors">Sucursales</Link></li>
                            <li><Link href="/cotizador" onClick={(e) => handleNavigation(e, '/cotizador')} className="hover:text-primary transition-colors">Cotizador</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Sedes</h2>
                        <div className="space-y-3 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                            {branches.length > 0 ? (
                                branches.map(branch => (
                                    <Link key={branch.id} href="/sucursales" onClick={(e) => handleNavigation(e, '/sucursales')} className="block hover:text-primary transition-colors">
                                        {branch.ciudad}, {branch.estado}
                                    </Link>
                                ))
                            ) : (
                                <div className="space-y-3">
                                    <Link href="/sucursales" onClick={(e) => handleNavigation(e, '/sucursales')} className="block hover:text-primary transition-colors">Mérida, Yucatán</Link>
                                    <Link href="/sucursales" onClick={(e) => handleNavigation(e, '/sucursales')} className="block hover:text-primary transition-colors">Cancún, Q. Roo</Link>
                                    <Link href="/sucursales" onClick={(e) => handleNavigation(e, '/sucursales')} className="block hover:text-primary transition-colors">Playa del Carmen, Q. Roo</Link>
                                    <Link href="/sucursales" onClick={(e) => handleNavigation(e, '/sucursales')} className="block hover:text-primary transition-colors">Tulum, Q. Roo</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <p>© {new Date().getFullYear()} Thermo House. Todos los derechos reservados.</p>
                        <span className="px-2 py-0.5 bg-white/5 rounded-md text-[8px] border border-white/10 text-slate-600">v{packageInfo.version} - {new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }).replace('.', '').toUpperCase()}</span>
                    </div>
                    <div className="flex gap-8">
                        <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
                        <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
