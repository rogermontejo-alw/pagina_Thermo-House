import { CheckCircle2, XCircle } from 'lucide-react';

export default function TechComparisonSection() {
    const comparisons = [
        {
            feature: "Protección Total",
            thermo: "Se aplica como una sola pieza que sella cada rincón, sin dejar huecos por donde pase el agua.",
            traditional: "Se pega por partes, dejando uniones que con el tiempo se despegan y causan goteras."
        },
        {
            feature: "Adiós al Calor",
            thermo: "Mantiene tu casa fresca porque bloquea el sol por fuera, ahorrándote mucho en luz del clima.",
            traditional: "Solo tapa el agua, pero deja que el techo se caliente como un horno todo el día."
        },
        {
            feature: "Agarre Perfecto",
            thermo: "Se vuelve parte de tu techo. No se vuela, no se infla y no se despega con nada.",
            traditional: "Con el sol y la lluvia se va 'ampollando' o despegando hasta que el agua se mete por debajo."
        },
        {
            feature: "Duración Real",
            thermo: "Dura muchísimos años sin necesidad de estar parchando cada temporada de lluvias.",
            traditional: "A los 2 o 3 años ya necesita otra mano de pintura o parches porque se empieza a cuartear."
        },
        {
            feature: "Instalación Rápida",
            thermo: "Terminamos en tiempo récord. Lo aplicamos con equipo especial y queda listo en horas.",
            traditional: "Es un proceso lento, ruidoso y de muchos días que ensucia mucho tu propiedad."
        }
    ];

    return (
        <section className="py-10 md:py-16 bg-muted/40">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
                    <h2 className="text-2xl sm:text-4xl font-bold text-secondary mb-4 md:mb-6">
                        La Solución Moderna vs. Lo Tradicional
                    </h2>
                    <p className="text-base md:text-lg text-muted-foreground">
                        Descubra por qué no todos los sistemas de impermeabilización son iguales. Esta comparación destaca las claras ventajas de la tecnología de poliuretano espreado de Thermo House.
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    {/* Desktop Header */}
                    <div className="hidden md:grid grid-cols-12 border-b border-slate-200 bg-slate-50/50 uppercase tracking-widest text-[10px] font-black text-slate-400">
                        <div className="p-6 col-span-3">Característica</div>
                        <div className="p-6 col-span-4 border-l border-slate-100 bg-secondary text-white">Thermo House (Propuesta)</div>
                        <div className="p-6 col-span-5 border-l border-slate-100">Sistemas Tradicionales</div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {comparisons.map((item, idx) => (
                            <div key={idx} className="flex flex-col md:grid md:grid-cols-12 hover:bg-slate-50/50 transition-colors">
                                {/* Feature Title - Mobile Header */}
                                <div className="p-4 md:p-6 md:col-span-3 font-bold text-secondary bg-slate-50 md:bg-transparent flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs md:hidden">
                                        {idx + 1}
                                    </div>
                                    <span className="text-sm md:text-base">{item.feature}</span>
                                </div>

                                {/* Thermo House Column */}
                                <div className="p-5 md:p-6 md:col-span-4 border-t md:border-t-0 md:border-l border-slate-100 flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-tighter md:hidden">Thermo House</span>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                            {item.thermo}
                                        </p>
                                    </div>
                                </div>

                                {/* Traditional Column */}
                                <div className="p-5 md:p-6 md:col-span-5 border-t md:border-t-0 md:border-l border-slate-100 flex items-start gap-4 bg-slate-50/30 md:bg-transparent">
                                    <div className="flex-shrink-0 mt-1">
                                        <XCircle className="w-5 h-5 text-red-400/70" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter md:hidden">Sistemas Tradicionales</span>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            {item.traditional}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 md:mt-12 text-center">
                    <button
                        onClick={() => document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full sm:w-auto bg-secondary hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-semibold transition-all"
                    >
                        Obtenga una Consulta Gratuita
                    </button>
                </div>
            </div>
        </section>
    );
}
