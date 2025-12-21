'use client';

import { useState, useEffect, useTransition, useActionState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Shield, Zap, Droplets, Loader2, Phone, ArrowRight, RotateCcw, Sparkles, Package, MapPin } from 'lucide-react';
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
                const sysName = paymentOption === 'Upgrade' ? upsellQuote?.title : selectedSolution?.title;
                const message = `¡Hola! Me interesa el sistema ${sysName} de ${paymentOption.toUpperCase()} para ${initialArea}m² en ${city || 'mi ubicación'}. Mi nombre es ${leadName}. Folio: #${Math.floor(Math.random() * 9000) + 1000}`;
                // Use a direct api.whatsapp.com link for better reliability
                window.open(`https://api.whatsapp.com/send?phone=5219993229999&text=${encodeURIComponent(message)}`, '_blank');
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
            if (!roofType) return false;
            return s.category === roofType || s.category === 'both';
        })
        .map((s: Solution) => {
            const isEconomic = s.internal_id === 'th-fix';
            const isStandard = s.internal_id === 'th-light' || s.internal_id === 'th-3-4';
            const features = [
                `Espesor real: ${s.grosor || 'Constante'}`,
                s.beneficio_principal || 'Protección Certificada',
                s.detalle_costo_beneficio?.split('.')[0] || 'Calidad Thermo House',
            ];

            // Add tiered benefits
            if (!isEconomic) {
                features.push(s.category === 'sheet' ? 'Elimina ruido de lluvia' : 'Aislamiento térmico activo');
            }
            if (!isEconomic && !isStandard) {
                features.push('Doble barrera térmica');
                features.push('Máximo ahorro en luz');
            }

            features.push('Garantía por escrito');

            return {
                id: s.internal_id,
                title: s.title,
                features,
                popular: s.internal_id === 'th-light' || s.internal_id === 'th-3-4',
                premium: s.internal_id === 'th-forte' || s.internal_id === 'th-ingles'
            };
        });

    const selectedSolution = currentSolutions.find(s => s.id === selectedSolutionId);

    // Effect to calculate price securely on server
    useEffect(() => {
        if (!initialArea || initialArea <= 0 || !selectedSolutionId) {
            setQuote(null);
            setUpsellQuote(null);
            setCalcError(null);
            return;
        }

        const fetchQuotes = () => {
            startTransition(async () => {
                setCalcError(null);
                try {
                    // Task 1: Calculate Selected Quote
                    let finalQuote = null;
                    const result = await calculateQuote(initialArea, selectedSolutionId, city);
                    const MIN_PRICE = 5900;

                    if (result.success && result.data) {
                        finalQuote = result.data;
                    } else {
                        // Manual Fallback Calculation
                        const sol = activeSolutions.find(fs => fs.internal_id === selectedSolutionId);
                        if (sol) {
                            const rawCash = Math.round(initialArea * (sol.precio_contado_m2 || 0));
                            const rawMsi = Math.round(initialArea * (sol.precio_msi_m2 || 0));
                            finalQuote = {
                                totalCash: Math.max(rawCash, MIN_PRICE),
                                totalMsi: Math.max(rawMsi, MIN_PRICE)
                            };
                        }
                    }
                    setQuote(finalQuote);

                    // Task 2: Detect Superior Solution (Upsell)
                    const relevantSols = activeSolutions.filter((s: Solution) => {
                        return s.category === roofType || s.category === 'both';
                    }).sort((a, b) => (a.orden || 0) - (b.orden || 0));

                    const currentIndex = relevantSols.findIndex(s => s.internal_id === selectedSolutionId);
                    const superiorSolution = relevantSols[currentIndex + 1];

                    if (superiorSolution) {
                        let finalUpsell = null;
                        const superiorResult = await calculateQuote(initialArea, superiorSolution.internal_id, city);

                        if (superiorResult.success && superiorResult.data) {
                            finalUpsell = {
                                ...superiorResult.data,
                                title: superiorSolution.title,
                                internal_id: superiorSolution.internal_id
                            };
                        } else {
                            const rawCash = Math.round(initialArea * (superiorSolution.precio_contado_m2 || 0));
                            const rawMsi = Math.round(initialArea * (superiorSolution.precio_msi_m2 || 0));
                            finalUpsell = {
                                totalCash: Math.max(rawCash, MIN_PRICE),
                                totalMsi: Math.max(rawMsi, MIN_PRICE),
                                title: superiorSolution.title,
                                internal_id: superiorSolution.internal_id
                            };
                        }
                        setUpsellQuote(finalUpsell);
                    } else {
                        setUpsellQuote(null);
                    }

                } catch (err) {
                    console.error("Calculation Error:", err);
                    setCalcError('Error al calcular precios.');
                }
            });
        };

        const timer = setTimeout(fetchQuotes, 300);
        return () => clearTimeout(timer);
    }, [initialArea, selectedSolutionId, roofType, activeSolutions]);

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
                {/* STEP 1: SELECTION */}
                {currentStep === 'selection' && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                    >
                        {/* Roof Type Selection */}
                        {(() => {
                            const isLocationMissing = initialArea > 0 && (!address || !city || !stateName);
                            const canProceed = initialArea > 0 && !isLocationMissing;

                            return (
                                <div className={`p-6 md:p-8 rounded-2xl border border-border shadow-sm bg-white transition-all duration-300 ${canProceed ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale blur-[1px]'}`}>
                                    <h3 className="text-xl font-bold text-secondary mb-6 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-sm">2</span>
                                        Selecciona tu Tipo de Techo
                                    </h3>

                                    {isLocationMissing && (
                                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-700 animate-pulse">
                                            <Shield className="w-5 h-5 flex-shrink-0" />
                                            <p className="text-sm font-medium">Por favor, completa tu <strong>dirección, ciudad y estado</strong> arriba para ver las soluciones disponibles.</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => { setRoofType('concrete'); setSelectedSolutionId(null); }}
                                            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 group ${roofType === 'concrete' ? 'border-primary bg-orange-50 text-secondary' : 'border-slate-100 text-muted-foreground hover:border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <div className={`p-3 rounded-lg transition-colors ${roofType === 'concrete' ? 'bg-white shadow-sm text-primary' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600'}`}>
                                                <Droplets className="w-8 h-8" />
                                            </div>
                                            <span className="font-semibold text-lg">Losa de Concreto</span>
                                        </button>

                                        <button
                                            onClick={() => { setRoofType('sheet'); setSelectedSolutionId(null); }}
                                            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 group ${roofType === 'sheet' ? 'border-primary bg-orange-50 text-secondary' : 'border-slate-100 text-muted-foreground hover:border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <div className={`p-3 rounded-lg transition-colors ${roofType === 'sheet' ? 'bg-white shadow-sm text-primary' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600'}`}>
                                                <Zap className="w-8 h-8" />
                                            </div>
                                            <span className="font-semibold text-lg">Lámina / Metálico</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Solutions Grid */}
                        {roofType && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-secondary mb-4 px-1">Soluciones Recomendadas</h3>
                                <div className={`grid grid-cols-1 ${roofType === 'concrete' ? 'md:grid-cols-3' : 'md:grid-cols-2 max-w-4xl mx-auto'} gap-6`}>
                                    {currentSolutions.map((sol) => (
                                        <div
                                            key={sol.id}
                                            onClick={() => setSelectedSolutionId(sol.id)}
                                            className={`relative group cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 ${selectedSolutionId === sol.id ? 'border-primary bg-white scale-[1.02] shadow-xl ring-1 ring-primary/20' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg'}`}
                                        >
                                            {sol.popular && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-sm">
                                                    Más Vendido
                                                </div>
                                            )}
                                            {sol.premium && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-sm">
                                                    Premium
                                                </div>
                                            )}

                                            <h4 className={`text-lg font-bold mb-2 transition-colors ${selectedSolutionId === sol.id ? 'text-primary' : 'text-secondary'}`}>{sol.title}</h4>

                                            <div className={`text-sm mb-4 h-6 flex items-center font-medium ${selectedSolutionId === sol.id ? 'text-primary' : 'text-muted-foreground/60'}`}>
                                                {selectedSolutionId === sol.id ? '✓ Selección Activa' : '• Click para seleccionar'}
                                            </div>

                                            <ul className="space-y-3">
                                                {sol.features.map((f, i) => (
                                                    <li key={i} className="flex items-start text-sm text-slate-600">
                                                        <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                                        <span className="leading-tight">{f}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>

                                {selectedSolutionId && (
                                    <div className="flex justify-center pt-8">
                                        <button
                                            onClick={() => setCurrentStep('contact')}
                                            className="bg-secondary text-white px-10 py-4 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3 animate-bounce"
                                        >
                                            Continuar a Cotización <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                        }
                    </motion.div>
                )}

                {/* STEP 2: CONTACT */}
                {currentStep === 'contact' && (
                    <motion.div
                        key="contact"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-xl space-y-8">
                            <div className="text-center space-y-2 md:space-y-4">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                    <Phone className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-black text-secondary uppercase tracking-tight">¿A dónde enviamos tu reporte?</h3>
                                <p className="text-slate-500 text-xs md:text-sm">Necesitamos estos datos para generar tu folio de seguimiento oficial.</p>
                            </div>

                            <form className="space-y-6" onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                const name = fd.get('name') as string;
                                const phone = fd.get('phone') as string;
                                const email = fd.get('email') as string;

                                if (!name || name.length < 3) {
                                    setSaveState({ success: false, errors: { name: 'Por favor ingresa tu nombre completo.' } });
                                    return;
                                }
                                if (!phone && !email) {
                                    setSaveState({ success: false, errors: { phone: 'Ingresa un WhatsApp o Correo para contactarte.' } });
                                    return;
                                }

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
                                        {saveState?.errors?.name && <p className="text-red-500 text-[10px] mt-1 ml-1">{saveState.errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">WhatsApp</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                            placeholder="10 dígitos"
                                        />
                                        {saveState?.errors?.phone && <p className="text-red-500 text-[10px] mt-1 ml-1">{saveState.errors.phone}</p>}
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
                                    {saveState?.errors?.email && <p className="text-red-500 text-[10px] mt-1 ml-1">{saveState.errors.email}</p>}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-orange-600 text-white font-black py-4 rounded-xl shadow-xl shadow-primary/20 transition-all text-lg flex items-center justify-center gap-2 mt-4 uppercase tracking-wider"
                                >
                                    Ver Mi Cotización Ahora <ArrowRight className="w-5 h-5" />
                                </button>

                                <p className="text-[10px] text-center text-slate-400 font-medium">
                                    Protegemos tu información. Al continuar aceptas nuestro aviso de privacidad.
                                </p>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: RESULTS & UPSELL */}
                {currentStep === 'result' && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-12"
                    >
                        {/* Summary Header */}
                        <div className="bg-white rounded-3xl p-6 md:p-12 border border-slate-100 shadow-xl relative overflow-hidden text-center">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-orange-400 to-amber-300" />
                            <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold mb-3 md:mb-4 border border-green-100 uppercase tracking-widest">
                                <Check className="w-3.5 h-3.5" /> Cotización Generada
                            </div>
                            <h3 className="text-2xl md:text-5xl font-black text-secondary tracking-tighter">¡Todo Listo, {leadName.split(' ')[0] || 'Cliente'}!</h3>
                            <div className="flex flex-col items-center gap-1 mt-2 md:mt-4">
                                <p className="text-slate-500 text-xs md:text-xl">Tu proyecto de <strong>{initialArea}m²</strong> en <strong>{city || address || 'tu ubicación'}</strong></p>
                                <div className="mt-2 inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <span className="text-[10px] md:text-xs font-black text-secondary uppercase tracking-tight">
                                        Precio considerado en: {city?.includes('Chihuahua') ? 'Chihuahua, Chihuahua y áreas cercanas' : city?.includes('Cuernavaca') ? 'Cuernavaca y áreas cercanas' : 'Mérida y áreas cercanas'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 items-stretch">
                            {/* OPTION 1: SELECTED - CASH */}
                            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col transition-all hover:border-slate-200">
                                <div className="p-5 md:p-8 pb-0">
                                    <div className="flex items-center gap-1.5 text-primary font-bold text-[9px] uppercase tracking-widest mb-1">
                                        <Check className="w-3 h-3" /> Pago Contado
                                    </div>
                                    <h4 className="text-xl md:text-2xl lg:text-3xl font-black text-secondary">{selectedSolution?.title}</h4>
                                </div>

                                <div className="space-y-4 mb-4 md:mb-6 p-5 md:p-8">
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

                                    <div className="text-center">
                                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Inversión Final:</span>
                                        <div className="text-5xl md:text-6xl lg:text-7xl font-black text-secondary tracking-tighter">${quote?.totalCash.toLocaleString()}</div>
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

                            {/* OPTION 2: SELECTED - 12 MSI */}
                            <div className="bg-white rounded-3xl shadow-2xl shadow-primary/20 border-2 border-primary/20 flex flex-col relative transition-all hover:scale-[1.02] overflow-hidden">
                                <div className="absolute top-2 right-2 bg-secondary text-white text-[7px] md:text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm z-20">
                                    Popular
                                </div>
                                <div className="p-5 md:p-8 pb-0">
                                    <div className="flex items-center gap-1.5 text-primary font-bold text-[9px] uppercase tracking-widest mb-1">
                                        <Zap className="w-3 h-3 fill-primary" /> Pago a 12 MSI
                                    </div>
                                    <h4 className="text-xl md:text-2xl lg:text-3xl font-black text-secondary">{selectedSolution?.title}</h4>
                                </div>

                                <div className="space-y-4 mb-4 md:mb-6 p-5 md:p-8">
                                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-xs md:text-sm lg:text-base">
                                        <ul className="space-y-2 text-slate-600 font-medium">
                                            <li className="flex items-center gap-2 font-black text-secondary"><Check className="w-4 h-4 text-green-500" /> Sin Intereses</li>
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Todas las Tarjetas*</li>
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Saldo diferido</li>
                                        </ul>
                                    </div>

                                    <div className="text-center">
                                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">12 Pagos Fijos de:</span>
                                        <div className="text-5xl md:text-6xl lg:text-7xl font-black text-primary tracking-tighter">${Math.round((quote?.totalMsi || 0) / 12).toLocaleString()}</div>
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
                                <div className="absolute bottom-1.5 right-3 pointer-events-none">
                                    <span className="text-[8px] md:text-[10px] text-primary/40 uppercase font-black tracking-tighter">*Aplican restricciones bancarias</span>
                                </div>
                            </div>

                            {/* OPTION 3: UPGRADE - 12 MSI */}
                            {upsellQuote ? (
                                <div className="bg-secondary rounded-3xl shadow-2xl relative flex flex-col overflow-hidden transition-all hover:scale-[1.02]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -mr-16 -mt-16 pointer-events-none" />
                                    <div className="absolute top-2 right-2 bg-primary text-white text-[7px] md:text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm z-20">
                                        RECOMENDADO
                                    </div>

                                    <div className="p-5 md:p-8 pb-0">
                                        <div className="flex items-center gap-1.5 text-primary font-bold text-[9px] uppercase tracking-widest mb-1">
                                            <Shield className="w-3 h-3" /> Nivel Superior
                                        </div>
                                        <h4 className="text-xl md:text-2xl lg:text-3xl font-black text-white">{upsellQuote.title}</h4>
                                    </div>

                                    <div className="space-y-4 mb-4 md:mb-6 p-5 md:p-8">
                                        <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/5 text-xs md:text-sm lg:text-base text-slate-200 italic leading-relaxed font-medium">
                                            "Si ya vas a impermeabilizar, este nivel garantiza <span className="text-primary font-black">doble aislamiento térmico</span> por solo un pequeño ajuste mensual."
                                        </div>

                                        <div className="text-center">
                                            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block text-white/60">12 Pagos Fijos de:</span>
                                            <div className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter">${Math.round(upsellQuote.totalMsi / 12).toLocaleString()}</div>
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

                        {/* Recap / Footer */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-100">
                            <div className="flex items-center gap-4 text-slate-400 text-sm">
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    <Loader2 className="w-5 h-5" />
                                </div>
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
        </div>
    );
}
