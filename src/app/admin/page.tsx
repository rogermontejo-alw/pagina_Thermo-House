'use client';

import { useState, useEffect, useMemo } from 'react';
import { getQuotes, updateQuote, purgeQuotes, getQuote } from '@/app/actions/get-quotes';
import { supabase } from '@/lib/supabase';
import { logoutAdmin, getAdminSession } from '@/app/actions/admin-auth';
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, resetAdminPassword } from '@/app/actions/admin-users';
import { getProducts, updateProduct, cloneProductToCity, deleteProduct, createProduct, getMasterProducts, createMasterProduct, updateMasterProduct, deleteMasterProduct } from '@/app/actions/admin-products';
import { useRouter } from 'next/navigation';
import {
    Users, TrendingUp, Calendar, MapPin, Phone, ExternalLink, Search, Filter,
    CheckCircle2, Clock, AlertCircle, ChevronRight, LogOut, UserPlus, Trash2,
    Shield, Mail, UserCircle, Package, Edit3, Plus, Globe, Save, X, Key, Building2,
    Download, CheckSquare, Square, FileText, Cake, Receipt, FileSignature,
    LayoutGrid, ListOrdered, Navigation, Map, AlertTriangle, Printer, FileCheck, PencilRuler,
    PieChart, BarChart3, ShieldAlert
} from 'lucide-react';
import { getLocations, createLocation, deleteLocation, updateLocation } from '@/app/actions/admin-locations';
import { getAppConfig, updateAppConfig } from '@/app/actions/get-config';
import { MEXICAN_CITIES_BY_STATE } from '@/lib/mexico-data';

// Helper to format dates in Mexico City timezone
const formatDateCDMX = (dateStr: string | Date, options: Intl.DateTimeFormatOptions = {}) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleString('es-MX', {
            timeZone: 'America/Mexico_City',
            ...options
        });
    } catch (e) {
        return String(dateStr);
    }
};

const formatShortDateCDMX = (dateStr: string | Date) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX', {
            timeZone: 'America/Mexico_City',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return String(dateStr);
    }
};

export default function AdminDashboard() {
    const [session, setSession] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'quotes' | 'users' | 'prices' | 'locations' | 'products' | 'config'>('dashboard');
    const [quotes, setQuotes] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [masterProducts, setMasterProducts] = useState<any[]>([]);
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
    const [rangeType, setRangeType] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [isPurging, setIsPurging] = useState(false);
    const [purgePassword, setPurgePassword] = useState('');
    const [purgePasswordInput, setPurgePasswordInput] = useState('');
    const [confirmPurge, setConfirmPurge] = useState(false); // New state for modal-based confirmation
    const [showPurgeModal, setShowPurgeModal] = useState(false);
    const [isSavingPurgePassword, setIsSavingPurgePassword] = useState(false);

    const dashboardQuotes = useMemo(() => {
        let filtered = [...quotes];

        // Get "Now" in CDMX
        const cdmxNowStr = new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
        const now = new Date(cdmxNowStr);

        if (rangeType === 'today') {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            filtered = filtered.filter(q => {
                const qDate = new Date(new Date(q.created_at).toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
                return qDate.getTime() >= todayStart;
            });
        } else if (rangeType === 'week') {
            const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
            filtered = filtered.filter(q => {
                const qDate = new Date(new Date(q.created_at).toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
                return qDate.getTime() >= weekStart;
            });
        } else if (rangeType === 'month') {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
            filtered = filtered.filter(q => {
                const qDate = new Date(new Date(q.created_at).toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
                return qDate.getTime() >= monthStart;
            });
        }

        return filtered;
    }, [quotes, rangeType]);

    // Selection state
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

    // User Creation/Editing State
    const [newUser, setNewUser] = useState({
        name: '',
        apellido: '',
        email: '',
        password: '',
        role: 'editor' as 'admin' | 'manager' | 'editor',
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

    // Password & Delete Modal States
    const [passwordModal, setPasswordModal] = useState<{ open: boolean, userId: string | null, userName: string }>({
        open: false,
        userId: null,
        userName: ''
    });
    const [newPassword, setNewPassword] = useState('');
    const [deleteModal, setDeleteModal] = useState<{
        open: boolean,
        type: 'user' | 'product' | 'location' | 'master',
        id: string | null,
        name: string,
        details?: string
    }>({
        open: false,
        type: 'user',
        id: null,
        name: '',
        details: ''
    });

    // Client Detail Modal
    const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<any>(null);
    const [isSavingDetail, setIsSavingDetail] = useState(false);
    const [showQuotePreview, setShowQuotePreview] = useState(false);

    // Permission helper
    const canEditQuote = (q: any) =>
        session?.role === 'admin' ||
        session?.role === 'manager' ||
        (session?.role === 'editor' && q?.status !== 'Cerrado');

    // Product Modal State
    const [productModal, setProductModal] = useState<{
        open: boolean;
        type: 'edit' | 'create' | 'clone';
        data: any;
        isMaster?: boolean;
    }>({ open: false, type: 'edit', data: null });
    const [isSavingProduct, setIsSavingProduct] = useState(false);

    const router = useRouter();

    // Location Management State
    const [isSavingLocation, setIsSavingLocation] = useState(false);
    const [newLocation, setNewLocation] = useState({ ciudad: '', estado: '' });
    const [locationModal, setLocationModal] = useState<{ open: boolean, data: any }>({
        open: false,
        data: null
    });

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
            if (userSession.role !== 'admin') {
                setActiveTab('quotes');
            }
            // After session is set, fetch initial data
            fetchData(userSession);
        };
        init();
    }, []);

    // Real-time Subscription for Quotes
    useEffect(() => {
        if (!session) return;

        const channel = supabase
            .channel('realtime_quotes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cotizaciones'
                },
                async (payload) => {
                    const isGlobal = session.role === 'admin' || session.role === 'manager';

                    if (payload.eventType === 'INSERT') {
                        const newQuoteRaw = payload.new;
                        if (!isGlobal && newQuoteRaw.ciudad !== session.ciudad) return;

                        const res = await getQuote(newQuoteRaw.id);
                        if (res.success && res.data) {
                            setQuotes(prev => {
                                if (prev.some(q => q.id === res.data.id)) return prev;
                                return [res.data, ...prev];
                            });
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedQuoteRaw = payload.new;

                        if (!isGlobal) {
                            const isAssignedToMe = updatedQuoteRaw.assigned_to === session.id;
                            const isLocalUnassigned = !updatedQuoteRaw.assigned_to && updatedQuoteRaw.ciudad === session.ciudad;

                            if (!isAssignedToMe && !isLocalUnassigned) {
                                setQuotes(prev => prev.filter(q => q.id !== updatedQuoteRaw.id));
                                return;
                            }
                        }

                        const res = await getQuote(updatedQuoteRaw.id);
                        if (res.success && res.data) {
                            setQuotes(prev => {
                                const exists = prev.some(q => q.id === res.data.id);
                                if (exists) {
                                    return prev.map(q => q.id === res.data.id ? res.data : q);
                                } else {
                                    return [res.data, ...prev];
                                }
                            });
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setQuotes(prev => prev.filter(q => q.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session]);

    const fetchData = async (currSession: any) => {
        setLoading(true);
        const cityFilter = (currSession.role === 'admin' || currSession.role === 'manager') ? 'Todas' : currSession.ciudad;

        const [qRes, uRes, pRes, mRes, lRes, configKey] = await Promise.all([
            getQuotes(cityFilter),
            (currSession.role === 'admin' || currSession.role === 'manager') ? getAdminUsers() : Promise.resolve({ success: true, data: [] }),
            getProducts(cityFilter),
            getMasterProducts(),
            getLocations(),
            currSession.role === 'admin' ? getAppConfig('GOOGLE_MAPS_KEY') : Promise.resolve(null)
        ]);

        if (qRes.success) setQuotes(qRes.data || []);
        if (uRes.success) setUsers(uRes.data || []);
        if (pRes.success) setProducts(pRes.data || []);
        if (mRes.success) setMasterProducts(mRes.data || []);
        if (lRes.success) {
            setLocations(lRes.data || []);
            if (lRes.data && lRes.data.length > 0 && !newUser.ciudad) {
                setNewUser(prev => ({ ...prev, ciudad: lRes.data[0].ciudad }));
            }
        }
        if (configKey) setMapsKey(configKey);

        // Sales team (editor) view only their city's prices by default
        if (currSession.role === 'editor') {
            setPriceCityFilter(currSession.ciudad);
        }

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

    const handleAssignLead = async (leadId: string, userId: string) => {
        const res = await updateQuote(leadId, { assigned_to: userId || null });
        if (res.success) {
            // Actualización local optimista
            setQuotes(prev => prev.map(q => {
                if (q.id === leadId) {
                    const assignedUser = users.find(u => u.id === userId);
                    return {
                        ...q,
                        assigned_to: userId || null,
                        assigned_user: assignedUser ? { id: assignedUser.id, name: assignedUser.name, apellido: assignedUser.apellido } : null
                    };
                }
                return q;
            }));
        } else {
            alert('Error al asignar: ' + res.message);
        }
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

    const handleResetPassword = async (id: string, name: string) => {
        setPasswordModal({ open: true, userId: id, userName: name });
        setNewPassword('');
    };

    const confirmResetPassword = async () => {
        if (!newPassword) return;
        setIsCreatingUser(true);
        const res = await resetAdminPassword(passwordModal.userId!, newPassword);
        if (res.success) {
            setPasswordModal({ open: false, userId: null, userName: '' });
            alert('Contraseña actualizada correctamente para ' + passwordModal.userName);
        } else {
            alert(res.message);
        }
        setIsCreatingUser(false);
    };

    const handleDeleteUser = (id: string, name: string) => {
        setDeleteModal({
            open: true,
            type: 'user',
            id: id,
            name: name,
            details: 'Esta acción eliminará permanentemente al asesor de la plataforma.'
        });
    };

    const handleDeleteProduct = (id: string, name: string) => {
        setDeleteModal({
            open: true,
            type: 'product',
            id: id,
            name: name,
            details: 'Se eliminará esta tarifa regional específica.'
        });
    };

    const handleDeleteLocation = (id: string, name: string) => {
        setDeleteModal({
            open: true,
            type: 'location',
            id: id,
            name: name,
            details: 'La ciudad ya no aparecerá en los menús, pero los precios existentes se conservarán.'
        });
    };

    const confirmDeleteAction = async () => {
        setIsCreatingUser(true);
        let res;
        if (deleteModal.type === 'user') {
            res = await deleteAdminUser(deleteModal.id!);
        } else if (deleteModal.type === 'product') {
            res = await deleteProduct(deleteModal.id!);
        } else if (deleteModal.type === 'location') {
            res = await deleteLocation(deleteModal.id!);
        }

        if (res?.success) {
            setDeleteModal({ ...deleteModal, open: false });
            fetchData(session);
        } else if (res) {
            alert(res.message);
        }
        setIsCreatingUser(false);
    };

    const toggleProductActive = async (id: string, current: boolean) => {
        const res = await updateProduct(id, { activo: !current });
        if (res.success) fetchData(session);
    };

    const toggleMasterProductActive = async (id: string, current: boolean) => {
        const res = await updateMasterProduct(id, { activo: !current });
        if (res.success) fetchData(session);
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

    const handleUpdateLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!locationModal.data) return;
        setIsSavingLocation(true);
        const { id, ...data } = locationModal.data;

        // Remove internal fields that shouldn't be updated directly or might cause issues
        const { created_at, ...updateData } = data;

        const res = await updateLocation(id, updateData);
        if (res.success) {
            await fetchData(session);
            setLocationModal({ open: false, data: null });
        } else {
            alert(res.message);
        }
        setIsSavingLocation(false);
    };

    const handleSaveProductData = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProduct(true);
        const { data, type } = productModal;

        let res;
        if (productModal.isMaster) {
            if (type === 'edit') {
                res = await updateMasterProduct(data.id, {
                    title: data.title,
                    internal_id: data.internal_id,
                    category: data.category,
                    grosor: data.grosor,
                    beneficio_principal: data.beneficio_principal,
                    detalle_costo_beneficio: data.detalle_costo_beneficio,
                    orden: Number(data.orden)
                });
            } else {
                res = await createMasterProduct({
                    title: data.title,
                    internal_id: data.internal_id,
                    category: data.category,
                    grosor: data.grosor,
                    beneficio_principal: data.beneficio_principal,
                    detalle_costo_beneficio: data.detalle_costo_beneficio,
                    orden: Number(data.orden || 0)
                });
            }
        } else {
            if (type === 'edit') {
                res = await updateProduct(data.id, {
                    precio_contado_m2: Number(data.precio_contado_m2),
                    precio_msi_m2: Number(data.precio_msi_m2),
                    ciudad: data.ciudad,
                    internal_id: data.internal_id,
                    orden: Number(data.orden),
                    // Strictly pricing and linkage only
                    title: data.title,
                    category: data.category
                });
            } else if (type === 'create' || type === 'clone') {
                const { id, created_at, ...newData } = data;

                // Detailed Validation
                if (!newData.internal_id) {
                    alert('Error: Debes seleccionar un producto del catálogo.');
                    setIsSavingProduct(false);
                    return;
                }
                if (!newData.ciudad) {
                    alert('Error: Debes seleccionar una ciudad para asignar el precio.');
                    setIsSavingProduct(false);
                    return;
                }
                if (!newData.precio_contado_m2 || isNaN(Number(newData.precio_contado_m2))) {
                    alert('Error: El precio de contado debe ser un número válido.');
                    setIsSavingProduct(false);
                    return;
                }

                // Prepare clean object for DB
                const dbProduct: any = {
                    title: newData.title,
                    internal_id: newData.internal_id,
                    category: newData.category,
                    precio_contado_m2: Number(newData.precio_contado_m2),
                    precio_msi_m2: Number(newData.precio_msi_m2 || 0),
                    ciudad: newData.ciudad,
                    orden: Number(newData.orden || 0),
                    grosor: newData.grosor,
                    beneficio_principal: newData.beneficio_principal,
                    detalle_costo_beneficio: newData.detalle_costo_beneficio,
                    producto_id: newData.producto_id,
                    activo: true
                };

                res = await createProduct(dbProduct);
            }
        }

        if (res?.success) {
            await fetchData(session);
            setProductModal({ ...productModal, open: false });
        } else {
            console.error('Save Product Error:', res);
            alert('No se pudo guardar: ' + (res?.message || 'Error desconocido del servidor'));
        }
        setIsSavingProduct(false);
    };

    const handleClone = (prod: any) => {
        setProductModal({
            open: true,
            type: 'clone',
            isMaster: false,
            data: { ...prod, id: undefined, created_at: undefined, ciudad: '' } // Clear city for user to input
        });
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

    const handlePurgeLeads = async () => {
        if (!purgePasswordInput) {
            alert('Por favor ingrese la contraseña de depuración para continuar.');
            return;
        }

        if (!confirmPurge) {
            alert('Por favor, marca la casilla de confirmación para autorizar el borrado permanente.');
            return;
        }

        setIsPurging(true);
        try {
            const res = await purgeQuotes(purgePasswordInput);
            if (res.success) {
                alert(res.message);
                setShowPurgeModal(false);
                setPurgePasswordInput('');
                setConfirmPurge(false);
                await fetchData(session);
            } else {
                alert(res.message);
            }
        } catch (err) {
            alert('Ocurrió un error al intentar purgar los datos.');
        } finally {
            setIsPurging(false);
        }
    };

    const handleUpdatePurgePassword = async () => {
        if (!purgePassword) return;
        setIsSavingPurgePassword(true);
        const res = await updateAppConfig('PURGE_PASSWORD', purgePassword);
        if (res.success) {
            alert('Contraseña de depuración actualizada.');
        } else {
            alert('Error: ' + res.message);
        }
        setIsSavingPurgePassword(false);
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
            formatShortDateCDMX(q.created_at),
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

        // Normalize date comparison for CDMX
        const qDateCDMXStr = new Date(q.created_at).toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
        const qDate = new Date(qDateCDMXStr);

        const matchesStartDate = !startDate || qDate >= new Date(startDate + 'T00:00:00');
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
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block">
                            <img src="/logo.png" alt="Thermo House" className="h-12 w-auto filter brightness-110 drop-shadow-sm" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                                    {session.role === 'admin' ? 'Acceso Total' : session.role === 'manager' ? 'Gerencia Global' : `Zona: ${session.ciudad}`}
                                </span>
                            </div>
                            <h1 className="text-3xl font-black text-secondary uppercase tracking-tight">Management Suite</h1>
                            <p className="text-slate-400 text-sm">Bienvenido de nuevo, {session.name}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-1">
                            {(session.role === 'admin' || session.role === 'manager') && (
                                <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`} title="Resumen general de métricas">Dashboard</button>
                            )}
                            <button onClick={() => setActiveTab('quotes')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'quotes' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`} title="Gestión de prospectos y cotizaciones">Leads</button>
                            {session.role === 'admin' && (
                                <>
                                    <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`} title="Fichas técnicas y productos maestros">Productos</button>
                                </>
                            )}
                            {(session.role === 'admin' || session.role === 'manager' || session.role === 'editor') && (
                                <>
                                    <button onClick={() => setActiveTab('prices')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'prices' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`} title="Consulta de tarifas regionales">Precios</button>
                                </>
                            )}
                            {session.role === 'admin' && (
                                <>
                                    <button onClick={() => setActiveTab('locations')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'locations' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`} title="Configuración de ciudades">Ubicaciones</button>
                                    <button onClick={() => setActiveTab('config')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`} title="Ajustes globales del sistema">Configuración</button>
                                </>
                            )}
                            {(session.role === 'admin' || session.role === 'manager') && (
                                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-secondary text-white shadow-lg' : 'text-slate-400 hover:text-secondary'}`} title="Administración de equipo">Equipo</button>
                            )}
                        </div>
                        <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold border border-red-100 hover:bg-red-100 transition-all"><LogOut className="w-4 h-4" /></button>
                    </div>
                </div>


                {activeTab === 'dashboard' && (session.role === 'admin' || session.role === 'manager') && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Dashboard Header with Range Selectors */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-secondary uppercase tracking-tight">Rendimiento Operativo</h2>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Métricas en tiempo real basadas en leads cotizados</p>
                            </div>
                            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm self-start md:self-center">
                                {[
                                    { id: 'all', label: 'TODO' },
                                    { id: 'today', label: 'DÍA' },
                                    { id: 'week', label: 'SEMANA' },
                                    { id: 'month', label: 'MES' }
                                ].map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => setRangeType(r.id as any)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${rangeType === r.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-secondary'}`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 1. Quick Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {[
                                { label: 'Total Leads', val: dashboardQuotes.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                                { label: 'Ventas (Cerrado)', val: dashboardQuotes.filter(q => q.status === 'Cerrado').length, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
                                { label: 'Tasa Conv.', val: `${dashboardQuotes.length > 0 ? Math.round((dashboardQuotes.filter(q => q.status === 'Cerrado').length / dashboardQuotes.length) * 100) : 0}%`, icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-50' },
                                { label: 'Sin Atender', val: dashboardQuotes.filter(q => q.status === 'Nuevo').length, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-2 hover:shadow-xl transition-all duration-300 group">
                                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-2xl font-black text-secondary leading-none pt-2">{stat.val}</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* 2. Products Summary */}
                            <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black text-secondary uppercase tracking-tight flex items-center gap-2">
                                            <Package className="w-5 h-5 text-primary" />
                                            Sistemas más Solicitados
                                        </h3>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Distribución por volumen de leads</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {Array.from(new Set(dashboardQuotes.map(q => q.soluciones_precios?.title || 'No especificado')))
                                        .map(title => ({
                                            title,
                                            count: dashboardQuotes.filter(q => (q.soluciones_precios?.title || 'No especificado') === title).length
                                        }))
                                        .sort((a, b) => b.count - a.count)
                                        .slice(0, 5)
                                        .map((prod, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                                    <span className="text-secondary">{prod.title}</span>
                                                    <span className="text-primary">{prod.count} Leads</span>
                                                </div>
                                                <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                                                    <div
                                                        className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(255,107,38,0.3)] transition-all duration-1000 ease-out"
                                                        style={{ width: `${(prod.count / (dashboardQuotes.length || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* 3. Payment Preference */}
                            <div className="bg-secondary p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                                    <PieChart className="w-32 h-32 text-white" />
                                </div>
                                <div className="relative z-10 space-y-8">
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Preferencias</h3>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Métodos de pago sugeridos</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { label: 'Pago Contado', val: dashboardQuotes.filter(q => q.pricing_type === 'contado' || !q.pricing_type).length, color: 'bg-primary' },
                                            { label: '12 MSI', val: dashboardQuotes.filter(q => q.pricing_type === 'lista').length, color: 'bg-blue-400' }
                                        ].map((pay, i) => (
                                            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{pay.label}</span>
                                                    <span className="text-xl font-black text-white">{Math.round((pay.val / (dashboardQuotes.length || 1)) * 100)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${pay.color} transition-all duration-1000`}
                                                        style={{ width: `${(pay.val / (dashboardQuotes.length || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* 4. Sales by City */}
                            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                <div>
                                    <h3 className="text-xl font-black text-secondary uppercase tracking-tight flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-primary" />
                                        Distribución por Ciudad
                                    </h3>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Presencia regional activa</p>
                                </div>
                                <div className="overflow-hidden rounded-2xl border border-slate-50">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Ciudad</th>
                                                <th className="px-6 py-4">Leads</th>
                                                <th className="px-6 py-4 text-right">Potencial</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {Array.from(new Set(dashboardQuotes.map(q => q.ciudad)))
                                                .map(city => ({
                                                    name: city,
                                                    count: dashboardQuotes.filter(q => q.ciudad === city).length,
                                                    total: dashboardQuotes.filter(q => q.ciudad === city).reduce((sum, q) => sum + (q.precio_total_contado || 0), 0)
                                                }))
                                                .sort((a, b) => b.count - a.count)
                                                .slice(0, 5)
                                                .map((city, i) => (
                                                    <tr key={i} className="hover:bg-slate-50 transition-all group">
                                                        <td className="px-6 py-4 font-bold text-secondary text-xs">{city.name}</td>
                                                        <td className="px-6 py-4 text-xs font-black text-slate-400">{city.count}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-[10px] font-black text-primary px-3 py-1 bg-primary/5 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                                                                ${Math.round(city.total / 1000)}k
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 5. Unattended Clients (Alert List) */}
                            <div className="bg-orange-50/50 p-10 rounded-[2.5rem] border border-orange-100 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-black text-secondary uppercase tracking-tight flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                                            Atención Prioritaria
                                        </h3>
                                        <p className="text-orange-900/40 text-[10px] font-bold uppercase tracking-widest mt-1">Nuevos prospectos sin contacto</p>
                                    </div>
                                    <button onClick={() => { setActiveTab('quotes'); setStatusFilter('Nuevo'); }} className="text-[9px] font-black py-2 px-4 bg-white border border-orange-100 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all uppercase tracking-widest shadow-sm">Ver Todos</button>
                                </div>
                                <div className="space-y-3">
                                    {dashboardQuotes.filter(q => q.status === 'Nuevo').slice(0, 4).map((q, i) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl border border-orange-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center font-black">{q.contact_info?.name?.[0] || '?'}</div>
                                                <div>
                                                    <div className="text-xs font-black text-secondary">{q.contact_info?.name || 'Cliente'}</div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase">{q.ciudad} • {formatShortDateCDMX(q.created_at)}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[9px] font-black text-primary px-2 py-0.5 bg-primary/5 rounded-full uppercase">{q.area}m²</div>
                                            </div>
                                        </div>
                                    ))}
                                    {dashboardQuotes.filter(q => q.status === 'Nuevo').length === 0 && (
                                        <div className="p-8 text-center text-slate-400 font-bold italic border-2 border-dashed border-orange-100 rounded-[2rem]">¡Todo al día! Sin pendientes.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 6. Advisor Performance */}
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                            <div>
                                <h3 className="text-xl font-black text-secondary uppercase tracking-tight flex items-center gap-2">
                                    <UserCircle className="w-5 h-5 text-primary" />
                                    Rendimiento por Asesor
                                </h3>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Productividad y cierre de ventas</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from(new Set(dashboardQuotes.filter(q => q.advisor).map(q => q.advisor.name + ' ' + (q.advisor.apellido || ''))))
                                    .map(advisorName => {
                                        const advisorQuotes = dashboardQuotes.filter(q => (q.advisor?.name + ' ' + (q.advisor?.apellido || '')) === advisorName);
                                        const closedSales = advisorQuotes.filter(q => q.status === 'Cerrado').length;
                                        const convRate = advisorQuotes.length > 0 ? Math.round((closedSales / advisorQuotes.length) * 100) : 0;
                                        const totalVol = advisorQuotes.reduce((sum, q) => sum + (q.precio_total_contado || 0), 0);

                                        return (
                                            <div key={advisorName} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 hover:border-primary/20 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary border border-slate-100 font-black shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                                        {advisorName[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-secondary">{advisorName}</div>
                                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{advisorQuotes.length} Leads gestionados</div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                                        <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Cierres</div>
                                                        <div className="text-sm font-black text-green-500">{closedSales}</div>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                                        <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Conversión</div>
                                                        <div className="text-sm font-black text-primary">{convRate}%</div>
                                                    </div>
                                                </div>
                                                <div className="pt-2">
                                                    <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Volumen Total</div>
                                                    <div className="text-base font-black text-secondary">${Math.round(totalVol / 1000)}k</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {quotes.filter(q => q.advisor).length === 0 && (
                                    <div className="col-span-full p-12 text-center text-slate-300 font-bold italic border-2 border-dashed border-slate-100 rounded-[2rem]">
                                        Aún no hay asignaciones registradas.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">{formatShortDateCDMX(q.created_at)}</div>
                                                    <div className="font-black text-secondary text-base">{q.contact_info.name}</div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-black text-secondary">${Math.round(q.precio_total_contado).toLocaleString()}</span>
                                                        {(!q.pricing_type || q.pricing_type === 'contado') && (
                                                            <span className="text-[6px] font-black px-1 py-0.5 bg-secondary text-white rounded uppercase tracking-tighter">Elegido</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-bold text-primary">${Math.round(q.precio_total_msi).toLocaleString()} <span className="text-[8px] opacity-60">MSI</span></span>
                                                        {q.pricing_type === 'lista' && (
                                                            <span className="text-[6px] font-black px-1 py-0.5 bg-primary text-white rounded uppercase tracking-tighter">Elegido</span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 flex flex-col items-end">
                                                        <div className="text-[7px] text-slate-300 font-bold uppercase mb-0.5">Asignado a:</div>
                                                        {(session.role === 'admin' || session.role === 'manager') ? (
                                                            <select
                                                                value={q.assigned_to || ''}
                                                                onChange={(e) => handleAssignLead(q.id, e.target.value)}
                                                                className="text-[8px] font-black uppercase bg-slate-100 border-none rounded-md px-2 py-0.5 outline-none max-w-[120px]"
                                                            >
                                                                <option value="">Por Asignar</option>
                                                                {users.map(u => (
                                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <div className="text-[9px] font-black text-secondary flex items-center gap-1">
                                                                {q.assigned_user ? q.assigned_user.name : 'Sin asignar'}
                                                            </div>
                                                        )}
                                                        <div className="text-[7px] font-bold text-slate-300 capitalize mt-1">Vía: {q.advisor?.name || 'Sistema'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md"><MapPin className="w-3 h-3" />{q.ciudad}</div>
                                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md"><PencilRuler className="w-3 h-3" />{q.area}m²</div>
                                                <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md"><Phone className="w-3 h-3" />{q.contact_info.phone}</div>
                                                {q.is_out_of_zone && (
                                                    <span className="ml-1.5 px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[7px] font-black animate-pulse">FORÁNEO</span>
                                                )}
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
                                        <th className="px-8 py-5">Proyecto / Info</th>
                                        <th className="px-8 py-5">Presupuesto / Asignación</th>
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
                                                    {formatDateCDMX(q.created_at, {
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
                                                        {q.is_out_of_zone && (
                                                            <span className="ml-1.5 px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[7px] font-black animate-pulse">FORÁNEO</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm font-black text-secondary">${Math.round(q.precio_total_contado).toLocaleString()}</div>
                                                            {(!q.pricing_type || q.pricing_type === 'contado') && (
                                                                <span className="text-[7px] font-black px-1 py-0.5 bg-secondary text-white rounded uppercase tracking-tighter">Elegido</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-[11px] font-bold text-primary">${Math.round(q.precio_total_msi).toLocaleString()} <span className="text-[8px] opacity-70">MSI</span></div>
                                                            {q.pricing_type === 'lista' && (
                                                                <span className="text-[7px] font-black px-1 py-0.5 bg-primary text-white rounded uppercase tracking-tighter">Elegido</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-2 border-t border-slate-50">
                                                        <div className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 flex items-center gap-1 px-1">
                                                            <div className="w-1 h-1 rounded-full bg-primary animate-pulse" /> Seguimiento / Asignación
                                                        </div>
                                                        {(session.role === 'admin' || session.role === 'manager') ? (
                                                            <div className="relative group/sel">
                                                                <select
                                                                    value={q.assigned_to || ''}
                                                                    onChange={(e) => handleAssignLead(q.id, e.target.value)}
                                                                    className="w-full text-[9px] font-black uppercase bg-slate-100/80 hover:bg-slate-200/50 border border-slate-200/50 rounded-lg px-2.5 py-2 outline-none transition-all cursor-pointer appearance-none"
                                                                >
                                                                    <option value="">🔘 Por Asignar</option>
                                                                    {users.map(u => (
                                                                        <option key={u.id} value={u.id}>👤 {u.name} {u.apellido || ''}</option>
                                                                    ))}
                                                                </select>
                                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/sel:opacity-100 transition-opacity">
                                                                    <ChevronRight className="w-3 h-3 rotate-90" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={`text-[9px] font-black uppercase flex items-center gap-1.5 px-3 py-2 rounded-lg ${q.assigned_to === session.id ? 'bg-primary/10 text-primary border border-primary/10' : 'bg-slate-100/50 text-slate-400'}`}>
                                                                <UserCircle className="w-3 h-3" />
                                                                {q.assigned_user ?
                                                                    (q.assigned_to === session.id ? '⚠️ Asignado a Ti' : `${q.assigned_user.name} ${q.assigned_user.apellido || ''}`)
                                                                    : 'Sin Asignar'}
                                                            </div>
                                                        )}
                                                        <div className="text-[7px] text-slate-300 font-bold uppercase mt-1.5 px-1 flex items-center gap-1">
                                                            Originado por: <span className="text-slate-400">{q.advisor?.name || 'Sistema Web'}</span>
                                                        </div>
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
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedLeadForDetail(q);
                                                                setShowQuotePreview(true);
                                                            }}
                                                            className={`p-2 rounded-xl border transition-all hover:scale-110 active:scale-95 ${q.status !== 'Nuevo' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 text-slate-300 border-slate-200'}`}
                                                            title={q.status !== 'Nuevo' ? "Ver Cotización Generada" : "Ver Previsualización de Cotización"}
                                                        >
                                                            <FileSignature className="w-4 h-4" />
                                                        </button>

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
                                    disabled={session.role === 'editor'}
                                    className={`px-4 py-2.5 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer bg-white ${session.role === 'editor' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    value={priceCityFilter}
                                    onChange={e => setPriceCityFilter(e.target.value)}
                                >
                                    {session.role !== 'editor' && <option value="Todas">Todas las Ciudades</option>}
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
                                            isMaster: false,
                                            data: { title: '', ciudad: '', precio_contado_m2: 0, precio_msi_m2: 0, internal_id: '', orden: 0 }
                                        })}
                                        className="bg-primary text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Nueva Tarifa Regional
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
                                                <button
                                                    disabled={session.role === 'editor'}
                                                    onClick={() => toggleProductActive(p.id, p.activo !== false)}
                                                    className={`p-2 rounded-lg border text-[8px] font-black uppercase tracking-tighter ${p.activo !== false ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-200'} ${session.role === 'editor' ? 'opacity-80' : 'cursor-pointer'}`}
                                                >
                                                    {p.activo !== false ? 'Activo' : 'Pausado'}
                                                </button>
                                                {(session.role === 'admin' || session.role === 'manager') && (
                                                    <>
                                                        <button onClick={() => setProductModal({ open: true, type: 'edit', data: p })} className="p-2 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                                                        <button onClick={() => handleClone(p)} className="p-2 bg-blue-50 text-blue-400 border border-blue-100 rounded-lg"><Plus className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteProduct(p.id, p.title + ' en ' + p.ciudad)} className="p-2 bg-red-50 text-red-300 border border-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                    </>
                                                )}
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
                                            <th className="px-8 py-5">Estado</th>
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
                                                    <td className="px-8 py-5">
                                                        <button
                                                            disabled={session.role === 'editor'}
                                                            onClick={() => toggleProductActive(p.id, !(p.activo !== false))}
                                                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${p.activo !== false ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-100 text-slate-400 border border-slate-200'} ${session.role === 'editor' ? 'opacity-80' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                                                        >
                                                            {p.activo !== false ? '● Activo' : '○ Pausado'}
                                                        </button>
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
                                                                        onClick={() => handleDeleteProduct(p.id, p.title + ' en ' + p.ciudad)}
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
                    <div className="flex flex-col gap-8">
                        {/* Team Form */}
                        {session.role === 'admin' && (
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                                <div>
                                    <h2 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                                        <UserPlus className="w-6 h-6 text-primary" />
                                        Dar de alta Asesor
                                    </h2>
                                    <p className="text-slate-400 text-xs mt-1">Completa el perfil del nuevo integrante</p>
                                </div>

                                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                                        <input type="text" required placeholder="Nombre" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
                                        <input type="text" required placeholder="Apellido" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" value={newUser.apellido} onChange={e => setNewUser({ ...newUser, apellido: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Acceso</label>
                                        <input type="email" required placeholder="correo@acceso.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                                        <input type="password" required placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol</label>
                                        <select className="w-full px-2 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}>
                                            <option value="editor">Editor / Asesor</option>
                                            <option value="manager">Gerencia</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad Asignada</label>
                                        <select className="w-full px-2 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={newUser.ciudad} onChange={e => setNewUser({ ...newUser, ciudad: e.target.value })}>
                                            {locations.map(l => <option key={l.id} value={l.ciudad}>{l.ciudad}</option>)}
                                            {(newUser.role === 'admin' || newUser.role === 'manager') && <option value="Todas">Todas (Global)</option>}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sede / Base</label>
                                        <input type="text" placeholder="Ej: Matriz" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" value={newUser.base} onChange={e => setNewUser({ ...newUser, base: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Profesional</label>
                                        <input type="text" placeholder="10 dígitos" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" value={newUser.telefono} onChange={e => setNewUser({ ...newUser, telefono: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Público</label>
                                        <input type="email" placeholder="ventas@..." className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" value={newUser.contacto_email} onChange={e => setNewUser({ ...newUser, contacto_email: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-1">
                                        <button disabled={isCreatingUser} className="w-full bg-secondary text-white py-3 rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-2">
                                            {isCreatingUser ? 'Guardando...' : 'Registrar Perfil'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Team List */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3 mb-6">
                                <Users className="w-6 h-6 text-primary" />
                                Equipo Thermo House
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {users.map(u => (
                                    <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between group hover:border-primary/20 transition-all gap-4">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all flex-shrink-0">
                                                <UserCircle className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <div className="font-black text-secondary uppercase tracking-tight">{u.name} {u.apellido}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1"><Building2 className="w-3 h-3" /> {u.base || 'Gral'} • {u.ciudad}</div>
                                                <div className="mt-3 flex gap-2">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        u.role === 'manager' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                            'bg-blue-50 text-blue-600 border-blue-100'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {(session.role === 'admin' || session.role === 'manager') && (
                                            <div className="flex flex-row sm:flex-col gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50 sm:opacity-0 sm:group-hover:opacity-100 transition-all overflow-x-auto">
                                                <button onClick={() => setUserModal({ open: true, type: 'edit', data: u })} className="flex-1 sm:flex-none p-3 bg-slate-50 text-slate-400 border border-slate-200 shadow-sm hover:bg-white hover:text-primary rounded-xl transition-all flex items-center justify-center gap-2" title="Editar Perfil">
                                                    <Edit3 className="w-4 h-4" />
                                                    <span className="text-[8px] font-black uppercase sm:hidden">Editar</span>
                                                </button>
                                                <button onClick={() => handleResetPassword(u.id, u.name)} className="flex-1 sm:flex-none p-3 bg-slate-50 text-slate-400 border border-slate-200 shadow-sm hover:bg-white hover:text-secondary rounded-xl transition-all flex items-center justify-center gap-2" title="Clave">
                                                    <Key className="w-4 h-4" />
                                                    <span className="text-[8px] font-black uppercase sm:hidden">Clave</span>
                                                </button>
                                                <button onClick={() => handleDeleteUser(u.id, u.name)} className="flex-1 sm:flex-none p-3 bg-red-50 text-red-300 border border-red-100 shadow-sm hover:bg-white hover:text-red-600 rounded-xl transition-all flex items-center justify-center gap-2" title="Eliminar">
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="text-[8px] font-black uppercase sm:hidden">Eliminar</span>
                                                </button>
                                            </div>
                                        )}
                                        {session.role !== 'admin' && session.role !== 'manager' && (
                                            <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-300 uppercase italic self-start">Solo Lectura</div>
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                                                    {(userModal.data.role === 'admin' || userModal.data.role === 'manager') && <option value="Todas">Todas</option>}
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
                                        <select
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                                            value={newLocation.ciudad}
                                            onChange={e => setNewLocation({ ...newLocation, ciudad: e.target.value })}
                                        >
                                            <option value="">Selecciona Ciudad</option>
                                            {newLocation.estado && MEXICAN_CITIES_BY_STATE[newLocation.estado]?.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
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

                        {/* Map Configuration moved to Config tab */}

                        {/* Location List */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex flex-col gap-6">
                                {/* Base City Highlight */}
                                {locations.filter(l => l.ciudad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 'merida').map(l => (
                                    <div key="base-merida" className="bg-primary/5 border-2 border-primary/20 p-8 rounded-[2.5rem] flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-primary text-white rounded-[2rem] flex items-center justify-center shadow-lg shadow-primary/20">
                                                <Globe className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Sede Central de Operaciones</div>
                                                <h3 className="text-3xl font-black text-secondary uppercase tracking-tighter">{l.ciudad}</h3>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{l.estado}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="hidden md:block">
                                                <span className="px-5 py-2 bg-white border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-sm">Sede Base</span>
                                            </div>
                                            {session.role === 'admin' && (
                                                <button
                                                    onClick={() => setLocationModal({ open: true, data: { ...l, redes_sociales: l.redes_sociales || { facebook: '', instagram: '', whatsapp: '' } } })}
                                                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-primary rounded-xl shadow-sm transition-all active:scale-95"
                                                    title="Editar Ficha de Sucursal Principal"
                                                >
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sucursales y Zonas de Operación Regionales</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {locations.filter(l => l.ciudad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== 'merida').map(l => {
                                            return (
                                                <div key={l.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary border border-slate-100">
                                                            <MapPin className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-black text-secondary uppercase tracking-tight">{l.ciudad}</div>
                                                            </div>
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{l.estado}</div>
                                                            {!products.some(p => p.ciudad === l.id || p.ciudad === l.ciudad) && (
                                                                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">
                                                                    <AlertCircle className="w-2.5 h-2.5" /> Sin Tarifas Regionales
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {session.role === 'admin' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setLocationModal({ open: true, data: { ...l, redes_sociales: l.redes_sociales || { facebook: '', instagram: '', whatsapp: '' } } })}
                                                                className="p-3 bg-slate-50 text-slate-400 hover:text-primary border border-slate-100 rounded-xl transition-all"
                                                                title="Editar Detalles de Sucursal"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLocation(l.id, l.ciudad)}
                                                                className="p-3 bg-red-50 text-red-300 hover:text-red-600 rounded-xl transition-all"
                                                                title="Eliminar Zona de Operación"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {locations.length <= 1 && (
                                            <div className="col-span-full py-20 text-center text-slate-300 font-bold italic border-2 border-dashed border-slate-100 rounded-[2rem]">No hay sucursales regionales configuradas.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'config' && session.role === 'admin' && (
                    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                            <div>
                                <h2 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                                    <Globe className="w-6 h-6 text-primary" />
                                    Ajustes Globales del Sistema
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">Configuración técnica y llaves de API externas</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                            <Key className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-tight text-white">Google Maps API KEY</h3>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mapas Satelitales</p>
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
                                            {isSavingKey ? 'Guardando...' : 'Actualizar Key'}
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                            <ShieldAlert className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-tight text-red-900">Seguridad y Limpieza</h3>
                                            <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Control de purga de base de datos</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-red-300 uppercase tracking-widest ml-1">Contraseña Máster de Depuración</label>
                                            <input
                                                type="password"
                                                className="w-full bg-white border border-red-100 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-red-100 outline-none transition-all"
                                                placeholder="Asigna una contraseña..."
                                                value={purgePassword}
                                                onChange={e => setPurgePassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdatePurgePassword}
                                                disabled={isSavingPurgePassword}
                                                className="flex-[2] bg-secondary text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                                            >
                                                {isSavingPurgePassword ? 'Guardando...' : 'Guardar Nueva Clave'}
                                            </button>
                                            <button
                                                onClick={() => setShowPurgeModal(true)}
                                                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                                            >
                                                Purgar Datos
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                                        <Package className="w-6 h-6 text-primary" />
                                        Catálogo Maestro de Productos
                                    </h2>
                                    <p className="text-slate-400 text-sm mt-1">Define las características técnicas de cada sistema termoaislante</p>
                                </div>
                                {session.role === 'admin' && (
                                    <button
                                        onClick={() => setProductModal({ open: true, type: 'create', data: { title: '', internal_id: '', category: 'concrete' } })}
                                        className="bg-secondary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Nuevo Producto Master
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(masterProducts.length > 0 ? masterProducts : Array.from(new Set(products.map(p => p.internal_id))).map(id => products.find(prod => prod.internal_id === id))).map((p: any) => (
                                    <div key={p.id || p.internal_id} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 space-y-4 hover:shadow-xl hover:shadow-slate-100/50 transition-all border-b-4 border-b-primary/20">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black bg-primary text-white px-2 py-0.5 rounded-full uppercase">{p?.category}</span>
                                                <button
                                                    onClick={() => toggleMasterProductActive(p.id, !(p.activo !== false))}
                                                    className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase transition-all ${p.activo !== false ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}
                                                >
                                                    {p.activo !== false ? '● Activo' : '○ Pausado'}
                                                </button>
                                            </div>
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ORDEN #{p?.orden}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-secondary tracking-tight text-lg leading-tight uppercase">{p?.title}</h3>
                                            <p className="text-[10px] font-mono font-black text-slate-300 uppercase mt-1">{p?.internal_id}</p>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Espesor</p>
                                                <p className="text-[11px] font-black text-secondary uppercase">{p?.grosor || '---'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Zonas Activas</p>
                                                <p className="text-[11px] font-black text-primary uppercase">
                                                    {products.filter(prod => prod.internal_id === p.internal_id).length} Ciudades
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setProductModal({ open: true, type: 'edit', data: p, isMaster: true })}
                                                className="flex-1 bg-white border border-slate-200 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                                            >
                                                Editar Ficha
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {masterProducts.length === 0 && products.length > 0 && (
                                <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 text-blue-800">
                                    <AlertCircle className="w-5 h-5 text-blue-500" />
                                    <p className="text-[10px] font-black uppercase tracking-tight">Modo Legado: Los productos se están derivando de los precios regionales. Para habilitar el catálogo maestro, ejecute la migración SQL.</p>
                                </div>
                            )}
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
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.contact_info.name}
                                            readOnly={!canEditQuote(selectedLeadForDetail)}
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
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.contact_info.phone}
                                            readOnly={!canEditQuote(selectedLeadForDetail)}
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
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.contact_info.email || ''}
                                            placeholder="No proporcionado"
                                            readOnly={!canEditQuote(selectedLeadForDetail)}
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
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.fecha_nacimiento || ''}
                                            readOnly={!canEditQuote(selectedLeadForDetail)}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, fecha_nacimiento: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección de Obra / Proyecto</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.address}
                                            readOnly={!canEditQuote(selectedLeadForDetail)}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.ciudad}
                                            readOnly={!canEditQuote(selectedLeadForDetail)}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, ciudad: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.estado}
                                            readOnly={!canEditQuote(selectedLeadForDetail)}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, estado: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código Postal</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50' : ''}`}
                                            value={selectedLeadForDetail.postal_code || ''}
                                            placeholder="CP"
                                            maxLength={5}
                                            readOnly={!canEditQuote(selectedLeadForDetail)}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, postal_code: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                                        />
                                    </div>
                                    <div className="space-y-1 flex flex-col justify-end pb-1 ml-1">
                                        <label className={`flex items-center gap-3 group ${canEditQuote(selectedLeadForDetail) ? 'cursor-pointer' : 'cursor-default opacity-60'}`}>
                                            <div className={`w-12 h-6 rounded-full transition-all relative ${selectedLeadForDetail.factura ? 'bg-primary' : 'bg-slate-200'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedLeadForDetail.factura ? 'left-7' : 'left-1'}`} />
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedLeadForDetail.factura || false}
                                                disabled={!canEditQuote(selectedLeadForDetail)}
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
                                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50' : ''}`}
                                                value={selectedLeadForDetail.area}
                                                readOnly={!canEditQuote(selectedLeadForDetail)}
                                                onChange={e => updateLeadWithRecalculation({ area: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">TIPO DE PRECIO PARA REPORTE</label>
                                            <div className={`flex bg-white p-1 rounded-xl border border-slate-200 ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 opacity-60' : ''}`}>
                                                <button
                                                    type="button"
                                                    disabled={!canEditQuote(selectedLeadForDetail)}
                                                    onClick={() => updateLeadWithRecalculation({ pricing_type: 'contado' })}
                                                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${(!selectedLeadForDetail.pricing_type || selectedLeadForDetail.pricing_type === 'contado') ? 'bg-secondary text-white shadow-md' : 'text-slate-400'}`}
                                                >Contado</button>
                                                <button
                                                    type="button"
                                                    disabled={!canEditQuote(selectedLeadForDetail)}
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
                                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 opacity-60' : ''}`}
                                                value={selectedLeadForDetail.status}
                                                disabled={!canEditQuote(selectedLeadForDetail)}
                                                onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, status: e.target.value })}
                                            >
                                                {['Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SISTEMA FINAL COMPRADO</label>
                                            <select
                                                className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-primary outline-none ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 opacity-60' : ''}`}
                                                value={selectedLeadForDetail.solution_id}
                                                disabled={!canEditQuote(selectedLeadForDetail)}
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
                                                    className={`w-full pl-8 pr-4 py-3 bg-white border border-orange-200 rounded-xl text-sm font-bold text-orange-600 outline-none focus:ring-4 focus:ring-orange-100 ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 opacity-60' : ''}`}
                                                    value={selectedLeadForDetail.costo_logistico || 0}
                                                    readOnly={!canEditQuote(selectedLeadForDetail)}
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
                                        className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium min-h-[100px] outline-none focus:ring-4 focus:ring-primary/10 ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50' : ''}`}
                                        placeholder="Escribe notas sobre el cliente o el proceso de venta..."
                                        value={selectedLeadForDetail.notas || ''}
                                        readOnly={!canEditQuote(selectedLeadForDetail)}
                                        onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, notas: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowQuotePreview(true)}
                                        className="bg-white text-secondary border-2 border-slate-200 py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-[10px]"
                                        title="Generar y previsualizar reporte formal para el cliente"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Vista Previa Cotización
                                    </button>
                                    {canEditQuote(selectedLeadForDetail) && (
                                        <button
                                            disabled={isSavingDetail}
                                            className="bg-secondary text-white py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] text-[10px]"
                                            title="Guardar cambios técnicos, comerciales y notas"
                                        >
                                            {isSavingDetail ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Actualizar Ficha
                                        </button>
                                    )}
                                    {!canEditQuote(selectedLeadForDetail) && (
                                        <div className="col-span-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2">
                                            <Shield className="w-5 h-5 text-slate-300" />
                                            <p className="italic text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                * Cotización Bloqueada. <br />No se permiten cambios una vez que el lead está Cerrado.
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
                    <div className="fixed inset-0 bg-secondary/95 z-[150] overflow-y-auto p-0 md:p-12 flex items-start justify-center backdrop-blur-md quote-preview-overlay">
                        <div id="printable-quote-modal-content" className="w-full max-w-4xl bg-white shadow-2xl relative">
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
                                        <Printer className="w-4 h-4" /> GENERAR PDF
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
                                    <div id="printable-quote" className="bg-white p-8 md:p-16 text-slate-800 font-sans print:p-0 print:m-0">
                                        {/* Header Logo */}
                                        <div className="flex flex-row justify-between items-start mb-10 border-b-4 border-primary pb-6">
                                            <div className="flex items-center gap-3">
                                                <img src="/logo.png" alt="Thermo House" className="h-10 w-auto" />
                                                <div>
                                                    <h2 className="text-xl font-black text-secondary tracking-tighter leading-tight">THERMO HOUSE</h2>
                                                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Aislamiento Térmico & Acústico</p>
                                                </div>
                                            </div>
                                            <div className="w-1/3 text-right">
                                                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Cotización Automática</div>
                                                <div className="text-xs font-black text-secondary">#{selectedLeadForDetail.id.slice(0, 8).toUpperCase()}</div>
                                                <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Vence en: 7 días hábiles</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 mb-10" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                            <div>
                                                <h4 className="text-[8px] font-black uppercase tracking-widest text-primary mb-2">Información del Cliente</h4>
                                                <div className="space-y-1">
                                                    <p className="text-base font-black text-secondary uppercase leading-none">{selectedLeadForDetail.contact_info.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-600 flex items-center gap-2">
                                                        <Phone className="w-2.5 h-2.5" /> +52 {selectedLeadForDetail.contact_info.phone}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-slate-400 flex items-center gap-2 mt-1.5">
                                                        <MapPin className="w-3 h-3 text-primary" />
                                                        {selectedLeadForDetail.address}, {selectedLeadForDetail.ciudad}, {selectedLeadForDetail.estado}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <h4 className="text-[8px] font-black uppercase tracking-widest text-primary mb-2">Detalles del Presupuesto</h4>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-slate-600">Fecha: {formatDateCDMX(selectedLeadForDetail.created_at, { hour12: false })}</p>
                                                    <p className="text-[10px] font-bold text-slate-600">Vigente hasta: {formatShortDateCDMX(new Date(new Date(selectedLeadForDetail.created_at).getTime() + 7 * 24 * 60 * 60 * 1000))}</p>
                                                    <p className="text-[10px] font-black text-secondary mt-2 uppercase tracking-tight">Área Verificada: {selectedLeadForDetail.area} m²</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Product Section */}
                                        <div className="mb-10">
                                            <div className="bg-slate-900 text-white p-4 rounded-t-lg">
                                                <div className="grid grid-cols-4 text-[8px] font-black uppercase tracking-[0.2em]">
                                                    <div className="col-span-2">Concepto / Sistema Aplicado</div>
                                                    <div className="text-center">Área</div>
                                                    <div className="text-right">Cantidades</div>
                                                </div>
                                            </div>
                                            <div className="border-x border-b border-slate-100 p-6 space-y-6">
                                                <div className="grid grid-cols-4 items-start">
                                                    <div className="col-span-2">
                                                        <h5 className="text-sm font-black text-secondary uppercase mb-1">
                                                            {products.find(p => p.id === selectedLeadForDetail.solution_id)?.title || 'Sistema Thermo House'}
                                                            <span className="ml-2 text-[7px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-200 align-middle font-bold">
                                                                P. {selectedLeadForDetail.pricing_type === 'lista' ? 'LISTA' : 'CONTADO'}
                                                            </span>
                                                        </h5>
                                                        <div className="text-[10px] text-slate-500 font-medium leading-relaxed pr-8 space-y-1">
                                                            {(() => {
                                                                const product = products.find(p => p.id === selectedLeadForDetail.solution_id);
                                                                const text = `${product?.beneficio_principal || ''}\n${product?.detalle_costo_beneficio || ''}`;
                                                                const fallback = 'Sistema de aislamiento térmico de alta densidad. Incluye preparación de superficie, sellado de grietas, aplicación de base reflectante y capa protectora final.';

                                                                const features = (product?.detalle_costo_beneficio || product?.beneficio_principal)
                                                                    ? text.split(/-|\n/).map(f => f.trim()).filter(Boolean)
                                                                    : fallback.split('.');

                                                                return features.map((line, i) => (
                                                                    <p key={i} className="flex items-start gap-2">
                                                                        <span className="text-primary mt-1">•</span>
                                                                        <span>{line}</span>
                                                                    </p>
                                                                ));
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <div className="text-center text-xs font-black text-slate-600">{selectedLeadForDetail.area} m²</div>
                                                    <div className="text-right text-base font-black text-secondary">
                                                        ${basePrice.toLocaleString()}
                                                    </div>
                                                </div>

                                                {logistics > 0 && (
                                                    <div className="grid grid-cols-4 items-center bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                                                        <div className="col-span-2">
                                                            <h6 className="text-[8px] font-black text-orange-800 uppercase tracking-widest">Cargos por Logística Foránea</h6>
                                                            <p className="text-[7.5px] font-bold text-orange-600/70">Traslado de equipo y personal a zona {selectedLeadForDetail.ciudad}</p>
                                                        </div>
                                                        <div className="text-center text-[10px]">--</div>
                                                        <div className="text-right text-[10px] font-black text-orange-800">
                                                            + ${logistics.toLocaleString()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Totals Bar */}
                                            <div className="bg-slate-50 p-6">
                                                <div className="grid grid-cols-4 items-start w-full">
                                                    <div className="col-span-2" />
                                                    <div className="col-span-2 space-y-3">
                                                        <div className="flex justify-between items-center text-slate-400 font-bold text-[10px] uppercase tracking-widest pl-12">
                                                            <span>Subtotal</span>
                                                            <span className="font-black text-secondary">${subtotal.toLocaleString()}</span>
                                                        </div>
                                                        {selectedLeadForDetail.factura && (
                                                            <div className="flex justify-between items-center font-bold text-[10px] uppercase tracking-widest text-blue-500 pl-12">
                                                                <span>IVA (16%)</span>
                                                                <span className="font-black">${iva.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                        <div className="h-px bg-slate-200 ml-12" />
                                                        <div className="flex justify-between items-center pl-12">
                                                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Total Final</span>
                                                            <span className="text-xl font-black text-primary">${grandTotal.toLocaleString()}</span>
                                                        </div>
                                                        {selectedLeadForDetail.pricing_type === 'lista' && (
                                                            <p className="text-[7.5px] font-extrabold text-slate-400 text-right uppercase leading-tight">* Sujeto a 12 Meses Sin Intereses con tarjetas participantes.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Terms */}
                                        <div className="grid grid-cols-2 gap-10">
                                            <div className="space-y-3">
                                                <h6 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Condiciones de Venta</h6>
                                                <div className="space-y-1.5">
                                                    <p className="text-[8px] font-bold text-slate-400 flex items-center gap-2 leading-tight">
                                                        <CheckCircle2 className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                                                        Precios en Pesos Mexicanos. Válidos solo durante la vigencia indicada.
                                                    </p>
                                                    <p className="text-[8px] font-bold text-slate-400 flex items-center gap-2 leading-tight">
                                                        <CheckCircle2 className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                                                        Garantía por escrito de 10 años en impermeabilización y aislamiento.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right pt-4">
                                                <div className="h-px bg-slate-200 mb-3" />
                                                <p className="text-[9px] font-black uppercase tracking-widest text-secondary">Thermo House México</p>
                                                {(() => {
                                                    const advisor = selectedLeadForDetail.advisor || session;
                                                    const advisorName = advisor?.name || 'Asesor';
                                                    const advisorLastName = advisor?.apellido || '';
                                                    const advisorPhone = advisor?.telefono || '999 448 6445';
                                                    const advisorEmail = advisor?.contacto_email || advisor?.email || 'ventas@thermohouse.mx';

                                                    return (
                                                        <div className="mt-1.5 flex flex-col items-end text-right">
                                                            <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 flex flex-col items-end">
                                                                <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-0.5">Atendido por:</p>
                                                                <p className="text-xs font-black text-secondary uppercase tracking-tight">
                                                                    {advisorName} {advisorLastName}
                                                                </p>
                                                            </div>
                                                            <div className="mt-1.5 flex gap-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                                                {advisorPhone && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Phone className="w-2.5 h-2.5 text-primary" />
                                                                        <span>{advisorPhone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
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
            {/* Location Detail Modal */}
            {
                locationModal.open && locationModal.data && (
                    <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                                        <MapPin className="w-7 h-7 text-primary" />
                                        Ficha de {locationModal.data.ciudad}
                                    </h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Configuración de Sucursal / Operación</p>
                                </div>
                                <button onClick={() => setLocationModal({ open: false, data: null })} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateLocation} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección Completa</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            value={locationModal.data.direccion || ''}
                                            onChange={e => setLocationModal({ ...locationModal, data: { ...locationModal.data, direccion: e.target.value } })}
                                            placeholder="Calle, Número, Col., CP"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono de Contacto</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            value={locationModal.data.telefono || ''}
                                            onChange={e => setLocationModal({ ...locationModal, data: { ...locationModal.data, telefono: e.target.value } })}
                                            placeholder="999 000 0000"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            value={locationModal.data.correo || ''}
                                            onChange={e => setLocationModal({ ...locationModal, data: { ...locationModal.data, correo: e.target.value } })}
                                            placeholder="sucursal@thermohouse.mx"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Google Maps (URL)</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            value={locationModal.data.google_maps_link || ''}
                                            onChange={e => setLocationModal({ ...locationModal, data: { ...locationModal.data, google_maps_link: e.target.value } })}
                                            placeholder="https://goo.gl/maps/..."
                                        />
                                    </div>
                                </div>

                                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        <h4 className="font-black text-secondary uppercase text-sm">Redes Sociales de la Sucursal</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={locationModal.data.redes_sociales?.whatsapp || ''}
                                                onChange={e => setLocationModal({
                                                    ...locationModal,
                                                    data: {
                                                        ...locationModal.data,
                                                        redes_sociales: { ...locationModal.data.redes_sociales, whatsapp: e.target.value }
                                                    }
                                                })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Facebook</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={locationModal.data.redes_sociales?.facebook || ''}
                                                onChange={e => setLocationModal({
                                                    ...locationModal,
                                                    data: {
                                                        ...locationModal.data,
                                                        redes_sociales: { ...locationModal.data.redes_sociales, facebook: e.target.value }
                                                    }
                                                })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instagram</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={locationModal.data.redes_sociales?.instagram || ''}
                                                onChange={e => setLocationModal({
                                                    ...locationModal,
                                                    data: {
                                                        ...locationModal.data,
                                                        redes_sociales: { ...locationModal.data.redes_sociales, instagram: e.target.value }
                                                    }
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${locationModal.data.is_branch ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-secondary uppercase tracking-tight">Habilitar como Sucursal Física</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aparecerá en la sección "Sucursales" del sitio</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={locationModal.data.is_branch || false}
                                            onChange={e => setLocationModal({ ...locationModal, data: { ...locationModal.data, is_branch: e.target.checked } })}
                                        />
                                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setLocationModal({ open: false, data: null })}
                                        className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    > Cancelar </button>
                                    <button
                                        disabled={isSavingLocation}
                                        className="flex-[2] bg-primary text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                                    >
                                        {isSavingLocation ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Guardar Cambios en Ficha
                                    </button>
                                </div>
                            </form>
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

                            <form onSubmit={handleSaveProductData} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                                {productModal.isMaster ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID Interno (Ej: th-fix)</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={productModal.data.internal_id}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, internal_id: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={productModal.data.title}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, title: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                                            <select
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={productModal.data.category}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, category: e.target.value } })}
                                            >
                                                <option value="concrete">Solo Concreto</option>
                                                <option value="sheet">Solo Lámina</option>
                                                <option value="both">Ambas Superficies</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Espesor (Grosor)</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: 1 cm"
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                    value={productModal.data.grosor || ''}
                                                    onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, grosor: e.target.value } })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Orden Maestro</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                    value={productModal.data.orden}
                                                    onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, orden: e.target.value } })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resumen de Beneficio</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Aislamiento Térmico Óptimo"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={productModal.data.beneficio_principal || ''}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, beneficio_principal: e.target.value } })}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista de Características (Ficha)</label>
                                                <span className="text-[8px] font-bold text-primary uppercase">Un elemento por renglón</span>
                                            </div>
                                            <textarea
                                                rows={5}
                                                placeholder="Resumen del sistema. Puedes usar guiones (-) o nuevas líneas para separar características.&#10;Ej: Aislamiento Térmico - Impermeable - Garantía 10 años"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                                                value={productModal.data.detalle_costo_beneficio || ''}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, detalle_costo_beneficio: e.target.value } })}
                                            />
                                            <p className="text-[8px] text-slate-400 italic ml-1">* El texto se separará por guiones (-) o saltos de línea. El último elemento aparecerá en naranja.</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 mb-2">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Paso 1: Seleccionar Sistema</p>
                                            <p className="text-[10px] font-bold text-slate-500 leading-tight">Elige uno de tus 5 productos maestros. Los detalles técnicos (garantía, grosor, etc.) se copiarán automáticamente.</p>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Producto del Catálogo Maestro</label>
                                            <select
                                                className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-black text-secondary outline-none focus:border-primary transition-all"
                                                value={productModal.data.internal_id}
                                                onChange={e => {
                                                    const master = masterProducts.find(m => m.internal_id === e.target.value) ||
                                                        (masterProducts.length === 0 && Array.from(new Set(products.map(p => p.internal_id))).map(id => products.find(prod => prod.internal_id === id)).find((m: any) => m.internal_id === e.target.value));

                                                    if (master) {
                                                        setProductModal({
                                                            ...productModal,
                                                            data: {
                                                                ...productModal.data,
                                                                producto_id: master.producto_id || master.id, // Try producto_id first if from legacy list
                                                                internal_id: master.internal_id,
                                                                title: master.title,
                                                                category: master.category,
                                                                grosor: master.grosor,
                                                                beneficio_principal: master.beneficio_principal,
                                                                detalle_costo_beneficio: master.detalle_costo_beneficio,
                                                                orden: master.orden
                                                            }
                                                        });
                                                    }
                                                }}
                                                required
                                            >
                                                <option value="" disabled>Selecciona el producto...</option>
                                                {(masterProducts.length > 0 ? masterProducts : Array.from(new Set(products.map(p => p.internal_id))).map(id => products.find(prod => prod.internal_id === id))).map((m: any) => (
                                                    <option key={m.id || m.internal_id} value={m.internal_id}>{m.title}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciudad Destino</label>
                                            <select
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={productModal.data.ciudad}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, ciudad: e.target.value } })}
                                                required
                                            >
                                                <option value="" disabled>Selecciona ciudad para el precio</option>
                                                {locations.map(l => <option key={l.id} value={l.ciudad}>{l.ciudad} ({l.estado})</option>)}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio Contado $/m²</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="w-full pl-8 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-black text-secondary outline-none focus:border-primary transition-all"
                                                        value={productModal.data.precio_contado_m2}
                                                        onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, precio_contado_m2: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Precio MSI $/m²</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="w-full pl-8 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm font-black text-primary outline-none focus:border-primary transition-all"
                                                        value={productModal.data.precio_msi_m2}
                                                        onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, precio_msi_m2: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Orden Local (Opcional)</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={productModal.data.orden}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, orden: e.target.value } })}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setProductModal({ ...productModal, open: false })}
                                        className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    > Cancelar </button>
                                    <button
                                        disabled={isSavingProduct}
                                        className="flex-[2] bg-primary text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                                    >
                                        {isSavingProduct ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        {productModal.type === 'create' ? 'Crear Registro' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Password Reset Modal */}
            {
                passwordModal.open && (
                    <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-secondary uppercase tracking-tight flex items-center gap-3">
                                        <Key className="w-7 h-7 text-primary" />
                                        Cambiar Clave
                                    </h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Usuario: {passwordModal.userName}</p>
                                </div>
                                <button onClick={() => setPasswordModal({ open: false, userId: null, userName: '' })} className="p-3 bg-white border border-slate-200 rounded-2xl">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        autoFocus
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        placeholder="Mínimo 6 caracteres"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && confirmResetPassword()}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setPasswordModal({ open: false, userId: null, userName: '' })}
                                        className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    > Cancelar </button>
                                    <button
                                        onClick={confirmResetPassword}
                                        disabled={isCreatingUser || !newPassword}
                                        className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                                    >
                                        {isCreatingUser ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        Actualizar Clave
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteModal.open && (
                    <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-8 text-center space-y-6">
                                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
                                    <Trash2 className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-secondary uppercase tracking-tight">
                                        {deleteModal.type === 'user' ? '¿Eliminar Asesor?' :
                                            deleteModal.type === 'product' ? '¿Eliminar Tarifa?' : '¿Eliminar Ubicación?'}
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-2 font-bold px-4">
                                        Confirma que deseas eliminar <span className="text-secondary">{deleteModal.name}</span>. {deleteModal.details}
                                    </p>
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button
                                        onClick={() => setDeleteModal({ ...deleteModal, open: false })}
                                        className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    > Cancelar </button>
                                    <button
                                        onClick={confirmDeleteAction}
                                        disabled={isCreatingUser}
                                        className="flex-[2] py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-3"
                                    >
                                        {isCreatingUser ? <Clock className="w-5 h-5 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        Confirmar Eliminación
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: letter portrait;
                        margin: 0;
                    }

                    /* General Print Clean Up */
                    body {
                        background: white !important;
                    }

                    .admin-dashboard-layout,
                    .admin-sidebar,
                    .print\:hidden,
                    .lead-modal-overlay {
                        display: none !important;
                    }

                    /* Essential: Make the quote preview overlay visible and full screen in print */
                    .quote-preview-overlay {
                        display: block !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 215.9mm !important;
                        height: 279.4mm !important;
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        z-index: 99999 !important;
                        overflow: visible !important;
                    }

                    #printable-quote-modal-content {
                        position: relative !important;
                        width: 215.9mm !important;
                        height: 279.4mm !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        display: block !important;
                        border: none !important;
                    }

                    #printable-quote {
                        width: 215.9mm !important;
                        height: 279.4mm !important;
                        padding: 1.5cm !important;
                        margin: 0 !important;
                        box-sizing: border-box !important;
                        background: white !important;
                        display: flex !important;
                        flex-direction: column !important;
                    }

                    /* Scale fonts for single page security */
                    #printable-quote * {
                        font-size: 0.92em !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    #printable-quote h2 { font-size: 22pt !important; }
                    #printable-quote h5 { font-size: 12pt !important; }
                    #printable-quote .text-2xl { font-size: 18pt !important; }
                    #printable-quote .text-lg { font-size: 13pt !important; }

                    /* Force background colors to show in PDF */
                    .bg-primary { background-color: #ff5722 !important; -webkit-print-color-adjust: exact; }
                    .bg-slate-900 { background-color: #0f172a !important; -webkit-print-color-adjust: exact; }
                    .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>
            {/* Purge Modal */}
            {showPurgeModal && (
                <div className="fixed inset-0 bg-secondary/95 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-red-600 p-8 text-white text-center space-y-2">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                <AlertTriangle className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Zona de Peligro</h3>
                            <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Esta acción es irreversible</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <p className="text-sm text-slate-600 font-medium text-center">
                                Se eliminarán <strong>TODOS</strong> los leads y cotizaciones registrados hasta el momento. Ingrese la contraseña de depuración para continuar.
                            </p>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña de Depuración</label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center font-black tracking-[0.5em] focus:ring-4 focus:ring-red-100 outline-none transition-all"
                                    placeholder="••••••••"
                                    value={purgePasswordInput}
                                    onChange={e => setPurgePasswordInput(e.target.value)}
                                />
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                                <div className="mt-0.5">
                                    <input
                                        type="checkbox"
                                        id="confirmPurge"
                                        className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                        checked={confirmPurge}
                                        onChange={e => setConfirmPurge(e.target.checked)}
                                    />
                                </div>
                                <label htmlFor="confirmPurge" className="text-[10px] font-bold text-red-700 leading-tight cursor-pointer uppercase">
                                    Confirmo que deseo ELIMINAR permanentemente todos los datos de esta sección.
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setShowPurgeModal(false); setPurgePasswordInput(''); setConfirmPurge(false); }}
                                    className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handlePurgeLeads}
                                    disabled={isPurging}
                                    className={`flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${!purgePasswordInput || !confirmPurge
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'
                                        }`}
                                >
                                    {isPurging ? (
                                        <>
                                            <Clock className="w-4 h-4 animate-spin" />
                                            Borrando...
                                        </>
                                    ) : 'Borrar Todo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
