'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Shield, Zap, Droplets, Loader2, Phone, ArrowRight, RotateCcw, Sparkles, Package, MapPin, CheckCircle2, Building2, Factory, AlertTriangle, AlertCircle } from 'lucide-react';
import { calculateQuote } from '@/app/actions/calculate-quote';
import { saveQuote } from '@/app/actions/save-quote';
import { getAllSolutions } from '@/app/actions/get-solutions';
import { Solution } from '@/types';

interface QuoteGeneratorProps {
    initialArea: number;
    address?: string;
    city?: string;
    stateName?: string;
    mapsLink?: string;
    postalCode?: string;
}

export default function QuoteGenerator({ initialArea, address, city, stateName, mapsLink, postalCode }: QuoteGeneratorProps) {
    const [currentStep, setCurrentStep] = useState<'selection' | 'contact' | 'result'>('selection');
    const [roofType, setRoofType] = useState<'concrete' | 'sheet' | null>(null);
    const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
    const [leadName, setLeadName] = useState('');
    const [contactData, setContactData] = useState({ phone: '', email: '' });
    const [allDbSolutions, setAllDbSolutions] = useState<Solution[]>([]);
    const [dbLoaded, setDbLoaded] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);

    // Auto-scroll on step change
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (currentStep === 'selection') {
            // If area is set but no roof type, scroll specifically to roof type selector
            if (initialArea > 0 && !roofType) {
                setTimeout(() => {
                    document.getElementById('roof-type-selector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500);
            }
        } else if (containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [currentStep, initialArea, roofType]);

    const fallbackSolutions: Solution[] = [
        { id: '1', internal_id: 'th-fix', title: 'TH FIX', category: 'concrete', precio_contado_m2: 79, precio_msi_m2: 94, grosor: '1000 micras', beneficio_principal: 'Sellado básico y reflectividad', detalle_costo_beneficio: 'Sistema de mantenimiento preventivo. Protege contra filtraciones leves.', orden: 1 },
        { id: '2', internal_id: 'th-light', title: 'TH LIGHT', category: 'concrete', precio_contado_m2: 119, precio_msi_m2: 142, grosor: '5 mm', beneficio_principal: 'Impermeabilidad Total Certificada', detalle_costo_beneficio: 'Aislamiento inicial. Elimina goteras por completo.', orden: 2 },
        { id: '3', internal_id: 'th-forte', title: 'TH FORTE', category: 'concrete', precio_contado_m2: 152, precio_msi_m2: 181, grosor: '10 mm', beneficio_principal: 'Máxima Protección y Aislamiento', detalle_costo_beneficio: 'Aislamiento térmico de alto rendimiento. Reduce climatización.', orden: 3 },
        { id: '4', internal_id: 'th-3-4', title: 'TH 3/4', category: 'sheet', precio_contado_m2: 186, precio_msi_m2: 221, grosor: '19 mm', beneficio_principal: 'Escudo Térmico y Acústico', detalle_costo_beneficio: 'Especial para lámina. Elimina ruido de lluvia.', orden: 4 },
        { id: '5', internal_id: 'th-ingles', title: 'TH Inglés', category: 'sheet', precio_contado_m2: 200, precio_msi_m2: 238, grosor: '25 mm', beneficio_principal: 'Aislamiento Superior Industrial', detalle_costo_beneficio: 'Máximo confort y ahorro energético total.', orden: 5 },
    ];

    useEffect(() => {
        const fetchSols = async () => {
            try {
                const res = await getAllSolutions(city);
                if (res.success && res.data?.length > 0) {
                    setAllDbSolutions(res.data);
                }
            } catch (err) {
                console.error("Failed to load solutions from DB:", err);
            } finally {
                setDbLoaded(true);
            }
        };
        fetchSols();
    }, [city]);

    const activeSolutions = allDbSolutions.length > 0 ? allDbSolutions : fallbackSolutions;

    const [isPendingCalc, startTransition] = useTransition();
    const [quote, setQuote] = useState<{ totalCash: number; totalMsi: number } | null>(null);
    const [upsellQuote, setUpsellQuote] = useState<{ totalCash: number; totalMsi: number; title: string; internal_id: string } | null>(null);
    const [calcError, setCalcError] = useState<string | null>(null);
    const [isOutOfZone, setIsOutOfZone] = useState(false);

    const [isPendingSave, startSaveTransition] = useTransition();
    const [saveState, setSaveState] = useState<{ success: boolean; errors?: Record<string, string>; message?: string } | null>(null);

    const handleSaveAndAction = async (paymentOption: 'Contado' | '12 MSI' | 'Upgrade') => {
        const formData = new FormData();
        formData.append('name', leadName);
        formData.append('phone', contactData.phone);
        formData.append('email', contactData.email);
        formData.append('area', initialArea.toString());
        formData.append('address', address || '');
        formData.append('city', city || '');
        formData.append('state', stateName || '');
        formData.append('maps_link', mapsLink || '');
        formData.append('postalCode', postalCode || '');
        formData.append('pricing_type', paymentOption === 'Contado' ? 'contado' : 'lista');

        const finalSolutionId = (paymentOption === 'Upgrade' && upsellQuote) ? upsellQuote.internal_id : selectedSolutionId;
        formData.append('solutionId', finalSolutionId || '');

        let cash = quote?.totalCash || 0;
        let msi = quote?.totalMsi || 0;

        if (paymentOption === 'Upgrade' && upsellQuote) {
            cash = upsellQuote.totalCash;
            msi = upsellQuote.totalMsi;
        }

        formData.append('totalCash', cash.toString());
        formData.append('totalMsi', msi.toString());
        formData.append('isOutOfZone', isOutOfZone ? 'true' : 'false');

        startSaveTransition(async () => {
            const result = await saveQuote(null, formData);
            if (result.success) {
                setShowSuccessModal(true);
            } else {
                setSaveState(result);
            }
        });
    };

    const getSolutionFeatures = (sol: Solution | undefined) => {
        if (!sol) return [];
        return [
            `Espesor real: ${sol.grosor || 'N/A'}`,
            sol.beneficio_principal || 'Protección de alta calidad',
            sol.detalle_costo_beneficio || 'Rendimiento garantizado',
            'Aislamiento térmico activo',
            'Garantía por escrito'
        ];
    };

    const allPotentialSols = allDbSolutions.length > 0 ? allDbSolutions : fallbackSolutions;
    const currentSolutions = (() => {
        const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const targetCityNorm = normalize(city || 'Mérida');
        const meridaNorm = normalize('Mérida');

        // Master List (Mérida)
        const meridaPool = allPotentialSols.filter(s => s.ciudad && normalize(s.ciudad) === meridaNorm);

        // City Overrides
        const cityPool = (targetCityNorm !== meridaNorm)
            ? allPotentialSols.filter(s => s.ciudad && normalize(s.ciudad) === targetCityNorm)
            : [];

        // Build Map (InternalID -> Solution)
        const finalMap = new Map<string, Solution>();

        // Load Mérida base
        meridaPool.forEach(s => {
            finalMap.set(s.internal_id.toLowerCase(), s);
        });

        // Overlay with city overrides (keeps all products, just changes pricing/data if available)
        cityPool.forEach(s => {
            finalMap.set(s.internal_id.toLowerCase(), s);
        });

        // If for some reason Mérida has nothing (new DB), load whatever is available
        if (finalMap.size === 0) {
            allPotentialSols.forEach(s => {
                const id = s.internal_id.toLowerCase();
                if (!finalMap.has(id)) finalMap.set(id, s);
            });
        }

        return Array.from(finalMap.values())
            .filter((s): s is Solution => {
                if (roofType === 'concrete') return s.category === 'concrete' || s.category === 'both';
                if (roofType === 'sheet') return s.category === 'sheet' || s.category === 'both';
                return false;
            })
            .sort((a, b) => (a.orden || 0) - (b.orden || 0));
    })();


    const selectedSolution = currentSolutions.find(s => s.internal_id === selectedSolutionId);

    const handleSolutionSelect = (id: string) => {
        setSelectedSolutionId(id);
        startTransition(() => {
            calculateQuote(initialArea, id, city || 'Mérida').then(res => {
                if (res.success && res.data) {
                    setQuote(res.data);
                    setUpsellQuote(res.upsell || null);
                    setIsOutOfZone(!!res.isOutOfZone);
                    setCalcError(null);
                    if (window.innerWidth < 768) {
                        setTimeout(() => {
                            document.getElementById('calc-button')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                    }
                } else {
                    setCalcError(res.error || 'Error al calcular');
                }
            });
        });
    };

    const getIcon = (id: string, isSelected: boolean) => {
        const colorClass = isSelected ? 'text-white' : 'text-primary';
        switch (id) {
            case 'th-fix': return <Package className={`w-8 h-8 ${colorClass}`} />;
            case 'th-light': return <Droplets className={`w-8 h-8 ${colorClass}`} />;
            case 'th-forte': return <Shield className={`w-8 h-8 ${colorClass}`} />;
            case 'th-3-4': return <Zap className={`w-8 h-8 ${colorClass}`} />;
            case 'th-ingles': return <Sparkles className={`w-8 h-8 ${colorClass}`} />;
            default: return <Package className={`w-8 h-8 ${colorClass}`} />;
        }
    };

    return (
        <div ref={containerRef} className="space-y-8 w-full max-w-5xl mx-auto scroll-mt-24 dark:text-slate-200">
            <AnimatePresence mode="wait">
                {currentStep === 'selection' && (
                    <motion.div key="selection" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                        {(() => {
                            const isLocationMissing = initialArea > 0 && (!address || !city || !stateName);
                            const canProceed = initialArea > 0 && !isLocationMissing;

                            return (
                                <AnimatePresence>
                                    {canProceed && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, y: -20, height: 0 }}
                                            transition={{ duration: 0.4, ease: "circOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-6 md:p-8 rounded-2xl border border-border dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 mb-8 transition-colors duration-500">
                                                <h3 id="roof-type-selector" className="text-lg font-bold text-secondary dark:text-white mb-6 flex items-center gap-2 scroll-mt-32">
                                                    <div className="w-2 h-6 bg-primary rounded-full" />
                                                    PRÓXIMO PASO: TIPO DE TECHO
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-6">
                                                    <button onClick={() => {
                                                        setRoofType('concrete');
                                                        setTimeout(() => {
                                                            document.getElementById('systems-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }, 100);
                                                    }} className={`relative p-4 md:p-8 rounded-2xl md:rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 md:gap-5 group overflow-hidden ${roofType === 'concrete' ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-2xl scale-[1.02]' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-xl'}`}>
                                                        {roofType === 'concrete' && <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-primary/10 rounded-bl-full -mr-6 -mt-6 md:-mr-10 md:-mt-10" />}
                                                        <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg transition-all duration-500 ${roofType === 'concrete' ? 'bg-primary text-white rotate-3' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 group-hover:rotate-3'}`}>
                                                            <Building2 className="w-6 h-6 md:w-10 md:h-10" />
                                                        </div>
                                                        <div className="text-center space-y-1">
                                                            <span className="block font-black text-secondary dark:text-white text-xs md:text-xl tracking-tighter">LOSA CONCRETO</span>
                                                            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-200 font-medium px-4">Ideal para casas habitacionales, departamentos y comercios urbanos.</p>
                                                        </div>
                                                        <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all ${roofType === 'concrete' ? 'border-primary bg-primary text-white scale-110' : 'border-slate-200 dark:border-slate-700'}`}>
                                                            {roofType === 'concrete' && <Check className="w-3 h-3 md:w-4 md:h-4" />}
                                                        </div>
                                                    </button>
                                                    <button onClick={() => {
                                                        setRoofType('sheet');
                                                        setTimeout(() => {
                                                            document.getElementById('systems-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }, 100);
                                                    }} className={`relative p-4 md:p-8 rounded-2xl md:rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 md:gap-5 group overflow-hidden ${roofType === 'sheet' ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-2xl scale-[1.02]' : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-xl'}`}>
                                                        {roofType === 'sheet' && <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-primary/10 rounded-bl-full -mr-6 -mt-6 md:-mr-10 md:-mt-10" />}
                                                        <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg transition-all duration-500 ${roofType === 'sheet' ? 'bg-primary text-white -rotate-3' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 group-hover:-rotate-3'}`}>
                                                            <Factory className="w-6 h-6 md:w-10 md:h-10" />
                                                        </div>
                                                        <div className="text-center space-y-1">
                                                            <span className="block font-black text-secondary dark:text-white text-xs md:text-xl tracking-tighter">TECHO LÁMINA</span>
                                                            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-200 font-medium px-4">Bodegas industriales, anexos metálicos y proyectos de gran escala.</p>
                                                        </div>
                                                        <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all ${roofType === 'sheet' ? 'border-primary bg-primary text-white scale-110' : 'border-slate-200 dark:border-slate-700'}`}>
                                                            {roofType === 'sheet' && <Check className="w-3 h-3 md:w-4 md:h-4" />}
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            );
                        })()}

                        {roofType && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 id="systems-title" className="text-lg font-bold text-secondary dark:text-white flex items-center gap-2">
                                    <div className="w-2 h-6 bg-primary rounded-full" />
                                    ELITE SYSTEMS: SELECCIONA TU NIVEL DE PROTECCIÓN
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {currentSolutions.map((sol) => {
                                        const isPremium = sol.internal_id === 'th-forte' || sol.internal_id === 'th-ingles';
                                        const isBestSeller = sol.internal_id === 'th-light';
                                        const isSelected = selectedSolutionId === sol.internal_id;

                                        return (
                                            <button
                                                key={sol.id}
                                                onClick={() => handleSolutionSelect(sol.internal_id)}
                                                className={`relative p-6 md:p-7 rounded-[2.5rem] border-2 text-left transition-all h-full flex flex-col group overflow-hidden ${isSelected ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-2xl ring-4 ring-primary/10 scale-[1.02]' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-xl'}`}
                                            >
                                                {isBestSeller && (
                                                    <div className="absolute top-0 right-0 bg-primary dark:bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl shadow-lg uppercase tracking-tight z-10">MAS VENDIDO</div>
                                                )}
                                                {isPremium && (
                                                    <div className="absolute top-0 right-0 bg-secondary dark:bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl shadow-lg uppercase tracking-tight z-10">MEJORALO ¡¡¡</div>
                                                )}

                                                <div className={`mb-4 md:mb-3 w-12 h-12 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-900 text-primary group-hover:bg-primary group-hover:text-white'}`}>
                                                    {getIcon(sol.internal_id, isSelected)}
                                                </div>

                                                <div className="space-y-1 mb-4 md:mb-3">
                                                    <h4 className="text-xl md:text-2xl font-black text-secondary dark:text-white leading-none uppercase tracking-tighter">{sol.title}</h4>
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-70">SISTEMA {isPremium ? 'PROFESIONAL' : 'VITAL'}</p>
                                                        <span className="text-sm md:text-base bg-primary/10 dark:bg-slate-900 text-primary dark:text-primary px-3 py-1 rounded-lg font-black w-fit border border-primary/20">
                                                            ${sol.precio_contado_m2} <span className="text-[10px] opacity-70">/m² en {city || 'Mérida'}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <ul className="space-y-2 md:space-y-1.5 mb-6 md:mb-4 flex-grow">
                                                    {getSolutionFeatures(sol).slice(0, 3).map((f, i) => (
                                                        <li key={i} className="flex items-start text-xs text-slate-600 dark:text-slate-200 gap-2.5 font-medium leading-normal">
                                                            <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${isSelected ? 'bg-primary/20 text-primary' : 'bg-green-50 dark:bg-green-900/30 text-green-500'}`}>
                                                                <Check className="w-2.5 h-2.5 stroke-[4]" />
                                                            </div>
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>

                                                <div className={`mt-auto pt-6 border-t ${isSelected ? 'border-primary/20' : 'border-slate-100 dark:border-slate-700'}`}>
                                                    <div className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-primary' : 'text-slate-400 dark:text-slate-300 group-hover:text-secondary dark:group-hover:text-white'}`}>
                                                        <span>{isSelected ? 'SISTEMA SELECCIONADO' : 'VER PRESUPUESTO'}</span>
                                                        <ArrowRight className={`w-3 h-3 transition-transform ${isSelected ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
                                                    </div>
                                                </div>

                                                {isPremium && isSelected && (
                                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {calcError && (
                                    <div className="flex justify-center pt-4">
                                        <div className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> {calcError}
                                        </div>
                                    </div>
                                )}

                                {selectedSolutionId && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pt-8 gap-4">
                                        <button
                                            id="calc-button"
                                            disabled={isPendingCalc || !!calcError}
                                            onClick={() => setCurrentStep('contact')}
                                            className={`bg-primary hover:bg-orange-600 text-white font-black px-10 md:px-12 py-4 md:py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center gap-3 text-base md:text-lg uppercase tracking-wider group active:scale-95 ${(isPendingCalc || !!calcError) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isPendingCalc ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> Calculando...</>
                                            ) : (
                                                <>{calcError ? 'Reintenta Seleccionar' : 'Continuar a Precios'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                                            )}
                                        </button>

                                        {isOutOfZone && !isPendingCalc && !calcError && (
                                            <p className="text-[10px] md:text-xs text-orange-600 font-bold uppercase tracking-widest flex items-center gap-2 animate-pulse">
                                                <AlertTriangle className="w-4 h-4" /> Zona con cargo logístico adicional
                                            </p>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {currentStep === 'contact' && (
                    <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden transition-colors duration-500">
                            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                            <div className="mb-8 text-center">
                                <h3 className="text-3xl font-black text-secondary dark:text-white tracking-tight mb-2 uppercase">¡Casi Listo!</h3>
                                <p className="text-slate-500 dark:text-slate-200 font-medium">Déjanos tus datos para enviarte el desglose oficial.</p>
                            </div>
                            <form className="space-y-6" onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const name = formData.get('name') as string;
                                const phone = formData.get('phone') as string;
                                const email = formData.get('email') as string;

                                if (name.trim().length < 3) {
                                    alert('Por favor, ingresa tu nombre completo (mínimo 3 letras).');
                                    return;
                                }
                                const cleanPhone = phone.replace(/\D/g, '');
                                if (cleanPhone.length !== 10) {
                                    alert('El WhatsApp debe ser de 10 dígitos exactamente.');
                                    return;
                                }

                                setLeadName(name);
                                setContactData({ phone: cleanPhone, email });
                                setSaveState(null);
                                setCurrentStep('result');
                            }}>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase ml-1">Nombre Completo</label>
                                        <input type="text" name="name" required minLength={3} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-secondary dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="Tu nombre..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase ml-1">WhatsApp (10 dígitos)</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            pattern="[0-9]{10}"
                                            maxLength={10}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-secondary dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                            placeholder="Ej: 9991234567"
                                            onChange={(e) => {
                                                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase ml-1">Correo Electrónico (Opcional)</label>
                                        <input type="email" name="email" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-secondary dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="ejemplo@correo.com" />
                                    </div>
                                    {(!postalCode || postalCode.length < 5) && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase ml-1">Código Postal</label>
                                            <input
                                                type="text"
                                                name="postalCode"
                                                defaultValue={postalCode}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-secondary dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                                                placeholder="CP"
                                                maxLength={5}
                                                onChange={(e) => {
                                                    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <button type="submit" className="w-full bg-primary hover:bg-orange-600 text-white font-black py-4 rounded-xl shadow-xl shadow-primary/20 transition-all text-lg flex items-center justify-center gap-2 mt-4 uppercase tracking-wider group">
                                    Ver Mi Cotización Ahora <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}

                {currentStep === 'result' && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8 py-8 md:py-12"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden text-center transition-colors duration-500">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-orange-400 to-amber-300" />
                            <div className="flex justify-center mb-6">
                                <img src="/logo.png" alt="Thermo House" className="h-10 md:h-14 w-auto filter brightness-110 drop-shadow-md" />
                            </div>
                            <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold mb-3 md:mb-4 border border-green-100 dark:border-green-800/50 uppercase tracking-widest">
                                <Check className="w-3.5 h-3.5" /> Cotización Generada
                            </div>
                            <h3 className="text-2xl md:text-5xl font-black text-secondary dark:text-white tracking-tighter">¡Todo Listo, {leadName.split(' ')[0] || 'Cliente'}!</h3>
                            <p className="text-slate-500 dark:text-slate-200 text-xs md:text-xl mt-2">Tu proyecto de <strong>{initialArea}m²</strong> en <strong>{city || address || 'tu ubicación'}</strong></p>

                            <div className="mt-8 mb-4 space-y-4">
                                <div className="bg-primary/10 dark:bg-primary/5 border-2 border-primary/30 rounded-2xl p-6 md:p-8 animate-pulse shadow-lg">
                                    <h4 className="text-xl md:text-3xl font-black text-primary uppercase tracking-tighter mb-2">¡ELIGE TU FORMA DE PAGO!</h4>
                                    <p className="text-secondary dark:text-slate-300 font-bold text-xs md:text-lg">
                                        Selecciona la opción que más te convenga y recibe tu presupuesto oficial al instante.
                                    </p>
                                </div>
                                <p className="text-slate-500 dark:text-slate-300 font-bold text-[10px] md:text-sm uppercase tracking-widest">Desplaza hacia abajo para ver las opciones:</p>
                            </div>

                            {isOutOfZone && (
                                <div className="mt-8 p-4 md:p-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl md:rounded-[2rem] text-orange-800 dark:text-orange-300 text-xs md:text-base font-bold flex items-center justify-center gap-4 animate-in fade-in zoom-in duration-500">
                                    <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-orange-500 flex-shrink-0" />
                                    <div className="text-left">
                                        <p className="text-orange-950 dark:text-orange-200">Nota de Ubicación Especial</p>
                                        <p className="text-[10px] md:text-sm font-medium opacity-80">Esta es una cotización basada en precios de Mérida. Debido a la distancia, podrían incurrir costos extras de logística y viáticos tras la visita técnica.</p>
                                    </div>
                                </div>
                            )}

                            {saveState && !saveState.success && (
                                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-bold flex items-center gap-3 animate-bounce">
                                    <AlertCircle className="w-5 h-5" />
                                    <p>Error al registrar cotización: {saveState.message || 'Intenta de nuevo.'}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 items-stretch">
                            <button
                                disabled={isPendingSave}
                                onClick={() => handleSaveAndAction('Contado')}
                                className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl flex flex-col transition-all border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[380px] text-left hover:scale-[1.02] hover:border-primary/50 group"
                            >
                                <div className="bg-secondary dark:bg-slate-800 px-6 py-4 w-full">
                                    <div className="text-white font-black text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Check className="w-4 h-4 text-primary" /> Precio de Promoción
                                    </div>
                                </div>
                                <div className="p-6 space-y-4 flex flex-col flex-grow w-full">
                                    <h4 className="text-2xl md:text-3xl font-black text-secondary dark:text-white leading-tight">{selectedSolution?.title}</h4>
                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                                        <ul className="space-y-1">
                                            {getSolutionFeatures(selectedSolution).slice(0, 3).map((f, i) => (
                                                <li key={i} className="flex items-start text-slate-600 dark:text-slate-200 text-[10px] md:text-xs gap-2 font-medium leading-tight">
                                                    <div className="w-1 rounded-full bg-primary flex-shrink-0 mt-1.5 h-1" />{f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="text-center mt-auto pt-4">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-1 block">Inversión Final:</span>
                                        <div className="text-3xl md:text-4xl font-black text-secondary dark:text-white tracking-tight">${quote?.totalCash.toLocaleString()}</div>
                                        <span className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded mt-2 inline-block">Ahorro del 14% aplicado</span>
                                    </div>
                                </div>
                            </button>

                            <button
                                disabled={isPendingSave}
                                onClick={() => handleSaveAndAction('12 MSI')}
                                className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border-2 border-primary/20 dark:border-primary/10 flex flex-col relative overflow-hidden min-h-[380px] text-left hover:scale-[1.02] hover:border-primary transition-all group"
                            >
                                <div className="bg-primary px-6 py-4 w-full">
                                    <div className="text-white font-black text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Zap className="w-4 h-4 fill-white" /> 12 Meses sin Intereses*
                                    </div>
                                </div>
                                <div className="p-6 space-y-4 flex flex-col flex-grow w-full">
                                    <h4 className="text-2xl md:text-3xl font-black text-secondary dark:text-white leading-tight">{selectedSolution?.title}</h4>
                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                                        <ul className="space-y-1 text-slate-600 dark:text-slate-200 font-medium text-[10px] md:text-xs">
                                            <li className="flex items-center gap-2 font-black text-primary"><Check className="w-4 h-4 text-primary" /> ¡Protege hoy, paga mañana!</li>
                                            <li className="flex items-center gap-2 font-black text-secondary"><Check className="w-4 h-4 text-green-500" /> Sin Intereses</li>
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Saldo diferido</li>
                                        </ul>
                                    </div>
                                    <div className="text-center mt-auto pt-4">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-1 block">12 pagos fijos de:</span>
                                        <div className="text-3xl md:text-4xl font-black text-primary tracking-tight">${Math.round((quote?.totalMsi || 0) / 12).toLocaleString()}</div>
                                        <div className="text-[9px] text-slate-400 dark:text-slate-300 mt-2 uppercase font-black tracking-widest leading-none">Inversión anual: ${quote?.totalMsi.toLocaleString()}</div>
                                    </div>
                                </div>
                            </button>

                            {upsellQuote && (
                                <button
                                    disabled={isPendingSave}
                                    onClick={() => handleSaveAndAction('Upgrade')}
                                    className="bg-secondary dark:bg-slate-950 rounded-3xl shadow-xl relative flex flex-col overflow-hidden min-h-[380px] text-left hover:scale-[1.02] transition-all group border-2 border-transparent hover:border-primary/50"
                                >
                                    <div className="bg-primary/20 backdrop-blur-sm px-6 py-4 w-full">
                                        <div className="text-white font-black text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-primary fill-primary" /> Nivel Superior Elite
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4 flex flex-col flex-grow w-full">
                                        <h4 className="text-2xl md:text-3xl font-black text-white leading-tight">{upsellQuote.title}</h4>
                                        <p className="text-[10px] md:text-xs text-primary font-bold leading-tight">
                                            Inversión inteligente: por solo una pequeña diferencia, obtén protección de por vida y máximo ahorro energético.
                                        </p>
                                        <div className="bg-white/5 rounded-2xl p-3 border border-white/10 w-full">
                                            <ul className="space-y-1.5">
                                                {(() => {
                                                    const upsellSol = currentSolutions.find(s => s.internal_id === upsellQuote.internal_id);
                                                    return getSolutionFeatures(upsellSol).slice(0, 2).map((f, i) => (
                                                        <li key={i} className="flex items-start text-slate-200 text-[10px] md:text-xs gap-2 font-medium leading-tight">
                                                            <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                                                            {f}
                                                        </li>
                                                    ));
                                                })()}
                                            </ul>
                                        </div>
                                        <div className="text-center mt-auto pt-4">
                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">12 pagos fijos de:</span>
                                            <div className="text-3xl md:text-4xl font-black text-white tracking-tight">${Math.round((upsellQuote?.totalMsi || 0) / 12).toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-300 mt-2 font-bold uppercase tracking-widest opacity-90 leading-none">
                                                Solo <span className="text-primary font-black">+$ {Math.round((upsellQuote.totalMsi - (quote?.totalMsi || 0)) / 12).toLocaleString()}</span> mensuales*
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-100 dark:border-slate-800 text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-200">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-4 uppercase tracking-widest"><Loader2 className="w-4 h-4" /><span>Precios sujetos a visita técnica de validación. Válido por 7 días.</span></div>
                                <div className="flex items-center gap-4 text-primary opacity-80 italic"><span>*12 MSI disponible con tarjetas de crédito Visa y Mastercard de bancos mexicanos. No aplica para American Express.</span></div>
                            </div>
                            <button onClick={() => {
                                setCurrentStep('selection');
                                setTimeout(() => {
                                    document.getElementById('systems-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 100);
                            }} className="group flex items-center gap-2 text-secondary dark:text-white font-bold hover:text-primary transition-colors py-2 px-4 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 uppercase tracking-widest"><RotateCcw className="w-4 h-4" /> Cambiar Sistema</button>
                        </div>
                    </motion.div>
                )
                }
            </AnimatePresence >

            {
                showSuccessModal && (
                    <div className="fixed inset-0 bg-secondary/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl p-10 md:p-14 text-center space-y-6 border border-slate-100 dark:border-slate-800">
                            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-100 dark:border-green-800/50"><CheckCircle2 className="w-10 h-10" /></div>
                            <h3 className="text-3xl md:text-4xl font-black text-secondary dark:text-white uppercase tracking-tighter leading-none">¡Gracias por <br /> <span className="text-primary">Considerarnos!</span></h3>
                            <p className="text-slate-500 dark:text-slate-200 font-medium text-base md:text-lg">Tu cotización ha sido registrada con éxito.</p>
                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700"><p className="text-slate-600 dark:text-slate-300 font-bold text-sm">En breve uno de nuestros especialistas te enviará la información detallada al medio de contacto que nos proporcionaste.</p></div>
                            <button onClick={() => { window.location.href = '/'; }} className="w-full bg-secondary dark:bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-primary/90 transition-all">Entendido</button>
                        </motion.div>
                    </div>
                )
            }
        </div >
    );
}
