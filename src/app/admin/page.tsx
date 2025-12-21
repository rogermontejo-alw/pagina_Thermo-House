'use client';

import { useState, useEffect } from 'react';
import { getQuotes, updateQuoteStatus } from '@/app/actions/get-quotes';
import { logoutAdmin } from '@/app/actions/admin-auth';
import { getAdminUsers, createAdminUser, deleteAdminUser } from '@/app/actions/admin-users';
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
    LogOut,
    UserPlus,
    Trash2,
    Shield,
    Mail,
    UserCircle
} from 'lucide-react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'quotes' | 'users'>('quotes');
    const [quotes, setQuotes] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // User Creation State
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'editor' as 'admin' | 'editor' });
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    const router = useRouter();

    useEffect(() => {
        fetchData();
        fetchUsers();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const res = await getQuotes();
        if (res.success) setQuotes(res.data || []);
        setLoading(false);
    };

    const fetchUsers = async () => {
        const res = await getAdminUsers();
        if (res.success) setUsers(res.data || []);
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        const res = await updateQuoteStatus(id, status);
        if (res.success) {
            setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingUser(true);
        const res = await createAdminUser(newUser);
        if (res.success) {
            await fetchUsers();
            setNewUser({ name: '', email: '', password: '', role: 'editor' });
            alert('Usuario creado exitosamente');
        } else {
            alert('Error: ' + res.message);
        }
        setIsCreatingUser(false);
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar a este usuario?')) {
            const res = await deleteAdminUser(id);
            if (res.success) await fetchUsers();
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
                        <h1 className="text-3xl font-black text-secondary uppercase tracking-tight">Management Suite</h1>
                        <p className="text-muted-foreground">Sistema de Control Thermo House</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex">
                            <button
                                onClick={() => setActiveTab('quotes')}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'quotes' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`}
                            >
                                Cotizaciones
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`}
                            >
                                Mi Equipo
                            </button>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold border border-red-100 shadow-sm hover:bg-red-100 transition-all flex items-center gap-2"
                        >
                            <LogOut className="w-4 h-4" />
                            Salir
                        </button>
                    </div>
                </div>

                {activeTab === 'quotes' ? (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-blue-50 rounded-xl"><Users className="w-6 h-6 text-blue-500" /></div>
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Leads</span>
                                </div>
                                <div className="text-3xl font-black text-secondary">{quotes.length}</div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-primary/10 rounded-xl"><TrendingUp className="w-6 h-6 text-primary" /></div>
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Cartera</span>
                                </div>
                                <div className="text-3xl font-black text-secondary">${(totalRevenue / 1000).toFixed(1)}k</div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-accent/10 rounded-xl"><MapPin className="w-6 h-6 text-accent" /></div>
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Metraje</span>
                                </div>
                                <div className="text-3xl font-black text-secondary">{Math.round(totalArea)}m²</div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-purple-50 rounded-xl"><Calendar className="w-6 h-6 text-purple-500" /></div>
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Promedio</span>
                                </div>
                                <div className="text-3xl font-black text-secondary">${Math.round(avgTicket).toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Quotes Table */}
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
                                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No hay cotizaciones.</td>
                                            </tr>
                                        ) : (
                                            filteredQuotes.map((quote) => (
                                                <tr key={quote.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-bold text-slate-600">
                                                            {new Date(quote.created_at).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-secondary text-sm">{quote.contact_info.name}</div>
                                                        <div className="text-xs text-primary font-medium">{quote.contact_info.phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium">
                                                        {quote.area} m² - {quote.ciudad}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-black text-secondary">${Math.round(quote.precio_total_contado).toLocaleString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={quote.status}
                                                            onChange={(e) => handleUpdateStatus(quote.id, e.target.value)}
                                                            className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border outline-none bg-slate-50 border-slate-100"
                                                        >
                                                            <option value="Nuevo">Nuevo</option>
                                                            <option value="Contactado">Contactado</option>
                                                            <option value="Visita Técnica">Visita</option>
                                                            <option value="Cerrado">Cerrado</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {quote.google_maps_link && (
                                                            <a href={quote.google_maps_link} target="_blank" className="p-2 hover:bg-slate-100 rounded-lg inline-block transition-all">
                                                                <ExternalLink className="w-4 h-4 text-primary" />
                                                            </a>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* New User Form */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit">
                            <div className="mb-6">
                                <h2 className="text-xl font-black text-secondary uppercase tracking-tight flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-primary" />
                                    Nuevo Integrante
                                </h2>
                                <p className="text-slate-400 text-xs mt-1">Otorga acceso al panel administrativo</p>
                            </div>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                                        placeholder="Ej. Juan Pérez"
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                                        placeholder="correo@thermohouse.mx"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña Temporal</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                                        placeholder="••••••••"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel de Acceso</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                                    >
                                        <option value="editor">Vendedor (Editor)</option>
                                        <option value="admin">Administrador (Total)</option>
                                    </select>
                                </div>
                                <button
                                    disabled={isCreatingUser}
                                    className="w-full bg-secondary text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-secondary/10 mt-2 flex items-center justify-center gap-2"
                                >
                                    {isCreatingUser ? 'Guardando...' : 'Dar de Alta'}
                                </button>
                            </form>
                        </div>

                        {/* Users List */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-xl font-black text-secondary uppercase tracking-tight flex items-center gap-2 mb-6">
                                <Users className="w-5 h-5 text-primary" />
                                Integrantes Activos
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {users.map(user => (
                                    <div key={user.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                                <UserCircle className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-secondary">{user.name}</div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <Mail className="w-3 h-3 text-primary" /> {user.email}
                                                </div>
                                                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <Shield className="w-2.5 h-2.5 mr-1.5 text-primary" /> {user.role}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
