'use client';
import { useState, useEffect } from 'react';
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
        <section id="sistemas" className="py-4 md:py-6 bg-muted/20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-4">
                    <h2 className="text-2xl sm:text-4xl font-black text-secondary tracking-tight uppercase">
                        SISTEMAS ELITE THERMO HOUSE
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground">
                        Protección avanzada para cada tipo de estructura.
                    </p>

                    {/* Selector de Tipo de Techo */}
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex p-1.5 bg-slate-100 rounded-[2rem] shadow-inner border border-slate-200">
                            <button
                                onClick={() => setRoofType('concrete')}
                                className={`flex items-center gap-2 px-10 py-4 rounded-[1.5rem] text-sm font-black transition-all duration-500 ${roofType === 'concrete' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-slate-500 hover:text-secondary'}`}
                            >
                                <Building2 className="w-4 h-4" /> Techo de Concreto
                            </button>
                            <button
                                onClick={() => setRoofType('sheet')}
                                className={`flex items-center gap-2 px-10 py-4 rounded-[1.5rem] text-sm font-black transition-all duration-500 ${roofType === 'sheet' ? 'bg-secondary text-white shadow-xl scale-105' : 'text-slate-500 hover:text-secondary'}`}
                            >
                                <Factory className="w-4 h-4" /> Techo de Lámina
                            </button>
                        </div>
                    </div>
                </div>

                {/* Systems Cards Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    {filteredSolutions.map((sys) => {
                        const Icon = getIcon(sys.internal_id);
                        const isPremium = sys.internal_id === 'th-forte' || sys.internal_id === 'th-ingles';
                        const isBestSeller = sys.internal_id === 'th-light';

                        return (
                            <div key={sys.id} className={`group bg-white rounded-[2.5rem] p-8 border-2 transition-all duration-500 relative overflow-hidden flex flex-col ${isPremium ? 'border-primary/20 shadow-xl' : 'border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-2xl'}`}>
                                {isBestSeller && (
                                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-6 py-2 rounded-bl-3xl shadow-lg uppercase tracking-widest z-10">Más Vendido</div>
                                )}
                                {isPremium && (
                                    <div className="absolute top-0 right-0 bg-secondary text-white text-[10px] font-black px-6 py-2 rounded-bl-3xl shadow-lg uppercase tracking-widest z-10">Grado Experto</div>
                                )}

                                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg transition-all duration-500 ${isPremium ? 'bg-secondary text-white rotate-3 scale-110' : 'bg-slate-50 text-primary group-hover:bg-primary group-hover:text-white group-hover:-rotate-3'}`}>
                                        <Icon className="w-8 h-8" />
                                    </div>

                                    <h3 className="text-2xl font-black text-secondary mb-1 uppercase tracking-tighter">{sys.title}</h3>
                                    <p className="text-[10px] font-black text-primary mb-6 uppercase tracking-[0.2em] opacity-80">{sys.grosor || 'Espesor Estándar'}</p>

                                    <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 mb-8 flex-grow">
                                        <ul className="space-y-4">
                                            {(() => {
                                                const features = [
                                                    ...(sys.beneficio_principal ? [sys.beneficio_principal] : []),
                                                    ...(sys.detalle_costo_beneficio ? sys.detalle_costo_beneficio.split('\n').filter(l => l.trim() !== '') : [])
                                                ];

                                                return features.map((feature, idx) => {
                                                    const isFirst = idx === 0;
                                                    const isLast = idx === features.length - 1;

                                                    if (isLast && features.length > 1) {
                                                        return (
                                                            <li key={idx} className="flex items-start gap-3 text-[12px] text-primary font-black uppercase tracking-tighter">
                                                                <Zap className="w-4 h-4 shrink-0" /> {feature}
                                                            </li>
                                                        );
                                                    }

                                                    if (isFirst) {
                                                        return (
                                                            <li key={idx} className="flex items-start gap-3 text-[13px] text-secondary font-bold leading-tight">
                                                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                    <Check className="w-3 h-3 text-green-600 stroke-[4]" />
                                                                </div>
                                                                <span>{feature}</span>
                                                            </li>
                                                        );
                                                    }

                                                    return (
                                                        <li key={idx} className="flex items-start gap-3 text-[12px] text-slate-500 font-medium italic leading-relaxed">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0 mt-2" />
                                                            <span>{feature}</span>
                                                        </li>
                                                    );
                                                });
                                            })()}
                                        </ul>
                                    </div>

                                    <button
                                        onClick={() => document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth' })}
                                        className={`w-full py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isPremium ? 'bg-primary text-white hover:bg-orange-600' : 'bg-secondary text-white hover:bg-slate-800'}`}
                                    >
                                        Cotizar este Sistema
                                    </button>
                                </div>
                                {isPremium && <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-secondary via-primary to-secondary" />}
                            </div>
                        );
                    })}
                </div>

                {/* Comparison Table */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                    <div className="p-10 bg-secondary border-b border-white/5 relative overflow-hidden text-center">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Comparativa Técnica {roofType === 'concrete' ? 'Concreto' : 'Lámina'}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-8 font-black text-slate-400 uppercase text-[10px] tracking-widest">Atributo</th>
                                    {filteredSolutions.map(sys => (
                                        <th key={sys.id} className="p-8 font-black text-secondary border-l border-slate-100 uppercase tracking-tighter text-sm">{sys.title}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-8 font-black text-slate-700 bg-slate-50/10">ESPESOR FINAL</td>
                                    {filteredSolutions.map(sys => <td key={sys.id} className="p-8 text-primary font-black border-l border-slate-100">{sys.grosor || '1000 micras'}</td>)}
                                </tr>
                                <tr className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-8 font-black text-slate-700 bg-slate-50/10">BENEFICIOS CLAVE</td>
                                    {filteredSolutions.map(sys => (
                                        <td key={sys.id} className="p-8 text-slate-600 border-l border-slate-100 text-[10px] text-wrap max-w-[220px] leading-relaxed">
                                            <ul className="space-y-1.5 uppercase font-bold text-slate-500">
                                                <li className="text-secondary flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-primary" />
                                                    {sys.beneficio_principal}
                                                </li>
                                                {(sys.detalle_costo_beneficio || '').split('\n').filter(l => l.trim()).map((line, i) => (
                                                    <li key={i} className="flex items-center gap-2 opacity-80">
                                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                        {line}
                                                    </li>
                                                )).slice(0, 2)}
                                            </ul>
                                        </td>
                                    ))}
                                </tr>
                                <tr className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-8 font-black text-slate-700 bg-slate-50/10">ESPECIALIDAD</td>
                                    {filteredSolutions.map(sys => (
                                        <td key={sys.id} className="p-8 text-slate-600 border-l border-slate-100 text-[10px] font-bold uppercase tracking-widest">
                                            {sys.category === 'sheet' ? 'Siderúrgicos' : (sys.category === 'concrete' ? 'Estructural' : 'Híbrido')}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}
