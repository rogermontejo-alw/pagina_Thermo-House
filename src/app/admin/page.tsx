'use client';

import { useState, useEffect } from 'react';
import { getQuotes, updateQuoteStatus } from '@/app/actions/get-quotes';
import { logoutAdmin } from '@/app/actions/admin-auth';
import { useRouter } from 'next/navigation';
import {
    Users,
    TrendingUp,
    Calendar,
    MapPin,
    Phone,
    ExternalLink,
    Search,
    Filter,
    ArrowUpDown,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    LogOut
} from 'lucide-react';

export default function AdminDashboard() {
    const [quotes, setQuotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const res = await getQuotes();
        if (res.success) {
            setQuotes(res.data || []);
        }
        setLoading(false);
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        const res = await updateQuoteStatus(id, status);
        if (res.success) {
            setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
        }
    };

    const handleLogout = async () => {
        await logoutAdmin();
        router.push('/');
        router.refresh();
    };

    const filteredQuotes = quotes.filter(q => {
        const matchesSearch =
            q.contact_info.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.ciudad.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const totalRevenue = quotes.reduce((acc, q) => acc + (q.precio_total_contado || 0), 0);
    const totalArea = quotes.reduce((acc, q) => acc + (q.area || 0), 0);
    const avgTicket = quotes.length ? totalRevenue / quotes.length : 0;


    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-secondary uppercase tracking-tight">Dashboard de Ventas</h1>
                        <p className="text-muted-foreground">Gestión de cotizaciones y leads en tiempo real</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchData}
                            className="bg-white px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Actualizar
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold border border-red-100 shadow-sm hover:bg-red-100 transition-all flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Salir
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2 bg-blue-50 rounded-xl"><Users className="w-6 h-6 text-blue-500" /></div>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Cotizaciones</span>
                        </div>
                        <div className="text-3xl font-black text-secondary">{quotes.length}</div>
                        <div className="text-xs text-green-500 font-bold mt-1">+12% este mes</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2 bg-primary/10 rounded-xl"><TrendingUp className="w-6 h-6 text-primary" /></div>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Volumen Est.</span>
                        </div>
                        <div className="text-3xl font-black text-secondary">${(totalRevenue / 1000).toFixed(1)}k</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Suma de propuestas</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2 bg-accent/10 rounded-xl"><MapPin className="w-6 h-6 text-accent" /></div>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Metraje Total</span>
                        </div>
                        <div className="text-3xl font-black text-secondary">{Math.round(totalArea)}m²</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Superficie protegida</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-2 bg-purple-50 rounded-xl"><Calendar className="w-6 h-6 text-purple-500" /></div>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Ticket Prom.</span>
                        </div>
                        <div className="text-3xl font-black text-secondary">${Math.round(avgTicket).toLocaleString()}</div>
                        <div className="text-xs text-slate-400 font-medium mt-1">Valor medio obra</div>
                    </div>
                </div>

                {/* Filters & Table */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o ciudad..."
                                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            {['All', 'Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === status ? 'bg-secondary text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest font-black text-slate-400">
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Proyecto</th>
                                    <th className="px-6 py-4">Propuesta</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Cargando datos...</td>
                                    </tr>
                                ) : filteredQuotes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No hay cotizaciones registradas.</td>
                                    </tr>
                                ) : (
                                    filteredQuotes.map((quote) => (
                                        <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-slate-600">
                                                    {new Date(quote.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {new Date(quote.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-secondary text-sm">{quote.contact_info.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <a href={`tel:${quote.contact_info.phone}`} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                                                        <Phone className="w-3 h-3" /> {quote.contact_info.phone}
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-700">{quote.area} m² / {quote.ciudad}</div>
                                                <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1 mt-0.5 font-bold">
                                                    <MapPin className="w-3 h-3" /> {quote.estado}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-black text-secondary">
                                                    ${Math.round(quote.precio_total_contado).toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-primary font-black uppercase tracking-tighter">
                                                    {quote.soluciones_precios?.title || 'Personalizado'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={quote.status}
                                                    onChange={(e) => handleUpdateStatus(quote.id, e.target.value)}
                                                    className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border outline-none transition-all cursor-pointer ${quote.status === 'Nuevo' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                        quote.status === 'Contactado' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            quote.status === 'Visita Técnica' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                                'bg-green-50 text-green-600 border-green-100'
                                                        }`}
                                                >
                                                    <option value="Nuevo">Nuevo</option>
                                                    <option value="Contactado">Contactado</option>
                                                    <option value="Visita Técnica">Visita</option>
                                                    <option value="Cerrado">Cerrado</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    {quote.google_maps_link && (
                                                        <a
                                                            href={quote.google_maps_link}
                                                            target="_blank"
                                                            className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 transition-all"
                                                            title="Ver Techo en Maps"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    <button className="p-2 bg-secondary rounded-lg text-white hover:bg-slate-800 transition-all">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
