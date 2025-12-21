'use client';

import { useState, useEffect } from 'react';
import { getQuotes, updateQuote } from '@/app/actions/get-quotes';
import { logoutAdmin, getAdminSession } from '@/app/actions/admin-auth';
import { getAdminUsers, createAdminUser, deleteAdminUser, resetAdminPassword } from '@/app/actions/admin-users';
import { getProducts, updateProduct, cloneProductToCity, deleteProduct } from '@/app/actions/admin-products';
import { useRouter } from 'next/navigation';
import {
    Users, TrendingUp, Calendar, MapPin, Phone, ExternalLink, Search, Filter,
    CheckCircle2, Clock, AlertCircle, ChevronRight, LogOut, UserPlus, Trash2,
    Shield, Mail, UserCircle, Package, Edit3, Plus, Globe, Save, X, Key, Building2,
    Download, CheckSquare, Square, FileText, Cake, Receipt, FileSignature
} from 'lucide-react';

export default function AdminDashboard() {
    const [session, setSession] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'quotes' | 'users' | 'prices'>('quotes');
    const [quotes, setQuotes] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Selection state
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

    // User Creation State
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'editor' as 'admin' | 'editor', ciudad: 'Mérida' });
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    // Product Editing State
    const [editingProduct, setEditingProduct] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>(null);

    // Client Detail Modal
    const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<any>(null);
    const [isSavingDetail, setIsSavingDetail] = useState(false);

    const router = useRouter();

    const CIUDADES_OPERACION = [
        'Mérida', 'Cancún', 'Playa del Carmen', 'Campeche', 'Villahermosa',
        'Veracruz', 'Cuernavaca', 'Chihuahua', 'Ciudad Juárez', 'Puebla', 'Monterrey'
    ];

    useEffect(() => {
        const init = async () => {
            const userSession = await getAdminSession();
            if (!userSession) {
                router.push('/admin/login');
                return;
            }
            setSession(userSession);
            // After session is set, fetch initial data
            fetchData(userSession);
        };
        init();
    }, []);

    const fetchData = async (currSession: any) => {
        setLoading(true);
        const cityFilter = currSession.role === 'admin' ? 'Todas' : currSession.ciudad;

        const [qRes, uRes, pRes] = await Promise.all([
            getQuotes(cityFilter),
            currSession.role === 'admin' ? getAdminUsers() : Promise.resolve({ success: true, data: [] }),
            getProducts(cityFilter)
        ]);

        if (qRes.success) setQuotes(qRes.data || []);
        if (uRes.success) setUsers(uRes.data || []);
        if (pRes.success) setProducts(pRes.data || []);
        setLoading(false);
    };

    const handleUpdateQuoteStatus = async (id: string, status: string) => {
        const res = await updateQuote(id, { status });
        if (res.success) setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    };

    const handleSaveLeadDetail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeadForDetail) return;
        setIsSavingDetail(true);

        const updates = {
            status: selectedLeadForDetail.status,
            solution_id: selectedLeadForDetail.solution_id,
            fecha_nacimiento: selectedLeadForDetail.fecha_nacimiento || null,
            factura: selectedLeadForDetail.factura || false,
            notas: selectedLeadForDetail.notas || ''
        };

        const res = await updateQuote(selectedLeadForDetail.id, updates);
        if (res.success) {
            await fetchData(session);
            setSelectedLeadForDetail(null);
        } else {
            alert('Error: ' + res.message);
        }
        setIsSavingDetail(false);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingUser(true);
        const res = await createAdminUser(newUser);
        if (res.success) {
            await fetchData(session);
            setNewUser({ name: '', email: '', password: '', role: 'editor', ciudad: 'Mérida' });
            alert('Usuario creado exitosamente');
        } else alert('Error: ' + res.message);
        setIsCreatingUser(false);
    };

    const handleResetPassword = async (id: string) => {
        const newPass = prompt('Ingresa la nueva contraseña para este usuario');
        if (newPass) {
            const res = await resetAdminPassword(id, newPass);
            if (res.success) alert('Contraseña actualizada');
            else alert(res.message);
        }
    };

    const handeDeleteUser = async (id: string) => {
        if (confirm('¿Eliminar usuario definitivamente?')) {
            const res = await deleteAdminUser(id);
            if (res.success) fetchData(session);
        }
    };

    const handleSaveProduct = async () => {
        if (!editForm) return;
        const res = await updateProduct(editForm.id, {
            precio_contado_m2: Number(editForm.precio_contado_m2),
            precio_msi_m2: Number(editForm.precio_msi_m2),
            title: editForm.title
        });
        if (res.success) {
            setEditingProduct(null);
            fetchData(session);
        } else alert(res.message);
    };

    const handleClone = async (prod: any) => {
        const city = prompt('¿Para qué ciudad quieres crear este precio especial?', 'Chihuahua');
        if (city) {
            const res = await cloneProductToCity(prod, city);
            if (res.success) fetchData(session);
            else alert(res.message);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (confirm('¿Eliminar esta tarifa regional?')) {
            const res = await deleteProduct(id);
            if (res.success) fetchData(session);
        }
    };

    const handleLogout = async () => {
        await logoutAdmin();
        router.push('/admin/login');
    };

    const toggleLeadSelection = (id: string) => {
        const newSelection = new Set(selectedLeads);
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
        setSelectedLeads(newSelection);
    };

    const handleSelectAll = (filteredLeads: any[]) => {
        if (selectedLeads.size === filteredLeads.length) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(filteredLeads.map(q => q.id)));
        }
    };

    const exportToCSV = () => {
        const leadsToExport = quotes.filter(q => selectedLeads.has(q.id));
        if (leadsToExport.length === 0) {
            alert('Por favor selecciona al menos un registro para exportar.');
            return;
        }

        const headers = ['Fecha', 'Cliente', 'WhatsApp', 'Email', 'Ciudad', 'Area (m2)', 'Sistema', 'Precio Contado', 'Estado', 'Cumpleaños', 'Factura', 'Notas'];
        const rows = leadsToExport.map(q => [
            new Date(q.created_at).toLocaleDateString(),
            q.contact_info.name,
            q.contact_info.phone,
            q.contact_info.email || 'N/A',
            q.ciudad,
            q.area,
            q.soluciones_precios?.title || 'Personalizado',
            Math.round(q.precio_total_contado),
            q.status,
            q.fecha_nacimiento || 'N/A',
            q.factura ? 'SÍ' : 'NO',
            (q.notas || '').replace(/\n/g, ' ')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `leads_thermohouse_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredQuotes = quotes.filter(q => {
        const matchesSearch = q.contact_info.name.toLowerCase().includes(searchTerm.toLowerCase()) || q.ciudad.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || q.status === statusFilter;

        const qDate = new Date(q.created_at);
        const matchesStartDate = !startDate || qDate >= new Date(startDate);
        const matchesEndDate = !endDate || qDate <= new Date(endDate + 'T23:59:59');

        return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });

    if (!session) return <div className="h-screen flex items-center justify-center font-black text-slate-200 uppercase tracking-widest animate-pulse">Cargando Sesión...</div>;

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                                {session.role === 'admin' ? 'Acceso Total' : `Zona: ${session.ciudad}`}
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-secondary uppercase tracking-tight">Management Suite</h1>
                        <p className="text-slate-400 text-sm">Bienvenido de nuevo, {session.name}</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-1">
                            <button onClick={() => setActiveTab('quotes')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'quotes' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`}>Leads</button>
                            <button onClick={() => setActiveTab('prices')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'prices' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`}>Precios</button>
                            {session.role === 'admin' && (
                                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`}>Mi Equipo</button>
                            )}
                        </div>
                        <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold border border-red-100 hover:bg-red-100 transition-all"><LogOut className="w-4 h-4" /></button>
                    </div>
                </div>

                {activeTab === 'quotes' && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px]">
                        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
                            <div className="flex gap-4 items-center flex-1 w-full">
                                <div className="relative flex-1 md:max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="text" placeholder="Buscar cliente o ciudad..." className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                                {selectedLeads.size > 0 && (
                                    <button
                                        onClick={exportToCSV}
                                        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                                    >
                                        <Download className="w-4 h-4" />
                                        Exportar {selectedLeads.size} Seleccionado(s)
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="date"
                                        className="text-[10px] font-bold outline-none bg-transparent"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        placeholder="Inicio"
                                    />
                                    <span className="text-slate-300">|</span>
                                    <input
                                        type="date"
                                        className="text-[10px] font-bold outline-none bg-transparent"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        placeholder="Fin"
                                    />
                                    {(startDate || endDate) && (
                                        <button
                                            onClick={() => { setStartDate(''); setEndDate(''); }}
                                            className="ml-1 p-1 hover:bg-slate-100 rounded-md text-slate-400"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                    {['All', 'Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'].map(status => (
                                        <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === status ? 'bg-secondary text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}>{status}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 w-10">
                                            <button
                                                onClick={() => handleSelectAll(filteredQuotes)}
                                                className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                                            >
                                                {selectedLeads.size === filteredQuotes.length && filteredQuotes.length > 0 ? (
                                                    <CheckSquare className="w-4 h-4 text-primary" />
                                                ) : (
                                                    <Square className="w-4 h-4" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-8 py-5">Fecha</th>
                                        <th className="px-8 py-5">Cliente</th>
                                        <th className="px-8 py-5">Proyecto</th>
                                        <th className="px-8 py-5">Presupuesto</th>
                                        <th className="px-8 py-5">Estado</th>
                                        <th className="px-8 py-5 text-right">Canal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm animate-pulse">Sincronizando Leads...</td></tr>
                                    ) : filteredQuotes.length === 0 ? (
                                        <tr><td colSpan={7} className="px-8 py-20 text-center text-slate-300 font-bold italic">No se encontraron registros en {session.ciudad === 'Todas' ? 'el sistema' : session.ciudad}</td></tr>
                                    ) : (
                                        filteredQuotes.map(q => (
                                            <tr key={q.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedLeads.has(q.id) ? 'bg-primary/[0.02]' : ''}`}>
                                                <td className="px-8 py-5">
                                                    <button
                                                        onClick={() => toggleLeadSelection(q.id)}
                                                        className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                                                    >
                                                        {selectedLeads.has(q.id) ? (
                                                            <CheckSquare className="w-4 h-4 text-primary" />
                                                        ) : (
                                                            <Square className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-8 py-5 text-xs font-bold text-slate-400">{new Date(q.created_at).toLocaleDateString()}</td>
                                                <td className="px-8 py-5">
                                                    <div className="font-black text-secondary text-sm group-hover:text-primary transition-colors">{q.contact_info.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {q.contact_info.phone}</div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="text-sm font-bold text-slate-700">{q.area}m²</div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-black flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {q.ciudad}</div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="text-sm font-black text-secondary">${Math.round(q.precio_total_contado).toLocaleString()}</div>
                                                    <div className="text-[10px] text-primary font-black uppercase tracking-tighter mt-1">{q.soluciones_precios?.title || 'Personalizado'}</div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <select value={q.status} onChange={e => handleUpdateQuoteStatus(q.id, e.target.value)} className="text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 outline-none hover:border-primary transition-all cursor-pointer">
                                                        {['Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'].map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setSelectedLeadForDetail(q)}
                                                            className="p-2 bg-secondary text-white rounded-xl hover:bg-slate-800 transition-all shadow-sm"
                                                            title="Ver Ficha del Cliente"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                        {q.google_maps_link && (
                                                            <a href={q.google_maps_link} target="_blank" className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><ExternalLink className="w-4 h-4" /></a>
                                                        )}
                                                        {q.contact_info.phone && (
                                                            <a href={`https://wa.me/52${q.contact_info.phone}`} target="_blank" className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"><Phone className="w-4 h-4" /></a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'prices' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                                <Package className="w-6 h-6 text-primary" />
                                Lista de Precios {session.ciudad !== 'Todas' ? `en ${session.ciudad}` : '(Global)'}
                            </h2>
                            {session.role === 'admin' && (
                                <div className="text-xs font-bold text-slate-400 bg-white border px-4 py-2 rounded-xl">Precios base autogenerados</div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(p => (
                                <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-3 h-3 text-slate-400" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{p.ciudad}</span>
                                            </div>
                                            <h3 className="text-xl font-black text-secondary leading-none">{p.title}</h3>
                                        </div>
                                        {session.role === 'admin' && (
                                            <div className="flex gap-1">
                                                <button onClick={() => handleClone(p)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-primary rounded-xl transition-all" title="Clonar para ciudad"><Plus className="w-5 h-5" /></button>
                                                {p.ciudad !== 'General' && (
                                                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2.5 bg-red-50 text-red-300 hover:text-red-500 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {editingProduct === p.id && session.role === 'admin' ? (
                                        <div className="space-y-4 pt-2">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Contado $/m²</label>
                                                    <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-secondary outline-none focus:ring-4 focus:ring-primary/10" value={editForm.precio_contado_m2} onChange={e => setEditForm({ ...editForm, precio_contado_m2: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">MSI $/m²</label>
                                                    <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-primary outline-none focus:ring-4 focus:ring-primary/10" value={editForm.precio_msi_m2} onChange={e => setEditForm({ ...editForm, precio_msi_m2: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handleSaveProduct} className="flex-1 bg-secondary text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-secondary/10">Guardar Cambios</button>
                                                <button onClick={() => setEditingProduct(null)} className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"><X className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contado</span>
                                                    <span className="text-2xl font-black text-secondary">${p.precio_contado_m2}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meses Sin Int.</span>
                                                    <span className="text-2xl font-black text-primary">${p.precio_msi_m2}</span>
                                                </div>
                                            </div>
                                            {session.role === 'admin' && (
                                                <button onClick={() => { setEditingProduct(p.id); setEditForm(p); }} className="w-full py-4 border-2 border-slate-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-secondary hover:text-secondary transition-all flex items-center justify-center gap-2">
                                                    <Edit3 className="w-3.5 h-3.5" /> Modificar Tarifas
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'users' && session.role === 'admin' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Team Form */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit space-y-8">
                            <div>
                                <h2 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                                    <UserPlus className="w-6 h-6 text-primary" />
                                    Nuevo Integrante
                                </h2>
                                <p className="text-slate-400 text-xs mt-1">Otorga el nivel de acceso correcto</p>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                                        <input type="text" required placeholder="Nombre completo" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                        <input type="email" required placeholder="correo@empresa.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                                        <input type="password" required placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol</label>
                                            <select className="w-full px-2 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}>
                                                <option value="editor">Editor</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad</label>
                                            <select className="w-full px-2 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" value={newUser.ciudad} onChange={e => setNewUser({ ...newUser, ciudad: e.target.value })} disabled={newUser.role === 'admin'}>
                                                {CIUDADES_OPERACION.map(c => <option key={c} value={c}>{c}</option>)}
                                                {newUser.role === 'admin' && <option value="Todas">Todas</option>}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <button disabled={isCreatingUser} className="w-full bg-secondary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-2">
                                    {isCreatingUser ? 'Guardando...' : 'Dar de Alta'}
                                </button>
                            </form>
                        </div>

                        {/* Team List */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3 mb-6">
                                <Users className="w-6 h-6 text-primary" />
                                Integrantes Activos
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {users.map(u => (
                                    <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-start justify-between group hover:border-primary/20 transition-all">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                                <UserCircle className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <div className="font-black text-secondary">{u.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1"><Building2 className="w-3 h-3" /> {u.ciudad}</div>
                                                <div className="mt-3 flex gap-2">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                        {u.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => handleResetPassword(u.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-secondary rounded-xl" title="Resetear Contraseña"><Key className="w-4 h-4" /></button>
                                            <button onClick={() => handeDeleteUser(u.id)} className="p-2.5 bg-red-50 text-red-300 hover:text-red-600 rounded-xl" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Client Detail Modal (Ficha) */}
            {selectedLeadForDetail && (
                <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                                    <UserCircle className="w-7 h-7 text-primary" />
                                    Ficha del Cliente
                                </h3>
                                <p className="text-slate-400 text-sm font-medium">Folio: #{selectedLeadForDetail.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                            <button onClick={() => setSelectedLeadForDetail(null)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveLeadDetail} className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                            {/* Contact Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                                    <div className="px-4 py-3 bg-slate-50 rounded-xl font-bold text-secondary border border-transparent">{selectedLeadForDetail.contact_info.name}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                                    <div className="px-4 py-3 bg-slate-50 rounded-xl font-bold text-secondary border border-transparent">{selectedLeadForDetail.contact_info.phone}</div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                                        value={selectedLeadForDetail.fecha_nacimiento || ''}
                                        onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, fecha_nacimiento: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1 flex flex-col justify-end pb-1 ml-1">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-12 h-6 rounded-full transition-all relative ${selectedLeadForDetail.factura ? 'bg-primary' : 'bg-slate-200'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedLeadForDetail.factura ? 'left-7' : 'left-1'}`} />
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={selectedLeadForDetail.factura || false}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, factura: e.target.checked })}
                                        />
                                        <span className="text-sm font-black text-secondary uppercase tracking-tight group-hover:text-primary transition-colors">¿Requiere Factura?</span>
                                    </label>
                                </div>
                            </div>

                            {/* Project Section */}
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Package className="w-5 h-5 text-primary" />
                                    <h4 className="font-black text-secondary uppercase text-sm">Detalles del Cierre</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estatus</label>
                                        <select
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                            value={selectedLeadForDetail.status}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, status: e.target.value })}
                                        >
                                            {['Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SISTEMA FINAL COMPRADO</label>
                                        <select
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-primary outline-none"
                                            value={selectedLeadForDetail.solution_id}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, solution_id: e.target.value })}
                                        >
                                            {products.filter(p => p.ciudad === selectedLeadForDetail.ciudad || p.ciudad === 'Mérida').map(p => (
                                                <option key={p.id} value={p.id}>{p.title} ({p.ciudad})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas y Comentarios Internos</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium min-h-[100px] outline-none focus:ring-4 focus:ring-primary/10"
                                    placeholder="Escribe notas sobre el cliente o el proceso de venta..."
                                    value={selectedLeadForDetail.notas || ''}
                                    onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, notas: e.target.value })}
                                />
                            </div>

                            <button
                                disabled={isSavingDetail}
                                className="w-full bg-secondary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {isSavingDetail ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Actualizar Ficha de Cliente
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
