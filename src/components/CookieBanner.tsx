'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, ShieldCheck } from 'lucide-react';

export default function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if consent was already given
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Show after a short delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'granted');
        window.dispatchEvent(new Event('storage'));
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        window.dispatchEvent(new Event('storage'));
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[100]"
                >
                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-7 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden relative group">
                        {/* Decorative background element */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                        <div className="relative flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Cookie className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-secondary dark:text-white uppercase tracking-tight">Experiencia Optimizada</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <ShieldCheck className="w-3 h-3 text-green-500" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navegación Privada & Segura</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                En <span className="text-secondary dark:text-white font-bold">Thermohouse</span> utilizamos cookies propias y de socios estratégicos para personalizar tu experiencia, optimizar el rendimiento de la web y brindarte asesoría técnica personalizada.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                                <button
                                    onClick={handleAccept}
                                    className="flex-1 bg-secondary dark:bg-primary text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-secondary/10 dark:shadow-primary/20"
                                >
                                    Aceptar Todo
                                </button>
                                <button
                                    onClick={handleDecline}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold"
                                >
                                    Solo Esenciales
                                </button>
                            </div>

                            <p className="text-[9px] text-center text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em] font-bold">
                                Thermo House México &copy; 2026
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
