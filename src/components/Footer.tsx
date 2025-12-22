'use client';

import { useState, useEffect } from 'react';
import { getLocations } from '@/app/actions/admin-locations';
import { Location } from '@/types';

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

    return (
        <footer className="bg-slate-950 py-20 border-t border-white/5 font-sans rounded-t-[3rem] scroll-snap-align-end text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            <div className="max-w-5xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <img src="/logo.png" alt="Thermo House" className="h-8 w-auto filter brightness-0 invert" />
                            <span className="text-xl font-black uppercase tracking-tighter">Thermo<span className="text-primary">House</span></span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Líderes en aislamiento y protección térmica de alta gama para la Península de Yucatán.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Navegación</h4>
                        <ul className="space-y-3 text-slate-400 text-sm font-bold uppercase tracking-widest">
                            <li><a href="#sistemas" className="hover:text-primary transition-colors">Sistemas</a></li>
                            <li><a href="#garantia" className="hover:text-primary transition-colors">Garantía</a></li>
                            <li><a href="#sucursales" className="hover:text-primary transition-colors">Sucursales</a></li>
                            <li><a href="#cotizador" className="hover:text-primary transition-colors">Cotizador</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Sedes</h4>
                        <div className="space-y-3 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                            {branches.length > 0 ? (
                                branches.map(branch => (
                                    <p key={branch.id}>{branch.ciudad}, {branch.estado}</p>
                                ))
                            ) : (
                                <>
                                    <p>Mérida, Yucatán</p>
                                    <p>Cancún, Q. Roo</p>
                                    <p>Playa del Carmen, Q. Roo</p>
                                    <p>Tulum, Q. Roo</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    <p>© {new Date().getFullYear()} Thermo House. Todos los derechos reservados.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-white transition-colors">Términos</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
