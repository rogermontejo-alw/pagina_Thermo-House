'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Loader2 } from 'lucide-react';
import { getLocations } from '@/app/actions/admin-locations';
import { Location } from '@/types';

export default function BranchesSection() {
    const [branches, setBranches] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBranches = async () => {
            const res = await getLocations();
            if (res.success && res.data) {
                // Filter only locations marked as branches
                setBranches(res.data.filter((l: Location) => l.is_branch));
            }
            setLoading(false);
        };
        fetchBranches();
    }, []);

    if (loading) {
        return (
            <div className="py-20 transition-colors duration-500">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto mb-16 animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[500px] bg-slate-100 dark:bg-slate-900/50 rounded-[2.5rem] animate-pulse border border-slate-200 dark:border-slate-800" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (branches.length === 0) return null;

    return (
        <section id="sucursales" className="py-2 transition-colors duration-500">
            <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-black text-secondary dark:text-white uppercase tracking-tighter">Nuestras Sucursales</h2>
                    <p className="text-slate-500 dark:text-slate-300 font-medium max-w-2xl mx-auto">
                        Estamos presentes en las ciudades más importantes del sureste para brindarte protección térmica de élite.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {branches.map((branch, idx) => (
                        <motion.div
                            key={branch.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-primary/5 transition-all group"
                        >
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <MapPin className="w-6 h-6" />
                            </div>

                            <h3 className="text-2xl font-black text-secondary dark:text-white mb-4 uppercase tracking-tight">{branch.ciudad}</h3>

                            <div className="space-y-6">
                                {branch.direccion && (
                                    <div className="flex items-start gap-4 text-sm text-slate-600 dark:text-slate-300">
                                        <MapPin className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                                        <span>{branch.direccion}</span>
                                    </div>
                                )}

                                {branch.telefono && (
                                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                                        <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                                        <a href={`tel:${branch.telefono.replace(/\D/g, '')}`} className="font-bold hover:text-primary transition-colors">
                                            {branch.telefono}
                                        </a>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                    <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                                    <span>Lun - Vie: 9:00 - 18:00</span>
                                </div>

                                {/* Social Icons Row (Orange Icons Only) */}
                                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex gap-3">
                                    {/* Voice Call */}
                                    {branch.telefono && (
                                        <a
                                            href={`tel:${branch.telefono.replace(/\D/g, '')}`}
                                            className="w-11 h-11 rounded-2xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary transition-all hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20"
                                            title="Llamada de voz"
                                        >
                                            <Phone className="w-5 h-5" />
                                        </a>
                                    )}

                                    {/* WhatsApp */}
                                    {(() => {
                                        const waNumber = branch.redes_sociales?.whatsapp || branch.telefono;
                                        if (!waNumber) return null;
                                        return (
                                            <a
                                                href={`https://wa.me/521${waNumber.replace(/\D/g, '')}?text=${encodeURIComponent("Hola, quisiera más información.")}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-11 h-11 rounded-2xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary transition-all hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20"
                                                title="WhatsApp"
                                            >
                                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                </svg>
                                            </a>
                                        );
                                    })()}

                                    {/* Facebook */}
                                    {branch.redes_sociales?.facebook && (
                                        <a
                                            href={branch.redes_sociales.facebook.startsWith('http') ? branch.redes_sociales.facebook : `https://facebook.com/${branch.redes_sociales.facebook}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-11 h-11 rounded-2xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary transition-all hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20"
                                            title="Facebook"
                                        >
                                            <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                            </svg>
                                        </a>
                                    )}

                                    {/* Instagram */}
                                    {branch.redes_sociales?.instagram && (
                                        <a
                                            href={branch.redes_sociales.instagram.startsWith('http') ? branch.redes_sociales.instagram : `https://instagram.com/${branch.redes_sociales.instagram}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-11 h-11 rounded-2xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-primary transition-all hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/20"
                                            title="Instagram"
                                        >
                                            <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.246 2.242 1.308 3.607.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.246-3.607 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.246-2.242-1.308-3.607-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.246 3.607-1.308 1.266-.058 1.646-.07 4.85-.07M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.668-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {branch.google_maps_link && (
                                <a
                                    href={branch.google_maps_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-8 block w-full py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-center text-xs font-black uppercase tracking-widest text-secondary dark:text-white hover:border-primary dark:hover:border-primary hover:text-primary transition-all"
                                >
                                    Ver Ubicación
                                </a>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
