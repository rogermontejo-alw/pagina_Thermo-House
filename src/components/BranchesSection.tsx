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
                            className="p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:shadow-primary/5 transition-all group"
                        >
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <MapPin className="w-6 h-6" />
                            </div>

                            <h3 className="text-2xl font-black text-secondary dark:text-white mb-4 uppercase tracking-tight">{branch.ciudad}</h3>

                            <div className="space-y-4">
                                {branch.direccion && (
                                    <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                        <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                                        <span>{branch.direccion}</span>
                                    </div>
                                )}
                                {branch.telefono && (
                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <Phone className="w-4 h-4 text-primary" />
                                        <span>{branch.telefono}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <Clock className="w-4 h-4 text-primary" />
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
