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
            // Only apply hide/show logic on desktop
            if (window.innerWidth < 768) {
                setIsVisible(true);
                return;
            }

            setIsVisible(true);

            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(() => {
                // Check if mouse is NOT at the top before hiding
                setIsVisible(false);
            }, 2500);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (window.innerWidth < 768) return;

            // If mouse is near the top (top 80px), show navbar
            if (e.clientY < 80) {
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
            // Keep visible while scrolling to target
            setIsVisible(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setIsVisible(false), 2500);
        }
    };

    return (
        <>
            {/* Hover Trigger for Desktop - Transparent area at top */}
            <div
                className="fixed top-0 left-0 w-full h-4 z-[51] hidden md:block"
                onMouseEnter={() => setIsVisible(true)}
            />

            <motion.nav
                initial={{ y: 0 }}
                animate={{ y: isVisible || isOpen ? 0 : -100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border shadow-sm"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <Link href="/" className="text-xl md:text-2xl font-bold text-secondary tracking-tight">
                                Thermo<span className="font-light">House</span>
                            </Link>
                        </div>

                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-8">
                                {menuItems.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => scrollToSection(e, item.href)}
                                        className="text-muted-foreground hover:text-primary px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="hidden md:block">
                            <button
                                onClick={(e) => scrollToSection(e, '#cotizador')}
                                className="bg-secondary hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-md active:scale-95 text-sm"
                            >
                                Solicitar Cotización
                            </button>
                        </div>

                        <div className="-mr-2 flex md:hidden">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-slate-100 focus:outline-none transition-colors"
                            >
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Backdrop */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-secondary/40 backdrop-blur-md z-[40] md:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden bg-background border-b border-border overflow-hidden relative z-[50]"
                        >
                            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                                {menuItems.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => scrollToSection(e, item.href)}
                                        className="text-muted-foreground hover:text-primary hover:bg-slate-50 block px-3 py-4 rounded-md text-base font-medium border-b border-slate-50 last:border-0"
                                    >
                                        {item.name}
                                    </a>
                                ))}
                                <div className="pt-4 pb-2 px-3">
                                    <button
                                        onClick={(e) => scrollToSection(e, '#cotizador')}
                                        className="w-full bg-primary hover:bg-orange-600 text-white px-6 py-4 rounded-lg font-bold transition-all shadow-lg text-center"
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
