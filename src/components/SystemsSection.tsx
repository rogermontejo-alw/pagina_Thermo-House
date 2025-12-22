'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Hammer, Feather, Sparkles, Zap, Package, Building2, Factory, Check } from 'lucide-react';
import { getAllSolutions } from '@/app/actions/get-solutions';
import { Solution } from '@/types';

export default function SystemsSection() {
    const [solutions, setSolutions] = useState<Solution[]>([]);
    const [loading, setLoading] = useState(true);
    const [roofType, setRoofType] = useState<'concrete' | 'sheet'>('concrete');

    const fallbackSolutions: Solution[] = [
        {
            id: '1',
            internal_id: 'th-fix',
            title: 'TH FIX',
            category: 'concrete',
            precio_contado_m2: 79,
            precio_msi_m2: 94,
            grosor: '1000 micras',
            beneficio_principal: 'Protección Preventiva Avanzada',
            detalle_costo_beneficio: 'Ideal para techos sin daños previos. Detiene la erosión y el calentamiento solar.',
            orden: 1
        },
        {
            id: '2',
            internal_id: 'th-light',
            title: 'TH LIGHT',
            category: 'concrete',
            precio_contado_m2: 119,
            precio_msi_m2: 142,
            grosor: '1/2 cm (5 mm)',
            beneficio_principal: 'Impermeabilidad Total y Confort',
            detalle_costo_beneficio: 'Elimina goteras y genera ahorro energético inmediato en aires acondicionados.',
            orden: 2
        },
        {
            id: '3',
            internal_id: 'th-forte',
            title: 'TH FORTE',
            category: 'concrete',
            precio_contado_m2: 152,
            precio_msi_m2: 181,
            grosor: '1 cm (10 mm)',
            beneficio_principal: 'Aislamiento Térmico de Alto Nivel',
            detalle_costo_beneficio: 'Reduce drásticamente la temperatura interior. El sistema más vendido por su relación ahorro/confort.',
            orden: 3
        },
        {
            id: '4',
            internal_id: 'th-3-4',
            title: 'TH 3/4',
            category: 'sheet',
            precio_contado_m2: 186,
            precio_msi_m2: 221,
            grosor: '1.9 cm (19 mm)',
            beneficio_principal: 'Blindaje Térmico y Silenciador',
            detalle_costo_beneficio: 'Especial para naves y hogares con lámina. Reduce el ruido de lluvia hasta un 70%.',
            orden: 4
        },
        {
            id: '5',
            internal_id: 'th-ingles',
            title: 'TH Inglés',
            category: 'sheet',
            precio_contado_m2: 200,
            precio_msi_m2: 238,
            grosor: '2.5 cm (25 mm)',
            beneficio_principal: 'Máxima Eficiencia Energética',
            detalle_costo_beneficio: 'Transforma techos de lámina en superficies frías al tacto bajo el sol más intenso.',
            orden: 5
        },
    ];

    useEffect(() => {
        const fetch = async () => {
            const result = await getAllSolutions();
            if (result.success && result.data?.length > 0) {
                setSolutions(result.data);
            } else {
                setSolutions(fallbackSolutions);
            }
            setLoading(false);
        };
        fetch();
    }, []);

    const filteredSolutions = solutions.filter(s => s.category === roofType || s.category === 'both');

    const getIcon = (id: string) => {
        switch (id) {
            case 'th-fix': return Hammer;
            case 'th-light': return Feather;
            case 'th-forte': return Shield;
            case 'th-3-4': return Zap;
            case 'th-ingles': return Sparkles;
            default: return Package;
        }
    };

    if (loading) return (
        <section className="py-24 text-center">
            <div className="animate-pulse text-muted-foreground">Cargando sistemas...</div>
        </section>
    );

    return (
        <section id="sistemas" className="py-2 transition-colors duration-500">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-6 md:mb-10">
                    <h2 className="text-2xl sm:text-4xl font-black text-secondary dark:text-white tracking-tight uppercase mb-3 md:mb-4">
                        SISTEMAS ELITE THERMO HOUSE
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground mb-8 md:mb-10">
                        Protección avanzada para cada tipo de estructura.
                    </p>

                    {/* Selector de Tipo de Techo */}
                    <div className="flex justify-center mb-6 md:mb-8">
                        <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-full shadow-inner border border-slate-200 dark:border-slate-700 relative h-16 w-full max-w-sm overflow-hidden">
                            {/* Sliding Capsule */}
                            <motion.div
                                className="absolute bg-secondary dark:bg-primary h-[calc(100%-12px)] rounded-full shadow-lg"
                                layoutId="roofTypeCapsule"
                                initial={false}
                                animate={{
                                    x: roofType === 'concrete' ? 0 : '100%',
                                    left: roofType === 'concrete' ? 6 : -6,
                                    width: 'calc(50% - 6px)'
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30
                                }}
                            />

                            <button
                                onClick={() => setRoofType('concrete')}
                                className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-4 rounded-full text-[10px] md:text-sm font-black transition-colors duration-300 ${roofType === 'concrete' ? 'text-white' : 'text-slate-500 dark:text-slate-200'}`}
                            >
                                <Building2 className="w-4 h-4" /> Techo de Concreto
                            </button>
                            <button
                                onClick={() => setRoofType('sheet')}
                                className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-4 rounded-full text-[10px] md:text-sm font-black transition-colors duration-300 ${roofType === 'sheet' ? 'text-white' : 'text-slate-500 dark:text-slate-200'}`}
                            >
                                <Factory className="w-4 h-4" /> Techo de Lámina
                            </button>
                        </div>
                    </div>
                </div>

                {/* Systems Cards Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8 md:mb-10">
                    {filteredSolutions.map((sys) => {
                        const Icon = getIcon(sys.internal_id);
                        const isPremium = sys.internal_id === 'th-forte' || sys.internal_id === 'th-ingles';
                        const isBestSeller = sys.internal_id === 'th-light';

                        return (
                            <div key={sys.id} className={`group bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 md:p-7 border-2 transition-all duration-500 relative overflow-hidden flex flex-col ${isPremium ? 'border-primary/20 dark:border-primary/20 shadow-xl' : 'border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 shadow-sm hover:shadow-2xl'}`}>
                                {isBestSeller && (
                                    <div className="absolute top-0 right-0 bg-primary dark:bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl shadow-lg uppercase tracking-tight z-10">MAS VENDIDO</div>
                                )}
                                {isPremium && (
                                    <div className="absolute top-0 right-0 bg-secondary dark:bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl shadow-lg uppercase tracking-tight z-10">MEJORALO ¡¡¡</div>
                                )}

                                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className={`w-14 h-14 md:w-11 md:h-11 rounded-2xl flex items-center justify-center mb-6 md:mb-3 shadow-lg transition-all duration-500 ${isPremium ? 'bg-secondary dark:bg-slate-700 text-white rotate-3 scale-110' : 'bg-slate-50 dark:bg-slate-900 text-primary group-hover:bg-primary group-hover:text-white group-hover:-rotate-3'}`}>
                                        <Icon className="w-7 h-7 md:w-5 md:h-5" />
                                    </div>

                                    <h3 className="text-xl md:text-2xl font-black text-secondary dark:text-white mb-1 uppercase tracking-tighter">{sys.title}</h3>
                                    <p className="text-[10px] font-black text-primary mb-4 md:mb-3 uppercase tracking-[0.2em] opacity-80">{sys.grosor || 'Espesor Estándar'}</p>

                                    <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-5 md:p-4 border border-slate-100 dark:border-slate-700 mb-6 md:mb-4 flex-grow">
                                        <ul className="space-y-3 md:space-y-2">
                                            {(() => {
                                                const featureText = `${sys.beneficio_principal || ''}\n${sys.detalle_costo_beneficio || ''}`;
                                                // Split by hyphen or newline, trim whitespace, and filter out empty items
                                                const features = featureText
                                                    .split(/-|\n/)
                                                    .map(f => f.trim())
                                                    .filter(f => f.length > 0);

                                                return features.map((feature, idx) => {
                                                    const isFirst = idx === 0;
                                                    const isLast = idx === features.length - 1;

                                                    if (isLast && features.length > 1) {
                                                        return (
                                                            <li key={idx} className="flex items-start gap-3 text-[12px] text-primary font-black tracking-tighter">
                                                                <Zap className="w-4 h-4 shrink-0 mt-0.5" /> {feature}
                                                            </li>
                                                        );
                                                    }

                                                    if (isFirst) {
                                                        return (
                                                            <li key={idx} className="flex items-start gap-3 text-[13px] text-secondary dark:text-white font-medium leading-tight">
                                                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                    <Check className="w-3 h-3 text-green-600 stroke-[4]" />
                                                                </div>
                                                                <span>{feature}</span>
                                                            </li>
                                                        );
                                                    }

                                                    return (
                                                        <li key={idx} className="flex items-start gap-3 text-[12px] text-slate-600 dark:text-slate-300 font-medium leading-tight">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-1.5" />
                                                            <span>{feature}</span>
                                                        </li>
                                                    );
                                                });
                                            })()}
                                        </ul>
                                    </div>

                                    <button
                                        onClick={() => document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth' })}
                                        className={`w-full py-4 md:py-3.5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isPremium ? 'bg-primary text-white hover:bg-orange-600' : 'bg-secondary dark:bg-slate-700 text-white hover:bg-slate-800'}`}
                                    >
                                        Cotizar este Sistema
                                    </button>
                                </div>
                                {isPremium && <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-secondary via-primary to-secondary" />}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section >
    );
}
