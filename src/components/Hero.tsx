'use client';
import { motion } from 'framer-motion';

export default function Hero() {
    const scrollToSection = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
        e.preventDefault();
        const elem = document.getElementById(id);
        elem?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="dark-section relative min-h-screen flex flex-col justify-center overflow-hidden border-b border-white/5">
            <div className="absolute inset-0 z-0">
                {/* Gradiente sutil Dark Navy consistente con Branding */}
                <div className="absolute inset-0 bg-gradient-to-b from-secondary via-[#1e293b] to-[#0f172a]" />

                {/* Acentos de luz sutiles para profundidad premium */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-[#38bdf8]/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-balance font-sans">
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-3xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 md:mb-8"
                >
                    La Única Inversión que <br />
                    <span className="text-primary">
                        Dura para Siempre.
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="mt-4 md:mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-300 leading-relaxed"
                >
                    Protección de por vida para su hogar. Nuestros sistemas de impermeabilización y aislamiento térmico ofrecen una barrera impenetrable.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    {/* Botón Principal (Primary Action) - Width Auto consistente */}
                    <button
                        onClick={(e) => scrollToSection(e, 'sistemas')}
                        className="w-full sm:w-auto min-w-[200px] bg-primary hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all shadow-lg shadow-orange-500/25 hover:scale-[1.02]"
                    >
                        Descubre Nuestros Sistemas
                    </button>

                    {/* Botón Secundario (Ghost/Outline para balance) */}
                    <button
                        onClick={(e) => scrollToSection(e, 'cotizador')}
                        className="w-full sm:w-auto min-w-[200px] px-8 py-4 rounded-lg text-lg font-medium text-white border border-white/20 hover:bg-white/5 transition-all"
                    >
                        Solicitar Cotización
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
