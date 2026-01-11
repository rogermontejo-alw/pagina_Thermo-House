'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getQuotes, updateQuote, purgeQuotes, getQuote, createQuote, deleteQuote } from '@/app/actions/get-quotes';
import { supabase } from '@/lib/supabase';
import { logoutAdmin, getAdminSession } from '@/app/actions/admin-auth';
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, resetAdminPassword } from '@/app/actions/admin-users';
import { getProducts, updateProduct, cloneProductToCity, deleteProduct, createProduct, getMasterProducts, createMasterProduct, updateMasterProduct, deleteMasterProduct } from '@/app/actions/admin-products';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, TrendingUp, Calendar, MapPin, Phone, ExternalLink, Search, Filter,
    CheckCircle2, Clock, AlertCircle, ChevronRight, LogOut, UserPlus, Trash2,
    Shield, Mail, UserCircle, Package, Edit3, Plus, Globe, Save, X, Key, Building2, Facebook,
    Download, CheckSquare, Square, FileText, Cake, Receipt, FileSignature,
    LayoutGrid, ListOrdered, Navigation, Map, AlertTriangle, Printer, FileCheck, PencilRuler,
    PieChart, BarChart3, ShieldAlert, Sun, Moon, Loader2, Power, Zap, Radio
} from 'lucide-react';
import { getLocations, createLocation, deleteLocation, updateLocation } from '@/app/actions/admin-locations';
import { getAppConfig, updateAppConfig } from '@/app/actions/get-config';
import { getMarketingScripts, createMarketingScript, updateMarketingScript, deleteMarketingScript } from '@/app/actions/marketing-scripts';
import { MEXICAN_CITIES_BY_STATE } from '@/lib/mexico-data';
import ThemeToggle from '@/components/ThemeToggle';
import BlogManager from '@/components/BlogManager';
import Toast, { ToastType } from '@/components/Toast';

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

const getFolio = (quote: any) => {
    if (!quote) return '';
    try {
        const city = quote.ciudad || 'MX';
        const initials = city.slice(0, 3).toUpperCase();
        const date = new Date(quote.created_at || new Date());
        // Use full year and include seconds for better uniqueness
        const datePart = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');
        const timePart = date.getHours().toString().padStart(2, '0') +
            date.getMinutes().toString().padStart(2, '0') +
            date.getSeconds().toString().padStart(2, '0');
        return `${initials}-${datePart}-${timePart}`;
    } catch (e) {
        return quote.id?.slice(0, 8).toUpperCase() || 'N/A';
    }
};

export default function AdminDashboard() {
    const [session, setSession] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'quotes' | 'users' | 'prices' | 'locations' | 'products' | 'config' | 'blog' | 'marketing'>('dashboard');
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
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [fbPixelId, setFbPixelId] = useState(''); // Legacy fallback compatibility
    const [isSavingPixel, setIsSavingPixel] = useState(false);
    const [newScript, setNewScript] = useState({ platform: 'facebook', pixel_id: '', is_active: true });
    const [marketingScripts, setMarketingScripts] = useState<any[]>([]);
    const [marketingExpenses, setMarketingExpenses] = useState<any[]>([]);
    const [isSavingSpend, setIsSavingSpend] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [newExpense, setNewExpense] = useState({ source: 'facebook', campaign: '', amount: 0, startDate: '', endDate: '' });
    const [showAttributionOverlay, setShowAttributionOverlay] = useState(false);

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
        role: session?.role === 'manager' ? 'editor' : 'editor' as 'admin' | 'direccion' | 'manager' | 'editor',
        ciudad: session?.role === 'manager' && session?.ciudad !== 'Todas' ? session.ciudad : '',
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
        type: 'user' | 'product' | 'location' | 'master' | 'marketing' | 'toggle' | 'lead',
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

    // Manual Lead State
    const [manualLeadModal, setManualLeadModal] = useState(false);
    const [isSavingManualLead, setIsSavingManualLead] = useState(false);
    const [manualLeadData, setManualLeadData] = useState({
        name: '',
        phone: '',
        email: '',
        area: '',
        address: '',
        ciudad: session?.role === 'manager' && session.ciudad !== 'Todas' ? session.ciudad : '',
        estado: 'Yucatán',
        postal_code: '',
        solution_id: '',
        pricing_type: 'contado',
        costo_logistico: '0',
        factura: false
    });

    const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
        visible: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ visible: true, message, type });
    };

    const MEXICAN_STATES = [
        'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Ciudad de México', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
    ];

    // Merge DB locations with Mexico Data for full coverage
    const activeRegions = useMemo(() => {
        const merged: Record<string, string[]> = { ...MEXICAN_CITIES_BY_STATE };
        if (locations && locations.length > 0) {
            locations.forEach(loc => {
                if (!merged[loc.estado]) merged[loc.estado] = [];
                // Standardize comparison
                const cityExists = merged[loc.estado].some(c => c.toLowerCase() === loc.ciudad.toLowerCase());
                if (!cityExists) {
                    merged[loc.estado].push(loc.ciudad);
                }
            });
        }
        // Ensure cities are sorted
        Object.keys(merged).forEach(k => merged[k].sort());
        return merged;
    }, [locations]);

    useEffect(() => {
        const init = async () => {
            const userSession = await getAdminSession();
            if (!userSession) {
                router.push('/th-manager/login');
                return;
            }
            setSession(userSession);
            if (userSession.role !== 'admin' && userSession.role !== 'manager' && userSession.role !== 'direccion') {
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
                        if (res?.success && res.data) {
                            setQuotes(prev => {
                                if (prev.some(q => q.id === res.data!.id)) return prev;
                                return [res.data!, ...prev];
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
                        if (res?.success && res.data) {
                            setQuotes(prev => {
                                const exists = prev.some(q => q.id === res.data!.id);
                                if (exists) {
                                    return prev.map(q => q.id === res.data!.id ? res.data! : q);
                                } else {
                                    return [res.data!, ...prev];
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

    const handleUpdateExpenses = async (updatedExpenses: any[]) => {
        setIsSavingSpend(true);
        const res = await updateAppConfig('marketing_expenses_json', JSON.stringify(updatedExpenses));
        if (res.success) {
            setMarketingExpenses(updatedExpenses);
            showToast('Registro de gastos actualizado');
        } else {
            showToast('Error: ' + res.message, 'error');
        }
        setIsSavingSpend(false);
    };

    const handleAddExpense = () => {
        if (!newExpense.amount || !newExpense.startDate || !newExpense.endDate) {
            showToast('Por favor completa todos los campos obligatorios', 'error');
            return;
        }
        const updated = [...marketingExpenses, { ...newExpense, id: Date.now().toString() }];
        handleUpdateExpenses(updated);
        setNewExpense({ source: 'facebook', campaign: '', amount: 0, startDate: '', endDate: '' });
        setShowExpenseModal(false);
    };

    const handleDeleteExpense = (id: string) => {
        const updated = marketingExpenses.filter(e => e.id !== id);
        handleUpdateExpenses(updated);
    };

    const fetchData = async (currSession: any) => {
        setLoading(true);
        const cityFilter = (currSession.role === 'admin' || currSession.role === 'manager') ? 'Todas' : currSession.ciudad;

        const [qRes, uRes, pRes, mRes, lRes, configKey, pixelKey, expensesVal, scriptsRes] = await Promise.all([
            getQuotes(cityFilter),
            (currSession.role === 'admin' || currSession.role === 'manager') ? getAdminUsers() : Promise.resolve({ success: true, data: [] }),
            getProducts(cityFilter),
            getMasterProducts(),
            getLocations(),
            currSession.role === 'admin' ? getAppConfig('GOOGLE_MAPS_KEY') : Promise.resolve(null),
            currSession.role === 'admin' ? getAppConfig('facebook_pixel_id') : Promise.resolve(null),
            currSession.role === 'admin' ? getAppConfig('marketing_expenses_json') : Promise.resolve(null),
            currSession.role === 'admin' ? getMarketingScripts() : Promise.resolve({ success: true, data: [] })
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
        if (pixelKey) setFbPixelId(pixelKey);
        if (expensesVal) {
            try {
                setMarketingExpenses(JSON.parse(expensesVal));
            } catch (e) {
                setMarketingExpenses([]);
            }
        }
        if (scriptsRes.success) setMarketingScripts(scriptsRes.data || []);

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
        const MIN_PRICE = 5900;

        // Subtotal should NOT include logistics anymore to avoid duplication
        newLead.precio_total_contado = Math.max(Math.round(area * up_contado), MIN_PRICE);
        newLead.precio_total_msi = Math.max(Math.round(area * up_msi), MIN_PRICE);

        setSelectedLeadForDetail(newLead);
    };



    const handleSaveLeadDetail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeadForDetail) return;
        setIsSavingDetail(true);

        const payload: any = {
            solution_id: selectedLeadForDetail.solution_id,
            area: Number(selectedLeadForDetail.area),
            precio_total_contado: Number(selectedLeadForDetail.precio_total_contado),
            precio_total_msi: Number(selectedLeadForDetail.precio_total_msi),
            costo_logistico: Number(selectedLeadForDetail.costo_logistico || 0),
            fecha_nacimiento: selectedLeadForDetail.fecha_nacimiento || null,
            factura: selectedLeadForDetail.factura || false,
            is_manual: selectedLeadForDetail.is_manual || false,
            notas: selectedLeadForDetail.notas || '',
            pricing_type: selectedLeadForDetail.pricing_type || 'contado',
            address: selectedLeadForDetail.address,
            ciudad: selectedLeadForDetail.ciudad,
            estado: selectedLeadForDetail.estado,
            postal_code: selectedLeadForDetail.postal_code,
            contact_info: selectedLeadForDetail.contact_info,
            manual_unit_price: selectedLeadForDetail.manual_unit_price,
            assigned_to: selectedLeadForDetail.assigned_to,
            manual_source: selectedLeadForDetail.manual_source || null,
            utm_source: selectedLeadForDetail.utm_source,
            utm_medium: selectedLeadForDetail.utm_medium,
            utm_campaign: selectedLeadForDetail.utm_campaign,
            referrer: selectedLeadForDetail.referrer,
            secondary_sources: selectedLeadForDetail.secondary_sources || []
        };

        let res;

        if (selectedLeadForDetail.id === 'new') {
            if (!payload.contact_info.name || !payload.contact_info.phone || !payload.ciudad || !payload.solution_id || !payload.address || !payload.manual_source) {
                showToast('Por favor completa: Nombre, Teléfono, Ciudad, Sistema, Dirección y Fuente de Adquisición.', 'error');
                setIsSavingDetail(false);
                return;
            }
            payload.status = 'Nuevo';
            payload.created_by = session?.id;
            payload.assigned_to = session?.role === 'editor' ? session.id : (payload.assigned_to || null);
            payload.is_out_of_zone = !products.some(p => p.ciudad === payload.ciudad);
            res = await createQuote(payload);
        } else {
            if (!payload.manual_source) {
                showToast('Por favor selecciona la fuente de adquisición.', 'error');
                setIsSavingDetail(false);
                return;
            }
            payload.status = selectedLeadForDetail.status;
            payload.created_by = selectedLeadForDetail.created_by || session.id;
            res = await updateQuote(selectedLeadForDetail.id, payload);
        }

        if (res.success) {
            await fetchData(session);
            setSelectedLeadForDetail(null);
            showToast(selectedLeadForDetail.id === 'new' ? '¡Lead creado exitosamente!' : 'Cambios guardados correctamente.');
        } else {
            showToast('Error: ' + res.message, 'error');
        }
        setIsSavingDetail(false);
    };



    const initiateNewLead = () => {
        const defaultSolution = products.find(p => p.ciudad === session.ciudad) || products[0];

        setSelectedLeadForDetail({
            id: 'new',
            status: 'Nuevo',
            contact_info: { name: '', phone: '', email: '' },
            address: '',
            ciudad: session.ciudad || locations[0]?.ciudad || 'Mérida',
            estado: 'Yucatán',
            postal_code: '',
            area: 0,
            secondary_sources: [],
            solution_id: defaultSolution?.id || '',
            costo_logistico: 0,
            precio_total_contado: 0,
            precio_total_msi: 0,
            pricing_type: 'contado',
            factura: false,
            is_manual: true,
            is_out_of_zone: false,
            created_at: new Date().toISOString(),
            soluciones_precios: defaultSolution ? { title: defaultSolution.title } : { title: 'Seleccionar' }
        });
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
                        assigned_user: assignedUser ? { id: assignedUser.id, name: assignedUser.name, apellido: assignedUser.apellido } : null,
                        // Ensure advisor is present for dashboard grouping if not already
                        advisor: q.advisor || (assignedUser ? { name: assignedUser.name, apellido: assignedUser.apellido, telefono: assignedUser.telefono, email: assignedUser.email } : null)
                    };
                }
                return q;
            }));
        } else {
            showToast('Error al asignar: ' + res.message, 'error');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreatingUser(true);
        const res = await createAdminUser(newUser as any);
        if (res.success) {
            await fetchData(session);
            setNewUser({ name: '', apellido: '', email: '', password: '', role: 'editor', ciudad: '', base: '', telefono: '', contacto_email: '' });
            setIsUserFormOpen(false);
            showToast('Usuario creado exitosamente');
        } else showToast('Error: ' + res.message, 'error');
        setIsCreatingUser(false);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userModal.data || !userModal.data.id) return; // Keep original check
        setIsCreatingUser(true); // Keep original loading state
        const res = await updateAdminUser(userModal.data.id, userModal.data);
        if (res.success) {
            await fetchData(session);
            showToast('Perfil actualizado exitosamente');
            setUserModal({ open: false, type: 'edit', data: null });
        } else showToast('Error: ' + res.message, 'error');
        setIsCreatingUser(false);
    };

    const toggleUserActive = async (user: any) => {
        const newStatus = user.active === false ? true : false; // Toggle
        const actionName = newStatus ? 'ACTIVAR' : 'DESACTIVAR';

        setDeleteModal({
            open: true,
            type: 'toggle',
            id: user.id,
            name: `${actionName} A ${user.name.toUpperCase()}`,
            details: `¿Estás seguro de que deseas ${actionName.toLowerCase()} a este usuario?`
        });
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
            showToast('Contraseña actualizada correctamente para ' + passwordModal.userName);
        } else {
            showToast(res?.message || 'Error', 'error');
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
        } else if (deleteModal.type === 'marketing') {
            res = await deleteMarketingScript(deleteModal.id!);
        } else if (deleteModal.type === 'toggle') {
            // Finding the current user to toggle their status
            const user = users.find(u => u.id === deleteModal.id);
            if (user) {
                const newStatus = user.active === false;
                res = await updateAdminUser(user.id, { active: newStatus } as any);
            }
        } else if (deleteModal.type === 'lead') {
            res = await deleteQuote(deleteModal.id!);
        }

        if (res?.success) {
            setDeleteModal({ ...deleteModal, open: false });
            if (deleteModal.type === 'lead') {
                setQuotes(prev => prev.filter(q => q.id !== deleteModal.id));
                showToast('Registro eliminado correctamente');
            } else {
                fetchData(session);
            }
            if (deleteModal.type === 'toggle') {
                showToast('Estado del usuario actualizado');
            }
        } else if (res) {
            showToast(res?.message || 'Error', 'error');
        }
        setIsCreatingUser(false);
    };

    const toggleProductActive = async (id: string, current: boolean) => {
        const res = await updateProduct(id, { activo: !current });
        if (res.success) fetchData(session);
    };

    const toggleMasterProductVisibility = async (id: string, newVisibility: boolean) => {
        try {
            const res = await updateMasterProduct(id, { visible_on_web: newVisibility });
            if (res.success) {
                setMasterProducts(prev => prev.map(p => p.id === id ? { ...p, visible_on_web: newVisibility } : p));
                setToast({ visible: true, type: 'success', message: `Producto ${newVisibility ? 'visible' : 'oculto'} en web` });
            } else {
                setToast({ visible: true, type: 'error', message: res.message || 'Error al actualizar' });
            }
        } catch (error) {
            setToast({ visible: true, type: 'error', message: 'Error de conexión' });
        }
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
            showToast('¡Ciudad Habilitada! 📍');
        } else showToast(res?.message || 'Error', 'error');
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
            showToast(res?.message || 'Error', 'error');
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
                    orden: Number(data.orden),
                    activo: data.activo !== false,
                    visible_on_web: data.visible_on_web !== false
                });
            } else {
                res = await createMasterProduct({
                    title: data.title,
                    internal_id: data.internal_id,
                    category: data.category,
                    grosor: data.grosor,
                    beneficio_principal: data.beneficio_principal,
                    detalle_costo_beneficio: data.detalle_costo_beneficio,
                    orden: Number(data.orden || 0),
                    activo: data.activo !== false,
                    visible_on_web: data.visible_on_web !== false
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
                    showToast('Error: Debes seleccionar un producto del catálogo.', 'error');
                    setIsSavingProduct(false);
                    return;
                }
                if (!newData.ciudad) {
                    showToast('Error: Debes seleccionar una ciudad para asignar el precio.', 'error');
                    setIsSavingProduct(false);
                    return;
                }
                if (!newData.precio_contado_m2 || isNaN(Number(newData.precio_contado_m2))) {
                    showToast('Error: El precio de contado debe ser un número válido.', 'error');
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
            showToast('No se pudo guardar: ' + (res?.message || 'Error desconocido del servidor'), 'error');
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
            showToast('API Key de Google Maps actualizada');
        } else {
            showToast(res?.message || 'Error', 'error');
        }
        setIsSavingKey(false);
    };

    const handleUpdatePixelId = async () => {
        setIsSavingPixel(true);
        const res = await updateAppConfig('facebook_pixel_id', fbPixelId);
        if (res.success) {
            showToast('Facebook Pixel actualizado');
        } else {
            showToast(res?.message || 'Error', 'error');
        }
        setIsSavingPixel(false);
    };

    const handleAddMarketingScript = async () => {
        if (!newScript.pixel_id) return;
        setIsSavingPixel(true);
        const res = await createMarketingScript(newScript);
        if (res.success) {
            setMarketingScripts(prev => [res.data, ...prev]);
            setNewScript({ platform: 'facebook', pixel_id: '', is_active: true });
            setIsAddingScript(false);
            showToast('Conector de marketing añadido exitosamente');
        } else {
            showToast('Error: ' + res.message, 'error');
        }
        setIsSavingPixel(false);
    };

    const handleToggleScript = async (id: string, current: boolean) => {
        const res = await updateMarketingScript(id, { is_active: !current });
        if (res.success) {
            setMarketingScripts(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
        }
    };

    const handleDeleteScript = async (id: string, platform: string) => {
        setDeleteModal({
            open: true,
            type: 'marketing',
            id: id,
            name: platform.replace('_', ' ').toUpperCase(),
            details: 'Este rastreador de marketing se eliminará permanentemente y dejará de funcionar en la web.'
        });
    };

    const handleCreateManualLead = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic required check
        if (!manualLeadData.name || !manualLeadData.area || !manualLeadData.solution_id || !manualLeadData.ciudad || !manualLeadData.phone || !manualLeadData.estado || !manualLeadData.postal_code || !manualLeadData.address) {
            showToast('Por favor completa los campos obligatorios.', 'error');
            return;
        }

        // Phone validation (10 digits)
        const phoneDigits = manualLeadData.phone.replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
            showToast('El teléfono debe tener 10 dígitos', 'error');
            return;
        }

        setIsSavingManualLead(true);
        try {
            // Find selected product for pricing
            const selectedProduct = products.find(p => p.id === manualLeadData.solution_id);
            if (!selectedProduct) throw new Error('Sistema no encontrado');

            const area = Number(manualLeadData.area);
            const logisticCost = Number(manualLeadData.costo_logistico || 0);
            const totalContado = (area * (selectedProduct.precio_contado_m2 || 0));
            const totalMsi = (area * (selectedProduct.precio_msi_m2 || 0));

            const payload = {
                address: manualLeadData.address || 'Captura Manual',
                ciudad: manualLeadData.ciudad,
                estado: manualLeadData.estado,
                postal_code: manualLeadData.postal_code,
                area: area,
                solution_id: selectedProduct.id,
                precio_total_contado: totalContado,
                precio_total_msi: totalMsi,
                contact_info: {
                    name: manualLeadData.name,
                    phone: manualLeadData.phone,
                    email: manualLeadData.email
                },
                status: 'Nuevo',
                pricing_type: manualLeadData.pricing_type,
                costo_logistico: logisticCost,
                factura: manualLeadData.factura,
                is_manual: true,
                is_out_of_zone: !products.some(p => p.ciudad === manualLeadData.ciudad),
                assigned_to: session?.role === 'editor' ? session.id : null,
                notas: `Registro manual por ${session?.name || 'Administrador'}.`
            };

            const res = await createQuote(payload);
            if (res.success) {
                setManualLeadModal(false);
                setManualLeadData({
                    name: '', phone: '', email: '', area: '', address: '',
                    ciudad: '', estado: 'Yucatán', postal_code: '', solution_id: '',
                    pricing_type: 'contado', costo_logistico: '0', factura: false
                });
                await fetchData(session);
            } else {
                showToast(res?.message || 'Error', 'error');
            }
        } catch (err: any) {
            showToast('Error: ' + err.message, 'error');
        }
        setIsSavingManualLead(false);
    };

    const handleLogout = async () => {
        await logoutAdmin();
        router.push('/th-manager/login');
    };

    const toggleLeadSelection = (id: string) => {
        const newSelection = new Set(selectedLeads);
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
        setSelectedLeads(newSelection);
    };

    const handlePurgeLeads = async () => {
        if (!purgePasswordInput) {
            showToast('Por favor ingrese la contraseña de depuración para continuar.', 'error');
            return;
        }

        if (!confirmPurge) {
            showToast('Por favor, marca la casilla de confirmación para autorizar el borrado permanente.', 'error');
            return;
        }

        setIsPurging(true);
        try {
            const res = await purgeQuotes(purgePasswordInput);
            if (res.success) {
                setQuotes([]);
                setSelectedLeads(new Set());
                showToast('Base de datos limpiada exitosamente');
                setShowPurgeModal(false);
                setPurgePasswordInput('');
                setConfirmPurge(false);
            } else {
                showToast(res?.message || 'Error al eliminar leads', 'error');
            }
        } catch (err) {
            showToast('Ocurrió un error al intentar purgar los datos.', 'error');
        } finally {
            setIsPurging(false);
        }
    };

    const handleDeleteSingleLead = (id: string, name: string) => {
        setDeleteModal({
            open: true,
            type: 'lead',
            id: id,
            name: name,
            details: 'Se eliminará permanentemente este registro de la base de datos.'
        });
    };

    const handleUpdatePurgePassword = async () => {
        if (!purgePassword) return;
        setIsSavingPurgePassword(true);
        const res = await updateAppConfig('PURGE_PASSWORD', purgePassword);
        if (res.success) {
            showToast('Contraseña de depuración actualizada');
        } else {
            showToast('Error: ' + res.message, 'error');
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
            showToast('Por favor selecciona al menos un registro para exportar.', 'error');
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
            showToast('No hay precios para exportar con los filtros actuales.', 'error');
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

        let matchesStatus = true;
        if (statusFilter === 'Rescatar') {
            matchesStatus = q.last_step === 'datos_contacto' || q.status === 'Borrador';
        } else {
            matchesStatus = statusFilter === 'All' || q.status === statusFilter;
        }

        // Range Date Filtering (Same as dashboard)
        let matchesDate = true;
        if (rangeType !== 'all') {
            const cdmxNowStr = new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
            const now = new Date(cdmxNowStr);
            const qDate = new Date(new Date(q.created_at).toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));

            if (rangeType === 'today') {
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                matchesDate = qDate.getTime() >= todayStart;
            } else if (rangeType === 'week') {
                const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
                matchesDate = qDate.getTime() >= weekStart;
            } else if (rangeType === 'month') {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
                matchesDate = qDate.getTime() >= monthStart;
            }
        }

        return matchesSearch && matchesStatus && matchesDate;
    })
        .sort((a, b) => {
            // Multi-level sort: 1. City (ASC), 2. Time (ASC - Most recent at the end)
            const cityA = (a.ciudad || '').toLowerCase();
            const cityB = (b.ciudad || '').toLowerCase();

            if (cityA < cityB) return -1;
            if (cityA > cityB) return 1;

            // Within same city, sort by date/time ascending (newest at the bottom)
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

    if (!session) return <div className="h-screen flex items-center justify-center font-black text-slate-200 uppercase tracking-widest animate-pulse">Cargando Sesión...</div>;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 md:p-8 font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8 admin-dashboard-layout">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    {/* Top Row: Brand/Title and Main Actions */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block">
                                <img src="/logo.png" alt="Thermo House" className="h-10 w-auto filter brightness-110 drop-shadow-sm" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                                        {session.role === 'admin' ? 'Acceso Total' : session.role === 'direccion' ? 'Dirección General' : session.role === 'manager' ? 'Gerencia Global' : `Zona: ${session.ciudad}`}
                                    </span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black text-secondary dark:text-white uppercase tracking-tight">Nexus Admin <span className="text-primary">v1.9</span></h1>
                                <p className="text-slate-400 dark:text-slate-300 text-xs hidden sm:block">Sesión iniciada como {session.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <ThemeToggle hideLabels />
                            <button
                                onClick={handleLogout}
                                className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-2.5 rounded-xl text-sm font-bold border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all shadow-sm"
                                title="Cerrar Sesión"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Row: Tabs */}
                    <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-nowrap gap-1 w-full overflow-hidden">
                        {(session.role === 'admin' || session.role === 'manager' || session.role === 'direccion') && (
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-secondary dark:bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-secondary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                <span>Dashboard</span>
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('quotes')}
                            className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'quotes' ? 'bg-secondary dark:bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-secondary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>Leads</span>
                        </button>
                        {(session.role === 'admin' || session.role === 'direccion' || session.role === 'manager') && (
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-secondary dark:bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-secondary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <Package className="w-3.5 h-3.5" />
                                <span>Productos</span>
                            </button>
                        )}
                        {session.role === 'admin' && (
                            <button
                                onClick={() => setActiveTab('marketing')}
                                className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'marketing' ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'}`}
                            >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Marketing</span>
                            </button>
                        )}
                        {(session.role === 'admin' || session.role === 'manager' || session.role === 'editor') && (
                            <button
                                onClick={() => setActiveTab('prices')}
                                className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'prices' ? 'bg-secondary dark:bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-secondary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span>Precios</span>
                            </button>
                        )}
                        {(session.role === 'admin' || session.role === 'direccion' || session.role === 'manager') && (
                            <button
                                onClick={() => setActiveTab('locations')}
                                className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'locations' ? 'bg-secondary dark:bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-secondary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <MapPin className="w-3.5 h-3.5" />
                                <span>Zonas</span>
                            </button>
                        )}
                        {session.role === 'admin' && (
                            <button
                                onClick={() => setActiveTab('config')}
                                className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-secondary dark:bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-secondary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <Key className="w-3.5 h-3.5" />
                                <span>Config</span>
                            </button>
                        )}
                        {(session.role === 'admin' || session.role === 'manager' || session.role === 'direccion') && (
                            <>
                                <button
                                    onClick={() => setActiveTab('blog')}
                                    className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'blog' ? 'bg-secondary dark:bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-secondary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Blog</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-secondary dark:bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-secondary dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    <UserCircle className="w-3.5 h-3.5" />
                                    <span>Equipo</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>


                {activeTab === 'dashboard' && (session.role === 'admin' || session.role === 'manager' || session.role === 'direccion') && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Dashboard Header with Range Selectors */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight">Rendimiento Operativo</h2>
                                <p className="text-slate-400 dark:text-slate-200 text-[10px] font-bold uppercase tracking-widest">Métricas en tiempo real basadas en leads cotizados</p>
                            </div>
                            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm self-start md:self-center">
                                {[
                                    { id: 'all', label: 'TODO' },
                                    { id: 'today', label: 'DÍA' },
                                    { id: 'week', label: 'SEMANA' },
                                    { id: 'month', label: 'MES' }
                                ].map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => setRangeType(r.id as any)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${rangeType === r.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 dark:text-slate-300 hover:text-secondary dark:hover:text-white'}`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 0. Sales Pipeline Report */}
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        Pipeline de Ventas
                                    </h3>
                                    <p className="text-slate-400 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-1">Estado del embudo y valor proyectado</p>
                                </div>
                                {session.role === 'admin' && (
                                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Valor Total Pipeline:</span>
                                        <span className="text-sm font-black text-primary">
                                            ${Math.round(dashboardQuotes.reduce((sum, q) => {
                                                const base = q.pricing_type === 'lista' ? (q.precio_total_msi || 0) : (q.precio_total_contado || 0);
                                                const logistics = Number(q.costo_logistico || 0);
                                                const convValue = q.conversion_value || base;
                                                return sum + ((convValue + logistics) * (q.factura ? 1.16 : 1));
                                            }, 0)).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                {['Borrador', 'Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'].map((status) => {
                                    const quotes = dashboardQuotes.filter(q => q.status === status);
                                    const amount = quotes.reduce((sum, q) => {
                                        const base = q.pricing_type === 'lista' ? (q.precio_total_msi || 0) : (q.precio_total_contado || 0);
                                        const logistics = Number(q.costo_logistico || 0);
                                        const convValue = q.conversion_value || base;
                                        return sum + ((convValue + logistics) * (q.factura ? 1.16 : 1));
                                    }, 0);
                                    const colors = {
                                        'Borrador': 'bg-rose-400',
                                        'Nuevo': 'bg-blue-500',
                                        'Contactado': 'bg-amber-500',
                                        'Visita Técnica': 'bg-purple-500',
                                        'Cerrado': 'bg-green-500'
                                    };
                                    const lightColors = {
                                        'Borrador': 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
                                        'Nuevo': 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
                                        'Contactado': 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
                                        'Visita Técnica': 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
                                        'Cerrado': 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                                    };

                                    return (
                                        <div key={status} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-4 hover:shadow-lg transition-all group">
                                            <div className="flex justify-between items-start">
                                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${lightColors[status as keyof typeof lightColors]}`}>
                                                    {status === 'Borrador' ? 'POR RESCATAR' : status}
                                                </div>
                                                <div className="text-xs font-black text-slate-400 group-hover:text-primary transition-colors">{quotes.length} Leads</div>
                                            </div>
                                            <div className="space-y-1">
                                                {session.role === 'admin' && <div className="text-xl font-black text-secondary dark:text-white">${Math.round(amount).toLocaleString()}</div>}
                                                <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={`h-full ${colors[status as keyof typeof colors]} transition-all duration-1000`} style={{ width: `${dashboardQuotes.length > 0 ? (quotes.length / dashboardQuotes.length) * 100 : 0}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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
                                <div key={i} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-2 hover:shadow-xl transition-all duration-300 group">
                                    <div className={`w-12 h-12 ${stat.bg} dark:bg-slate-800/50 ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-2xl font-black text-secondary dark:text-white leading-none pt-2">{stat.val}</div>
                                    <div className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* 2. Products Summary */}
                            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 transition-colors duration-300">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-2">
                                            <Package className="w-5 h-5 text-primary" />
                                            Sistemas más Solicitados
                                        </h3>
                                        <p className="text-slate-400 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-1">Distribución por volumen de leads</p>
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
                                                    <span className="text-secondary dark:text-slate-300">{prod.title}</span>
                                                    <span className="text-primary">{prod.count} Leads</span>
                                                </div>
                                                <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700 p-0.5">
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
                            <div className="bg-secondary dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                                    <PieChart className="w-32 h-32 text-white" />
                                </div>
                                <div className="relative z-10 space-y-8">
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Preferencias</h3>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Métodos de pago sugeridos</p>
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
                            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                <div>
                                    <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-primary" />
                                        Distribución por Ciudad
                                    </h3>
                                    <p className="text-slate-400 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-1">Presencia regional activa</p>
                                </div>
                                <div className="overflow-hidden rounded-2xl border border-slate-50 dark:border-slate-800">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[9px] font-black uppercase text-slate-400 dark:text-slate-300 tracking-widest">
                                            <tr>
                                                <th className="px-6 py-4">Ciudad</th>
                                                <th className="px-6 py-4">Leads</th>
                                                <th className="px-6 py-4 text-right">Potencial</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {Array.from(new Set(dashboardQuotes.map(q => q.ciudad)))
                                                .map(city => ({
                                                    name: city,
                                                    count: dashboardQuotes.filter(q => q.ciudad === city).length,
                                                    total: dashboardQuotes.filter(q => q.ciudad === city).reduce((sum, q) => sum + (q.precio_total_contado || 0), 0)
                                                }))
                                                .sort((a, b) => b.count - a.count)
                                                .slice(0, 5)
                                                .map((city, i) => (
                                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                                                        <td className="px-6 py-4 font-bold text-secondary dark:text-slate-200 text-xs">{city.name}</td>
                                                        <td className="px-6 py-4 text-xs font-black text-slate-400 dark:text-slate-400">{city.count}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-[10px] font-black text-primary px-3 py-1 bg-primary/5 dark:bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
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
                            <div className="bg-orange-50/50 dark:bg-orange-950/20 p-10 rounded-[2.5rem] border border-orange-100 dark:border-orange-900/30 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                                            Atención Prioritaria
                                        </h3>
                                        <p className="text-orange-900/40 dark:text-orange-300 text-[10px] font-bold uppercase tracking-widest mt-1">Nuevos prospectos sin contacto</p>
                                    </div>
                                    <button onClick={() => { setActiveTab('quotes'); setStatusFilter('Nuevo'); }} className="text-[9px] font-black py-2 px-4 bg-white dark:bg-slate-800 border border-orange-100 dark:border-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-600 hover:text-white transition-all uppercase tracking-widest shadow-sm">Ver Todos</button>
                                </div>
                                <div className="space-y-3">
                                    {dashboardQuotes
                                        .filter(q => q.status === 'Nuevo')
                                        .sort((a, b) => {
                                            const valA = ((a.pricing_type === 'lista' ? (a.precio_total_msi || 0) : (a.precio_total_contado || 0)) + Number(a.costo_logistico || 0)) * (a.factura ? 1.16 : 1);
                                            const valB = ((b.pricing_type === 'lista' ? (b.precio_total_msi || 0) : (b.precio_total_contado || 0)) + Number(b.costo_logistico || 0)) * (b.factura ? 1.16 : 1);
                                            return valB - valA;
                                        })
                                        .slice(0, 4)
                                        .map((q, i) => {
                                            const totalVal = ((q.pricing_type === 'lista' ? (q.precio_total_msi || 0) : (q.precio_total_contado || 0)) + Number(q.costo_logistico || 0)) * (q.factura ? 1.16 : 1);
                                            return (
                                                <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 text-orange-500 rounded-xl flex items-center justify-center font-black">{q.contact_info?.name?.[0] || '?'}</div>
                                                        <div>
                                                            <div className="text-xs font-black text-secondary dark:text-slate-200">{q.contact_info?.name || 'Cliente'}</div>
                                                            <div className="text-[9px] text-slate-400 dark:text-slate-400 font-bold uppercase">
                                                                {q.ciudad} • ${Math.round(totalVal).toLocaleString()}
                                                                <span className="text-orange-600 dark:text-orange-400 font-black ml-2 tracking-widest">(SIN ATENDER)</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[9px] font-black text-primary px-2 py-0.5 bg-primary/5 dark:bg-primary/10 rounded-full uppercase">{q.area}m²</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {dashboardQuotes.filter(q => q.status === 'Nuevo').length === 0 && (
                                        <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold italic border-2 border-dashed border-orange-100 dark:border-orange-900/20 rounded-[2rem]">¡Todo al día! Sin pendientes.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 6. Advisor Performance */}
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                            <div>
                                <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    <UserCircle className="w-5 h-5 text-primary" />
                                    Rendimiento por Asesor
                                </h3>
                                <p className="text-slate-400 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-1">Productividad y cierre de ventas</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from(new Set(dashboardQuotes.map(q => {
                                    const exec = q.assigned_user || q.advisor;
                                    return exec ? exec.name + ' ' + (exec.apellido || '') : null;
                                }).filter(Boolean)))
                                    .map(advisorName => {
                                        const advisorQuotes = dashboardQuotes.filter(q => {
                                            const exec = q.assigned_user || q.advisor;
                                            return exec && (exec.name + ' ' + (exec.apellido || '')) === advisorName;
                                        });
                                        const closedSales = advisorQuotes.filter(q => q.status === 'Cerrado').length;
                                        const convRate = advisorQuotes.length > 0 ? Math.round((closedSales / advisorQuotes.length) * 100) : 0;

                                        const calculateQuoteValue = (q: any) => {
                                            const base = q.pricing_type === 'lista' ? (q.precio_total_msi || 0) : (q.precio_total_contado || 0);
                                            const logistics = Number(q.costo_logistico || 0);
                                            return (base + logistics) * (q.factura ? 1.16 : 1);
                                        };

                                        return (
                                            <div key={advisorName} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 space-y-4 hover:border-primary/20 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700 font-black shadow-sm group-hover:bg-primary group-hover:text-white transition-all text-lg">
                                                        {advisorName?.[0] || '?'}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <div className="text-sm font-black text-secondary dark:text-white leading-tight">{advisorName}</div>
                                                            <div className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">{convRate}% Cierre</div>
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-widest">Pipeline Personal</div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    {['Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'].map(status => {
                                                        const qs = advisorQuotes.filter(q => q.status === status);
                                                        const amt = qs.reduce((sum, q) => sum + calculateQuoteValue(q), 0);
                                                        return (
                                                            <div key={status} className="bg-white dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                                                <div className="flex justify-between items-center mb-0.5">
                                                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">{status}</span>
                                                                    <span className="text-[8px] font-bold text-slate-300">{qs.length}</span>
                                                                </div>
                                                                <div className="text-[11px] font-black text-secondary dark:text-white">${Math.round(amt / 1000)}k</div>
                                                            </div>
                                                        );
                                                    }) /* status map */}
                                                </div>
                                            </div>
                                        );
                                    }) /* advisor map */}
                                {(quotes.filter(q => q.assigned_user || q.advisor).length === 0) && (
                                    <div className="col-span-full p-12 text-center text-slate-300 font-bold italic border-2 border-dashed border-slate-100 rounded-[2rem]">
                                        Aún no hay asignaciones registradas.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'marketing' && session.role === 'admin' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight flex items-center gap-2">
                                    <Globe className="w-5 h-5" />
                                    Inteligencia de Marketing
                                </h2>
                                <p className="text-slate-400 dark:text-slate-200 text-[10px] font-bold uppercase tracking-widest">Análisis de origen, presupuestos y retorno</p>
                            </div>
                            <button
                                onClick={() => setShowExpenseModal(true)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                            >
                                <Plus className="w-4 h-4" /> Registrar Gasto/Inversión
                            </button>
                        </div>

                        {/* Efficiency Period Stats */}
                        {(() => {
                            const periodExpenses = marketingExpenses.filter(e => {
                                if (rangeType === 'all') return true;
                                const expenseStart = new Date(e.startDate);
                                const expenseEnd = new Date(e.endDate);
                                const viewStart = startDate ? new Date(startDate) : new Date(0);
                                const viewEnd = endDate ? new Date(endDate) : new Date();
                                return (expenseStart <= viewEnd && expenseEnd >= viewStart);
                            });
                            const totalSpend = periodExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
                            const digitalLeads = dashboardQuotes.filter(q => q.utm_source).length;

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { label: 'Inversión en Periodo', val: `$${totalSpend.toLocaleString()}`, sub: `${periodExpenses.length} Asignaciones de Gasto`, icon: <TrendingUp />, color: 'text-emerald-500' },
                                        { label: 'CPL Global (Filtro)', val: `$${dashboardQuotes.length > 0 ? Math.round(totalSpend / dashboardQuotes.length) : 0}`, sub: 'Promedio general periodo', icon: <TrendingUp />, color: 'text-emerald-500' },
                                        { label: 'CPL Digital (Filtro)', val: `$${digitalLeads > 0 ? Math.round(totalSpend / digitalLeads) : 0}`, sub: 'Tráfico con UTM detectado', icon: <Zap />, color: 'text-indigo-500' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-slate-900 dark:bg-slate-900 border border-slate-800 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-500/5 transition-all hover:scale-[1.02]">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                                                    {React.cloneElement(stat.icon as React.ReactElement, { className: 'w-5 h-5' })}
                                                </div>
                                            </div>
                                            <div className="text-2xl font-black">{stat.val}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                            <div className="text-[8px] font-bold text-slate-500 uppercase mt-1">{stat.sub}</div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Leads en Periodo', val: dashboardQuotes.length, icon: <Users />, color: 'text-blue-500' },
                                { label: 'Origen Digital', val: dashboardQuotes.filter(q => q.utm_source).length, icon: <Zap />, color: 'text-indigo-500' },
                                { label: 'Origen Manual', val: dashboardQuotes.filter(q => q.manual_source).length, icon: <Radio />, color: 'text-orange-500' },
                                { label: 'Conversion Cerrada', val: dashboardQuotes.filter(q => q.status === 'Cerrado').length, icon: <CheckCircle2 />, color: 'text-emerald-500' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 ${stat.color}`}>
                                            {React.cloneElement(stat.icon as React.ReactElement, { className: 'w-5 h-5' })}
                                        </div>
                                    </div>
                                    <div className="text-2xl font-black text-secondary dark:text-white">{stat.val}</div>
                                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Sources Breakdown */}
                            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight">Fuentes de Adquisición</h3>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {(() => {
                                        const sourcesMap: Record<string, number> = {};
                                        dashboardQuotes.forEach(q => {
                                            const s = q.manual_source || q.utm_source || 'Desconocido / Directo';
                                            sourcesMap[s] = (sourcesMap[s] || 0) + 1;
                                        });
                                        return Object.entries(sourcesMap)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([source, count], i) => (
                                                <div key={i} className="space-y-2">
                                                    <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                                                        <span className="text-secondary dark:text-slate-300">{source}</span>
                                                        <span className="text-primary">{count} Leads</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500 rounded-full"
                                                            style={{ width: `${(count / (dashboardQuotes.length || 1)) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ));
                                    })()}
                                </div>
                            </div>

                            {/* Secondary Reach (Memory) */}
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight">Alcance de Memoria (Branding)</h3>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {(() => {
                                        const memoryMap: Record<string, number> = {};
                                        dashboardQuotes.forEach(q => {
                                            const sources = q.secondary_sources || [];
                                            sources.forEach((s: string) => {
                                                memoryMap[s] = (memoryMap[s] || 0) + 1;
                                            });
                                        });
                                        const sorted = Object.entries(memoryMap).sort((a, b) => b[1] - a[1]);
                                        if (sorted.length === 0) return (
                                            <div className="py-12 text-center text-slate-300 font-bold italic border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center gap-2">
                                                <AlertCircle className="w-5 h-5" />
                                                <span>Pendiente de recolección en Ventas</span>
                                            </div>
                                        );

                                        return sorted.slice(0, 6).map(([source, count], i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                                                    <span className="text-secondary dark:text-slate-300">{source}</span>
                                                    <span className="text-emerald-500">{Math.round((count / (dashboardQuotes.length || 1)) * 100)}% Presencia</span>
                                                </div>
                                                <div className="h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${(count / (dashboardQuotes.length || 1)) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Campaign Performance */}
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight">Rendimiento por Campaña (UTM)</h3>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {(() => {
                                        const calculateQuoteValue = (q: any) => {
                                            const base = q.pricing_type === 'lista' ? (q.precio_total_msi || 0) : (q.precio_total_contado || 0);
                                            const logistics = Number(q.costo_logistico || 0);
                                            return (base + logistics) * (q.factura ? 1.16 : 1);
                                        };

                                        const campaignStats: Record<string, { count: number, value: number }> = {};
                                        dashboardQuotes.filter(q => q.utm_campaign).forEach(q => {
                                            const campaign = q.utm_campaign || 'Sin Campaña';
                                            if (!campaignStats[campaign]) campaignStats[campaign] = { count: 0, value: 0 };
                                            campaignStats[campaign].count++;
                                            campaignStats[campaign].value += calculateQuoteValue(q);
                                        });

                                        const sorted = Object.entries(campaignStats).sort((a, b) => b[1].count - a[1].count);
                                        if (sorted.length === 0) return <div className="py-20 text-center text-slate-300 font-bold italic border-2 border-dashed border-slate-100 rounded-[2rem]">No se detectan campañas en este periodo.</div>;

                                        return sorted.map(([campaign, stats]) => (
                                            <div key={campaign} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 group">
                                                <div className="flex-1">
                                                    <div className="text-xs font-black text-secondary dark:text-white uppercase group-hover:text-indigo-600 transition-colors line-clamp-1">{campaign}</div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stats.count} Leads</span>
                                                        <span className="text-[8px] text-slate-300">•</span>
                                                        <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{Math.round((stats.count / (dashboardQuotes.length || 1)) * 100)}% del Mix</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">${Math.round(stats.value / 1000)}k</div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase">Potencial</div>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Investment History Registry */}
                            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tight">Historial de Inversiones / Gastos</h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{marketingExpenses.length} Registros</span>
                                </div>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {marketingExpenses.length === 0 ? (
                                        <div className="py-20 text-center text-slate-300 font-bold italic border-2 border-dashed border-slate-100 rounded-[2rem]">No hay gastos registrados.</div>
                                    ) : (
                                        marketingExpenses.map((expense, idx) => (
                                            <div key={idx} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all group">
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                                                    {expense.source === 'facebook' || expense.source === 'instagram' ? <Facebook className="w-5 h-5 text-indigo-500" /> : <Globe className="w-5 h-5 text-slate-400" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-xs font-black text-secondary dark:text-white uppercase tracking-tight">{expense.campaign || 'Gasto General'}</span>
                                                        <span className="text-xs font-black text-indigo-600">${Number(expense.amount).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between mt-1">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{expense.source}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {new Date(expense.startDate).toLocaleDateString()} - {new Date(expense.endDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'blog' && (session.role === 'admin' || session.role === 'manager' || session.role === 'direccion') && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <FileText className="w-6 h-6 text-primary" />
                                Gestión de Blog
                            </h2>
                            <p className="text-slate-400 dark:text-slate-300 text-sm mt-1">Crea y edita artículos para la sección de noticias y consejos.</p>
                        </div>
                        <BlogManager />
                    </div>
                )}

                {activeTab === 'quotes' && (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px] transition-colors duration-300">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-6">
                            {/* Row 1: Manual Lead (1) and Search (2) */}
                            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                                {/* 1. Nuevo Lead Manual */}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={initiateNewLead}
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-secondary dark:bg-primary text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg min-w-[200px]"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Nuevo Cliente
                                    </button>
                                    {selectedLeads.size > 0 && (
                                        <button
                                            onClick={exportToCSV}
                                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-600 dark:bg-emerald-500 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                                        >
                                            <Download className="w-4 h-4" />
                                            Exportar {selectedLeads.size}
                                        </button>
                                    )}
                                </div>

                                {/* 2. Buscar Clientes */}
                                <div className="relative flex-1 lg:max-w-xl">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente, ciudad o folio..."
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium shadow-sm"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Row 2: Date Presets (3) and Status Filters (4) */}
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                                {/* 3. Selecciones de Fechas (Presets) */}
                                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        {[
                                            { id: 'all', label: 'TODO' },
                                            { id: 'today', label: 'DÍA' },
                                            { id: 'week', label: 'SEMANA' },
                                            { id: 'month', label: 'MES' }
                                        ].map((r) => (
                                            <button
                                                key={r.id}
                                                onClick={() => setRangeType(r.id as any)}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${rangeType === r.id ? 'bg-primary text-white shadow-lg' : 'text-slate-400 dark:text-slate-300 hover:text-secondary dark:hover:text-white'}`}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. Selecciones de Status Clientes */}
                                <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
                                    {['All', 'Rescatar', 'Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === status
                                                ? (status === 'Rescatar' ? 'bg-rose-500 text-white shadow-md' : 'bg-secondary dark:bg-primary text-white shadow-md')
                                                : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {status === 'Rescatar' ? '⚠️ POR RESCATAR' : status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50/10 dark:bg-slate-900/10">
                            {loading ? (
                                <div className="p-20 text-center space-y-4">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                                    <p className="text-slate-400 dark:text-slate-300 font-black uppercase tracking-widest text-sm animate-pulse">Sincronizando Leads...</p>
                                </div>
                            ) : filteredQuotes.length === 0 ? (
                                <div className="p-20 text-center space-y-6">
                                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                        <Search className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-slate-400 dark:text-slate-300 font-black uppercase tracking-widest text-sm">No hay registros</p>
                                        <p className="text-slate-300 dark:text-slate-500 text-xs font-medium italic">Intenta ajustar los filtros de búsqueda o fecha.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {/* Desktop header hint - Minimalist - Only visible when grid is 4-columns */}
                                    <div className="hidden lg:flex items-center px-8 py-3 bg-slate-50 dark:bg-slate-800/80 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">
                                        <div className="w-10">
                                            <button onClick={() => handleSelectAll(filteredQuotes)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors">
                                                {selectedLeads.size === filteredQuotes.length && filteredQuotes.length > 0 ? (
                                                    <CheckSquare className="w-4 h-4 text-primary" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-300" />
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex-1 grid grid-cols-4 gap-8 px-4">
                                            <span>Información del Cliente</span>
                                            <span>Detalles del Proyecto</span>
                                            <span>Inversión y Gestión</span>
                                            <span className="text-right">Seguimiento y Acciones</span>
                                        </div>
                                    </div>

                                    {filteredQuotes.map(q => (
                                        <div key={q.id} className={`p-5 md:p-6 lg:px-8 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group relative ${selectedLeads.has(q.id) ? 'bg-primary/[0.03] dark:bg-primary/[0.05]' : ''}`}>
                                            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
                                                {/* Selection Checkbox (Desktop always, Mobile optional) */}
                                                <div className="hidden md:block">
                                                    <button onClick={() => toggleLeadSelection(q.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                                        {selectedLeads.has(q.id) ? (
                                                            <CheckSquare className="w-5 h-5 text-primary" />
                                                        ) : (
                                                            <Square className="w-5 h-5 text-slate-200 dark:text-slate-700" />
                                                        )}
                                                    </button>
                                                </div>

                                                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
                                                    {/* Column 1: Identidad */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between sm:block">
                                                            <div className="text-[10px] font-black text-slate-400 dark:text-slate-200 uppercase tracking-widest mb-1">{formatDateCDMX(q.created_at, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                            <div className="sm:hidden flex gap-2">
                                                                {q.is_out_of_zone && <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-[4px] text-[8px] font-black tracking-tighter">FORÁNEO</span>}
                                                                {q.is_manual && <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-[4px] text-[8px] font-black tracking-tighter uppercase">Manual</span>}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-black text-secondary dark:text-white text-lg sm:text-base group-hover:text-primary transition-colors leading-tight mb-1">{q.contact_info.name}</h3>
                                                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-300">
                                                                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" /> {q.contact_info.phone}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Column 2: Proyecto */}
                                                    <div className="flex flex-col justify-center space-y-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-xl">
                                                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                                                <span className="text-[10px] font-black text-secondary dark:text-white uppercase tracking-tight">{q.ciudad}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-xl">
                                                                <PencilRuler className="w-3.5 h-3.5 text-slate-400" />
                                                                <span className="text-[10px] font-black text-secondary dark:text-white">{q.area}m²</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {q.is_out_of_zone && <span className="hidden sm:inline-block px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800/50 rounded-lg text-[8px] font-black tracking-widest">FORÁNEO</span>}
                                                            {q.is_manual && <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 rounded-lg text-[8px] font-black tracking-widest uppercase">Manual</span>}
                                                            {q.factura && <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 rounded-lg text-[8px] font-black tracking-widest uppercase">Factura</span>}
                                                            {q.utm_source && (
                                                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 rounded-lg text-[8px] font-black tracking-widest uppercase flex items-center gap-1">
                                                                    <Globe className="w-2.5 h-2.5" /> {q.utm_source}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Column 3: Precios y Asignación */}
                                                    <div className="flex flex-col justify-center space-y-4">
                                                        <div className="space-y-1">
                                                            {(!q.pricing_type || q.pricing_type === 'contado') ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-black text-secondary dark:text-white">${Math.round(q.precio_total_contado).toLocaleString()}</span>
                                                                    <span className="text-[7px] font-black px-1.5 py-0.5 bg-secondary dark:bg-primary text-white rounded-md uppercase tracking-tighter">Efectivo</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-black text-primary">${Math.round(q.precio_total_msi).toLocaleString()}</span>
                                                                    <span className="text-[7px] font-black px-1.5 py-0.5 bg-primary text-white rounded-md uppercase tracking-tighter">Lista (MSI)</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                                            {(session.role === 'admin' || session.role === 'manager') ? (
                                                                <div className="relative group/asgn">
                                                                    <select
                                                                        value={q.assigned_to || ''}
                                                                        onChange={(e) => handleAssignLead(q.id, e.target.value)}
                                                                        className="w-full min-w-[140px] text-[9px] font-black uppercase bg-slate-50 dark:bg-slate-800/50 text-secondary dark:text-white border border-slate-200/50 dark:border-slate-700 rounded-lg px-2.5 py-2.5 outline-none cursor-pointer hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-primary/20 focus:shadow-[0_0_15px_-3px_rgba(0,0,0,0.1)] transition-all appearance-none"
                                                                    >
                                                                        <option value="" className="text-slate-400">🔘 Por Asignar</option>
                                                                        {users.map(u => <option key={u.id} value={u.id}>👤 {u.name}</option>)}
                                                                    </select>
                                                                    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 rotate-90 opacity-40 group-hover/asgn:opacity-100 pointer-events-none transition-opacity" />
                                                                </div>
                                                            ) : (
                                                                <div className={`text-[9px] font-black uppercase px-3 py-2 rounded-lg flex items-center gap-2 ${q.assigned_to === session.id ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-200'}`}>
                                                                    <UserCircle className="w-3.5 h-3.5" />
                                                                    {q.assigned_user ? (q.assigned_to === session.id ? 'Tú' : q.assigned_user.name) : 'Libre'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Column 4: Estado y Acciones */}
                                                    <div className="flex flex-col md:items-end justify-center space-y-4">
                                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center md:w-36 ${q.status === 'Nuevo' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                                                            q.status === 'Contactado' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                                                                q.status === 'Visita Técnica' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                                                                    'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                                                            }`}>
                                                            {q.status}
                                                        </div>

                                                        <div className="flex md:justify-end items-center gap-2">
                                                            <button
                                                                onClick={() => { setSelectedLeadForDetail(q); setShowQuotePreview(true); }}
                                                                className={`p-2.5 rounded-xl border transition-all hover:scale-110 active:scale-95 ${q.status !== 'Nuevo' ? 'bg-primary/10 text-primary border-primary/10' : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-500 border-slate-100 dark:border-slate-700'}`}
                                                                title="Ver Cotización"
                                                            >
                                                                <FileSignature className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => setSelectedLeadForDetail(q)} className="p-2.5 bg-secondary dark:bg-primary text-white rounded-xl shadow-sm hover:scale-110 active:scale-95 transition-all"><FileText className="w-4 h-4" /></button>
                                                            {q.google_maps_link && <a href={q.google_maps_link} target="_blank" className="p-2.5 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-xl hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all"><ExternalLink className="w-4 h-4" /></a>}
                                                            {q.contact_info.phone && <a href={`https://wa.me/52${q.contact_info.phone}`} target="_blank" className="p-2.5 bg-green-50 dark:bg-slate-800 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30 rounded-xl hover:bg-green-600 dark:hover:bg-green-600 hover:text-white transition-all"><Phone className="w-4 h-4" /></a>}
                                                            {(session.role === 'admin' || session.role === 'direccion') && (
                                                                <button
                                                                    onClick={() => handleDeleteSingleLead(q.id, q.contact_info.name)}
                                                                    className="p-2.5 bg-red-50 dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-600 dark:hover:bg-red-600 hover:text-white transition-all"
                                                                    title="Eliminar Registro"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'prices' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <h2 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    <Package className="w-6 h-6 text-primary" />
                                    Lista de Tarifas Regionales
                                </h2>
                                <p className="text-slate-400 dark:text-slate-300 text-xs mt-1">Gestiona precios específicos por ciudad y sistema.</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar sistema..."
                                        className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-secondary dark:text-white text-xs font-bold w-40 outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        value={priceSearchTerm}
                                        onChange={e => setPriceSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    disabled={session.role === 'editor'}
                                    className={`px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer bg-white dark:bg-slate-800 text-secondary dark:text-white ${session.role === 'editor' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                    className="bg-secondary dark:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 border border-slate-200 dark:border-slate-600"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Exportar
                                </button>
                                {(session.role === 'admin' || session.role === 'manager') && (
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

                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                {/* Mobile Prices View */}
                                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                    {products.filter(p => {
                                        const matchesSearch = p.title.toLowerCase().includes(priceSearchTerm.toLowerCase());
                                        const matchesCity = priceCityFilter === 'Todas' || p.ciudad === priceCityFilter;
                                        return matchesSearch && matchesCity;
                                    }).map(p => (
                                        <div key={p.id} className="p-5 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-[10px] font-black text-primary uppercase">{p.ciudad}</div>
                                                    <div className="font-bold text-secondary dark:text-white">{p.title}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-secondary dark:text-white">${p.precio_contado_m2} <span className="text-[9px] text-slate-400 dark:text-slate-300">Contado</span></div>
                                                    <div className="text-xs font-black text-primary">${p.precio_msi_m2} <span className="text-[9px] text-slate-400 dark:text-slate-300">MSI</span></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    disabled={session.role === 'editor'}
                                                    onClick={() => toggleProductActive(p.id, p.activo !== false)}
                                                    className={`p-2 rounded-lg border text-[8px] font-black uppercase tracking-tighter transition-all ${p.activo !== false ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800/50' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-400 border-slate-200 dark:border-slate-700'} ${session.role === 'editor' ? 'opacity-80' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                                                >
                                                    {p.activo !== false ? '● Activo' : '○ Pausado'}
                                                </button>
                                                {(session.role === 'admin' || session.role === 'manager') && (
                                                    <>
                                                        <button onClick={() => setProductModal({ open: true, type: 'edit', data: p })} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 hover:text-secondary dark:hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                                                        {(session.role === 'admin' || session.role === 'manager') && (
                                                            <>
                                                                <button onClick={() => handleClone(p)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-400 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 rounded-lg hover:bg-white dark:hover:bg-blue-900/40 transition-all"><Plus className="w-4 h-4" /></button>
                                                                <button onClick={() => handleDeleteProduct(p.id, p.title + ' en ' + p.ciudad)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-300 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg hover:bg-white dark:hover:bg-red-900/40 transition-all"><Trash2 className="w-4 h-4" /></button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Desktop Prices Table */}
                                <table className="hidden md:table w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-black text-slate-400 dark:text-slate-300 tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="px-8 py-5">Ciudad</th>
                                            <th className="px-8 py-5">Sistema</th>
                                            <th className="px-8 py-5">Precio Contado</th>
                                            <th className="px-8 py-5">Precio MSI</th>
                                            <th className="px-8 py-5">Estado</th>
                                            <th className="px-8 py-5 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {products.filter(p => {
                                            const matchesSearch = p.title.toLowerCase().includes(priceSearchTerm.toLowerCase());
                                            const matchesCity = priceCityFilter === 'Todas' || p.ciudad === priceCityFilter;
                                            return matchesSearch && matchesCity;
                                        }).length === 0 ? (
                                            <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-300 dark:text-slate-200 font-bold italic">No se encontraron precios para los filtros aplicados</td></tr>
                                        ) : (
                                            products.filter(p => {
                                                const matchesSearch = p.title.toLowerCase().includes(priceSearchTerm.toLowerCase());
                                                const matchesCity = priceCityFilter === 'Todas' || p.ciudad === priceCityFilter;
                                                return matchesSearch && matchesCity;
                                            }).map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300" />
                                                            <span className="text-sm font-black text-secondary dark:text-white">{p.ciudad}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{p.title}</div>
                                                        <div className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-tighter">{p.internal_id}</div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="text-sm font-black text-secondary dark:text-white">${p.precio_contado_m2}</div>
                                                        <div className="text-[9px] text-slate-400 dark:text-slate-300 font-bold">Por m²</div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="text-sm font-black text-primary">${p.precio_msi_m2}</div>
                                                        <div className="text-[9px] text-slate-400 font-bold">Por m²</div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <button
                                                            disabled={session.role === 'editor'}
                                                            onClick={() => toggleProductActive(p.id, !(p.activo !== false))}
                                                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${p.activo !== false ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400 border border-slate-200 dark:border-slate-700'} ${session.role === 'editor' ? 'opacity-80' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                                                        >
                                                            {p.activo !== false ? '● Activo' : '○ Pausado'}
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex justify-end gap-1.5 p-1 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700 transition-all">
                                                            {(session.role === 'admin' || session.role === 'manager') && (
                                                                <>
                                                                    <button
                                                                        onClick={() => setProductModal({ open: true, type: 'edit', data: p })}
                                                                        className="p-2 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm hover:text-secondary dark:hover:text-white rounded-lg transition-all"
                                                                        title="Editar tarifa m2 de este sistema"
                                                                    >
                                                                        <Edit3 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    {(session.role === 'admin' || session.role === 'manager') && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => handleClone(p)}
                                                                                className="p-2 bg-white dark:bg-slate-800 text-blue-400 dark:text-blue-400 border border-slate-200 dark:border-slate-700 shadow-sm hover:text-blue-600 dark:hover:text-blue-300 rounded-lg transition-all"
                                                                                title="Clonar esta tarifa para otra ciudad"
                                                                            >
                                                                                <Plus className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteProduct(p.id, p.title + ' en ' + p.ciudad)}
                                                                                className="p-2 bg-white dark:bg-slate-800 text-red-300 dark:text-red-400 border border-slate-200 dark:border-slate-700 shadow-sm hover:text-red-600 dark:hover:text-red-300 rounded-lg transition-all"
                                                                                title="Eliminar tarifa regional"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </>
                                                                    )}
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
                        {/* Header & Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-primary" />
                                <div>
                                    <h2 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight">
                                        Equipo Thermo House
                                    </h2>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                                        Estructura Organizacional
                                    </p>
                                </div>
                            </div>

                            {(session.role === 'admin' || session.role === 'direccion' || session.role === 'manager') && (
                                <button
                                    onClick={() => setIsUserFormOpen(!isUserFormOpen)}
                                    className={`px-5 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg ${isUserFormOpen
                                        ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                        : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                                        }`}
                                >
                                    {isUserFormOpen ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                    {isUserFormOpen ? 'Cerrar Formulario' : 'Nuevo Miembro'}
                                </button>
                            )}
                        </div>

                        {/* Collapsible Form */}
                        <AnimatePresence>
                            {isUserFormOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
                                        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Nombre</label>
                                                <input type="text" required placeholder="Nombre" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-300 dark:placeholder:text-slate-600" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Apellido</label>
                                                <input type="text" required placeholder="Apellido" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-300 dark:placeholder:text-slate-600" value={newUser.apellido} onChange={e => setNewUser({ ...newUser, apellido: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Email Acceso</label>
                                                <input type="email" required placeholder="correo@acceso.com" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-300 dark:placeholder:text-slate-600" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Contraseña</label>
                                                <input type="password" required placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-300 dark:placeholder:text-slate-600" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Rol</label>
                                                <select className="w-full px-2 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}>
                                                    <option value="editor">Asesor / Editor</option>
                                                    {(session.role === 'admin' || session.role === 'direccion') && <option value="manager">Gerencia</option>}
                                                    {session.role === 'admin' && <option value="direccion">Dirección</option>}
                                                    {session.role === 'admin' && <option value="admin">Administrador</option>}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Ciudad Asignada</label>
                                                <select
                                                    className="w-full px-2 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white disabled:opacity-50"
                                                    value={newUser.ciudad}
                                                    onChange={e => setNewUser({ ...newUser, ciudad: e.target.value })}
                                                    disabled={session.role === 'manager' && session.ciudad !== 'Todas'}
                                                >
                                                    {session.role === 'manager' && session.ciudad !== 'Todas' ? (
                                                        <option value={session.ciudad}>{session.ciudad}</option>
                                                    ) : (
                                                        <>
                                                            {locations.map(l => <option key={l.id} value={l.ciudad}>{l.ciudad}</option>)}
                                                            {(session.role === 'admin' || newUser.role === 'manager') && <option value="Todas">Todas (Global)</option>}
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Sede / Base</label>
                                                <input type="text" placeholder="Ej: Matriz" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600" value={newUser.base} onChange={e => setNewUser({ ...newUser, base: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">WhatsApp Profesional</label>
                                                <input type="text" placeholder="10 dígitos" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600" value={newUser.telefono} onChange={e => setNewUser({ ...newUser, telefono: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Email Público</label>
                                                <input type="email" placeholder="ventas@..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600" value={newUser.contacto_email} onChange={e => setNewUser({ ...newUser, contacto_email: e.target.value })} />
                                            </div>
                                            <div className="md:col-span-1">
                                                <button disabled={isCreatingUser} className="w-full bg-secondary dark:bg-primary text-white py-3 rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-primary/90 transition-all shadow-xl shadow-secondary/20 dark:shadow-primary/20 flex items-center justify-center gap-2">
                                                    {isCreatingUser ? 'Guardando...' : 'Registrar Perfil'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Hierarchy View */}
                        <div className="space-y-10">
                            {[
                                { title: 'Nivel Directivo', role: 'direccion', icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                                { title: 'Nivel Gerencial', role: 'manager', icon: Building2, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                                { title: 'Fuerza de Ventas', role: 'editor', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }
                            ].map((section) => {
                                const sectionUsers = users.filter(u => u.role === section.role);
                                if (sectionUsers.length === 0) return null;

                                return (
                                    <div key={section.role} className="space-y-5">
                                        <div className="flex items-center gap-3 ml-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <div className={`p-2 rounded-lg ${section.bg} ${section.color}`}>
                                                <section.icon className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-sm font-black text-secondary dark:text-white uppercase tracking-widest">{section.title}</h3>
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{sectionUsers.length}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {sectionUsers.map(u => (
                                                <div key={u.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-primary/20 dark:hover:border-primary/30 transition-all flex flex-col justify-between group gap-4 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-3 opacity-10 font-black text-6xl text-slate-300 pointer-events-none select-none">
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-300 flex-shrink-0 z-10">
                                                            <UserCircle className="w-6 h-6" />
                                                        </div>
                                                        <div className="z-10">
                                                            <div className="font-black text-secondary dark:text-white uppercase text-sm leading-tight line-clamp-1" title={`${u.name} ${u.apellido}`}>{u.name} {u.apellido}</div>
                                                            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 mt-1">
                                                                <Building2 className="w-3 h-3" /> {u.ciudad} {u.active === false && <span className="text-red-400">(Inactivo)</span>}
                                                            </div>
                                                            {u.telefono && (
                                                                <a href={`https://wa.me/52${u.telefono.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-green-500 font-bold flex items-center gap-1 mt-1 hover:underline">
                                                                    <Phone className="w-3 h-3" /> WhatsApp
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    {/* Actions */}
                                                    {(session.role === 'admin' || session.role === 'direccion' || session.role === 'manager') && (
                                                        <div className="flex items-center gap-2 pt-3 border-t border-slate-50 dark:border-slate-800">
                                                            {(() => {
                                                                const RoleRanks: { [key: string]: number } = { admin: 4, direccion: 3, manager: 2, editor: 1 };
                                                                const sRank = RoleRanks[session.role as string] || 0;
                                                                const uRank = RoleRanks[u.role as string] || 0;
                                                                const canEdit = sRank > uRank || u.id === session.id;

                                                                return (
                                                                    <>
                                                                        <button
                                                                            onClick={() => canEdit && setUserModal({ open: true, type: 'edit', data: u })}
                                                                            disabled={!canEdit}
                                                                            className={`flex-1 p-2 border rounded-lg transition-all flex items-center justify-center gap-2 group/btn ${canEdit
                                                                                ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-primary hover:text-white hover:border-primary dark:hover:bg-primary'
                                                                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-200 dark:text-slate-700 border-slate-100 dark:border-slate-800 cursor-not-allowed opacity-50'
                                                                                }`}
                                                                            title={canEdit ? "Editar Perfil" : "No tienes permisos para editar este usuario"}
                                                                        >
                                                                            <Edit3 className="w-4 h-4" />
                                                                            <span className="text-[9px] font-black uppercase md:hidden">Editar</span>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => canEdit && toggleUserActive(u)}
                                                                            disabled={!canEdit}
                                                                            className={`flex-1 p-2 border rounded-lg transition-all flex items-center justify-center gap-2 ${canEdit
                                                                                ? (u.active !== false ? 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100' : 'bg-red-50 dark:bg-red-900/10 text-red-500 border-red-200 hover:bg-red-100')
                                                                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-200 dark:text-slate-700 border-slate-100 dark:border-slate-800 cursor-not-allowed opacity-50'
                                                                                }`}
                                                                            title={canEdit ? (u.active !== false ? 'Desactivar Cuenta' : 'Activar Cuenta') : "No tienes permisos"}
                                                                        >
                                                                            <Power className="w-4 h-4" />
                                                                            <span className="text-[9px] font-black uppercase md:hidden">{u.active !== false ? 'Activo' : 'Offline'}</span>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => canEdit && handleResetPassword(u.id, u.name)}
                                                                            disabled={!canEdit}
                                                                            className={`flex-1 p-2 border rounded-lg transition-all flex items-center justify-center gap-2 ${canEdit
                                                                                ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-yellow-400 hover:text-white hover:border-yellow-400'
                                                                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-200 dark:text-slate-700 border-slate-100 dark:border-slate-800 cursor-not-allowed opacity-50'
                                                                                }`}
                                                                            title={canEdit ? "Cambiar Contraseña" : "No tienes permisos"}
                                                                        >
                                                                            <Key className="w-4 h-4" />
                                                                            <span className="text-[9px] font-black uppercase md:hidden">Clave</span>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => canEdit && handleDeleteUser(u.id, u.name)}
                                                                            disabled={!canEdit}
                                                                            className={`flex-1 p-2 border rounded-lg transition-all flex items-center justify-center gap-2 ${canEdit
                                                                                ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-red-500 hover:text-white hover:border-red-500'
                                                                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-200 dark:text-slate-700 border-slate-100 dark:border-slate-800 cursor-not-allowed opacity-50'
                                                                                }`}
                                                                            title={canEdit ? "Eliminar Cuenta" : "No tienes permisos"}
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                            <span className="text-[9px] font-black uppercase md:hidden">Eliminar</span>
                                                                        </button>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {userModal.open && (
                            <div className="fixed inset-0 bg-secondary/80 dark:bg-slate-950/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                                <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                                <Edit3 className="w-7 h-7 text-primary" />
                                                Editar Perfil Profesional
                                            </h3>
                                            <p className="text-slate-400 dark:text-slate-300 text-xs font-bold uppercase tracking-widest mt-1">Datos técnicos de contacto</p>
                                        </div>
                                        <button onClick={() => setUserModal({ ...userModal, open: false })} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-secondary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Nombre</label>
                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-primary/20" value={userModal.data.name} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, name: e.target.value } })} required />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Apellido</label>
                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-primary/20" value={userModal.data.apellido} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, apellido: e.target.value } })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Sede / Base</label>
                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-primary/20" value={userModal.data.base} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, base: e.target.value } })} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Email de Acceso (Login)</label>
                                                <input type="email" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-primary/20" value={userModal.data.email} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, email: e.target.value } })} required title="Este correo es el que se usa para iniciar sesión" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Ciudad</label>
                                                <select className="w-full px-2 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white" value={userModal.data.ciudad} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, ciudad: e.target.value } })}>
                                                    {locations.map(l => <option key={l.id} value={l.ciudad}>{l.ciudad}</option>)}
                                                    {(userModal.data.role === 'admin' || userModal.data.role === 'manager') && <option value="Todas">Todas</option>}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">WhatsApp Profesional</label>
                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-primary/20" value={userModal.data.telefono} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, telefono: e.target.value } })} placeholder="10 dígitos" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Email de Contacto</label>
                                                <input type="email" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-primary/20" value={userModal.data.contacto_email} onChange={e => setUserModal({ ...userModal, data: { ...userModal.data, contacto_email: e.target.value } })} placeholder="ventas@..." />
                                            </div>
                                        </div>

                                        <button disabled={isCreatingUser} className="w-full bg-secondary dark:bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-secondary/20 dark:shadow-primary/20">
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
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm h-fit space-y-8">
                            <div>
                                <h2 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    <Map className="w-6 h-6 text-primary" />
                                    {session.role === 'admin' || session.role === 'manager' ? 'Abrir Zona' : 'Zonas de Servicio'}
                                </h2>
                                <p className="text-slate-400 dark:text-slate-300 text-xs mt-1">{session.role === 'admin' || session.role === 'manager' ? 'Registra nuevos centros de operación' : 'Regiones con cobertura'}</p>
                            </div>

                            {session.role === 'admin' || session.role === 'manager' ? (
                                <form onSubmit={handleCreateLocation} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Estado</label>
                                        <select
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10"
                                            value={newLocation.estado}
                                            onChange={e => setNewLocation({ ...newLocation, estado: e.target.value })}
                                        >
                                            <option value="">Selecciona Estado</option>
                                            {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Ciudad</label>
                                        <select
                                            required
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10"
                                            value={newLocation.ciudad}
                                            onChange={e => setNewLocation({ ...newLocation, ciudad: e.target.value })}
                                        >
                                            <option value="">Selecciona Ciudad</option>
                                            {newLocation.estado && MEXICAN_CITIES_BY_STATE[newLocation.estado]?.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button disabled={isSavingLocation} className="w-full bg-secondary dark:bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-primary/90 transition-all shadow-xl shadow-secondary/20 dark:shadow-primary/20 flex items-center justify-center gap-2">
                                        {isSavingLocation ? 'Guardando...' : 'Habilitar Ciudad'}
                                    </button>
                                </form>
                            ) : (
                                <div className="p-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4">
                                    <Shield className="w-10 h-10 text-slate-300 dark:text-slate-200" />
                                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest leading-relaxed">
                                        Solo Administradores y Gerentes pueden gestionar zonas geográficas
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
                                    <div key="base-merida" className="bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 dark:border-primary/30 p-8 rounded-[2.5rem] flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-primary text-white rounded-[2rem] flex items-center justify-center shadow-lg shadow-primary/20">
                                                <Globe className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Sede Central de Operaciones</div>
                                                <h3 className="text-3xl font-black text-secondary dark:text-white uppercase tracking-tighter">{l.ciudad}</h3>
                                                <p className="text-slate-400 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest">{l.estado}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="hidden md:block">
                                                <span className="px-5 py-2 bg-white dark:bg-slate-800 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-sm">Sede Base</span>
                                            </div>
                                            {(session.role === 'admin' || session.role === 'manager') && (
                                                <button
                                                    onClick={() => setLocationModal({ open: true, data: { ...l, redes_sociales: l.redes_sociales || { facebook: '', instagram: '', whatsapp: '' } } })}
                                                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-300 hover:text-primary rounded-xl shadow-sm transition-all active:scale-95"
                                                    title="Editar Ficha de Sucursal Principal"
                                                >
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Sucursales y Zonas de Operación Regionales</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {locations.filter(l => l.ciudad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") !== 'merida').map(l => {
                                            return (
                                                <div key={l.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-primary/20 dark:hover:border-primary/30 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary border border-slate-100 dark:border-slate-700">
                                                            <MapPin className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-black text-secondary dark:text-white uppercase tracking-tight">{l.ciudad}</div>
                                                            </div>
                                                            <div className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">{l.estado}</div>
                                                            {!products.some(p => p.ciudad === l.id || p.ciudad === l.ciudad) && (
                                                                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">
                                                                    <AlertCircle className="w-2.5 h-2.5" /> Sin Tarifas Regionales
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {(session.role === 'admin' || session.role === 'manager') && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setLocationModal({ open: true, data: { ...l, redes_sociales: l.redes_sociales || { facebook: '', instagram: '', whatsapp: '' } } })}
                                                                className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-300 hover:text-primary border border-slate-100 dark:border-slate-700 rounded-xl transition-all"
                                                                title="Editar Detalles de Sucursal"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLocation(l.id, l.ciudad)}
                                                                className="p-3 bg-red-50 dark:bg-red-900/20 text-red-300 dark:text-red-400 hover:text-red-600 rounded-xl transition-all"
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
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                            <div>
                                <h2 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    <Globe className="w-6 h-6 text-primary" />
                                    Ajustes Globales del Sistema
                                </h2>
                                <p className="text-slate-400 dark:text-slate-300 text-sm mt-1">Configuración técnica y llaves de API externas</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-[2rem] text-white space-y-6 border border-transparent dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                            <Key className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-tight text-white">Google Maps API KEY</h3>
                                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest">Mapas Satelitales</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <input
                                            type="password"
                                            className="w-full bg-white/5 border border-white/10 dark:border-white/5 rounded-xl px-4 py-3 text-sm font-mono focus:border-primary outline-none transition-all placeholder:text-slate-600"
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

                                <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-[2rem] border border-red-100 dark:border-red-900/50 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center">
                                            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-tight text-red-900 dark:text-red-400">Seguridad y Limpieza</h3>
                                            <p className="text-[9px] font-bold text-red-400 dark:text-red-500 uppercase tracking-widest">Control de purga de base de datos</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-red-300 dark:text-red-600 uppercase tracking-widest ml-1">Contraseña Máster de Depuración</label>
                                            <input
                                                type="password"
                                                className="w-full bg-white dark:bg-slate-800 border border-red-100 dark:border-red-900/50 rounded-xl px-4 py-3 text-sm font-mono text-secondary dark:text-white focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                                placeholder="Asigna una contraseña..."
                                                value={purgePassword}
                                                onChange={e => setPurgePassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUpdatePurgePassword}
                                                disabled={isSavingPurgePassword}
                                                className="flex-[2] bg-secondary dark:bg-slate-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                                            >
                                                {isSavingPurgePassword ? 'Guardando...' : 'Guardar Nueva Clave'}
                                            </button>
                                            <button
                                                onClick={() => setShowPurgeModal(true)}
                                                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none"
                                            >
                                                Purgar Datos
                                            </button>
                                        </div>
                                    </div>
                                </div>



                                <div className="md:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black uppercase tracking-tight text-secondary dark:text-white">Marketing Script Manager</h3>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-0.5">Gestión de píxeles y rastreadores de conversión</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsAddingScript(!isAddingScript)}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${isAddingScript ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 shadow-none' : 'bg-secondary dark:bg-primary text-white shadow-lg shadow-secondary/10 dark:shadow-primary/20 hover:scale-[1.02]'}`}
                                        >
                                            {isAddingScript ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                            <span>{isAddingScript ? 'Cerrar' : 'Nueva Red'}</span>
                                        </button>
                                    </div>

                                    {isAddingScript && (
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Plataforma</label>
                                                    <select
                                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-secondary dark:text-white outline-none"
                                                        value={newScript.platform}
                                                        onChange={e => setNewScript({ ...newScript, platform: e.target.value })}
                                                    >
                                                        <option value="facebook">Facebook Pixel</option>
                                                        <option value="google_ads">Google Ads (G-Tag)</option>
                                                        <option value="google_analytics">Google Analytics</option>
                                                        <option value="tiktok">TikTok Pixel</option>
                                                        <option value="custom">Código Custom</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ID del Pixel / Tracking</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-secondary dark:text-white outline-none"
                                                        placeholder="Ej: 123456789"
                                                        value={newScript.pixel_id}
                                                        onChange={e => setNewScript({ ...newScript, pixel_id: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleAddMarketingScript}
                                                    disabled={isSavingPixel || !newScript.pixel_id}
                                                    className="flex-[2] bg-secondary dark:bg-primary text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.01] transition-all disabled:opacity-50 shadow-lg shadow-secondary/10 dark:shadow-primary/20"
                                                >
                                                    {isSavingPixel ? 'Conectando...' : 'Conectar e Inyectar en Web'}
                                                </button>
                                                <button
                                                    onClick={() => setIsAddingScript(false)}
                                                    className="flex-1 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {marketingScripts.length === 0 ? (
                                            <p className="text-center py-8 text-slate-400 text-xs italic">No hay scripts configurados. Haz clic en el botón + para empezar.</p>
                                        ) : (
                                            marketingScripts.map((script) => (
                                                <div key={script.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-800/40 rounded-[1.5rem] border border-slate-50 dark:border-slate-700/50 hover:border-primary/20 transition-all group/item">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${script.is_active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                                            {script.platform === 'facebook' ? <Facebook className="w-6 h-6" /> : script.platform.includes('google') ? <Globe className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-sm font-black uppercase tracking-tight text-secondary dark:text-white">{script.platform.replace('_', ' ')}</h4>
                                                                {!script.is_active && <span className="text-[8px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-widest">Inactivo</span>}
                                                            </div>
                                                            <p className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
                                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                                {script.pixel_id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col items-end gap-1 mr-2 invisible group-hover/item:visible">
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Estado</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleToggleScript(script.id, script.is_active)}
                                                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${script.is_active ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-slate-200 dark:bg-slate-700'}`}
                                                        >
                                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${script.is_active ? 'right-1' : 'left-1'}`} />
                                                        </button>
                                                        <div className="w-px h-8 bg-slate-100 dark:bg-slate-700 mx-1" />
                                                        <button
                                                            onClick={() => handleDeleteScript(script.id, script.platform)}
                                                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                        <Package className="w-6 h-6 text-primary" />
                                        Catálogo Maestro de Productos
                                    </h2>
                                    <p className="text-slate-400 dark:text-slate-300 text-sm mt-1">Define las características técnicas de cada sistema termoaislante</p>
                                </div>
                                {(session.role === 'admin' || session.role === 'manager') && (
                                    <button
                                        onClick={() => setProductModal({ open: true, type: 'create', data: { title: '', internal_id: '', category: 'concrete' } })}
                                        className="bg-secondary dark:bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20 dark:shadow-primary/20 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Nuevo Producto Master
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(masterProducts.length > 0 ? masterProducts : Array.from(new Set(products.map(p => p.internal_id))).map(id => products.find(prod => prod.internal_id === id))).map((p: any) => (
                                    <div key={p.id || p.internal_id} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] p-6 space-y-4 hover:shadow-xl hover:shadow-slate-100/50 dark:hover:shadow-none transition-all border-b-4 border-b-primary/20">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black bg-primary text-white px-2 py-0.5 rounded-full uppercase">{p?.category}</span>
                                                <div title={p.activo !== false ? 'Producto Activo' : 'Producto Pausado'} className={`w-3 h-3 rounded-full ${p.activo !== false ? 'bg-green-500' : 'bg-slate-400'}`} />
                                                <div title={p.visible_on_web !== false ? 'Visible en Web' : 'Oculto en Web'} className={`w-3 h-3 rounded-full ${p.visible_on_web !== false ? 'bg-blue-500' : 'bg-slate-400'}`} />
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
                                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-secondary dark:text-white shadow-sm"
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
                    <div className="fixed inset-0 bg-secondary/80 dark:bg-slate-950/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 lead-modal-overlay">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                        <UserCircle className="w-7 h-7 text-primary" />
                                        {selectedLeadForDetail.id === 'new' ? 'Nuevo Cliente' : 'Ficha del Cliente'}
                                    </h3>
                                    <p className="text-slate-400 dark:text-slate-300 text-sm font-medium">
                                        {selectedLeadForDetail.id === 'new' ? 'Captura Inicial' : `Folio: ${getFolio(selectedLeadForDetail)}`}
                                    </p>
                                </div>
                                <button onClick={() => { setSelectedLeadForDetail(null); setShowAttributionOverlay(false); }} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all text-slate-400 dark:text-slate-300">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveLeadDetail} className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                                {selectedLeadForDetail.is_out_of_zone && (
                                    <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 rounded-2xl flex items-center gap-3 text-orange-800 dark:text-orange-400 animate-pulse">
                                        <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-600 flex-shrink-0" />
                                        <p className="text-[11px] font-black uppercase tracking-tight">Zona Foránea: Requiere validación de costos logísticos</p>
                                    </div>
                                )}

                                {selectedLeadForDetail.is_manual && (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl flex items-center gap-3 text-blue-800 dark:text-blue-400">
                                        <FileSignature className="w-5 h-5 text-blue-500 dark:text-blue-600 flex-shrink-0" />
                                        <p className="text-[11px] font-black uppercase tracking-tight">Lead Generado Manualmente</p>
                                    </div>
                                )}

                                {/* Contact Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Nombre del Cliente</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                                            value={selectedLeadForDetail.contact_info.name}
                                            readOnly={!canEditQuote(selectedLeadForDetail)}
                                            onChange={e => setSelectedLeadForDetail({
                                                ...selectedLeadForDetail,
                                                contact_info: { ...selectedLeadForDetail.contact_info, name: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">WhatsApp</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                                            value={selectedLeadForDetail.contact_info.phone}
                                            readOnly={!canEditQuote(selectedLeadForDetail)}
                                            onChange={e => setSelectedLeadForDetail({
                                                ...selectedLeadForDetail,
                                                contact_info: { ...selectedLeadForDetail.contact_info, phone: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
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
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                                        <input
                                            type="date"
                                            className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                                            value={selectedLeadForDetail.fecha_nacimiento || ''}
                                            readOnly={!canEditQuote(selectedLeadForDetail)}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, fecha_nacimiento: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Código Postal</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                                            value={selectedLeadForDetail.postal_code || ''}
                                            placeholder="CP"
                                            maxLength={5}
                                            readOnly={!canEditQuote(selectedLeadForDetail)}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, postal_code: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">¿Cómo nos conoció? (Obligatorio)</label>
                                        <select
                                            className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-primary/20 dark:border-primary/10 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                                            value={selectedLeadForDetail.manual_source || ''}
                                            disabled={!canEditQuote(selectedLeadForDetail)}
                                            onChange={e => {
                                                setSelectedLeadForDetail({ ...selectedLeadForDetail, manual_source: e.target.value });
                                                if (e.target.value) setShowAttributionOverlay(true);
                                            }}
                                        >
                                            <option value="">Seleccione Opción...</option>
                                            <option value="Facebook">Facebook (Anuncio)</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="Google">Google Search</option>
                                            <option value="TikTok">TikTok</option>
                                            <option value="TV">Campaña TV</option>
                                            <option value="OTT">Plataformas OTT</option>
                                            <option value="Radio">Radio</option>
                                            <option value="Recomendacion">Recomendación</option>
                                            <option value="Espectacular">Espectacular / Lona</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>

                                    {/* Attribution Overlay Trigger Script */}
                                    <script dangerouslySetInnerHTML={{ __html: "" }} />

                                    {/* Multi-Touch Attribution Capture Overlay */}
                                    {showAttributionOverlay && (
                                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-secondary/40 backdrop-blur-md animate-in fade-in duration-300">
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl p-10 border border-white/20 dark:border-slate-800 space-y-8"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                                        <PieChart className="w-7 h-7 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight">Impacto Multicanal</h4>
                                                        <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mt-1">¿En qué otros medios nos ha visto el cliente?</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {['Radio', 'Televisión', 'Espectacular', 'Facebook', 'Instagram', 'Google', 'YouTube', 'TikTok', 'Recomendación', 'Periódico', 'Evento/Expo'].map(source => {
                                                        const isSelected = (selectedLeadForDetail.secondary_sources || []).includes(source);
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={source}
                                                                onClick={() => {
                                                                    const current = selectedLeadForDetail.secondary_sources || [];
                                                                    const next = isSelected
                                                                        ? current.filter((s: string) => s !== source)
                                                                        : [...current, source];
                                                                    setSelectedLeadForDetail({ ...selectedLeadForDetail, secondary_sources: next });
                                                                }}
                                                                className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-2 ${isSelected
                                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/30 scale-[1.02]'
                                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-transparent hover:border-indigo-300'
                                                                    }`}
                                                            >
                                                                {isSelected && <CheckSquare className="w-3 h-3" />}
                                                                {source}
                                                            </button>
                                                        );
                                                    })}
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAttributionOverlay(false)}
                                                        className="col-span-full mt-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500/50"
                                                    >
                                                        Finalizar / Ninguno de los anteriores
                                                    </button>
                                                </div>

                                                <p className="text-center text-[9px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-widest">Puedes seleccionar múltiples opciones para un rastreo más exacto</p>
                                            </motion.div>
                                        </div>
                                    )}


                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Estado</label>
                                        <select
                                            className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                                            value={Object.keys(activeRegions).includes(selectedLeadForDetail.estado) ? selectedLeadForDetail.estado : (selectedLeadForDetail.estado ? 'Otro' : '')}
                                            disabled={!canEditQuote(selectedLeadForDetail)}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, estado: e.target.value, ciudad: '' })}
                                        >
                                            <option value="">Seleccione Estado</option>
                                            {Object.keys(activeRegions).sort().map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                            <option value="Otro">Otro (Especificar)</option>
                                        </select>
                                        {canEditQuote(selectedLeadForDetail) && (!Object.keys(activeRegions).includes(selectedLeadForDetail.estado) && selectedLeadForDetail.estado) && (
                                            <input
                                                type="text"
                                                placeholder="Nombre del Estado..."
                                                className="mt-2 w-full px-4 py-3 bg-white dark:bg-slate-800 border border-primary/30 text-sm font-bold text-primary rounded-xl outline-none animate-in fade-in slide-in-from-top-1"
                                                value={selectedLeadForDetail.estado === 'Otro' ? '' : selectedLeadForDetail.estado}
                                                onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, estado: e.target.value || 'Otro' })}
                                                autoFocus
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Ciudad</label>
                                        {(!Object.keys(activeRegions).includes(selectedLeadForDetail.estado) && selectedLeadForDetail.estado) ? (
                                            <input
                                                type="text"
                                                className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                                                value={selectedLeadForDetail.ciudad}
                                                readOnly={!canEditQuote(selectedLeadForDetail)}
                                                onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, ciudad: e.target.value })}
                                                placeholder="Escribe la ciudad..."
                                            />
                                        ) : (
                                            <>
                                                <select
                                                    className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                                                    value={(activeRegions[selectedLeadForDetail.estado]?.includes(selectedLeadForDetail.ciudad)) ? selectedLeadForDetail.ciudad : (selectedLeadForDetail.ciudad ? 'Otro' : '')}
                                                    disabled={!canEditQuote(selectedLeadForDetail) || !selectedLeadForDetail.estado}
                                                    onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, ciudad: e.target.value })}
                                                >
                                                    <option value="">Seleccione Ciudad</option>
                                                    {(activeRegions[selectedLeadForDetail.estado] || []).map(city => (
                                                        <option key={city} value={city}>{city}</option>
                                                    ))}
                                                    <option value="Otro">Otro (Especificar)</option>
                                                </select>
                                                {canEditQuote(selectedLeadForDetail) && selectedLeadForDetail.estado && (!activeRegions[selectedLeadForDetail.estado]?.includes(selectedLeadForDetail.ciudad) && selectedLeadForDetail.ciudad) && (
                                                    <input
                                                        type="text"
                                                        placeholder="Nombre de la Ciudad..."
                                                        className="mt-2 w-full px-4 py-3 bg-white dark:bg-slate-800 border border-primary/30 text-sm font-bold text-primary rounded-xl outline-none animate-in fade-in slide-in-from-top-1"
                                                        value={selectedLeadForDetail.ciudad === 'Otro' ? '' : selectedLeadForDetail.ciudad}
                                                        onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, ciudad: e.target.value || 'Otro' })}
                                                        autoFocus
                                                    />
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Dirección de Obra / Proyecto</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                                            value={selectedLeadForDetail.address}
                                            readOnly={!canEditQuote(selectedLeadForDetail)}
                                            onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, address: e.target.value })}
                                        />
                                    </div>
                                    {/* Marketing Origin Section */}
                                    {(selectedLeadForDetail.utm_source || selectedLeadForDetail.referrer) && (
                                        <div className="md:col-span-2 mt-4 p-5 bg-blue-50/30 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 space-y-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Globe className="w-4 h-4 text-blue-500" />
                                                <h4 className="font-black text-secondary dark:text-white uppercase text-[10px] tracking-tight">Origen de la Cotización</h4>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fuente</label>
                                                    <div className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase truncate">{selectedLeadForDetail.utm_source || 'Directo / Orgánico'}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Campaña</label>
                                                    <div className="text-xs font-black text-secondary dark:text-white uppercase truncate">{selectedLeadForDetail.utm_campaign || '-'}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Canal / Medio</label>
                                                    <div className="text-xs font-black text-secondary dark:text-white uppercase truncate">{selectedLeadForDetail.utm_medium || '-'}</div>
                                                </div>
                                                {selectedLeadForDetail.referrer && (
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Referido de</label>
                                                        <div className="text-xs font-black text-secondary dark:text-white truncate" title={selectedLeadForDetail.referrer}>
                                                            {selectedLeadForDetail.referrer.replace('https://', '').replace('http://', '').split('/')[0]}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Negotiation Section */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        <h4 className="font-black text-secondary dark:text-white uppercase text-sm">Ajuste Técnico y Comercial</h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">ÁREA VERIFICADA (m²)</label>
                                            <input
                                                type="number"
                                                className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
                                                value={selectedLeadForDetail.area}
                                                readOnly={!canEditQuote(selectedLeadForDetail)}
                                                onFocus={(e) => e.target.select()}
                                                onChange={e => updateLeadWithRecalculation({ area: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">TIPO DE PRECIO PARA REPORTE</label>
                                            <div className={`flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900 opacity-60' : ''}`}>
                                                <button
                                                    type="button"
                                                    disabled={!canEditQuote(selectedLeadForDetail)}
                                                    onClick={() => updateLeadWithRecalculation({ pricing_type: 'contado' })}
                                                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${(!selectedLeadForDetail.pricing_type || selectedLeadForDetail.pricing_type === 'contado') ? 'bg-secondary dark:bg-primary text-white shadow-md' : 'text-slate-400 dark:text-slate-300'}`}
                                                >Efectivo</button>
                                                <button
                                                    type="button"
                                                    disabled={!canEditQuote(selectedLeadForDetail)}
                                                    onClick={() => updateLeadWithRecalculation({ pricing_type: 'lista' })}
                                                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${selectedLeadForDetail.pricing_type === 'lista' ? 'bg-primary dark:bg-white dark:text-secondary-foreground text-white shadow-md' : 'text-slate-400 dark:text-slate-300'}`}
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
                                                        className="w-full pl-8 pr-4 py-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-xl text-sm font-black text-primary outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-primary/30"
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
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="w-5 h-5 text-primary" />
                                        <h4 className="font-black text-secondary dark:text-white uppercase text-sm">Detalles del Cierre</h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Estatus</label>
                                            <select
                                                className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900 opacity-60' : ''}`}
                                                value={selectedLeadForDetail.status}
                                                disabled={!canEditQuote(selectedLeadForDetail)}
                                                onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, status: e.target.value })}
                                            >
                                                {['Nuevo', 'Contactado', 'Visita Técnica', 'Cerrado'].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">SISTEMA FINAL COMPRADO</label>
                                            <select
                                                className={`w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-primary outline-none ${!canEditQuote(selectedLeadForDetail) ? 'bg-slate-50 dark:bg-slate-900 opacity-60' : ''}`}
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
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1 flex items-center justify-between">
                                                COSTO LOGÍSTICO (FORÁNEO)
                                                {selectedLeadForDetail.is_out_of_zone && <span className="text-[8px] bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded italic border border-orange-200 dark:border-orange-800">Recomendado</span>}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    className="w-full pl-8 pr-4 py-3 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900/50 rounded-xl text-sm font-bold text-orange-600 dark:text-orange-400 outline-none focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/30"
                                                    value={selectedLeadForDetail.costo_logistico === 0 ? '' : (selectedLeadForDetail.costo_logistico || '')}
                                                    placeholder="0"
                                                    onChange={e => updateLeadWithRecalculation({ costo_logistico: e.target.value === '' ? 0 : Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {/* Price Breakdown */}
                                            <div className="grid grid-cols-1 gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal (Sistema)</span>
                                                    <span className="text-sm font-black text-secondary dark:text-white">${Number(selectedLeadForDetail.pricing_type === 'lista' ? selectedLeadForDetail.precio_total_msi : selectedLeadForDetail.precio_total_contado).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo Logístico</span>
                                                    <span className="text-sm font-black text-orange-600 dark:text-orange-400">+ ${Number(selectedLeadForDetail.costo_logistico || 0).toLocaleString()}</span>
                                                </div>
                                                {selectedLeadForDetail.factura && (
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">IVA (16%)</span>
                                                        <span className="text-sm font-black text-blue-600 dark:text-blue-400">+ ${((Number(selectedLeadForDetail.pricing_type === 'lista' ? selectedLeadForDetail.precio_total_msi : selectedLeadForDetail.precio_total_contado) + Number(selectedLeadForDetail.costo_logistico || 0)) * 0.16).toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                                                <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">TOTAL FINAL ESTIMADO</label>
                                                <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
                                                    <span className="text-primary font-black text-xl">$</span>
                                                    <span className="text-2xl font-black text-primary tracking-tight">
                                                        {Math.round((Number(selectedLeadForDetail.pricing_type === 'lista' ? selectedLeadForDetail.precio_total_msi : selectedLeadForDetail.precio_total_contado) + Number(selectedLeadForDetail.costo_logistico || 0)) * (selectedLeadForDetail.factura ? 1.16 : 1)).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold italic text-center">* Este resumen incluye base {selectedLeadForDetail.pricing_type === 'lista' ? 'lista' : 'efectivo'} + logística + impuestos aplicables.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Notas y Comentarios Internos</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-secondary dark:text-white min-h-[100px] outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        placeholder="Escribe notas sobre el cliente o el proceso de venta..."
                                        value={selectedLeadForDetail.notas || ''}
                                        onChange={e => setSelectedLeadForDetail({ ...selectedLeadForDetail, notas: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowQuotePreview(true)}
                                        className="bg-white dark:bg-slate-800 text-secondary dark:text-white border-2 border-slate-200 dark:border-slate-700 py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-[10px] shadow-sm"
                                        title="Generar y previsualizar reporte formal para el cliente"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Vista Previa Cotización
                                    </button>
                                    {(canEditQuote(selectedLeadForDetail) || session?.role === 'editor') && (
                                        <button
                                            disabled={isSavingDetail}
                                            className="bg-secondary dark:bg-primary text-white py-3.5 rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-primary/90 transition-all shadow-lg shadow-secondary/20 dark:shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] text-[10px]"
                                            title="Guardar cambios técnicos, comerciales y notas"
                                        >
                                            {isSavingDetail ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Actualizar Ficha
                                        </button>
                                    )}
                                    {!canEditQuote(selectedLeadForDetail) && (
                                        <div className="col-span-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2">
                                            <Shield className="w-5 h-5 text-slate-300 dark:text-slate-200" />
                                            <p className="italic text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest">
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
                    <div className="fixed inset-0 bg-secondary/95 dark:bg-slate-950/98 z-[150] overflow-y-auto p-0 md:px-12 md:pb-12 md:pt-0 flex items-start justify-center backdrop-blur-md quote-preview-overlay">
                        <div id="printable-quote-modal-content" className="w-full max-w-4xl bg-white shadow-2xl relative border border-slate-200 dark:border-slate-800">
                            {/* Browser Controls */}
                            <div className="sticky top-0 bg-slate-900 p-4 flex items-center justify-between z-10 print:hidden border-b border-white/10">
                                <div className="flex items-center gap-4">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <span className="text-xs font-black uppercase tracking-widest text-white">Reporte de Cotización Formal</span>
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
                                const subtotal = basePrice + logistics; // This subtotal is base + logistics
                                const iva = selectedLeadForDetail.factura ? subtotal * 0.16 : 0;
                                const grandTotal = subtotal + iva;

                                return (
                                    <div id="printable-quote" className="bg-white p-6 md:px-16 md:pb-12 md:pt-0 text-slate-800 font-sans print:p-0 print:m-0 print:text-black">
                                        {/* Header Banner - Compounded for single page */}
                                        <div className="flex flex-row justify-between items-center mb-6 border-b-4 border-primary py-6 px-8 bg-slate-50/50 rounded-b-2xl print:bg-transparent print:py-4">
                                            <div className="flex items-center gap-3">
                                                <img src="/logo.png" alt="Thermo House" className="h-10 w-auto" />
                                                <div>
                                                    <h2 className="text-xl font-black text-slate-900 tracking-tighter leading-tight">THERMO HOUSE</h2>
                                                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Aislamiento Térmico & Acústico</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Cotización Automática</div>
                                                <div className="text-sm font-black text-slate-900">Folio: {getFolio(selectedLeadForDetail)}</div>
                                                <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">Vence en: 7 días hábiles</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 mb-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                            <div>
                                                <h4 className="text-[8px] font-black uppercase tracking-widest text-primary mb-2">Información del Cliente</h4>
                                                <div className="space-y-1">
                                                    <p className="text-base font-black text-slate-900 uppercase leading-none">{selectedLeadForDetail.contact_info.name}</p>
                                                    <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
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
                                                    <p className="text-sm font-black text-slate-900 mt-2 uppercase tracking-tight">Área: {selectedLeadForDetail.area} m²</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Product Section - Reduced padding */}
                                        <div className="mb-6">
                                            <div className="bg-slate-900 text-white p-4 rounded-t-lg">
                                                <div className="grid grid-cols-4 text-[8px] font-black uppercase tracking-[0.2em]">
                                                    <div className="col-span-2">Concepto / Sistema Aplicado</div>
                                                    <div className="text-center">Área</div>
                                                    <div className="text-right">Cantidades</div>
                                                </div>
                                            </div>
                                            <div className="border-x border-b border-slate-100 p-4 space-y-4">
                                                <div className="grid grid-cols-4 items-start">
                                                    <div className="col-span-2">
                                                        <h5 className="text-sm font-black text-slate-900 uppercase mb-1">
                                                            {products.find(p => p.id === selectedLeadForDetail.solution_id)?.title || 'Sistema Thermo House'}
                                                            <span className="ml-2 text-[7px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-200 align-middle font-bold">
                                                                P. {selectedLeadForDetail.pricing_type === 'lista' ? 'LISTA' : 'EFECTIVO'}
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
                                                    <div className="text-center text-sm font-black text-slate-600">{selectedLeadForDetail.area} m²</div>
                                                    <div className="text-right text-sm font-black text-slate-900">
                                                        ${basePrice.toLocaleString()}
                                                    </div>
                                                </div>

                                                {logistics > 0 && (
                                                    <div className="grid grid-cols-4 items-center bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                                                        <div className="col-span-2">
                                                            <h6 className="text-[10px] font-black text-orange-800 uppercase tracking-widest">Cargo por Logística Foránea</h6>
                                                            <p className="text-[9px] font-bold text-orange-600/70">Traslado de equipo y personal a zona {selectedLeadForDetail.ciudad}</p>
                                                        </div>
                                                        <div className="text-center text-sm font-black text-orange-300">--</div>
                                                        <div className="text-right text-sm font-black text-orange-800">
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
                                                        <div className="flex justify-between items-center text-slate-400 font-bold text-sm uppercase tracking-widest pl-12">
                                                            <span>Subtotal</span>
                                                            <span className="font-black text-slate-900">${basePrice.toLocaleString()}</span>
                                                        </div>
                                                        {logistics > 0 && (
                                                            <div className="flex justify-between items-center text-orange-600 font-bold text-sm uppercase tracking-widest pl-12">
                                                                <span>Logística</span>
                                                                <span className="font-black">${logistics.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                        {selectedLeadForDetail.factura && (
                                                            <div className="flex justify-between items-center font-bold text-sm uppercase tracking-widest text-blue-500 pl-12">
                                                                <span>IVA (16%)</span>
                                                                <span className="font-black">${iva.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                        <div className="h-px bg-slate-200 ml-12" />
                                                        <div className="flex justify-between items-center pl-12">
                                                            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Total Final</span>
                                                            <span className="text-lg font-black text-primary">${grandTotal.toLocaleString()}</span>
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
                                                        La garantía de por vida depende de los mantenimientos programados y oportunos.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col justify-end">
                                                {(() => {
                                                    const advisor = selectedLeadForDetail.advisor || session;
                                                    const advisorName = advisor?.name || 'Asesor';
                                                    const advisorLastName = advisor?.apellido || '';
                                                    const advisorPhone = advisor?.telefono || '999 448 6445';

                                                    return (
                                                        <div className="flex flex-col items-end text-right">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Atendido por:</p>
                                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1">
                                                                {advisorName} {advisorLastName}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                                                                <Phone className="w-2.5 h-2.5 text-primary" />
                                                                <span>{advisorPhone}</span>
                                                            </div>
                                                            <div className="h-0.5 w-32 bg-primary mt-3 opacity-30" />
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-800 mt-2">Thermo House México</p>
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
                    <div className="fixed inset-0 bg-secondary/80 dark:bg-slate-950/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                        <MapPin className="w-7 h-7 text-primary" />
                                        Ficha de {locationModal.data.ciudad}
                                    </h3>
                                    <p className="text-slate-400 dark:text-slate-300 text-xs font-bold uppercase tracking-widest mt-1">Configuración de Sucursal / Operación</p>
                                </div>
                                <button onClick={() => setLocationModal({ open: false, data: null })} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all text-slate-400 dark:text-slate-300">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateLocation} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Dirección Completa</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            value={locationModal.data.direccion || ''}
                                            onChange={e => setLocationModal({ ...locationModal, data: { ...locationModal.data, direccion: e.target.value } })}
                                            placeholder="Calle, Número, Col., CP"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Teléfono de Contacto</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            value={locationModal.data.telefono || ''}
                                            onChange={e => setLocationModal({ ...locationModal, data: { ...locationModal.data, telefono: e.target.value } })}
                                            placeholder="999 000 0000"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            value={locationModal.data.correo || ''}
                                            onChange={e => setLocationModal({ ...locationModal, data: { ...locationModal.data, correo: e.target.value } })}
                                            placeholder="sucursal@thermohouse.mx"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Google Maps (URL)</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                            value={locationModal.data.google_maps_link || ''}
                                            onChange={e => setLocationModal({ ...locationModal, data: { ...locationModal.data, google_maps_link: e.target.value } })}
                                            placeholder="https://goo.gl/maps/..."
                                        />
                                    </div>
                                </div>

                                <div className="p-6 bg-primary/5 dark:bg-primary/10 rounded-[2rem] border border-primary/10 dark:border-primary/20 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        <h4 className="font-black text-secondary dark:text-white uppercase text-sm">Redes Sociales de la Sucursal</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">WhatsApp</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
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
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Facebook</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
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
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Instagram</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
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

                                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/80 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${locationModal.data.is_branch ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-300'}`}>
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-secondary dark:text-white uppercase tracking-tight">Habilitar como Sucursal Física</p>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest">Aparecerá en la sección "Sucursales" del sitio</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={locationModal.data.is_branch || false}
                                            onChange={e => setLocationModal({ ...locationModal, data: { ...locationModal.data, is_branch: e.target.checked } })}
                                        />
                                        <div className="w-14 h-7 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setLocationModal({ open: false, data: null })}
                                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent dark:border-slate-700"
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
                    <div className="fixed inset-0 bg-secondary/80 dark:bg-slate-950/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                        <Package className="w-7 h-7 text-primary" />
                                        {productModal.type === 'create' ? 'Nuevo Producto' :
                                            productModal.type === 'clone' ? 'Clonar Tarifa Regional' : 'Editar Producto'}
                                    </h3>
                                    <p className="text-slate-400 dark:text-slate-300 text-xs font-bold uppercase tracking-widest mt-1">Configuración técnica</p>
                                </div>
                                <button onClick={() => setProductModal({ ...productModal, open: false })} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-400 dark:text-slate-300">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProductData} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                                {productModal.isMaster ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">ID Interno (Ej: th-fix)</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={productModal.data.internal_id}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, internal_id: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Nombre Comercial</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={productModal.data.title}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, title: e.target.value } })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Categoría</label>
                                            <select
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
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
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Espesor (Grosor)</label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej: 1 cm"
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                    value={productModal.data.grosor || ''}
                                                    onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, grosor: e.target.value } })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Orden Maestro</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                    value={productModal.data.orden}
                                                    onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, orden: e.target.value } })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Resumen de Beneficio</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Aislamiento Térmico Óptimo"
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={productModal.data.beneficio_principal || ''}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, beneficio_principal: e.target.value } })}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">Lista de Características (Ficha)</label>
                                                <span className="text-[8px] font-bold text-primary uppercase">Un elemento por renglón</span>
                                            </div>
                                            <textarea
                                                rows={5}
                                                placeholder="Resumen del sistema. Puedes usar guiones (-) o nuevas líneas para separar características.&#10;Ej: Aislamiento Térmico - Impermeable - Garantía 10 años"
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                                                value={productModal.data.detalle_costo_beneficio || ''}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, detalle_costo_beneficio: e.target.value } })}
                                            />
                                            <p className="text-[8px] text-slate-400 dark:text-slate-300 italic ml-1">* El texto se separará por guiones (-) o saltos de línea. El último elemento aparecerá en naranja.</p>
                                        </div>

                                        <div className="flex gap-6 pt-2">
                                            <label className="flex items-center gap-3 cursor-pointer bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded text-secondary"
                                                    checked={productModal.data.activo !== false}
                                                    onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, activo: e.target.checked } })}
                                                />
                                                <span className="text-[10px] font-black text-secondary dark:text-white uppercase tracking-widest">Producto Activo</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded text-blue-500"
                                                    checked={productModal.data.visible_on_web !== false}
                                                    onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, visible_on_web: e.target.checked } })}
                                                />
                                                <span className="text-[10px] font-black text-secondary dark:text-white uppercase tracking-widest">Mostrar en Web</span>
                                            </label>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-2xl border border-primary/10 dark:border-primary/20 mb-2">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Paso 1: Seleccionar Sistema</p>
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-200 leading-tight">Elige uno de tus 5 productos maestros. Los detalles técnicos (garantía, grosor, etc.) se copiarán automáticamente.</p>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Producto del Catálogo Maestro</label>
                                            <select
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-black text-secondary dark:text-white outline-none focus:border-primary transition-all"
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
                                                <option value="" disabled className="dark:bg-slate-800">Selecciona el producto...</option>
                                                {(masterProducts.length > 0 ? masterProducts : Array.from(new Set(products.map(p => p.internal_id))).map(id => products.find(prod => prod.internal_id === id))).map((m: any) => (
                                                    <option key={m.id || m.internal_id} value={m.internal_id} className="dark:bg-slate-800">{m.title}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Ciudad Destino</label>
                                            <select
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                                value={productModal.data.ciudad}
                                                onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, ciudad: e.target.value } })}
                                                required
                                            >
                                                <option value="" disabled className="dark:bg-slate-800">Selecciona ciudad para el precio</option>
                                                {locations.map(l => <option key={l.id} value={l.ciudad} className="dark:bg-slate-800">{l.ciudad} ({l.estado})</option>)}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Precio Contado $/m²</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="w-full pl-8 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-black text-secondary dark:text-white outline-none focus:border-primary transition-all"
                                                        value={productModal.data.precio_contado_m2}
                                                        onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, precio_contado_m2: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Precio MSI $/m²</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="w-full pl-8 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-black text-primary outline-none focus:border-primary transition-all"
                                                        value={productModal.data.precio_msi_m2}
                                                        onChange={e => setProductModal({ ...productModal, data: { ...productModal.data, precio_msi_m2: e.target.value } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Orden Local (Opcional)</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
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
                                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent dark:border-slate-700"
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
                    <div className="fixed inset-0 bg-secondary/80 dark:bg-slate-950/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                        <Key className="w-7 h-7 text-primary" />
                                        Cambiar Clave
                                    </h3>
                                    <p className="text-slate-400 dark:text-slate-300 text-xs font-bold uppercase tracking-widest mt-1">Usuario: {passwordModal.userName}</p>
                                </div>
                                <button onClick={() => setPasswordModal({ open: false, userId: null, userName: '' })} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-300">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        autoFocus
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        placeholder="Mínimo 6 caracteres"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && confirmResetPassword()}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setPasswordModal({ open: false, userId: null, userName: '' })}
                                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent dark:border-slate-700"
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
                    <div className="fixed inset-0 bg-secondary/80 dark:bg-slate-950/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
                            <div className="p-8 text-center space-y-6">
                                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
                                    <Trash2 className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight">
                                        {deleteModal.type === 'user' ? '¿Eliminar Asesor?' :
                                            deleteModal.type === 'product' ? '¿Eliminar Tarifa?' : '¿Eliminar Ubicación?'}
                                    </h3>
                                    <p className="text-slate-400 dark:text-slate-300 text-sm mt-2 font-bold px-4">
                                        Confirma que deseas eliminar <span className="text-secondary dark:text-white">{deleteModal.name}</span>. {deleteModal.details}
                                    </p>
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button
                                        onClick={() => setDeleteModal({ ...deleteModal, open: false })}
                                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent dark:border-slate-700"
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

            {/* Manual Lead Modal */}
            {
                manualLeadModal && (
                    <div className="fixed inset-0 bg-secondary/80 dark:bg-slate-950/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl"
                        >
                            <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight">Nuevo Lead Manual</h3>
                                    <p className="text-slate-400 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-1">Captura directa de prospectos</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setManualLeadModal(false);
                                        setManualLeadData({
                                            name: '', phone: '', email: '', area: '', address: '',
                                            ciudad: '', estado: 'Yucatán', postal_code: '', solution_id: '',
                                            pricing_type: 'contado', costo_logistico: '0', factura: false
                                        });
                                    }}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateManualLead} className="p-8 space-y-6 overflow-y-auto max-h-[75vh]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Basic Info */}
                                    <div className="space-y-4 md:col-span-2">
                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Users className="w-3 h-3" /> Información del Cliente
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Nombre Completo *</label>
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 dark:text-white"
                                                    value={manualLeadData.name}
                                                    onChange={e => setManualLeadData({ ...manualLeadData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">WhatsApp / Teléfono *</label>
                                                <input
                                                    required
                                                    type="tel"
                                                    placeholder="10 dígitos"
                                                    pattern="\d{10}"
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 dark:text-white"
                                                    value={manualLeadData.phone}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                        setManualLeadData({ ...manualLeadData, phone: val });
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                                <input
                                                    type="email"
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 dark:text-white"
                                                    value={manualLeadData.email}
                                                    onChange={e => setManualLeadData({ ...manualLeadData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Project Details */}
                                    <div className="space-y-4 md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                            <MapPin className="w-3 h-3" /> Ubicación y Dimensiones
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Estado *</label>
                                                <select
                                                    required
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 dark:text-white"
                                                    value={manualLeadData.estado}
                                                    onChange={e => setManualLeadData({ ...manualLeadData, estado: e.target.value, ciudad: '' })}
                                                >
                                                    <option value="">Selecciona Estado</option>
                                                    {Object.keys(MEXICAN_CITIES_BY_STATE).sort().map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Ciudad *</label>
                                                <select
                                                    required
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 dark:text-white"
                                                    value={manualLeadData.ciudad}
                                                    onChange={e => setManualLeadData({ ...manualLeadData, ciudad: e.target.value })}
                                                    disabled={!manualLeadData.estado}
                                                >
                                                    <option value="">Selecciona Ciudad</option>
                                                    {manualLeadData.estado && MEXICAN_CITIES_BY_STATE[manualLeadData.estado]?.sort().map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1 md:col-span-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Área Estimada (m²) *</label>
                                                <input
                                                    required
                                                    type="number"
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 dark:text-white"
                                                    value={manualLeadData.area}
                                                    onChange={e => setManualLeadData({ ...manualLeadData, area: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Código Postal *</label>
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 dark:text-white"
                                                    value={manualLeadData.postal_code}
                                                    onChange={e => setManualLeadData({ ...manualLeadData, postal_code: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1 md:col-span-2 pt-2">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Dirección del Proyecto *</label>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="Calle, colonia, referencia..."
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 dark:text-white"
                                                    value={manualLeadData.address}
                                                    onChange={e => setManualLeadData({ ...manualLeadData, address: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* System Selection */}
                                    <div className="space-y-4 md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Package className="w-3 h-3" /> Configuración Comercial
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Sistema a Cotizar *</label>
                                                <select
                                                    required
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 dark:text-white"
                                                    value={manualLeadData.solution_id}
                                                    onChange={e => setManualLeadData({ ...manualLeadData, solution_id: e.target.value })}
                                                >
                                                    <option value="">Selecciona Sistema</option>
                                                    {(products.some(p => p.ciudad === manualLeadData.ciudad)
                                                        ? products.filter(p => p.ciudad === manualLeadData.ciudad)
                                                        : products.filter(p => p.ciudad === 'Mérida')
                                                    ).map(p => (
                                                        <option key={p.id} value={p.id}>{p.title} {p.ciudad === 'Mérida' && manualLeadData.ciudad !== 'Mérida' ? '(Base Mérida)' : `(${p.ciudad})`}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Modalidad de Pago</label>
                                                <select
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 dark:text-white"
                                                    value={manualLeadData.pricing_type}
                                                    onChange={e => setManualLeadData({ ...manualLeadData, pricing_type: e.target.value })}
                                                >
                                                    <option value="contado">Pago de Contado (-15% aprox)</option>
                                                    <option value="lista">Precio de Lista / 12 MSI</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Gastos Logísticos ($)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 dark:text-white"
                                                    value={manualLeadData.costo_logistico}
                                                    onChange={e => setManualLeadData({ ...manualLeadData, costo_logistico: e.target.value })}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            {/* Factura control hidden as per request */}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setManualLeadModal(false);
                                            setManualLeadData({
                                                name: '', phone: '', email: '', area: '', address: '',
                                                ciudad: '', estado: 'Yucatán', postal_code: '', solution_id: '',
                                                pricing_type: 'contado', costo_logistico: '0', factura: false
                                            });
                                        }}
                                        className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-[10px]"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingManualLead}
                                        className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-[10px]"
                                    >
                                        {isSavingManualLead ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Registrar Lead Manualmente
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )
            }

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-secondary/80 dark:bg-slate-950/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    <TrendingUp className="w-7 h-7 text-indigo-600" />
                                    Registrar Inversión
                                </h3>
                                <p className="text-slate-400 dark:text-slate-300 text-xs font-bold uppercase tracking-widest mt-1">Control de costos de adquisición</p>
                            </div>
                            <button onClick={() => setShowExpenseModal(false)} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-secondary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Medio / Canal</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={newExpense.source}
                                        onChange={e => setNewExpense({ ...newExpense, source: e.target.value })}
                                    >
                                        <option value="facebook">Facebook Ads</option>
                                        <option value="google">Google Ads</option>
                                        <option value="radio">Radio</option>
                                        <option value="tv">Televisión</option>
                                        <option value="spectacular">Espectacular</option>
                                        <option value="other">Otro</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Monto ($ MXN)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="0.00"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Nombre de Campaña (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="Ej: Hot Sale 2025"
                                    value={newExpense.campaign}
                                    onChange={e => setNewExpense({ ...newExpense, campaign: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={newExpense.startDate}
                                        onChange={e => setNewExpense({ ...newExpense, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Fecha Fin</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        value={newExpense.endDate}
                                        onChange={e => setNewExpense({ ...newExpense, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAddExpense}
                                disabled={isSavingSpend}
                                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                {isSavingSpend ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Guardar Registro de Inversión
                            </button>
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
                    margin: 0.5cm;
                }

                body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    background: white !important;
                }

                #printable-quote {
                    width: 100% !important;
                    height: auto !important;
                    overflow: visible !important;
                    page-break-after: avoid !important;
                    page-break-inside: avoid !important;
                }

                /* Force black text for contrast in print */
                .text-slate-900, .text-secondary {
                    color: #000000 !important;
                }
                
                .text-slate-600, .text-slate-400 {
                    color: #333333 !important;
                }

                html, body {
                    height: auto !important;
                    overflow: visible !important;
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
            {
                showPurgeModal && (
                    <div className="fixed inset-0 bg-secondary/95 dark:bg-slate-950/98 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
                            <div className="bg-red-600 p-8 text-white text-center space-y-2">
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                    <AlertTriangle className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Zona de Peligro</h3>
                                <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Esta acción es irreversible</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <p className="text-sm text-slate-600 dark:text-slate-200 font-medium text-center leading-relaxed">
                                    Se eliminarán <strong>TODOS</strong> los leads y cotizaciones registrados hasta el momento. Ingrese la contraseña de depuración para continuar.
                                </p>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Contraseña de Depuración</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-center font-black tracking-[0.5em] text-secondary dark:text-white focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        placeholder="••••••••"
                                        value={purgePasswordInput}
                                        onChange={e => setPurgePasswordInput(e.target.value)}
                                    />
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex items-start gap-3">
                                    <div className="mt-0.5">
                                        <input
                                            type="checkbox"
                                            id="confirmPurge"
                                            className="w-4 h-4 rounded border-red-300 dark:border-red-900/50 text-red-600 focus:ring-red-500 dark:focus:ring-red-900/30 cursor-pointer bg-white dark:bg-slate-800"
                                            checked={confirmPurge}
                                            onChange={e => setConfirmPurge(e.target.checked)}
                                        />
                                    </div>
                                    <label htmlFor="confirmPurge" className="text-[10px] font-bold text-red-700 dark:text-red-400 leading-tight cursor-pointer uppercase">
                                        Confirmo que deseo ELIMINAR permanentemente todos los datos de esta sección.
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { setShowPurgeModal(false); setPurgePasswordInput(''); setConfirmPurge(false); }}
                                        className="flex-1 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
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
                )
            }

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, visible: false })}
            />
        </div >
    );
}
