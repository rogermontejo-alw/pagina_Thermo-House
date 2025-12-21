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
        <section className="py-12 md:py-24 bg-background">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
                    <h2 className="text-2xl sm:text-4xl font-bold text-secondary mb-4 md:mb-6">
                        La Solución Moderna vs. Lo Tradicional
                    </h2>
                    <p className="text-base md:text-lg text-muted-foreground">
                        Descubra por qué no todos los sistemas de impermeabilización son iguales. Esta comparación destaca las claras ventajas de la tecnología de poliuretano espreado de Thermo House.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-12 border-b border-border bg-muted/30">
                        <div className="p-4 md:p-6 md:col-span-3 font-bold text-secondary flex items-center text-xs md:text-sm">CARACTERÍSTICA</div>
                        <div className="p-4 md:p-6 md:col-span-4 bg-secondary text-white font-bold flex items-center text-xs md:text-sm">
                            POLIURETANO ESPREADO (THERMO HOUSE)
                        </div>
                        <div className="p-4 md:p-6 md:col-span-5 font-bold text-secondary flex items-center text-xs md:text-sm">
                            SISTEMAS TRADICIONALES
                        </div>
                    </div>

                    <div className="divide-y divide-border">
                        {comparisons.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 hover:bg-slate-50 transition-colors">
                                <div className="p-4 md:p-6 md:col-span-3 font-semibold text-secondary flex items-center text-sm">
                                    {item.feature}
                                </div>

                                <div className="p-4 md:p-6 md:col-span-4 flex items-start gap-4">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed">{item.thermo}</p>
                                </div>

                                <div className="p-4 md:p-6 md:col-span-5 flex items-start gap-4">
                                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{item.traditional}</p>
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
