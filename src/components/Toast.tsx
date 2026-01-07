'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error';

interface ToastProps {
    message: string;
    type: ToastType;
    visible: boolean;
    onClose: () => void;
}

export default function Toast({ message, type, visible, onClose }: ToastProps) {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border border-white/10"
                    style={{
                        backgroundColor: type === 'success' ? 'rgba(22, 163, 74, 0.9)' : 'rgba(220, 38, 38, 0.9)',
                        color: 'white'
                    }}
                >
                    <div className="p-1 bg-white/20 rounded-full">
                        {type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-white" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight">
                            {type === 'success' ? '¡Éxito!' : 'Error'}
                        </span>
                        <span className="text-xs font-medium text-white/90">
                            {message}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-white/80 hover:text-white" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
