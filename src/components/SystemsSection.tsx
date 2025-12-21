'use client';
import { useState, useEffect } from 'react';
import { Shield, Hammer, Feather, Sparkles, Zap, Package } from 'lucide-react';
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
        <section id="sistemas" className="py-12 md:py-24 bg-background">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-8">
                    <h2 className="text-2xl sm:text-4xl font-bold text-secondary mb-4 md:mb-6 uppercase tracking-tight">
                        Nuestros Sistemas de Aislamiento
                    </h2>
                    <p className="text-base md:text-lg text-muted-foreground mb-8">
                        Soluciones especializadas diseñadas para proteger tu hogar según tu tipo de techumbre.
                    </p>

                    {/* Selector de Tipo de Techo */}
                    <div className="flex justify-center mb-12">
                        <div className="inline-flex p-1 bg-slate-100 rounded-2xl shadow-inner">
                            <button
                                onClick={() => setRoofType('concrete')}
                                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${roofType === 'concrete' ? 'bg-white text-primary shadow-md scale-105' : 'text-slate-500 hover:text-secondary'}`}
                            >
                                Techo de Concreto
                            </button>
                            <button
                                onClick={() => setRoofType('sheet')}
                                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${roofType === 'sheet' ? 'bg-white text-primary shadow-md scale-105' : 'text-slate-500 hover:text-secondary'}`}
                            >
                                Techo de Lámina
                            </button>
                        </div>
                    </div>
                </div>

                {/* Systems Cards Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-24">
                    {filteredSolutions.map((sys) => {
                        const Icon = getIcon(sys.internal_id);
                        return (
                            <div key={sys.id} className="group bg-white rounded-3xl p-8 border border-slate-200 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />

                                <div className="relative z-10">
                                    <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-primary group-hover:rotate-6 transition-all duration-300">
                                        <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                                    </div>

                                    <h3 className="text-xl font-bold text-secondary mb-2">{sys.title}</h3>
                                    <p className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">{sys.grosor || 'Espesor Estándar'}</p>

                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                            <div className="bg-primary/20 p-1 rounded-md mt-0.5">
                                                <Shield className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            <span>{sys.beneficio_principal}</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-slate-600 font-medium italic">
                                            <div className="bg-primary/20 p-1 rounded-md mt-0.5">
                                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            <span>{sys.detalle_costo_beneficio?.split('.')[0]}</span>
                                        </li>
                                        {sys.internal_id !== 'th-fix' && (
                                            <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                                <div className="bg-primary/20 p-1 rounded-md mt-0.5">
                                                    <Zap className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <span>Ahorro Eléctrico Garantizado</span>
                                            </li>
                                        )}
                                        {(sys.internal_id === 'th-forte' || sys.internal_id === 'th-ingles' || sys.internal_id === 'th-3-4') && (
                                            <li className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                                                <div className="bg-primary/20 p-1 rounded-md mt-0.5">
                                                    <Package className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <span>{sys.category === 'sheet' ? 'Elimina Ruido de Lluvia' : 'Protección Estructural Máxima'}</span>
                                            </li>
                                        )}
                                    </ul>

                                    <button
                                        onClick={() => document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="w-full py-4 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-primary transition-all shadow-lg active:scale-95"
                                    >
                                        Cotizar este Sistema
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Comparison Table */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-8 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-2xl font-bold text-secondary text-center uppercase tracking-tighter">Ficha Técnica Comparativa ({roofType === 'concrete' ? 'Concreto' : 'Lámina'})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white">
                                <tr>
                                    <th className="p-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">Característica</th>
                                    {filteredSolutions.map(sys => (
                                        <th key={sys.id} className="p-6 font-bold text-secondary border-l border-slate-100">{sys.title}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="p-6 font-bold text-slate-700 bg-slate-50/50">Espesor final</td>
                                    {filteredSolutions.map(sys => <td key={sys.id} className="p-6 text-slate-600 border-l border-slate-100">{sys.grosor || 'Estándar'}</td>)}
                                </tr>
                                <tr>
                                    <td className="p-6 font-bold text-slate-700 bg-slate-50/50">Beneficio Principal</td>
                                    {filteredSolutions.map(sys => <td key={sys.id} className="p-6 text-slate-600 border-l border-slate-100 text-xs text-wrap max-w-[150px]">{sys.beneficio_principal || 'N/A'}</td>)}
                                </tr>
                                <tr>
                                    <td className="p-6 font-bold text-slate-700 bg-slate-50/50">Garantía / Duración</td>
                                    {filteredSolutions.map(sys => (
                                        <td key={sys.id} className="p-6 text-slate-600 border-l border-slate-100 text-xs text-wrap max-w-[200px]">
                                            {sys.detalle_costo_beneficio?.split('.')[1] || 'Protección Extendida'}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-6 font-bold text-slate-700 bg-slate-50/50">Aplicación</td>
                                    {filteredSolutions.map(sys => (
                                        <td key={sys.id} className="p-6 text-slate-600 border-l border-slate-100 text-xs">
                                            {sys.category === 'sheet' ? 'Exclusivo Lámina' : (sys.category === 'concrete' ? 'Exclusivo Concreto' : 'Multisuperficie')}
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
