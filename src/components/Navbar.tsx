'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const menuItems = [
        { name: 'Sistemas', href: '#sistemas' },
        { name: 'Garantía', href: '#garantia' },
        { name: 'Contacto', href: '#cotizador' },
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
                        <div className="flex-shrink-0 flex items-center justify-center h-full">
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
                                        className="text-slate-600 hover:text-white hover:bg-secondary px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300"
                                    >
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="hidden md:block">
                            <button
                                onClick={(e) => scrollToSection(e, '#cotizador')}
                                className="bg-primary hover:bg-orange-600 text-white px-5 py-2 rounded-full font-black transition-all shadow-md hover:shadow-primary/20 active:scale-95 text-[10px] uppercase tracking-widest"
                            >
                                Cotizar
                            </button>
                        </div>

                        <div className="-mr-2 flex md:hidden">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-slate-100 focus:outline-none transition-colors"
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
                            className="fixed inset-0 bg-secondary/60 backdrop-blur-xl z-[40] md:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden bg-background border-t border-border overflow-hidden relative z-[50]"
                        >
                            <div className="px-2 pt-6 pb-6 space-y-1 sm:px-3 text-center">
                                <div className="flex justify-center mb-6">
                                    <img src="/logo.png" alt="Thermo House" className="h-10 w-auto filter brightness-110" />
                                </div>
                                {menuItems.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => scrollToSection(e, item.href)}
                                        className="text-secondary hover:text-primary block px-3 py-5 rounded-md text-lg font-black uppercase tracking-tighter"
                                    >
                                        {item.name}
                                    </a>
                                ))}
                                <div className="pt-4 px-3">
                                    <button
                                        onClick={(e) => scrollToSection(e, '#cotizador')}
                                        className="w-full bg-primary text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                                    >
                                        Solicitar Cotización
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>
        </>
    );
}
