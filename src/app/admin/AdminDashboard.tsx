'use client';

import { useState, useTransition } from 'react';
import { Cotizacion, PrecioCiudad, updateCotizacionStatus, updatePrecio } from './actions';
import { motion } from 'framer-motion';
import {
    Phone,
    Mail,
    MapPin,
    DollarSign,
    Calendar,
    Save,
    Loader2,
    RefreshCw,
    TrendingUp,
    Settings
} from 'lucide-react';

const STATUSES = ['Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'] as const;

export default function AdminDashboard({
    initialQuotes,
    initialPrices
}: {
    initialQuotes: Cotizacion[],
    initialPrices: PrecioCiudad[]
}) {
    const [activeTab, setActiveTab] = useState<'funnel' | 'prices'>('funnel');
    const [quotes, setQuotes] = useState(initialQuotes);
    const [prices, setPrices] = useState(initialPrices);
    const [isPending, startTransition] = useTransition();

    const handleStatusChange = async (id: string, newStatus: string) => {
        // Optimistic update
        setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus as any } : q));

        startTransition(async () => {
            try {
                await updateCotizacionStatus(id, newStatus);
            } catch (error) {
                // Revert on error (could implement more robust rollback)
                console.error("Failed to update status", error);
            }
        });
    };

    const handlePriceChange = async (id: string, newPrice: number) => {
        startTransition(async () => {
            await updatePrecio(id, newPrice);
        });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
                        Thermo House Admin
                    </h1>
                    <p className="text-slate-400 mt-1">Panel de Control y Ventas</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('funnel')}
                        className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'funnel' ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                        <TrendingUp className="inline w-4 h-4 mr-2" />
                        Funnel de Ventas
                    </button>
                    <button
                        onClick={() => setActiveTab('prices')}
                        className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'prices' ? 'bg-teal-600 shadow-lg shadow-teal-500/20' : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                        <Settings className="inline w-4 h-4 mr-2" />
                        Precios
                    </button>
                </div>
            </header>

            {activeTab === 'funnel' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4">
                    {STATUSES.map(status => (
                        <div key={status} className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 min-w-[300px]">
                            <h2 className="text-lg font-semibold mb-4 px-2 flex justify-between items-center border-b border-slate-700 pb-2">
                                <span className={
                                    status === 'Nuevo' ? 'text-blue-400' :
                                        status === 'Contactado' ? 'text-yellow-400' :
                                            status === 'Visita Técnica' ? 'text-purple-400' :
                                                'text-green-400'
                                }>{status}</span>
                                <span className="text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300">
                                    {quotes.filter(q => (q.status || 'Nuevo') === status).length}
                                </span>
                            </h2>

                            <div className="space-y-4">
                                {quotes.filter(q => (q.status || 'Nuevo') === status).map(quote => (
                                    <motion.div
                                        layoutId={quote.id}
                                        key={quote.id}
                                        className="bg-slate-800 border-l-4 border-l-blue-500 rounded-lg p-4 shadow-lg hover:shadow-xl transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-white">{quote.nombre_cliente}</h3>
                                            <span className="text-xs text-slate-500">{new Date(quote.created_at).toLocaleDateString()}</span>
                                        </div>

                                        <div className="space-y-1 text-sm text-slate-400">
                                            <p className="flex items-center gap-2">
                                                <MapPin className="w-3 h-3 text-slate-500" /> {quote.ciudad}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-slate-500" /> {quote.telefono}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <DollarSign className="w-3 h-3 text-green-500" />
                                                <span className="text-green-400 font-mono">
                                                    ${quote.precio_total_contado?.toLocaleString()}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-700 flex justify-end">
                                            <select
                                                className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500"
                                                value={quote.status || 'Nuevo'}
                                                onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                                            >
                                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-6 border border-slate-700/50 max-w-4xl mx-auto">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <DollarSign className="text-teal-400" /> Configuración de Precios
                    </h2>

                    <div className="overflow-hidden rounded-lg border border-slate-700">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900/50 text-slate-200 uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Ciudad</th>
                                    <th className="px-6 py-4">Sistema</th>
                                    <th className="px-6 py-4">Precio Contado / m²</th>
                                    <th className="px-6 py-4">Precio MSI / m² (Auto)</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {prices.map(price => (
                                    <PriceRow key={price.id} price={price} onUpdate={handlePriceChange} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function PriceRow({ price, onUpdate }: { price: PrecioCiudad, onUpdate: (id: string, val: number) => void }) {
    const [val, setVal] = useState(price.precio_contado_m2);
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        await onUpdate(price.id, val);
        setIsDirty(false);
        setLoading(false);
    };

    return (
        <tr className="hover:bg-slate-800/30 transition-colors">
            <td className="px-6 py-4 font-medium text-white">{price.ciudad}</td>
            <td className="px-6 py-4 text-slate-300">{price.title}</td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">$</span>
                    <input
                        type="number"
                        value={val}
                        onChange={(e) => {
                            setVal(Number(e.target.value));
                            setIsDirty(true);
                        }}
                        className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-white w-32 focus:border-teal-500 focus:outline-none"
                    />
                </div>
            </td>
            <td className="px-6 py-4 text-slate-500">
                ${Math.round(val / 0.84).toLocaleString()}
            </td>
            <td className="px-6 py-4 text-right">
                {isDirty && (
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-teal-600 hover:bg-teal-500 text-white p-2 rounded-lg transition-all"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                )}
            </td>
        </tr>
    );
}
