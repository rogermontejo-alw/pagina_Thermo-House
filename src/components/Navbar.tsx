'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLocations } from '@/app/actions/admin-locations';
import { Location } from '@/types';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [branches, setBranches] = useState<string[]>([]);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchBranches = async () => {
            const res = await getLocations();
            if (res.success && res.data) {
                const names = res.data
                    .filter((l: Location) => l.is_branch)
                    .map((l: Location) => l.ciudad);
                setBranches(names);
            }
        };
        fetchBranches();
    }, []);

    const menuItems = [
        { name: 'Inicio', href: '#inicio' },
        { name: 'Sistemas', href: '#sistemas' },
        { name: 'Garantía', href: '#garantia' },
        { name: 'Cotizar', href: '#cotizador' },
        { name: 'Sucursales', href: '#sucursales' },
    ];

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerWidth < 768) {
                setIsVisible(true);
                return;
            }

            setIsVisible(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setIsVisible(false);
            }, 1200);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (window.innerWidth < 768) return;
            if (e.clientY < 60) {
                setIsVisible(true);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => {
        e.preventDefault();
        setIsOpen(false);
        const targetId = href.replace('#', '');
        const elem = document.getElementById(targetId);
        if (elem) {
            elem.scrollIntoView({ behavior: 'smooth' });
            setIsVisible(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setIsVisible(false), 1200);
        }
    };

    return (
        <>
            <div
                className="fixed top-0 left-0 w-full h-4 z-[51] hidden md:block"
                onMouseEnter={() => setIsVisible(true)}
            />

            <motion.nav
                initial={{ y: 0 }}
                animate={{ y: isVisible || isOpen ? 0 : -100 }}
                transition={{ type: 'spring', stiffness: 450, damping: 45 }}
                className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl z-50 bg-background/90 backdrop-blur-md border-b border-border shadow-lg rounded-b-2xl md:mt-0"
            >
                <div className="mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-14 md:h-14">
                        <div className={`flex-shrink-0 flex items-center justify-center h-full transition-opacity duration-300 ${isOpen ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}>
                            <Link href="/" className="flex items-center gap-2 group h-full">
                                <img src="/logo.png" alt="Thermo House Logo" className="h-5 md:h-6 w-auto object-contain filter brightness-110 drop-shadow-sm self-center" />
                                <span className="text-[12px] md:text-sm font-black text-secondary tracking-tight uppercase self-center leading-none">
                                    Thermo<span className="text-primary font-bold">House</span>
                                </span>
                            </Link>
                        </div>

                        <div className="hidden md:block">
                            <div className="flex items-center space-x-2">
                                {menuItems.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => scrollToSection(e, item.href)}
                                        className="text-slate-600 dark:text-slate-300 hover:text-white dark:hover:text-secondary-foreground hover:bg-secondary px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300"
                                    >
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-4">
                            <ThemeToggle minimal />
                            <button
                                onClick={(e) => scrollToSection(e, '#cotizador')}
                                className="bg-primary hover:bg-orange-600 text-white px-5 py-2 rounded-full font-black transition-all shadow-md hover:shadow-primary/20 active:scale-95 text-[10px] uppercase tracking-widest"
                            >
                                Cotizar
                            </button>
                        </div>

                        <div className="-mr-2 flex items-center gap-2 md:hidden z-[60]">
                            <ThemeToggle minimal />
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className={`inline-flex items-center justify-center p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-primary text-white scale-110' : 'text-muted-foreground hover:text-primary hover:bg-slate-100'}`}
                            >
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed inset-0 h-screen w-screen bg-secondary/98 dark:bg-slate-950/98 backdrop-blur-3xl z-[55] md:hidden flex flex-col"
                        >
                            {/* Header: Logo en cápsula de cristal */}
                            <div className="pt-12 pb-8 flex flex-col items-center">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="bg-white/5 backdrop-blur-md border border-white/10 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3"
                                >
                                    <img src="/logo.png" alt="Thermo House" className="h-9 w-auto filter brightness-110" />
                                    <div className="flex flex-col leading-none">
                                        <span className="text-white font-black text-lg tracking-tighter uppercase">Thermo<span className="text-primary">House</span></span>
                                        <span className="text-white/30 text-[7px] font-bold uppercase tracking-[0.3em]">Sistemas Elite</span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Enlaces: Diseño Editorial */}
                            <div className="flex-grow flex flex-col justify-center px-10">
                                <nav className="space-y-6">
                                    {menuItems.map((item, idx) => (
                                        <motion.a
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.15, delay: 0.03 * idx }}
                                            key={item.name}
                                            href={item.href}
                                            onClick={(e) => scrollToSection(e, item.href)}
                                            className="group flex items-end gap-3 text-white hover:text-primary transition-all"
                                        >
                                            <span className="text-primary/40 font-black text-xs mb-1.5 font-mono">0{idx + 1}</span>
                                            <span className="text-3xl font-black uppercase tracking-tighter transition-all leading-none">
                                                {item.name}
                                            </span>
                                        </motion.a>
                                    ))}
                                </nav>
                            </div>

                            {/* Footer: Acción y Sedes */}
                            <div className="p-8 w-full mt-auto space-y-6">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-6 flex flex-col items-center"
                                >
                                    <button
                                        onClick={(e) => scrollToSection(e, '#cotizador')}
                                        className="w-full max-w-[240px] bg-primary text-white p-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 text-sm flex items-center justify-center gap-3 active:scale-95 transition-transform"
                                    >
                                        Cotizar Proyecto
                                        <ArrowRight className="w-4 h-4" />
                                    </button>

                                    <div className="w-full flex flex-col gap-2 pt-6 border-t border-white/5">
                                        <div className="flex justify-between items-center text-[9px] text-white/60 font-bold uppercase tracking-[0.2em]">
                                            <span>Cobertura Peninsular</span>
                                            <span>© 2025</span>
                                        </div>
                                        <p className="text-[10px] text-white/40 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                            {branches.length > 0
                                                ? branches.join(' • ')
                                                : 'Mérida • Playa del Carmen • Cancún • Tulum'}
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>
        </>
    );
}
