'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Hero() {
    const scrollToSection = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
        e.preventDefault();
        const elem = document.getElementById(id);
        elem?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div id="inicio" className="relative min-h-screen flex flex-col justify-center overflow-hidden border-b border-slate-200 dark:border-white/5 transition-colors duration-500 bg-slate-50 dark:bg-[#020617]">
            <div className="absolute inset-0 z-0">
                {/* Adaptive background */}
                <div className="absolute inset-0 bg-slate-50 dark:bg-gradient-to-b dark:from-black dark:via-[#020617] dark:to-[#0f172a]" />

                {/* Light mode specific accents */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-slate-200/50 dark:bg-[#38bdf8]/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
                    {/* Left Column: Text Content */}
                    <div className="flex-1 max-w-xl text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-block px-4 py-1.5 rounded-full bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 mb-6"
                        >
                            <span className="text-primary text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">
                                Empresa 100% Mexicana
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-secondary dark:text-white mb-6 leading-[1.1] uppercase"
                        >
                            Thermo House: <br />
                            <span className="text-primary">
                                Impermeabilización Profesional con Poliuretano.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            className="text-sm md:text-lg text-slate-600 dark:text-slate-300/90 leading-relaxed mb-10 max-w-xl mx-auto md:mx-0 font-medium"
                        >
                            Ya seas una empresa, industria u hogar, en <span className="text-secondary dark:text-white font-bold">Thermo House</span> te ofrecemos impermeabilización realizada por profesionales con más de 15 años de experiencia. Garantía de por vida* por escrito, diagnósticos serios y atención formal en varios estados de México.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                            className="flex flex-col sm:flex-row items-center md:justify-start justify-center gap-4"
                        >
                            <button
                                onClick={(e) => scrollToSection(e, 'sistemas')}
                                className="w-full sm:w-auto min-w-[150px] bg-primary hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-orange-500/25 hover:scale-[1.02] uppercase tracking-wider"
                                aria-label="Ver sistemas de impermeabilización"
                            >
                                Ver Sistemas
                            </button>

                            <button
                                onClick={(e) => scrollToSection(e, 'cotizador')}
                                className="w-full sm:w-auto min-w-[150px] px-5 py-2.5 rounded-xl text-sm font-bold text-secondary dark:text-white border-2 border-secondary/10 dark:border-white/20 hover:bg-secondary/5 dark:hover:bg-white/10 transition-all backdrop-blur-sm"
                                aria-label="Comenzar cotización"
                            >
                                Cotizar Ahora
                            </button>
                        </motion.div>
                    </div>

                    {/* Right Column: Brand Logo */}
                    <motion.div
                        initial={{ opacity: 0, x: 30, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="flex-shrink-0 hidden md:block"
                    >
                        <Image
                            src="/logo.png"
                            alt="Thermo House Logo"
                            width={300}
                            height={300}
                            priority
                            className="w-auto h-40 md:h-52 lg:h-60 filter brightness-110 drop-shadow-[0_20px_50px_rgba(255,107,38,0.3)]"
                        />
                    </motion.div>

                    {/* Mobile Logo (visible only on small screens) */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:hidden order-first mb-8"
                    >
                        <Image
                            src="/logo.png"
                            alt="Thermo House Logo"
                            width={112}
                            height={112}
                            priority
                            className="h-28 w-auto filter brightness-110 drop-shadow-xl"
                        />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
