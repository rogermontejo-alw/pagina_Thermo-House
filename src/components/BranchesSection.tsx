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
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-300 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest">Cargando sucursales...</p>
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

                            <div className="space-y-4">
                                {branch.direccion && (
                                    <div className="flex items-start gap-4 text-sm text-slate-600 dark:text-slate-300">
                                        <MapPin className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                                        <span>{branch.direccion}</span>
                                    </div>
                                )}
                                {branch.telefono && (
                                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                        <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                                        <div className="flex items-center gap-3">
                                            <a
                                                href={`tel:${branch.telefono.replace(/\D/g, '')}`}
                                                className="hover:text-primary transition-colors font-bold"
                                            >
                                                {branch.telefono}
                                            </a>
                                            <a
                                                href={`https://wa.me/521${branch.telefono.replace(/\D/g, '')}?text=${encodeURIComponent("Hola, quisiera más información.")}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-green-500 hover:text-green-600 transition-transform hover:scale-110"
                                                aria-label="Contactar por WhatsApp"
                                            >
                                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                    <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                                    <span>Lun - Vie: 9:00 - 18:30</span>
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
