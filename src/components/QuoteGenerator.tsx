'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Shield, Zap, Droplets, Loader2, Phone, ArrowRight, RotateCcw, Sparkles, Package, MapPin, CheckCircle2, Building2, Factory } from 'lucide-react';
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

    // Auto-scroll on step change
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
        { id: '1', internal_id: 'th-fix', title: 'TH FIX', category: 'concrete', precio_contado_m2: 79, precio_msi_m2: 94, grosor: '1000 micras', beneficio_principal: 'Sellado básico y reflectividad', detalle_costo_beneficio: 'Sistema de mantenimiento preventivo. Protege contra filtraciones leves.', orden: 1 },
        { id: '2', internal_id: 'th-light', title: 'TH LIGHT', category: 'concrete', precio_contado_m2: 119, precio_msi_m2: 142, grosor: '5 mm', beneficio_principal: 'Impermeabilidad Total Certificada', detalle_costo_beneficio: 'Aislamiento inicial. Elimina goteras por completo.', orden: 2 },
        { id: '3', internal_id: 'th-forte', title: 'TH FORTE', category: 'concrete', precio_contado_m2: 152, precio_msi_m2: 181, grosor: '10 mm', beneficio_principal: 'Máxima Protección y Aislamiento', detalle_costo_beneficio: 'Aislamiento térmico de alto rendimiento. Reduce climatización.', orden: 3 },
        { id: '4', internal_id: 'th-3-4', title: 'TH 3/4', category: 'sheet', precio_contado_m2: 186, precio_msi_m2: 221, grosor: '19 mm', beneficio_principal: 'Escudo Térmico y Acústico', detalle_costo_beneficio: 'Especial para lámina. Elimina ruido de lluvia.', orden: 4 },
        { id: '5', internal_id: 'th-ingles', title: 'TH Inglés', category: 'sheet', precio_contado_m2: 200, precio_msi_m2: 238, grosor: '25 mm', beneficio_principal: 'Aislamiento Superior Industrial', detalle_costo_beneficio: 'Máximo confort y ahorro energético total.', orden: 5 },
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

    const [isPendingCalc, startTransition] = useTransition();
    const [quote, setQuote] = useState<{ totalCash: number; totalMsi: number } | null>(null);
    const [upsellQuote, setUpsellQuote] = useState<{ totalCash: number; totalMsi: number; title: string; internal_id: string } | null>(null);
    const [calcError, setCalcError] = useState<string | null>(null);

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
        // Build a unified list for selection: Prefer specific city, else Mérida/Fallback
        const uniqueInternalIds = Array.from(new Set(allPotentialSols.map(s => s.internal_id)));
        const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const targetCityNorm = normalize(city || 'Mérida');

        return uniqueInternalIds.map(id => {
            const citySol = allPotentialSols.find(s =>
                s.internal_id === id &&
                s.ciudad && normalize(s.ciudad) === targetCityNorm
            );
            const fallbackSol = allPotentialSols.find(s => s.internal_id === id); // Takes the first one found
            return citySol || fallbackSol;
        })
            .filter((s): s is Solution => {
                if (!s) return false;
                if (roofType === 'concrete') return s.category === 'concrete' || s.category === 'both';
                if (roofType === 'sheet') return s.category === 'sheet' || s.category === 'both';
                return false;
            })
            .sort((a, b) => (a.orden || 0) - (b.orden || 0));
    })();

    const selectedSolution = activeSolutions.find(s => s.internal_id === selectedSolutionId);

    const handleSolutionSelect = (id: string) => {
        setSelectedSolutionId(id);
        startTransition(() => {
            calculateQuote(initialArea, id, city || 'Mérida').then(res => {
                if (res.success && res.data) {
                    setQuote(res.data);
                    setUpsellQuote(res.upsell || null);
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
                    <motion.div key="selection" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                        {(() => {
                            const isLocationMissing = initialArea > 0 && (!address || !city || !stateName);
                            const canProceed = initialArea > 0 && !isLocationMissing;
                            return (
                                <div className={`p-6 md:p-8 rounded-2xl border border-border shadow-sm bg-white transition-all duration-300 ${canProceed ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale blur-[1px]'}`}>
                                    <h3 className="text-lg font-bold text-secondary mb-6 flex items-center gap-2">
                                        <div className="w-2 h-6 bg-primary rounded-full" />
                                        PRÓXIMO PASO: TIPO DE TECHO
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <button onClick={() => setRoofType('concrete')} className={`relative p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-5 group overflow-hidden ${roofType === 'concrete' ? 'border-primary bg-primary/5 shadow-2xl scale-[1.02]' : 'border-slate-100 hover:border-slate-300 bg-white hover:shadow-xl'}`}>
                                            {roofType === 'concrete' && <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-10 -mt-10" />}
                                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-all duration-500 ${roofType === 'concrete' ? 'bg-primary text-white rotate-3' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:rotate-3'}`}>
                                                <Building2 className="w-10 h-10" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <span className="block font-black text-secondary text-xl tracking-tighter">LOSA DE CONCRETO</span>
                                                <p className="text-[11px] text-slate-500 font-medium px-4">Ideal para casas habitacionales, departamentos y comercios urbanos.</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${roofType === 'concrete' ? 'border-primary bg-primary text-white scale-110' : 'border-slate-200'}`}>
                                                {roofType === 'concrete' && <Check className="w-4 h-4" />}
                                            </div>
                                        </button>
                                        <button onClick={() => setRoofType('sheet')} className={`relative p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-5 group overflow-hidden ${roofType === 'sheet' ? 'border-primary bg-primary/5 shadow-2xl scale-[1.02]' : 'border-slate-100 hover:border-slate-300 bg-white hover:shadow-xl'}`}>
                                            {roofType === 'sheet' && <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-10 -mt-10" />}
                                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-all duration-500 ${roofType === 'sheet' ? 'bg-primary text-white -rotate-3' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:-rotate-3'}`}>
                                                <Factory className="w-10 h-10" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <span className="block font-black text-secondary text-xl tracking-tighter">TECHO DE LÁMINA</span>
                                                <p className="text-[11px] text-slate-500 font-medium px-4">Bodegas industriales, anexos metálicos y proyectos de gran escala.</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${roofType === 'sheet' ? 'border-primary bg-primary text-white scale-110' : 'border-slate-200'}`}>
                                                {roofType === 'sheet' && <Check className="w-4 h-4" />}
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
                                    {currentSolutions.map((sol) => {
                                        const isPremium = sol.internal_id === 'th-forte' || sol.internal_id === 'th-ingles';
                                        const isBestSeller = sol.internal_id === 'th-light';
                                        const isSelected = selectedSolutionId === sol.internal_id;

                                        return (
                                            <button
                                                key={sol.id}
                                                onClick={() => handleSolutionSelect(sol.internal_id)}
                                                className={`relative p-8 rounded-[2.5rem] border-2 text-left transition-all h-full flex flex-col group overflow-hidden ${isSelected ? 'border-primary bg-primary/5 shadow-2xl ring-4 ring-primary/10 scale-[1.02]' : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-xl'}`}
                                            >
                                                {isBestSeller && (
                                                    <div className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black px-4 py-1.5 rounded-bl-2xl shadow-lg uppercase tracking-widest z-10">Best Seller</div>
                                                )}
                                                {isPremium && (
                                                    <div className="absolute -top-1 -right-1 bg-secondary text-white text-[9px] font-black px-4 py-1.5 rounded-bl-2xl shadow-lg uppercase tracking-widest z-10">Experto</div>
                                                )}

                                                <div className={`mb-6 w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-slate-50 text-primary group-hover:bg-primary group-hover:text-white'}`}>
                                                    {getIcon(sol.internal_id)}
                                                </div>

                                                <div className="space-y-1 mb-6">
                                                    <h4 className="text-2xl font-black text-secondary leading-none uppercase tracking-tighter">{sol.title}</h4>
                                                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-70">SISTEMA {isPremium ? 'PROFESIONAL' : 'VITAL'}</p>
                                                </div>

                                                <ul className="space-y-3 mb-8 flex-grow">
                                                    {getSolutionFeatures(sol).slice(0, 3).map((f, i) => (
                                                        <li key={i} className="flex items-start text-xs text-slate-600 gap-2.5 font-medium leading-normal">
                                                            <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${isSelected ? 'bg-primary/20 text-primary' : 'bg-green-50 text-green-500'}`}>
                                                                <Check className="w-2.5 h-2.5 stroke-[4]" />
                                                            </div>
                                                            {f}
                                                        </li>
                                                    ))}
                                                </ul>

                                                <div className={`mt-auto pt-6 border-t ${isSelected ? 'border-primary/20' : 'border-slate-100'}`}>
                                                    <div className={`flex items-center justify-between text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-primary' : 'text-slate-400 group-hover:text-secondary'}`}>
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

                                {selectedSolutionId && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center pt-8">
                                        <button onClick={() => setCurrentStep('contact')} className="bg-primary hover:bg-orange-600 text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center gap-3 text-lg uppercase tracking-wider group active:scale-95">
                                            Continuar a Precios <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {currentStep === 'contact' && (
                    <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                            <div className="mb-8 text-center">
                                <h3 className="text-3xl font-black text-secondary tracking-tight mb-2 uppercase">¡Casi Listo!</h3>
                                <p className="text-slate-500 font-medium">Déjanos tus datos para enviarte el desglose oficial.</p>
                            </div>
                            <form className="space-y-6" onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                setLeadName(formData.get('name') as string);
                                setContactData({ phone: formData.get('phone') as string, email: formData.get('email') as string });
                                setSaveState(null);
                                setCurrentStep('result');
                            }}>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre Completo</label>
                                        <input type="text" name="name" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="Tu nombre..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">WhatsApp</label>
                                        <input type="tel" name="phone" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="10 dígitos" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Correo Electrónico (Opcional)</label>
                                    <input type="email" name="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="ejemplo@correo.com" />
                                </div>
                                <button type="submit" className="w-full bg-primary hover:bg-orange-600 text-white font-black py-4 rounded-xl shadow-xl shadow-primary/20 transition-all text-lg flex items-center justify-center gap-2 mt-4 uppercase tracking-wider">
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
                        className="space-y-8 py-8 md:py-12"
                    >
                        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-xl relative overflow-hidden text-center">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-orange-400 to-amber-300" />
                            <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold mb-3 md:mb-4 border border-green-100 uppercase tracking-widest">
                                <Check className="w-3.5 h-3.5" /> Cotización Generada
                            </div>
                            <h3 className="text-2xl md:text-5xl font-black text-secondary tracking-tighter">¡Todo Listo, {leadName.split(' ')[0] || 'Cliente'}!</h3>
                            <p className="text-slate-500 text-xs md:text-xl mt-2">Tu proyecto de <strong>{initialArea}m²</strong> en <strong>{city || address || 'tu ubicación'}</strong></p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 items-stretch">
                            <div className="bg-white rounded-3xl shadow-2xl flex flex-col transition-all border border-slate-100 overflow-hidden min-h-[440px]">
                                <div className="p-4 md:p-5 pb-0">
                                    <div className="text-primary font-bold text-[9px] uppercase tracking-widest mb-1 flex items-center gap-1"><Check className="w-3 h-3" /> Pago Contado</div>
                                    <h4 className="text-lg md:text-xl lg:text-2xl font-black text-secondary">{selectedSolution?.title}</h4>
                                </div>
                                <div className="space-y-3 p-4 md:p-6 flex flex-col flex-grow">
                                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex-grow">
                                        <ul className="space-y-1.5">
                                            {getSolutionFeatures(selectedSolution).map((f, i) => (
                                                <li key={i} className="flex items-start text-slate-600 text-[10px] md:text-xs gap-2 font-medium leading-tight">
                                                    <div className="w-1 rounded-full bg-primary flex-shrink-0 mt-1.5 h-1" />{f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="text-center mt-auto pt-6 px-4 pb-4">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Inversión Final:</span>
                                        <div className="text-3xl md:text-4xl font-black text-secondary tracking-tight">${quote?.totalCash.toLocaleString()}</div>
                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-md mt-2 inline-block">Ahorro del 14% aplicado</span>
                                    </div>
                                </div>
                                <button disabled={isPendingSave} onClick={() => handleSaveAndAction('Contado')} className="mt-auto w-full bg-slate-100 hover:bg-slate-200 text-secondary font-black py-4 rounded-b-3xl transition-all flex items-center justify-center gap-2 text-xs md:text-sm uppercase tracking-wider">
                                    {isPendingSave ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Phone className="w-4 h-4" /> ELEGIR CONTADO</>}
                                </button>
                            </div>

                            <div className="bg-white rounded-3xl shadow-2xl border-2 border-primary/20 flex flex-col relative overflow-hidden min-h-[440px]">
                                <div className="p-4 md:p-5 pb-0">
                                    <div className="text-primary font-bold text-[9px] uppercase tracking-widest mb-1 flex items-center gap-1"><Zap className="w-3 h-3 fill-primary" /> Pago a 12 MSI</div>
                                    <h4 className="text-lg md:text-xl lg:text-2xl font-black text-secondary">{selectedSolution?.title}</h4>
                                </div>
                                <div className="space-y-3 p-4 md:p-6 flex flex-col flex-grow">
                                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex-grow">
                                        <ul className="space-y-1 text-slate-600 font-medium text-[10px] md:text-xs">
                                            <li className="flex items-center gap-2 font-black text-secondary"><Check className="w-4 h-4 text-green-500" /> Sin Intereses</li>
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Todas las Tarjetas*</li>
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Saldo diferido</li>
                                        </ul>
                                    </div>
                                    <div className="text-center mt-auto pt-6 px-4 pb-4">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">12 Pagos Fijos de:</span>
                                        <div className="text-3xl md:text-4xl font-black text-primary tracking-tight">${Math.round((quote?.totalMsi || 0) / 12).toLocaleString()}</div>
                                        <div className="text-[9px] text-slate-400 mt-2 uppercase font-black tracking-widest leading-none">Inversión anual: ${quote?.totalMsi.toLocaleString()}</div>
                                    </div>
                                </div>
                                <button disabled={isPendingSave} onClick={() => handleSaveAndAction('12 MSI')} className="mt-auto w-full bg-primary hover:bg-orange-600 text-white font-black py-4 md:py-6 rounded-b-3xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-xs md:text-sm uppercase tracking-wider">
                                    {isPendingSave ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Phone className="w-4 h-4" /> ELEGIR 12 MSI</>}
                                </button>
                            </div>

                            {upsellQuote ? (
                                <div className="bg-secondary rounded-3xl shadow-2xl relative flex flex-col overflow-hidden min-h-[440px]">
                                    <div className="p-4 pb-0">
                                        <div className="text-primary font-bold text-[9px] uppercase tracking-widest mb-1 flex items-center gap-1"><Shield className="w-3 h-3" /> Nivel Superior</div>
                                        <h4 className="text-lg md:text-xl font-black text-white">{upsellQuote.title}</h4>
                                    </div>
                                    <div className="space-y-3 p-4 flex flex-col flex-grow">
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-[10px] md:text-xs text-slate-200 italic leading-relaxed font-medium flex-grow">
                                            "Si ya vas a impermeabilizar, este nivel garantiza <span className="text-primary font-black">doble aislamiento térmico</span> por solo un pequeño ajuste mensual."
                                        </div>
                                        <div className="text-center mt-auto pt-4 px-4 pb-4">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block text-white/60">12 Pagos Fijos de:</span>
                                            <div className="text-3xl md:text-4xl font-black text-white tracking-tight">${Math.round((upsellQuote?.totalMsi || 0) / 12).toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-300 mt-3 font-black uppercase tracking-widest opacity-90 leading-none">
                                                Solo <span className="text-primary font-black">+${Math.round((upsellQuote.totalMsi - (quote?.totalMsi || 0)) / 12).toLocaleString()}</span> mensuales*
                                            </div>
                                        </div>
                                    </div>
                                    <button disabled={isPendingSave} onClick={() => handleSaveAndAction('Upgrade')} className="mt-auto w-full bg-white text-secondary hover:bg-slate-100 font-black py-4 rounded-b-3xl transition-all flex items-center justify-center gap-2 text-xs md:text-sm uppercase tracking-wider shadow-2xl">
                                        {isPendingSave ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-4 h-4 fill-primary text-primary" /> QUIERO EL UPGRADE</>}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-3xl p-6 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-60">
                                    <Shield className="w-8 h-8 text-slate-300 mb-3" /><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Máximo Nivel Alcanzado</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-100">
                            <div className="flex items-center gap-4 text-slate-400 text-sm"><Loader2 className="w-5 h-5" /><span>Precios sujetos a visita técnica de validación. Válido por 7 días.</span></div>
                            <button onClick={() => setCurrentStep('selection')} className="group flex items-center gap-2 text-secondary font-bold hover:text-primary transition-colors py-2 px-4 rounded-full hover:bg-slate-50"><RotateCcw className="w-4 h-4" /> Volver a los Sistemas</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showSuccessModal && (
                <div className="fixed inset-0 bg-secondary/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl p-10 md:p-14 text-center space-y-6">
                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-100"><CheckCircle2 className="w-10 h-10" /></div>
                        <h3 className="text-3xl md:text-4xl font-black text-secondary uppercase tracking-tighter leading-none">¡Gracias por <br /> <span className="text-primary">Considerarnos!</span></h3>
                        <p className="text-slate-500 font-medium text-base md:text-lg">Tu cotización ha sido registrada con éxito.</p>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100"><p className="text-slate-600 font-bold text-sm">En breve uno de nuestros especialistas te enviará la información detallada al medio de contacto que nos proporcionaste.</p></div>
                        <button onClick={() => { window.location.href = '/'; }} className="w-full bg-secondary text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Entendido</button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
