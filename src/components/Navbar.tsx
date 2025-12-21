'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { name: 'Sistemas', href: '#sistemas' },
        { name: 'Garantía', href: '#garantia' },
        { name: 'Contacto', href: '#cotizador' },
    ];

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => {
        e.preventDefault();
        setIsOpen(false);
        const targetId = href.replace('#', '');
        const elem = document.getElementById(targetId);
        elem?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border shadow-sm">
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

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-background border-b border-border animate-in slide-in-from-top duration-300">
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
                </div>
            )}
        </nav>
    );
}
