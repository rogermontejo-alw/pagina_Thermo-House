'use client';

import { useState, useEffect } from 'react';
import { getQuotes, updateQuoteStatus } from '@/app/actions/get-quotes';
import { logoutAdmin } from '@/app/actions/admin-auth';
import { getAdminUsers, createAdminUser, deleteAdminUser } from '@/app/actions/admin-users';
import { getProducts, updateProduct, cloneProductToCity, deleteProduct } from '@/app/actions/admin-products';
import { useRouter } from 'next/navigation';
import {
    Users, TrendingUp, Calendar, MapPin, Phone, ExternalLink, Search, Filter,
    CheckCircle2, Clock, AlertCircle, ChevronRight, LogOut, UserPlus, Trash2,
    Shield, Mail, UserCircle, Package, Edit3, Plus, Globe, Save, X
} from 'lucide-react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'quotes' | 'users' | 'prices'>('quotes');
    const [quotes, setQuotes] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // User Creation State
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'editor' as 'admin' | 'editor' });
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    // Product Editing State
    const [editingProduct, setEditingProduct] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>(null);
    const [newCityName, setNewCityName] = useState('');

    const router = useRouter();

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        const [qRes, uRes, pRes] = await Promise.all([getQuotes(), getAdminUsers(), getProducts()]);
        if (qRes.success) setQuotes(qRes.data || []);
        if (uRes.success) setUsers(uRes.data || []);
        if (pRes.success) setProducts(pRes.data || []);
        setLoading(false);
    };

    const handleUpdateQuote = async (id: string, status: string) => {
        const res = await updateQuoteStatus(id, status);
        if (res.success) setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingUser(true);
        const res = await createAdminUser(newUser);
        if (res.success) {
            await fetchAllData();
            setNewUser({ name: '', email: '', password: '', role: 'editor' });
            alert('Usuario creado');
        } else alert('Error: ' + res.message);
        setIsCreatingUser(false);
    };

    const handeDeleteUser = async (id: string) => {
        if (confirm('¿Eliminar usuario?')) {
            const res = await deleteAdminUser(id);
            if (res.success) fetchAllData();
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
            fetchAllData();
        } else alert(res.message);
    };

    const handleClone = async (prod: any) => {
        const city = prompt('¿Para qué ciudad quieres crear este precio especial? (Ej: Chihuahua)');
        if (city) {
            const res = await cloneProductToCity(prod, city);
            if (res.success) fetchAllData();
            else alert(res.message);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (confirm('¿Eliminar esta variante de precio?')) {
            const res = await deleteProduct(id);
            if (res.success) fetchAllData();
        }
    };

    const handleLogout = async () => {
        await logoutAdmin();
        router.push('/');
        router.refresh();
    };

    const filteredQuotes = quotes.filter(q => {
        const matchesSearch = q.contact_info.name.toLowerCase().includes(searchTerm.toLowerCase()) || q.ciudad.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-secondary uppercase tracking-tight">Management Suite</h1>
                        <p className="text-muted-foreground">Control de Ventas y Precios</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap">
                            <button onClick={() => setActiveTab('quotes')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'quotes' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400'}`}>Leads</button>
                            <button onClick={() => setActiveTab('prices')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'prices' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400'}`}>Precios</button>
                            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400'}`}>Equipo</button>
                        </div>
                        <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold border border-red-100"><LogOut className="w-4 h-4" /></button>
                    </div>
                </div>

                {activeTab === 'quotes' && (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div className="relative w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Buscar..." className="w-full pl-12 pr-4 py-2 rounded-xl border border-slate-200 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                                    <tr><th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Proyecto</th><th className="px-6 py-4">Estado</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredQuotes.map(q => (
                                        <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(q.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-bold text-secondary text-sm">{q.contact_info.name} <div className="text-[10px] text-primary">{q.contact_info.phone}</div></td>
                                            <td className="px-6 py-4 text-sm">{q.area}m² - {q.ciudad}</td>
                                            <td className="px-6 py-4">
                                                <select value={q.status} onChange={e => handleUpdateQuote(q.id, e.target.value)} className="text-[10px] font-black uppercase tracking-wider p-2 rounded-lg bg-white border border-slate-200">
                                                    {['Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'].map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'prices' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(p => (
                                <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${p.ciudad === 'General' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                {p.ciudad}
                                            </span>
                                            <h3 className="text-lg font-black text-secondary mt-2">{p.title}</h3>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleClone(p)} className="p-2 bg-slate-50 text-slate-400 hover:text-primary rounded-xl transition-all" title="Clonar para ciudad"><Plus className="w-4 h-4" /></button>
                                            {p.ciudad !== 'General' && <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>}
                                        </div>
                                    </div>

                                    {editingProduct === p.id ? (
                                        <div className="space-y-4 pt-2">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contado $/m²</label>
                                                    <input type="number" className="w-full p-2 bg-slate-50 border rounded-lg text-sm font-bold" value={editForm.precio_contado_m2} onChange={e => setEditForm({ ...editForm, precio_contado_m2: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MSI $/m²</label>
                                                    <input type="number" className="w-full p-2 bg-slate-50 border rounded-lg text-sm font-bold" value={editForm.precio_msi_m2} onChange={e => setEditForm({ ...editForm, precio_msi_m2: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handleSaveProduct} className="flex-1 bg-primary text-white py-2 rounded-xl text-xs font-black uppercase tracking-widest">Guardar</button>
                                                <button onClick={() => setEditingProduct(null)} className="p-2 bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Precio Contado</span>
                                                <span className="text-lg font-black text-secondary">${p.precio_contado_m2}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Precio MSI</span>
                                                <span className="text-lg font-black text-primary">${p.precio_msi_m2}</span>
                                            </div>
                                            <button onClick={() => { setEditingProduct(p.id); setEditForm(p); }} className="w-full mt-4 py-3 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-secondary transition-all flex items-center justify-center gap-2">
                                                <Edit3 className="w-3 h-3" /> Editar Tarifas
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit">
                            <h2 className="text-xl font-black text-secondary uppercase tracking-tight mb-6">Nuevo Usuario</h2>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <input placeholder="Nombre" className="w-full p-3 bg-slate-50 border rounded-xl" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                <input placeholder="Email" className="w-full p-3 bg-slate-50 border rounded-xl" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                <input type="password" placeholder="Password" className="w-full p-3 bg-slate-50 border rounded-xl" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                                <button className="w-full bg-secondary text-white py-4 rounded-xl font-black uppercase tracking-widest">Crear Acceso</button>
                            </form>
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {users.map(u => (
                                <div key={u.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center">
                                    <div><div className="font-bold">{u.name}</div><div className="text-xs text-slate-400">{u.email}</div></div>
                                    <button onClick={() => handeDeleteUser(u.id)} className="p-2 text-red-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
