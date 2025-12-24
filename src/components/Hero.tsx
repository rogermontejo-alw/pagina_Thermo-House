import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Hero() {
    const scrollToSection = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
        e.preventDefault();
        const elem = document.getElementById(id);
        elem?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div id="inicio" className="dark-section relative min-h-screen flex flex-col justify-center overflow-hidden border-b border-white/5">
            <div className="absolute inset-0 z-0">
                {/* Gradiente sutil Dark Navy consistente con Branding */}
                <div className="absolute inset-0 bg-gradient-to-b from-black via-[#020617] to-[#0f172a]" />

                {/* Acentos de luz sutiles para profundidad premium */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-[#38bdf8]/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
                    {/* Left Column: Text Content */}
                    <div className="flex-1 max-w-xl text-center md:text-left">
                        <motion.h1
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-3 leading-tight"
                        >
                            La Única Inversión que <br />
                            <span className="text-primary italic">
                                Dura para Siempre.
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            className="text-sm md:text-base text-slate-300/80 leading-relaxed mb-8 max-w-md mx-auto md:mx-0"
                        >
                            Protección de por vida para su hogar. Nuestros sistemas de impermeabilización y aislamiento térmico ofrecen una barrera impenetrable contra los elementos.
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
                                className="w-full sm:w-auto min-w-[150px] px-5 py-2.5 rounded-xl text-sm font-bold text-white border-2 border-white/20 hover:bg-white/10 transition-all backdrop-blur-sm"
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
