'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
    minimal?: boolean;
    hideLabels?: boolean;
}

export default function ThemeToggle({ minimal = false, hideLabels = false }: ThemeToggleProps) {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        console.log('🌓 ThemeToggle mounted');
        const storedTheme = localStorage.getItem('theme');
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'dark' : 'light');
    }, []);

    const toggleTheme = (newTheme: 'light' | 'dark') => {
        if (newTheme === theme) return;

        setTheme(newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    if (!mounted) return <div className={`flex-shrink-0 ${(minimal || hideLabels) ? 'w-[70px]' : 'w-[150px]'} h-[38px] bg-slate-100 dark:bg-slate-800/50 rounded-full animate-pulse`} />;

    return (
        <div className={`relative flex-shrink-0 bg-slate-200/50 dark:bg-slate-800/40 backdrop-blur-md p-1 rounded-full flex items-center ${(minimal || hideLabels) ? 'w-[70px]' : 'w-[150px]'} h-[38px] shadow-inner border border-white/50 dark:border-white/10 select-none cursor-pointer group transition-all duration-300`}>
            {/* Animated Background Capsule */}
            <motion.div
                className="absolute bg-slate-900 dark:bg-primary rounded-full shadow-lg z-0"
                style={{
                    width: (minimal || hideLabels) ? '28px' : '71px',
                    height: '30px'
                }}
                initial={false}
                animate={{
                    x: theme === 'light' ? 0 : ((minimal || hideLabels) ? 34 : 71)
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35
                }}
            />

            {/* Light Option */}
            <button
                onClick={() => toggleTheme('light')}
                aria-label="Cambiar a modo claro"
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 h-full transition-all duration-300 ${theme === 'light' ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-primary'
                    }`}
            >
                <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'fill-white/20' : ''}`} />
                {(!minimal && !hideLabels) && <span className="text-[10px] font-black uppercase tracking-tighter">Claro</span>}
            </button>

            {/* Dark Option */}
            <button
                onClick={() => toggleTheme('dark')}
                aria-label="Cambiar a modo oscuro"
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 h-full transition-all duration-300 ${theme === 'dark' ? 'text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-primary'
                    }`}
            >
                <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'fill-white/20' : ''}`} />
                {(!minimal && !hideLabels) && <span className="text-[10px] font-black uppercase tracking-tighter">Oscuro</span>}
            </button>
        </div>
    );
}
