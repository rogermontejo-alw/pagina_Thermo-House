'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '@/app/actions/admin-auth';
import { Clock, ShieldCheck, Lock } from 'lucide-react';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await loginAdmin(email, password);

            if (res.success) {
                router.push('/admin');
                router.refresh();
            } else {
                setError(res.message || 'Error al iniciar sesión');
                setLoading(false);
            }
        } catch (err: any) {
            setError('Error de conexión con el servidor.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 w-full max-w-md relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                <div className="text-center mb-10 relative">
                    <div className="flex justify-center mb-8">
                        <img src="/logo.png" alt="Thermo House Logo" className="h-16 w-auto filter brightness-110 drop-shadow-2xl" />
                    </div>
                    <h1 className="text-3xl font-black text-secondary uppercase tracking-tight mb-2">Acceso Seguro</h1>
                    <p className="text-slate-400 text-sm font-medium tracking-wide">PANEL DE CONTROL THERMO HOUSE</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                        <input
                            type="email"
                            placeholder="nombre@ejemplo.com"
                            className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                        <input
                            type="password"
                            placeholder="Ingresa tu contraseña"
                            className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-lg font-bold tracking-widest placeholder:text-slate-200"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 text-xs font-bold p-4 rounded-xl flex items-center gap-3 animate-shake">
                            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full bg-secondary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-secondary/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                    >
                        {loading ? 'Verificando...' : (
                            <>
                                Entrar al Dashboard
                                <ShieldCheck className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    SISTEMA DE SEGURIDAD THERMO HOUSE © 2025
                </div>
            </div>
        </div>
    );
}
