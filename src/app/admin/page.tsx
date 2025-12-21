'use client';

import { useState, useEffect } from 'react';
import { getQuotes, updateQuote } from '@/app/actions/get-quotes';
import { logoutAdmin, getAdminSession } from '@/app/actions/admin-auth';
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, resetAdminPassword } from '@/app/actions/admin-users';
import { getProducts, updateProduct, cloneProductToCity, deleteProduct, createProduct } from '@/app/actions/admin-products';
import { useRouter } from 'next/navigation';
import {
    Users, TrendingUp, Calendar, MapPin, Phone, ExternalLink, Search, Filter,
    CheckCircle2, Clock, AlertCircle, ChevronRight, LogOut, UserPlus, Trash2,
    Shield, Mail, UserCircle, Package, Edit3, Plus, Globe, Save, X, Key, Building2,
    Download, CheckSquare, Square, FileText, Cake, Receipt, FileSignature,
    LayoutGrid, ListOrdered, Navigation, Map, AlertTriangle, Printer, FileCheck, PencilRuler
} from 'lucide-react';
import { getLocations, createLocation, deleteLocation } from '@/app/actions/admin-locations';
import { getAppConfig, updateAppConfig } from '@/app/actions/get-config';

export default function AdminDashboard() {
    const [session, setSession] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'quotes' | 'users' | 'prices' | 'locations'>('quotes');
    const [quotes, setQuotes] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapsKey, setMapsKey] = useState('');
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [priceSearchTerm, setPriceSearchTerm] = useState('');
    const [priceCityFilter, setPriceCityFilter] = useState('Todas');
    const [statusFilter, setStatusFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Selection state
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

    // User Creation/Editing State
    const [newUser, setNewUser] = useState({
        name: '',
        apellido: '',
        email: '',
        password: '',
        role: 'editor' as 'admin' | 'editor',
        ciudad: '',
        base: '',
        telefono: '',
        contacto_email: ''
    });
    const [userModal, setUserModal] = useState<{ open: boolean, type: 'create' | 'edit', data: any }>({
        open: false,
        type: 'create',
        data: null
    });
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    // Product Editing State
    const [editingProduct, setEditingProduct] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>(null);

    // Client Detail Modal
    const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<any>(null);
    const [isSavingDetail, setIsSavingDetail] = useState(false);
    const [showQuotePreview, setShowQuotePreview] = useState(false);

    // Permission helper
    const canEditQuote = (q: any) => session?.role === 'admin' || (session?.role === 'editor' && q?.status === 'Nuevo');

    // Product Modal State
    const [productModal, setProductModal] = useState<{
        open: boolean;
        type: 'edit' | 'create' | 'clone';
        data: any;
    }>({ open: false, type: 'edit', data: null });
    const [isSavingProduct, setIsSavingProduct] = useState(false);

    const router = useRouter();

    // Location Management State
    const [isSavingLocation, setIsSavingLocation] = useState(false);
    const [newLocation, setNewLocation] = useState({ ciudad: '', estado: '' });

    const MEXICAN_STATES = [
        'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Ciudad de México', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
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

        const [qRes, uRes, pRes, lRes, configKey] = await Promise.all([
            getQuotes(cityFilter),
            currSession.role === 'admin' ? getAdminUsers() : Promise.resolve({ success: true, data: [] }),
            getProducts(cityFilter),
            getLocations(),
            currSession.role === 'admin' ? getAppConfig('GOOGLE_MAPS_KEY') : Promise.resolve(null)
        ]);

        if (qRes.success) setQuotes(qRes.data || []);
        if (uRes.success) setUsers(uRes.data || []);
        if (pRes.success) setProducts(pRes.data || []);
        if (lRes.success) {
            setLocations(lRes.data || []);
            if (lRes.data && lRes.data.length > 0 && !newUser.ciudad) {
                setNewUser(prev => ({ ...prev, ciudad: lRes.data[0].ciudad }));
            }
        }
        if (configKey) setMapsKey(configKey);
        setLoading(false);
    };

    const handleUpdateQuoteStatus = async (id: string, status: string) => {
        const res = await updateQuote(id, { status });
        if (res.success) setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    };

    const updateLeadWithRecalculation = (updates: any) => {
        if (!selectedLeadForDetail) return;

        const newLead = { ...selectedLeadForDetail, ...updates };
        const product = products.find(p => p.id === newLead.solution_id);

        const baseUP_Contado = product?.precio_contado_m2 || 0;
        const baseUP_Msi = product?.precio_msi_m2 || 0;

        // Use manual override if present, otherwise catalog
        const up_contado = newLead.manual_unit_price ?? baseUP_Contado;
        const up_msi = newLead.manual_unit_price ?? baseUP_Msi;

        const area = Number(newLead.area) || 0;
        const logistics = Number(newLead.costo_logistico || 0);
        const MIN_PRICE = 5900;

        newLead.precio_total_contado = Math.max(Math.round(area * up_contado), MIN_PRICE) + logistics;
        newLead.precio_total_msi = Math.max(Math.round(area * up_msi), MIN_PRICE) + logistics;

        setSelectedLeadForDetail(newLead);
    };

    const handleSaveLeadDetail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeadForDetail) return;
        setIsSavingDetail(true);

        const updates = {
            status: selectedLeadForDetail.status,
            solution_id: selectedLeadForDetail.solution_id,
            area: Number(selectedLeadForDetail.area),
            precio_total_contado: Number(selectedLeadForDetail.precio_total_contado),
            precio_total_msi: Number(selectedLeadForDetail.precio_total_msi),
            costo_logistico: Number(selectedLeadForDetail.costo_logistico || 0),
            fecha_nacimiento: selectedLeadForDetail.fecha_nacimiento || null,
            factura: selectedLeadForDetail.factura || false,
            notas: selectedLeadForDetail.notas || '',
            pricing_type: selectedLeadForDetail.pricing_type || 'contado',
            address: selectedLeadForDetail.address,
            ciudad: selectedLeadForDetail.ciudad,
            estado: selectedLeadForDetail.estado,
            contact_info: selectedLeadForDetail.contact_info,
            manual_unit_price: selectedLeadForDetail.manual_unit_price,
            // If lead doesn't have an advisor yet, assign the current one
            created_by: selectedLeadForDetail.created_by || session.id
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
            setNewUser({
                name: '', apellido: '', email: '', password: '',
                role: 'editor', ciudad: locations[0]?.ciudad || 'Mérida',
                base: '', telefono: '', contacto_email: ''
            });
            alert('Usuario creado exitosamente');
        } else alert('Error: ' + res.message);
        setIsCreatingUser(false);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userModal.data || !userModal.data.id) return;
        setIsCreatingUser(true);
        const res = await updateAdminUser(userModal.data.id, userModal.data);
        if (res.success) {
            await fetchData(session);
            alert('Perfil actualizado exitosamente');
            setUserModal({ open: false, type: 'edit', data: null });
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

    const handleDeleteUser = async (id: string) => {
        if (confirm('¿Eliminar usuario definitivamente?')) {
            const res = await deleteAdminUser(id);
            if (res.success) fetchData(session);
        }
    };

    const handleSaveProductData = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProduct(true);
        const { data, type } = productModal;

        let res;
        if (type === 'edit') {
            res = await updateProduct(data.id, {
                precio_contado_m2: Number(data.precio_contado_m2),
                precio_msi_m2: Number(data.precio_msi_m2),
                title: data.title,
                ciudad: data.ciudad,
                internal_id: data.internal_id,
                orden: Number(data.orden),
                grosor: data.grosor,
                beneficio_principal: data.beneficio_principal,
                detalle_costo_beneficio: data.detalle_costo_beneficio
            });
        } else if (type === 'create' || type === 'clone') {
            const { id, created_at, ...newData } = data;
            res = await createProduct({
                ...newData,
                precio_contado_m2: Number(newData.precio_contado_m2),
                precio_msi_m2: Number(newData.precio_msi_m2),
                orden: Number(newData.orden || 0)
            });
        }

        if (res?.success) {
            await fetchData(session);
            setProductModal({ ...productModal, open: false });
        } else {
            alert('Error: ' + res?.message);
        }
        setIsSavingProduct(false);
    };

    const handleClone = (prod: any) => {
        setProductModal({
            open: true,
            type: 'clone',
            data: { ...prod, ciudad: '' } // Clear city for user to input
        });
    };

    const handleDeleteProduct = async (id: string) => {
        if (confirm('¿Eliminar esta tarifa regional?')) {
            const res = await deleteProduct(id);
            if (res.success) fetchData(session);
        }
    };

    const handleCreateLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLocation.ciudad || !newLocation.estado) return;
        setIsSavingLocation(true);
        const res = await createLocation(newLocation);
        if (res.success) {
            await fetchData(session);
            const cityCreated = newLocation.ciudad;
            setNewLocation({ ciudad: '', estado: '' });
            alert(`¡Ciudad Habilitada! 📍\n\nRecuerda que para que los clientes en ${cityCreated} puedan cotizar localmente (sin advertencia de zona foránea), debes agregar al menos un precio específico para esta ciudad en la pestaña de 'Tarifas'.`);
        } else alert(res.message);
        setIsSavingLocation(false);
    };

    const handleDeleteLocation = async (id: string) => {
        if (confirm('¿Eliminar esta ubicación? Esto no borrará los precios ya creados, pero la ciudad ya no aparecerá en los menús.')) {
            const res = await deleteLocation(id);
            if (res.success) fetchData(session);
        }
    };

    const handleUpdateMapsKey = async () => {
        setIsSavingKey(true);
        const res = await updateAppConfig('GOOGLE_MAPS_KEY', mapsKey);
        if (res.success) {
            alert('API Key de Google Maps actualizada. Recargue la página principal para aplicar.');
        } else {
            alert(res.message);
        }
        setIsSavingKey(false);
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

    const exportPricesToCSV = () => {
        const filteredPrices = products.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(priceSearchTerm.toLowerCase());
            const matchesCity = priceCityFilter === 'Todas' || p.ciudad === priceCityFilter;
            return matchesSearch && matchesCity;
        });

        if (filteredPrices.length === 0) {
            alert('No hay precios para exportar con los filtros actuales.');
            return;
        }

        const headers = ['Ciudad', 'Sistema', 'ID Interno', 'Precio Contado $/m2', 'Precio MSI $/m2', 'Orden'];
        const rows = filteredPrices.map(p => [
            p.ciudad,
            p.title,
            p.internal_id,
            p.precio_contado_m2,
            p.precio_msi_m2,
            p.orden || 0
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `precios_thermohouse_${new Date().toISOString().split('T')[0]}.csv`);
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
    }).sort((a, b) => {
        // Priority 1: Status 'Nuevo' first
        if (a.status === 'Nuevo' && b.status !== 'Nuevo') return -1;
        if (a.status !== 'Nuevo' && b.status === 'Nuevo') return 1;

        // Priority 2: Oldest first (ASC)
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    if (!session) return <div className="h-screen flex items-center justify-center font-black text-slate-200 uppercase tracking-widest animate-pulse">Cargando Sesión...</div>;

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8 admin-dashboard-layout">
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
                            <button onClick={() => setActiveTab('quotes')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'quotes' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`} title="Gestión de prospectos y cotizaciones">Leads</button>
                            <button onClick={() => setActiveTab('prices')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'prices' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`} title="Control de tarifas regionales y productos">Precios</button>
                            <button onClick={() => setActiveTab('locations')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'locations' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`} title="Configuración de ciudades y estados">Ubicaciones</button>
                            {session.role === 'admin' && (
                                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`} title="Administración de equipo y permisos">Equipo</button>
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
                                        title="Descargar datos de los leads seleccionados en formato CSV"
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
                                            title="Limpiar filtros de fecha"
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
                            {/* Mobile Leads View (Cards) */}
                            <div className="md:hidden divide-y divide-slate-100">
                                {loading ? (
                                    <div className="p-8 text-center text-slate-300 font-black uppercase animate-pulse">Sincronizando Leads...</div>
                                ) : filteredQuotes.length === 0 ? (
                                    <div className="p-8 text-center text-slate-300 font-bold italic">No se encontraron registros</div>
                                ) : (
                                    filteredQuotes.map(q => (
                                        <div key={q.id} className="p-4 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(q.created_at).toLocaleDateString()}</div>
                                                    <div className="font-black text-secondary text-base">{q.contact_info.name}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-primary">${Math.round(q.precio_total_contado).toLocaleString()}</div>
                                                    <div className="text-[9px] font-bold text-slate-400 capitalize">{q.advisor?.name || 'Sistema'}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md"><MapPin className="w-3 h-3" />{q.ciudad}</div>
                                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md"><PencilRuler className="w-3 h-3" />{q.area}m²</div>
                                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md"><Phone className="w-3 h-3" />{q.contact_info.phone}</div>
                                            </div>
                                            <div className="flex items-center justify-between gap-4 pt-2">
                                                <select
                                                    value={q.status}
                                                    onChange={e => handleUpdateQuoteStatus(q.id, e.target.value)}
                                                    className="text-[10px] font-black uppercase bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 outline-none flex-1"
                                                >
                                                    {['Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'].map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setSelectedLeadForDetail(q)} className="p-2 bg-secondary text-white rounded-lg"><FileText className="w-4 h-4" /></button>
                                                    {q.contact_info.phone && <a href={`https://wa.me/52${q.contact_info.phone}`} target="_blank" className="p-2 bg-green-500 text-white rounded-lg"><Phone className="w-4 h-4" /></a>}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop Leads View (Table) */}
                            <table className="hidden md:table w-full text-left">
                                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-5 w-10">
                                            <button
                                                onClick={() => handleSelectAll(filteredQuotes)}
                                                className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                                                title="Seleccionar todos los leads filtrados"
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
                                        <th className="px-8 py-5">Atendido por</th>
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
                                                        title="Seleccionar para acciones masivas"
                                                    >
                                                        {selectedLeads.has(q.id) ? (
                                                            <CheckSquare className="w-4 h-4 text-primary" />
                                                        ) : (
                                                            <Square className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase leading-tight">
                                                    {new Date(q.created_at).toLocaleString('es-MX', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="font-black text-secondary text-sm group-hover:text-primary transition-colors">{q.contact_info.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {q.contact_info.phone}</div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="text-sm font-bold text-slate-700">{q.area}m²</div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-black flex items-center gap-1 mt-1">
                                                        <MapPin className="w-3 h-3" /> {q.ciudad} {q.postal_code ? `| CP ${q.postal_code}` : ''}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="text-sm font-black text-secondary">${Math.round(q.precio_total_contado).toLocaleString()}</div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 mt-1">
                                                        <UserCircle className="w-3 h-3" /> {q.advisor?.name || 'Sistema'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <select
                                                        value={q.status}
                                                        onChange={e => handleUpdateQuoteStatus(q.id, e.target.value)}
                                                        disabled={!canEditQuote(q)}
                                                        className={`text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 outline-none hover:border-primary transition-all cursor-pointer ${!canEditQuote(q) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        title={canEditQuote(q) ? "Actualizar estado del seguimiento" : "Esta cotización está bloqueada para edición"}
                                                    >
                                                        {['Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'].map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex justify-end items-center gap-1.5 p-1 bg-slate-50/50 rounded-2xl border border-transparent group-hover:border-slate-100 transition-all">
                                                        {/* Status de Cotización */}
                                                        <div
                                                            className={`p-2 rounded-xl border transition-all ${q.status !== 'Nuevo' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 text-slate-300 border-slate-200 opacity-40'}`}
                                                            title={q.status !== 'Nuevo' ? "Cotización Formal Emitida / Revisada" : "Cotización Pendiente de Generar"}
                                                        >
                                                            <FileSignature className="w-4 h-4" />
                                                        </div>

                                                        {/* Acciones principales */}
                                                        <button
                                                            onClick={() => setSelectedLeadForDetail(q)}
                                                            className="p-2 bg-white text-secondary border border-slate-200 shadow-sm rounded-xl hover:bg-secondary hover:text-white transition-all active:scale-95"
                                                            title="Ver Ficha y Editar Detalles"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>

                                                        {q.google_maps_link && (
                                                            <a
                                                                href={q.google_maps_link}
                                                                target="_blank"
                                                                className="p-2 bg-white text-blue-500 border border-slate-200 shadow-sm rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                                                title="Ver en Google Maps"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}

                                                        {q.contact_info.phone && (
                                                            <a
                                                                href={`https://wa.me/52${q.contact_info.phone}`}
                                                                target="_blank"
                                                                className="p-2 bg-white text-green-600 border border-slate-200 shadow-sm rounded-xl hover:bg-green-600 hover:text-white transition-all active:scale-95"
                                                                title="Iniciar WhatsApp"
                                                            >
                                                                <Phone className="w-4 h-4" />
                                                            </a>
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
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <h2 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                                    <Package className="w-6 h-6 text-primary" />
                                    Lista de Tarifas Regionales
                                </h2>
                                <p className="text-slate-400 text-xs mt-1">Gestiona precios específicos por ciudad y sistema.</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar sistema..."
                                        className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold w-40 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        value={priceSearchTerm}
                                        onChange={e => setPriceSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer bg-white"
                                    value={priceCityFilter}
                                    onChange={e => setPriceCityFilter(e.target.value)}
                                >
                                    <option value="Todas">Todas las Ciudades</option>
                                    {Array.from(new Set(products.map(p => p.ciudad))).sort().map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={exportPricesToCSV}
                                    className="bg-secondary text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Exportar
                                </button>
                                {session.role === 'admin' && (
                                    <button
                                        onClick={() => setProductModal({
                                            open: true,
                                            type: 'create',
                                            data: { title: '', ciudad: '', precio_contado_m2: 0, precio_msi_m2: 0, internal_id: 'custom', orden: 0 }
                                        })}
                                        className="bg-primary text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Nuevo
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                {/* Mobile Prices View */}
                                <div className="md:hidden divide-y divide-slate-100">
                                    {products.filter(p => {
                                        const matchesSearch = p.title.toLowerCase().includes(priceSearchTerm.toLowerCase());
                                        const matchesCity = priceCityFilter === 'Todas' || p.ciudad === priceCityFilter;
                                        return matchesSearch && matchesCity;
                                    }).map(p => (
                                        <div key={p.id} className="p-5 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-[10px] font-black text-primary uppercase">{p.ciudad}</div>
                                                    <div className="font-bold text-secondary">{p.title}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-secondary">${p.precio_contado_m2} <span className="text-[9px] text-slate-400">Contado</span></div>
                                                    <div className="text-xs font-black text-primary">${p.precio_msi_m2} <span className="text-[9px] text-slate-400">MSI</span></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setProductModal({ open: true, type: 'edit', data: p })} className="p-2 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                                                <button onClick={() => handleClone(p)} className="p-2 bg-blue-50 text-blue-400 border border-blue-100 rounded-lg"><Plus className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-300 border border-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Desktop Prices Table */}
                                <table className="hidden md:table w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5">Ciudad</th>
                                            <th className="px-8 py-5">Sistema</th>
                                            <th className="px-8 py-5">Precio Contado</th>
                                            <th className="px-8 py-5">Precio MSI</th>
                                            <th className="px-8 py-5 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {products.filter(p => {
                                            const matchesSearch = p.title.toLowerCase().includes(priceSearchTerm.toLowerCase());
                                            const matchesCity = priceCityFilter === 'Todas' || p.ciudad === priceCityFilter;
                                            return matchesSearch && matchesCity;
                                        }).length === 0 ? (
                                            <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-bold italic">No se encontraron precios para los filtros aplicados</td></tr>
                                        ) : (
                                            products.filter(p => {
                                                const matchesSearch = p.title.toLowerCase().includes(priceSearchTerm.toLowerCase());
                                                const matchesCity = priceCityFilter === 'Todas' || p.ciudad === priceCityFilter;
                                                return matchesSearch && matchesCity;
                                            }).map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                                                            <span className="text-sm font-black text-secondary">{p.ciudad}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="text-sm font-bold text-slate-700">{p.title}</div>
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{p.internal_id}</div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="text-sm font-black text-secondary">${p.precio_contado_m2}</div>
                                                        <div className="text-[9px] text-slate-400 font-bold">Por m²</div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="text-sm font-black text-primary">${p.precio_msi_m2}</div>
                                                        <div className="text-[9px] text-slate-400 font-bold">Por m²</div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex justify-end gap-1.5 p-1 bg-slate-50/50 rounded-xl border border-transparent group-hover:border-slate-100 transition-all">
                                                            {session.role === 'admin' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => setProductModal({ open: true, type: 'edit', data: p })}
                                                                        className="p-2 bg-white text-slate-400 border border-slate-200 shadow-sm hover:text-secondary rounded-lg transition-all"
                                                                        title="Editar tarifa m2 de este sistema"
                                                                    >
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleClone(p)}
                                                                        className="p-2 bg-white text-blue-400 border border-slate-200 shadow-sm hover:text-blue-600 rounded-lg transition-all"
                                                                        title="Clonar esta tarifa para otra ciudad"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteProduct(p.id)}
                                                                        className="p-2 bg-white text-red-300 border border-slate-200 shadow-sm hover:text-red-600 rounded-lg transition-all"
                                                                        title="Eliminar tarifa regional"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </>
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
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Team Form */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit space-y-8">
                            <div>
                                <h2 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                                    <UserPlus className="w-6 h-6 text-primary" />
                                    {session.role === 'admin' ? 'Dar de alta Asesor' : 'Equipo Interno'}
                                </h2>
                                <p className="text-slate-400 text-xs mt-1">{session.role === 'admin' ? 'Completa el perfil del nuevo integrante' : 'Lista de personal registrado'}</p>
                            </div>

                            {session.role === 'admin' ? (
                                <form onSubmit={handleCreateUser} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                                            <input type="text" required placeholder="Nombre" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                                            <input type="text" required placeholder="Apellido" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" value={newUser.apellido} onChange={e => setNewUser({ ...newUser, apellido: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de Acceso</label>
                                        <input type="email" required placeholder="correo@acceso.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                                        <input type="password" required placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol</label>
                                            <select className="w-full px-2 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}>
                                                <option value="editor">Editor</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sede/Base</label>
                                            <input type="text" placeholder="Ej: Matriz" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" value={newUser.base} onChange={e => setNewUser({ ...newUser, base: e.target.value })} />
                                        </div>
                                    </div>
                                    <button disabled={isCreatingUser} className="w-full bg-secondary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-2">
                                        {isCreatingUser ? 'Guardando...' : 'Registrar Nuevo Perfil'}
                                    </button>
                                </form>
                            ) : (
                                <div className="p-10 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4">
                                    <Shield className="w-10 h-10 text-slate-300" />
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                        Solo Administradores pueden gestionar el equipo profesional
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Team List */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3 mb-6">
                                <Users className="w-6 h-6 text-primary" />
                                Equipo Thermo House
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {users.map(u => (
                                    <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-start justify-between group hover:border-primary/20 transition-all">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                                <UserCircle className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <div className="font-black text-secondary">{u.name} {u.apellido}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1"><Building2 className="w-3 h-3" /> {u.base || 'Gral'} • {u.ciudad}</div>
                                                <div className="mt-3 flex gap-2">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                        {u.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {session.role === 'admin' && (
                                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => setUserModal({ open: true, type: 'edit', data: u })} className="p-2.5 bg-slate-50 text-slate-400 border border-slate-200 shadow-sm hover:bg-white hover:text-primary rounded-xl transition-all" title="Editar Perfil y Datos de Contacto Profesional"><Edit3 className="w-4 h-4" /></button>
                                                <button onClick={() => handleResetPassword(u.id)} className="p-2.5 bg-slate-50 text-slate-400 border border-slate-200 shadow-sm hover:bg-white hover:text-secondary rounded-xl transition-all" title="Restablecer Contraseña de Acceso"><Key className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteUser(u.id)} className="p-2.5 bg-red-50 text-red-300 border border-red-100 shadow-sm hover:bg-white hover:text-red-600 rounded-xl transition-all" title="Eliminar Usuario Definitivamente"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                        {session.role !== 'admin' && (
                                            <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-300 uppercase italic">Solo Lectura</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* User Edit Modal */}
                        {userModal.open && (
                            <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                                <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                                                <Edit3 className="w-7 h-7 text-primary" />
                                                Editar Perfil Profesional
                                            </h3>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Datos técnicos de contacto</p>
                                        </div>
                                        <button onClick={() => setUserModal({ ...userModal, open: false })} className="p-3 bg-white border border-slate-200 rounded-2xl">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={userModal.data.name} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, name: e.target.value } })} required />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={userModal.data.apellido} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, apellido: e.target.value } })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sede / Base</label>
                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={userModal.data.base} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, base: e.target.value } })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de Acceso (Login)</label>
                                                <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={userModal.data.email} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, email: e.target.value } })} required title="Este correo es el que se usa para iniciar sesión" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad</label>
                                                <select className="w-full px-2 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={userModal.data.ciudad} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, ciudad: e.target.value } })}>
                                                    {locations.map(l => <option key={l.id} value={l.ciudad}>{l.ciudad}</option>)}
                                                    {userModal.data.role === 'admin' && <option value="Todas">Todas</option>}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Profesional</label>
                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={userModal.data.telefono} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, telefono: e.target.value } })} placeholder="10 dígitos" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de Contacto</label>
                                                <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={userModal.data.contacto_email} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, contacto_email: e.target.value } })} placeholder="ventas@..." />
                                            </div>
                                        </div>

                                        <button disabled={isCreatingUser} className="w-full bg-secondary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                                            {isCreatingUser ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                            Guardar Cambios de Perfil
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'locations' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2">
                        {/* Location Form */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-fit space-y-8">
                            <div>
                                <h2 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                                    <Map className="w-6 h-6 text-primary" />
                                    {session.role === 'admin' ? 'Abrir Zona' : 'Zonas de Servicio'}
                                </h2>
                                <p className="text-slate-400 text-xs mt-1">{session.role === 'admin' ? 'Registra nuevos centros de operación' : 'Regiones con cobertura'}</p>
                            </div>

                            {session.role === 'admin' ? (
                                <form onSubmit={handleCreateLocation} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                                        <select
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                                            value={newLocation.estado}
                                            onChange={e => setNewLocation({ ...newLocation, estado: e.target.value })}
                                        >
                                            <option value="">Selecciona Estado</option>
                                            {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Nombre de la ciudad"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                                            value={newLocation.ciudad}
                                            onChange={e => setNewLocation({ ...newLocation, ciudad: e.target.value })}
                                        />
                                    </div>
                                    <button disabled={isSavingLocation} className="w-full bg-secondary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-2">
                                        {isSavingLocation ? 'Guardando...' : 'Habilitar Ciudad'}
                                    </button>
                                </form>
                            ) : (
                                <div className="p-10 bg-slate-50 border border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4">
                                    <Shield className="w-10 h-10 text-slate-300" />
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                        Solo Administradores pueden gestionar zonas geográficas
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Google Maps Key Configuration (Admin Only) */}
                        {session.role === 'admin' && (
                            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                        <Key className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-tight text-white">Google Maps API KEY</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Configuración Crítica</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <input
                                        type="password"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-primary outline-none transition-all"
                                        placeholder="AIzaSy..."
                                        value={mapsKey}
                                        onChange={e => setMapsKey(e.target.value)}
                                    />
                                    <button
                                        onClick={handleUpdateMapsKey}
                                        disabled={isSavingKey}
                                        className="w-full bg-primary text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50"
                                    >
                                        {isSavingKey ? 'Guardando...' : 'Actualizar Key Local'}
                                    </button>
                                </div>
                                <p className="text-[8px] text-slate-500 font-bold leading-relaxed uppercase">
                                    ⚠️ Esta llave es necesaria para el funcionamiento del mapa satelital. No la comparta.
                                </p>
                            </div>
                        )}

                        {/* Location List */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3 mb-6">
                                <Navigation className="w-6 h-6 text-primary" />
                                Zonas de Operación Activas
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {locations.filter(l => {
                                    const n = l.ciudad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                    return n !== 'merida';
                                }).map(l => (
                                    <div key={l.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary border border-slate-100">
                                                <MapPin className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="font-black text-secondary uppercase tracking-tight">{l.ciudad}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{l.estado}</div>
                                                {!products.some(p => p.ciudad === l.ciudad) && (
                                                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">
                                                        <AlertCircle className="w-2.5 h-2.5" /> Sin Tarifas Regionales
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {session.role === 'admin' && (
                                            <button
                                                onClick={() => handleDeleteLocation(l.id)}
                                                className="p-3 bg-red-50 text-red-300 hover:text-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {locations.length === 0 && (
                                    <div className="col-span-full py-20 text-center text-slate-300 font-bold italic">No hay ciudades configuradas.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Client Detail Modal (Ficha) */}
            {
                selectedLeadForDetail && (
                    <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 lead-modal-overlay">
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
                                {selectedLeadForDetail.is_out_of_zone && (
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3 text-orange-800 animate-pulse">
                                        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                        <p className="text-[11px] font-black uppercase tracking-tight">Zona Foránea: Requiere validación de costos logísticos</p>
                                    </div>
                                )}

                                {/* Contact Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Cliente</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.contact_info.name}
                                            readOnly={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                            onChange={e => setSelectedLeadForDetail({
                                                ...selectedLeadForDetail,
                                                contact_info: { ...selectedLeadForDetail.contact_info, name: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.contact_info.phone}
                                            readOnly={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                            onChange={e => setSelectedLeadForDetail({
                                                ...selectedLeadForDetail,
                                                contact_info: { ...selectedLeadForDetail.contact_info, phone: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.contact_info.email || ''}
                                            placeholder="No proporcionado"
                                            readOnly={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                            onChange={e => setSelectedLeadForDetail({
                                                ...selectedLeadForDetail,
                                                contact_info: { ...selectedLeadForDetail.contact_info, email: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                                        <input
                                            type="date"
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.fecha_nacimiento || ''}
                                            readOnly={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, fecha_nacimiento: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección de Obra / Proyecto</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.address}
                                            readOnly={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.ciudad}
                                            readOnly={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, ciudad: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.estado}
                                            readOnly={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, estado: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código Postal</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.postal_code || ''}
                                            placeholder="CP"
                                            maxLength={5}
                                            readOnly={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, postal_code: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                                        />
                                    </div>
                                    <div className="space-y-1 flex flex-col justify-end pb-1 ml-1">
                                        <label className={`flex items-center gap-3 group ${(session.role === 'admin' || (session.role === 'editor' && selectedLeadForDetail.status === 'Nuevo')) ? 'cursor-pointer' : 'cursor-default opacity-60'}`}>
                                            <div className={`w-12 h-6 rounded-full transition-all relative ${selectedLeadForDetail.factura ? 'bg-primary' : 'bg-slate-200'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedLeadForDetail.factura ? 'left-7' : 'left-1'}`} />
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedLeadForDetail.factura || false}
                                                disabled={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                                onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, factura: e.target.checked })}
                                            />
                                            <span className={`text-sm font-black text-secondary uppercase tracking-tight transition-colors ${(session.role === 'admin' || (session.role === 'editor' && selectedLeadForDetail.status === 'Nuevo')) ? 'group-hover:text-primary' : ''}`}>¿Requiere Factura? (IVA 16%)</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Negotiation Section */}
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        <h4 className="font-black text-secondary uppercase text-sm">Ajuste Técnico y Comercial</h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ÁREA VERIFICADA (m²)</label>
                                            <input
                                                type="number"
                                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50' : ''}`}
                                                value={selectedLeadForDetail.area}
                                                readOnly={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                                onChange={e => updateLeadWithRecalculation({ area: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">TIPO DE PRECIO PARA REPORTE</label>
                                            <div className={`flex bg-white p-1 rounded-xl border border-slate-200 ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50 opacity-60' : ''}`}>
                                                <button
                                                    type="button"
                                                    disabled={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                                    onClick={() => updateLeadWithRecalculation({ pricing_type: 'contado' })}
                                                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${(!selectedLeadForDetail.pricing_type || selectedLeadForDetail.pricing_type === 'contado') ? 'bg-secondary text-white shadow-md' : 'text-slate-400'}`}
                                                >Contado</button>
                                                <button
                                                    type="button"
                                                    disabled={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                                    onClick={() => updateLeadWithRecalculation({ pricing_type: 'lista' })}
                                                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${selectedLeadForDetail.pricing_type === 'lista' ? 'bg-primary text-white shadow-md' : 'text-slate-400'}`}
                                                >Lista/Promoción</button>
                                            </div>
                                        </div>
                                        {session.role === 'admin' && (
                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">AJUSTE PRECIO UNITARIO ($/m²) - SOLO ADMIN</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        className="w-full pl-8 pr-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-sm font-black text-primary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                        placeholder="Dejar vacío para usar precio de catálogo"
                                                        value={selectedLeadForDetail.manual_unit_price ?? ''}
                                                        onChange={e => updateLeadWithRecalculation({ manual_unit_price: e.target.value === '' ? null : Number(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                        )}
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
                                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50 opacity-60' : ''}`}
                                                value={selectedLeadForDetail.status}
                                                disabled={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                                onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, status: e.target.value })}
                                            >
                                                {['Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SISTEMA FINAL COMPRADO</label>
                                            <select
                                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-primary outline-none ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50 opacity-60' : ''}`}
                                                value={selectedLeadForDetail.solution_id}
                                                disabled={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                                onChange={e => updateLeadWithRecalculation({ solution_id: e.target.value })}
                                            >
                                                {products.filter(p => p.ciudad === selectedLeadForDetail.ciudad || p.ciudad === 'Mérida').map(p => (
                                                    <option key={p.id} value={p.id}>{p.title} ({p.ciudad})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                                                COSTO LOGÍSTICO (FORÁNEO)
                                                {selectedLeadForDetail.is_out_of_zone && <span className="text-[8px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded italic">Recomendado</span>}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    className={`w-full pl-8 pr-4 py-3 bg-white border border-orange-200 rounded-xl text-sm font-bold text-orange-600 outline-none focus:ring-4 focus:ring-orange-100 ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50 opacity-60' : ''}`}
                                                    value={selectedLeadForDetail.costo_logistico || 0}
                                                    readOnly={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                                    onChange={e => updateLeadWithRecalculation({ costo_logistico: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">COSTO TOTAL DEL SISTEMA ($)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full pl-8 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-400 outline-none cursor-not-allowed shadow-inner"
                                                    value={Math.round(selectedLeadForDetail.pricing_type === 'lista' ? selectedLeadForDetail.precio_total_msi : selectedLeadForDetail.precio_total_contado)}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="mt-2 flex items-center justify-between px-2">
                                                <p className="text-[9px] text-slate-400 font-bold italic">* Precio base sin logística ni impuestos.</p>
                                                <div className="text-[11px] font-black text-secondary uppercase bg-slate-100 px-3 py-1 rounded-lg flex gap-4">
                                                    <span>Subtotal: <span className="text-primary">${Number(selectedLeadForDetail.pricing_type === 'lista' ? selectedLeadForDetail.precio_total_msi : selectedLeadForDetail.precio_total_contado).toLocaleString()}</span></span>
                                                    {selectedLeadForDetail.factura && <span className="text-blue-600">+ IVA (16%): ${(Number(selectedLeadForDetail.pricing_type === 'lista' ? selectedLeadForDetail.precio_total_msi : selectedLeadForDetail.precio_total_contado) * 0.16).toLocaleString()}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas y Comentarios Internos</label>
                                    <textarea
                                        className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium min-h-[100px] outline-none focus:ring-4 focus:ring-primary/10 ${(session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo') ? 'bg-slate-50' : ''}`}
                                        placeholder="Escribe notas sobre el cliente o el proceso de venta..."
                                        value={selectedLeadForDetail.notas || ''}
                                        readOnly={session.role !== 'admin' && selectedLeadForDetail.status !== 'Nuevo'}
                                        onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, notas: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowQuotePreview(true)}
                                        className="bg-white text-secondary border-2 border-slate-200 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                        title="Generar y previsualizar reporte formal para el cliente"
                                    >
                                        <FileText className="w-5 h-5" />
                                        Vista Previa Cotización
                                    </button>
                                    {(session.role === 'admin' || (session.role === 'editor' && selectedLeadForDetail.status === 'Nuevo')) && (
                                        <button
                                            disabled={isSavingDetail}
                                            className="bg-secondary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                                            title="Guardar cambios técnicos, comerciales y notas"
                                        >
                                            {isSavingDetail ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                            Actualizar Ficha
                                        </button>
                                    )}
                                    {session.role === 'editor' && selectedLeadForDetail.status !== 'Nuevo' && (
                                        <div className="col-span-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2">
                                            <Shield className="w-5 h-5 text-slate-300" />
                                            <p className="italic text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                * Cotización Bloqueada. <br />Solo Administradores pueden modificar datos después de imprimir.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Quote Preview Modal */}
            {
                showQuotePreview && selectedLeadForDetail && (
                    <div className="fixed inset-0 bg-secondary/95 z-[150] overflow-y-auto p-0 md:p-12 flex items-start justify-center backdrop-blur-md">
                        <div id="printable-quote" className="w-full max-w-4xl bg-white shadow-2xl relative">
                            {/* Browser Controls */}
                            <div className="sticky top-0 bg-slate-900 text-white p-4 flex items-center justify-between z-10 print:hidden">
                                <div className="flex items-center gap-4">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <span className="text-xs font-black uppercase tracking-widest">Reporte de Cotización Formal</span>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            if (selectedLeadForDetail.status === 'Nuevo') {
                                                handleUpdateQuoteStatus(selectedLeadForDetail.id, 'Contactado');
                                            }
                                            window.print();
                                        }}
                                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                        title="Imprimir reporte o exportar a PDF para enviar al cliente"
                                    >
                                        <Printer className="w-4 h-4" /> Imprimir / PDF
                                    </button>
                                    <button
                                        onClick={() => setShowQuotePreview(false)}
                                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                        title="Regresar a la ficha del cliente"
                                    >
                                        Cerrar Vista
                                    </button>
                                </div>
                            </div>

                            {/* Printable Quote Content logic */}
                            {(() => {
                                const basePrice = Number(selectedLeadForDetail.pricing_type === 'lista' ? selectedLeadForDetail.precio_total_msi : selectedLeadForDetail.precio_total_contado);
                                const logistics = Number(selectedLeadForDetail.costo_logistico || 0);
                                const subtotal = basePrice + logistics;
                                const iva = selectedLeadForDetail.factura ? subtotal * 0.16 : 0;
                                const grandTotal = subtotal + iva;

                                return (
                                    <div id="printable-quote" className="bg-white p-12 md:p-20 text-slate-800 font-sans print:p-0">
                                        {/* Header Logo */}
                                        <div className="flex flex-row justify-between items-start mb-16 border-b-4 border-primary pb-8">
                                            <div className="w-2/3">
                                                <h2 className="text-4xl font-black text-secondary tracking-tighter mb-1">THERMO HOUSE</h2>
                                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Aislamiento Térmico & Acústico</p>
                                            </div>
                                            <div className="w-1/3 text-right">
                                                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Cotización Automática</div>
                                                <div className="text-sm font-black text-secondary">#{selectedLeadForDetail.id.slice(0, 8).toUpperCase()}</div>
                                                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Vence en: 7 días hábiles</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-12 mb-16" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Información del Cliente</h4>
                                                <div className="space-y-2">
                                                    <p className="text-xl font-black text-secondary uppercase leading-none">{selectedLeadForDetail.contact_info.name}</p>
                                                    <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                                                        <Phone className="w-3.5 h-3.5" /> +52 {selectedLeadForDetail.contact_info.phone}
                                                    </p>
                                                    <p className="text-[11px] font-medium text-slate-400 flex items-center gap-2 mt-2">
                                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                                        {selectedLeadForDetail.address}, {selectedLeadForDetail.ciudad}, {selectedLeadForDetail.estado}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Detalles del Presupuesto</h4>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-slate-600">Fecha: {new Date(selectedLeadForDetail.created_at).toLocaleString('es-MX')}</p>
                                                    <p className="text-sm font-bold text-slate-600">Vigente hasta: {new Date(new Date(selectedLeadForDetail.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                                                    <p className="text-sm font-black text-secondary mt-4 uppercase">Área Verificada: {selectedLeadForDetail.area} m²</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Product Section */}
                                        <div className="mb-16">
                                            <div className="bg-slate-900 text-white p-6 rounded-t-2xl">
                                                <div className="grid grid-cols-4 text-[10px] font-black uppercase tracking-widest opacity-60">
                                                    <div className="col-span-2">Concepto / Sistema Aplicado</div>
                                                    <div className="text-center">Área</div>
                                                    <div className="text-right">Cantidades</div>
                                                </div>
                                            </div>
                                            <div className="border-x border-b border-slate-100 p-8 space-y-8">
                                                <div className="grid grid-cols-4 items-start">
                                                    <div className="col-span-2">
                                                        <h5 className="text-lg font-black text-secondary uppercase mb-2">
                                                            {products.find(p => p.id === selectedLeadForDetail.solution_id)?.title || 'Sistema Thermo House'}
                                                            <span className="ml-2 text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 align-middle">
                                                                P. {selectedLeadForDetail.pricing_type === 'lista' ? 'LISTA' : 'CONTADO'}
                                                            </span>
                                                        </h5>
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed pr-8">
                                                            Sistema de aislamiento térmico de alta densidad. Incluye preparación de superficie, sellado de grietas, aplicación de base reflectante y capa protectora final.
                                                        </p>
                                                    </div>
                                                    <div className="text-center text-sm font-black text-slate-600">{selectedLeadForDetail.area} m²</div>
                                                    <div className="text-right text-lg font-black text-secondary">
                                                        ${basePrice.toLocaleString()}
                                                    </div>
                                                </div>

                                                {logistics > 0 && (
                                                    <div className="grid grid-cols-4 items-center bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                                        <div className="col-span-2">
                                                            <h6 className="text-[10px] font-black text-orange-800 uppercase tracking-widest">Cargos por Logística Foránea</h6>
                                                            <p className="text-[9px] font-bold text-orange-600/70">Traslado de equipo y personal a zona {selectedLeadForDetail.ciudad}</p>
                                                        </div>
                                                        <div className="text-center">--</div>
                                                        <div className="text-right text-sm font-black text-orange-800">
                                                            + ${logistics.toLocaleString()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Totals Bar */}
                                            <div className="bg-slate-50 p-8 flex justify-end">
                                                <div className="space-y-4 w-full max-w-xs">
                                                    <div className="flex justify-between items-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                                        <span>Subtotal</span>
                                                        <span>${subtotal.toLocaleString()}</span>
                                                    </div>
                                                    {selectedLeadForDetail.factura && (
                                                        <div className="flex justify-between items-center font-bold text-xs uppercase tracking-widest text-blue-500">
                                                            <span>IVA (16%)</span>
                                                            <span>${iva.toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                    <div className="h-px bg-slate-200" />
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-black text-secondary uppercase tracking-widest">Total Final</span>
                                                        <span className="text-3xl font-black text-primary">${grandTotal.toLocaleString()}</span>
                                                    </div>
                                                    {selectedLeadForDetail.pricing_type === 'lista' && (
                                                        <p className="text-[8px] font-bold text-slate-400 text-right uppercase">Sujeto a financiamiento de 12 Meses Sin Intereses con tarjetas participantes.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Terms */}
                                        <div className="grid grid-cols-2 gap-20">
                                            <div className="space-y-4">
                                                <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Condiciones de Venta</h6>
                                                <div className="space-y-2">
                                                    <p className="text-[9px] font-bold text-slate-400 flex items-center gap-2 leading-tight">
                                                        <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                                                        Precios en Pesos Mexicanos. Sujetos a cambios después de la vigencia.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-center pt-8">
                                                <div className="h-px bg-slate-200 mb-4" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Thermo House México</p>
                                                {(() => {
                                                    // Priority: Quote's recorded advisor > Current session user
                                                    const advisor = selectedLeadForDetail.advisor || session;
                                                    const advisorName = advisor?.name || 'Asesor';
                                                    const advisorLastName = advisor?.apellido || '';
                                                    const advisorPhone = advisor?.telefono || '';
                                                    const advisorEmail = advisor?.contacto_email || advisor?.email || 'ventas@thermohouse.mx';

                                                    return (
                                                        <div className="mt-2 space-y-0.5">
                                                            <p className="text-[11px] font-black text-primary uppercase">
                                                                Atendido por: {advisorName} {advisorLastName}
                                                            </p>
                                                            {(advisorPhone || advisorEmail) && (
                                                                <p className="text-[9px] font-bold text-slate-500">
                                                                    {advisorPhone && `Tel: ${advisorPhone}`}
                                                                    {advisorPhone && advisorEmail && ' | '}
                                                                    {advisorEmail}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )
            }
            {/* Product Modal (Create/Edit/Clone) */}
            {
                productModal.open && (
                    <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                                        <Package className="w-7 h-7 text-primary" />
                                        {productModal.type === 'create' ? 'Nuevo Producto' :
                                            productModal.type === 'clone' ? 'Clonar Tarifa Regional' : 'Editar Producto'}
                                    </h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Configuración técnica</p>
                                </div>
                                <button onClick={() => setProductModal({ ...productModal, open: false })} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProductData} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad o Región</label>
                                        <select
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            value={productModal.data.ciudad}
                                            onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, ciudad: e.target.value } })}
                                            required
                                        >
                                            <option value="" disabled>Selecciona una ciudad</option>
                                            {locations.map(l => <option key={l.id} value={l.ciudad}>{l.ciudad} ({l.estado})</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Sistema</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej: TH FORTE XL"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            value={productModal.data.title}
                                            onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, title: e.target.value } })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio Contado $/m²</label>
                                            <input
                                                type="number"
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black text-secondary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={productModal.data.precio_contado_m2}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, precio_contado_m2: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio MSI $/m²</label>
                                            <input
                                                type="number"
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black text-primary outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={productModal.data.precio_msi_m2}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, precio_msi_m2: e.target.value } })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Interno</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 outline-none uppercase"
                                                    value={productModal.data.internal_id}
                                                    onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, internal_id: e.target.value.toLowerCase() } })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Orden de Aparición</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none"
                                                    value={productModal.data.orden}
                                                    onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, orden: e.target.value } })}
                                                />
                                            </div>
                                        </div>

                                        {/* Characteristics Editing */}
                                        <div className="border-t border-slate-100 pt-6 space-y-4">
                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Características del Sistema</h4>
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Grosor / Espesor</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                                                        placeholder="Ej: 1000 micras, 5mm..."
                                                        value={productModal.data.grosor || ''}
                                                        onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, grosor: e.target.value } })}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Beneficio Principal</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                                                        placeholder="Ej: Impermeabilidad Total..."
                                                        value={productModal.data.beneficio_principal || ''}
                                                        onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, beneficio_principal: e.target.value } })}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Detalle Costo/Beneficio</label>
                                                    <textarea
                                                        className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all min-h-[60px]"
                                                        placeholder="Descripción corta para la tarjeta de cotización..."
                                                        value={productModal.data.detalle_costo_beneficio || ''}
                                                        onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, detalle_costo_beneficio: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    disabled={isSavingProduct}
                                    className="w-full bg-secondary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-3 active:scale-[0.98] mt-4"
                                >
                                    {isSavingProduct ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {productModal.type === 'edit' ? 'Actualizar Producto' : 'Crear Tarifa Tarifa'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: letter portrait;
                        margin: 1.5cm;
                    }

                    /* 1. Hide the entire dashboard background */
                    .admin-dashboard-layout {
                        display: none !important;
                    }

                    /* 2. Reset Body/HTML for clean print */
                    html, body {
                        background: white !important;
                        height: auto !important;
                        overflow: visible !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }

                    /* 3. Force the Modal Overlay to become the main page */
                    .lead-modal-overlay {
                        position: static !important;
                        display: block !important;
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        z-index: auto !important;
                        width: 100% !important;
                        height: auto !important;
                        backdrop-filter: none !important;
                    }

                    /* 4. Transform the modal card into a full-page document */
                    .lead-modal-overlay > div {
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }

                    /* 5. Hide modal UI elements (Header bar, Close buttons, Print button itself) */
                    .lead-modal-overlay > div > div:first-child,
                    .lead-modal-overlay button,
                    .print\\:hidden {
                        display: none !important;
                    }

                    /* 6. Ensure the quote content is visible and fills page */
                    #printable-quote {
                        display: block !important;
                        visibility: visible !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }

                    #printable-quote * {
                        visibility: visible !important;
                    }

                    /* 7. Force colors for logos/lines */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div >
    );
}
