'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SectionWrapper({ children, className, bg = "white" }: { children: React.ReactNode, className?: string, bg?: "white" | "slate" }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className={`py-16 md:py-24 border-y border-transparent transition-colors duration-500 ${bg === "slate" ? "bg-slate-100/80 dark:bg-slate-900/50 border-slate-200/60 dark:border-white/5" : "bg-white dark:bg-slate-950"} ${className || ""}`}
        >
            <div className="max-w-5xl mx-auto px-4">
                {children}
            </div>
        </motion.section>
    );
}

export function CTASection() {
    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        const targetId = 'cotizador';
        const elem = document.getElementById(targetId);
        if (elem) {
            window.history.pushState(null, '', href);
            elem.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="dark-section py-12 md:py-24 text-center rounded-[2rem] md:rounded-[3rem] w-full mb-12"
        >
            <div className="max-w-3xl mx-auto px-4">
                <h2 className="text-2xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter">¿Preparado para la Tranquilidad?</h2>
                <p className="text-sm md:text-xl text-slate-300 mb-10 opacity-90 leading-relaxed">Permita que Thermo House proteja su hogar contra el calor y las filtraciones de por vida.</p>
                <Link
                    href="/cotizador"
                    onClick={(e) => scrollToSection(e, '/cotizador')}
                    className="w-full sm:w-auto bg-primary hover:bg-orange-600 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 text-sm inline-block"
                    aria-label="Obtener cotización gratuita"
                >
                    Obtenga su Cotización Gratis
                </Link>
            </div>
        </motion.section>
    );
}
