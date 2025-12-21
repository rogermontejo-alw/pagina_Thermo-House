'use client';

import { useState, useEffect, useTransition, useActionState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Shield, Zap, Droplets, Loader2, Phone, ArrowRight, RotateCcw, Sparkles, Package, MapPin, CheckCircle2 } from 'lucide-react';
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
}

export default function QuoteGenerator({ initialArea, address, city, stateName, mapsLink }: QuoteGeneratorProps) {
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

    // Auto-scroll on step change (but not on initial mount)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [currentStep]);

    const fallbackSolutions: Solution[] = [
        {
            id: '1',
            internal_id: 'th-fix',
            title: 'TH FIX',
            category: 'concrete',
            precio_contado_m2: 79,
            precio_msi_m2: 94,
            grosor: '1000 micras',
            beneficio_principal: 'Sellado básico y reflectividad',
            detalle_costo_beneficio: 'Sistema de mantenimiento preventivo. Protege contra filtraciones leves.',
            orden: 1
        },
        {
            id: '2',
            internal_id: 'th-light',
            title: 'TH LIGHT',
            category: 'concrete',
            precio_contado_m2: 119,
            precio_msi_m2: 142,
            grosor: '5 mm',
            beneficio_principal: 'Impermeabilidad Total Certificada',
            detalle_costo_beneficio: 'Aislamiento inicial. Elimina goteras por completo.',
            orden: 2
        },
        {
            id: '3',
            internal_id: 'th-forte',
            title: 'TH FORTE',
            category: 'concrete',
            precio_contado_m2: 152,
            precio_msi_m2: 181,
            grosor: '10 mm',
            beneficio_principal: 'Máxima Protección y Aislamiento',
            detalle_costo_beneficio: 'Aislamiento térmico de alto rendimiento. Reduce climatización.',
            orden: 3
        },
        {
            id: '4',
            internal_id: 'th-3-4',
            title: 'TH 3/4',
            category: 'sheet',
            precio_contado_m2: 186,
            precio_msi_m2: 221,
            grosor: '19 mm',
            beneficio_principal: 'Escudo Térmico y Acústico',
            detalle_costo_beneficio: 'Especial para lámina. Elimina ruido de lluvia.',
            orden: 4
        },
        {
            id: '5',
            internal_id: 'th-ingles',
            title: 'TH Inglés',
            category: 'sheet',
            precio_contado_m2: 200,
            precio_msi_m2: 238,
            grosor: '25 mm',
            beneficio_principal: 'Aislamiento Superior Industrial',
            detalle_costo_beneficio: 'Máximo confort y ahorro energético total.',
            orden: 5
        },
    ];

    useEffect(() => {
        const fetchSols = async () => {
            try {
                const res = await getAllSolutions();
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
    }, []);

    const activeSolutions = allDbSolutions.length > 0 ? allDbSolutions : fallbackSolutions;

    // Server state for calculation
    const [isPendingCalc, startTransition] = useTransition();
    const [quote, setQuote] = useState<{ totalCash: number; totalMsi: number } | null>(null);
    const [upsellQuote, setUpsellQuote] = useState<{ totalCash: number; totalMsi: number; title: string; internal_id: string } | null>(null);
    const [calcError, setCalcError] = useState<string | null>(null);

    // Save Logic
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

        const finalSolution = (paymentOption === 'Upgrade' && upsellQuote) ? upsellQuote.internal_id : selectedSolutionId;
        formData.append('solutionId', finalSolution || '');

        let cash = quote?.totalCash || 0;
        let msi = quote?.totalMsi || 0;

        if (paymentOption === 'Upgrade' && upsellQuote) {
            cash = upsellQuote.totalCash;
            msi = upsellQuote.totalMsi;
        }

        formData.append('totalCash', cash.toString());
        formData.append('totalMsi', msi.toString());

        startSaveTransition(async () => {
            const result = await saveQuote(null, formData);
            if (result.success) {
                setShowSuccessModal(true);
            } else {
                setSaveState(result);
            }
        });
    };

    interface SolutionUI {
        id: string;
        title: string;
        features: string[];
        popular?: boolean;
        premium?: boolean;
    }

    // Filter solutions based on category including 'both'
    const currentSolutions: SolutionUI[] = activeSolutions
        .filter((s: Solution) => {
            if (roofType === 'concrete') return s.category === 'concrete' || s.category === 'both';
            if (roofType === 'sheet') return s.category === 'sheet' || s.category === 'both';
            return false;
        })
        .sort((a, b) => a.orden - b.orden)
        .map(s => ({
            id: s.internal_id,
            title: s.title,
            features: [
                `Espesor real: ${s.grosor}`,
                s.beneficio_principal,
                s.detalle_costo_beneficio,
                'Aislamiento térmico activo',
                'Garantía por escrito'
            ],
            popular: s.internal_id === 'th-light',
            premium: s.internal_id === 'th-forte' || s.internal_id === 'th-ingles'
        }));

    const selectedSolution = activeSolutions.find(s => s.internal_id === selectedSolutionId);

    const handleSolutionSelect = (id: string) => {
        setSelectedSolutionId(id);
        startTransition(() => {
            calculateQuote(initialArea, id, city || 'Mérida').then(res => {
                if (res.success) {
                    setQuote(res.data);
                    setUpsellQuote(res.upsell);
                    setCalcError(null);
                } else {
                    setCalcError(res.error || 'Error al calcular');
                }
            });
        });
    };

    const getIcon = (id: string) => {
        switch (id) {
            case 'th-fix': return <Package className="w-8 h-8 text-primary" />;
            case 'th-light': return <Droplets className="w-8 h-8 text-primary" />;
            case 'th-forte': return <Shield className="w-8 h-8 text-primary" />;
            case 'th-3-4': return <Zap className="w-8 h-8 text-primary" />;
            case 'th-ingles': return <Sparkles className="w-8 h-8 text-primary" />;
            default: return <Package className="w-8 h-8 text-primary" />;
        }
    };

    return (
        <div ref={containerRef} className="space-y-8 w-full max-w-5xl mx-auto scroll-mt-24">
            <AnimatePresence mode="wait">
                {currentStep === 'selection' && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                    >
                        {(() => {
                            const isLocationMissing = initialArea > 0 && (!address || !city || !stateName);
                            const canProceed = initialArea > 0 && !isLocationMissing;

                            return (
                                <div className={`p-6 md:p-8 rounded-2xl border border-border shadow-sm bg-white transition-all duration-300 ${canProceed ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale blur-[1px]'}`}>
                                    <h3 className="text-lg font-bold text-secondary mb-6 flex items-center gap-2">
                                        <div className="w-2 h-6 bg-primary rounded-full" />
                                        PRÓXIMO PASO: TIPO DE TECHO
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setRoofType('concrete')}
                                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 group ${roofType === 'concrete' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-slate-100 hover:border-slate-300 bg-slate-50'}`}
                                        >
                                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                <div className="w-8 h-8 bg-slate-300 rounded" />
                                            </div>
                                            <div className="text-center">
                                                <span className="block font-black text-secondary text-lg">LOSA DE CONCRETO</span>
                                                <span className="text-xs text-slate-500 font-medium">Casas, departamentos y comercios</span>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setRoofType('sheet')}
                                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 group ${roofType === 'sheet' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-slate-100 hover:border-slate-300 bg-slate-50'}`}
                                        >
                                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                <Zap className="w-8 h-8 text-primary" />
                                            </div>
                                            <div className="text-center">
                                                <span className="block font-black text-secondary text-lg">TECHO DE LÁMINA</span>
                                                <span className="text-xs text-slate-500 font-medium">Bodegas, industrias y anexos</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {roofType && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                                    <div className="w-2 h-6 bg-primary rounded-full" />
                                    ELITE SYSTEMS: SELECCIONA TU NIVEL DE PROTECCIÓN
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {currentSolutions.map((sol) => (
                                        <button
                                            key={sol.id}
                                            onClick={() => handleSolutionSelect(sol.id)}
                                            className={`relative p-6 rounded-3xl border-2 text-left transition-all h-full flex flex-col group ${selectedSolutionId === sol.id ? 'border-primary bg-primary/5 shadow-2xl ring-4 ring-primary/10' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                                        >
                                            {sol.premium && (
                                                <span className="absolute top-4 right-4 bg-secondary text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">Premium</span>
                                            )}
                                            <div className="mb-4">{getIcon(sol.id)}</div>
                                            <h4 className="text-xl font-black text-secondary mb-3 leading-none">{sol.title}</h4>
                                            <ul className="space-y-2 mb-6">
                                                {sol.features.slice(0, 3).map((f, i) => (
                                                    <li key={i} className="flex items-start text-[11px] text-slate-500 gap-2 font-medium">
                                                        <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="mt-auto pt-4 border-t border-slate-100">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedSolutionId === sol.id ? 'text-primary' : 'text-slate-400 group-hover:text-secondary'}`}>
                                                    {selectedSolutionId === sol.id ? 'SELECCIONADO ✓' : 'SELECCIONAR'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {selectedSolutionId && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center pt-8">
                                        <button
                                            onClick={() => setCurrentStep('contact')}
                                            className="bg-primary hover:bg-orange-600 text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center gap-3 text-lg uppercase tracking-wider group active:scale-95"
                                        >
                                            Continuar a Precios <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {currentStep === 'contact' && (
                    <motion.div
                        key="contact"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                            <div className="mb-8 text-center">
                                <h3 className="text-3xl font-black text-secondary tracking-tight mb-2 uppercase">¡Casi Listo!</h3>
                                <p className="text-slate-500 font-medium">Déjanos tus datos para enviarte el desglose oficial.</p>
                            </div>

                            <form className="space-y-6" action={(formData) => {
                                const name = formData.get('name') as string;
                                const phone = formData.get('phone') as string;
                                const email = formData.get('email') as string;
                                setLeadName(name);
                                setContactData({ phone, email });
                                setSaveState(null);
                                setCurrentStep('result');
                            }}>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre Completo</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                            placeholder="Tu nombre..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">WhatsApp</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                            placeholder="10 dígitos"
                                        />
                                        <p className="text-[9px] text-slate-400 ml-1 italic">* Necesario si no ingresas correo</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Correo Electrónico (Opcional)</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                        placeholder="ejemplo@correo.com"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-orange-600 text-white font-black py-4 rounded-xl shadow-xl shadow-primary/20 transition-all text-lg flex items-center justify-center gap-2 mt-4 uppercase tracking-wider"
                                >
                                    Ver Mi Cotización Ahora <ArrowRight className="w-5 h-5" />
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
                        className="space-y-12"
                    >
                        <div className="bg-white rounded-3xl p-6 md:p-12 border border-slate-100 shadow-xl relative overflow-hidden text-center">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-orange-400 to-amber-300" />
                            <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold mb-3 md:mb-4 border border-green-100 uppercase tracking-widest">
                                <Check className="w-3.5 h-3.5" /> Cotización Generada
                            </div>
                            <h3 className="text-2xl md:text-5xl font-black text-secondary tracking-tighter">¡Todo Listo, {leadName.split(' ')[0] || 'Cliente'}!</h3>
                            <div className="flex flex-col items-center gap-1 mt-2 md:mt-4">
                                <p className="text-slate-500 text-xs md:text-xl">Tu proyecto de <strong>{initialArea}m²</strong> en <strong>{city || address || 'tu ubicación'}</strong></p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 items-stretch">
                            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col transition-all hover:border-slate-200">
                                <div className="p-5 md:p-8 pb-0">
                                    <div className="flex items-center gap-1.5 text-primary font-bold text-[9px] uppercase tracking-widest mb-1">
                                        <Check className="w-3 h-3" /> Pago Contado
                                    </div>
                                    <h4 className="text-xl md:text-2xl lg:text-3xl font-black text-secondary">{selectedSolution?.title}</h4>
                                </div>

                                <div className="space-y-4 mb-4 md:mb-6 p-5 md:p-8 flex flex-col flex-grow">
                                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex-grow">
                                        <ul className="space-y-2.5">
                                            {selectedSolution?.features.map((f, i) => (
                                                <li key={i} className="flex items-start text-slate-600 text-xs md:text-sm gap-2 font-medium leading-tight">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="text-center mt-auto pt-6">
                                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block uppercase">Inversión Final:</span>
                                        <div className="text-5xl md:text-5xl lg:text-5xl font-black text-secondary tracking-tighter">${quote?.totalCash.toLocaleString()}</div>
                                        <span className="text-[10px] md:text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-md mt-2 inline-block">Ahorro del 14% aplicado</span>
                                    </div>
                                </div>

                                <button
                                    disabled={isPendingSave}
                                    onClick={() => handleSaveAndAction('Contado')}
                                    className="mt-auto w-full bg-slate-100 hover:bg-slate-200 text-secondary font-black py-4 md:py-6 rounded-b-3xl transition-all flex items-center justify-center gap-2 text-xs md:text-sm uppercase tracking-wider"
                                >
                                    {isPendingSave ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Phone className="w-4 h-4 md:w-5 md:h-5" /> ELEGIR CONTADO</>}
                                </button>
                            </div>

                            <div className="bg-white rounded-3xl shadow-2xl shadow-primary/20 border-2 border-primary/20 flex flex-col relative transition-all hover:scale-[1.02] overflow-hidden">
                                <div className="p-5 md:p-8 pb-0">
                                    <div className="flex items-center gap-1.5 text-primary font-bold text-[9px] uppercase tracking-widest mb-1">
                                        <Zap className="w-3 h-3 fill-primary" /> Pago a 12 MSI
                                    </div>
                                    <h4 className="text-xl md:text-2xl lg:text-3xl font-black text-secondary">{selectedSolution?.title}</h4>
                                </div>

                                <div className="space-y-4 mb-4 md:mb-6 p-5 md:p-8 flex flex-col flex-grow">
                                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex-grow">
                                        <ul className="space-y-2 text-slate-600 font-medium">
                                            <li className="flex items-center gap-2 font-black text-secondary"><Check className="w-4 h-4 text-green-500" /> Sin Intereses</li>
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Todas las Tarjetas*</li>
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Saldo diferido</li>
                                        </ul>
                                    </div>
                                    <div className="text-center mt-auto pt-6">
                                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">12 Pagos Fijos de:</span>
                                        <div className="text-5xl md:text-5xl lg:text-5xl font-black text-primary tracking-tighter">${Math.round((quote?.totalMsi || 0) / 12).toLocaleString()}</div>
                                        <div className="text-[9px] md:text-xs text-slate-400 mt-2 uppercase font-black tracking-widest">Inversión anual: ${quote?.totalMsi.toLocaleString()}</div>
                                    </div>
                                </div>

                                <button
                                    disabled={isPendingSave}
                                    onClick={() => handleSaveAndAction('12 MSI')}
                                    className="mt-auto w-full bg-primary hover:bg-orange-600 text-white font-black py-4 md:py-6 rounded-b-3xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-xs md:text-sm uppercase tracking-wider"
                                >
                                    {isPendingSave ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Phone className="w-4 h-4 md:w-5 md:h-5" /> ELEGIR 12 MSI</>}
                                </button>
                            </div>

                            {upsellQuote ? (
                                <div className="bg-secondary rounded-3xl shadow-2xl relative flex flex-col overflow-hidden transition-all hover:scale-[1.02]">
                                    <div className="p-5 md:p-8 pb-0">
                                        <div className="flex items-center gap-1.5 text-primary font-bold text-[9px] uppercase tracking-widest mb-1">
                                            <Shield className="w-3 h-3" /> Nivel Superior
                                        </div>
                                        <h4 className="text-xl md:text-2xl lg:text-3xl font-black text-white">{upsellQuote.title}</h4>
                                    </div>

                                    <div className="space-y-4 mb-4 md:mb-6 p-5 md:p-8 flex flex-col flex-grow">
                                        <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/5 text-xs md:text-sm lg:text-base text-slate-200 italic leading-relaxed font-medium flex-grow">
                                            "Si ya vas a impermeabilizar, este nivel garantiza <span className="text-primary font-black">doble aislamiento térmico</span> por solo un pequeño ajuste mensual."
                                        </div>
                                        <div className="text-center mt-auto pt-6">
                                            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block text-white/60">12 Pagos Fijos de:</span>
                                            <div className="text-5xl md:text-5xl lg:text-5xl font-black text-white tracking-tighter">${Math.round((upsellQuote?.totalMsi || 0) / 12).toLocaleString()}</div>
                                            <div className="text-[10px] md:text-xs text-slate-300 mt-3 font-black uppercase tracking-widest opacity-90">
                                                Solo <span className="text-primary font-black">+${Math.round((upsellQuote.totalMsi - (quote?.totalMsi || 0)) / 12).toLocaleString()}</span> mensuales*
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        disabled={isPendingSave}
                                        onClick={() => handleSaveAndAction('Upgrade')}
                                        className="mt-auto w-full bg-white text-secondary hover:bg-slate-100 font-black py-4 md:py-6 rounded-b-3xl transition-all flex items-center justify-center gap-2 text-xs md:text-sm uppercase tracking-wider shadow-2xl"
                                    >
                                        {isPendingSave ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-4 h-4 md:w-5 md:h-5 fill-primary text-primary" /> QUIERO EL UPGRADE</>}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-3xl p-6 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-60">
                                    <Shield className="w-8 h-8 text-slate-300 mb-3" />
                                    <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Máximo Nivel Alcanzado</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-100">
                            <div className="flex items-center gap-4 text-slate-400 text-sm">
                                <Loader2 className="w-5 h-5" />
                                <span>Precios sujetos a visita técnica de validación. Válido por 7 días.</span>
                            </div>
                            <button
                                onClick={() => setCurrentStep('selection')}
                                className="group flex items-center gap-2 text-secondary font-bold hover:text-primary transition-colors py-2 px-4 rounded-full hover:bg-slate-50"
                            >
                                <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
                                Volver a los Sistemas
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-secondary/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl relative"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                        <div className="p-10 md:p-14 text-center space-y-6">
                            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-100">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-black text-secondary uppercase tracking-tighter leading-none">
                                ¡Gracias por <br /> <span className="text-primary">Considerarnos!</span>
                            </h3>
                            <div className="space-y-4">
                                <p className="text-slate-500 font-medium text-base md:text-lg leading-relaxed">
                                    Tu cotización ha sido registrada con éxito.
                                </p>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <p className="text-slate-600 font-bold text-sm leading-relaxed">
                                        En breve uno de nuestros especialistas te enviará la información detallada al medio de contacto que nos proporcionaste.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setCurrentStep('selection');
                                }}
                                className="w-full bg-secondary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-secondary/20 active:scale-95"
                            >
                                Entendido
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
