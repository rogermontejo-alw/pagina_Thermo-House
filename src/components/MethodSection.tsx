'use client';

import { Play } from 'lucide-react';

export default function MethodSection() {
    const steps = [
        {
            id: 1,
            title: "Preparación Meticulosa",
            description: "Nuestro proceso comienza con una limpieza profunda de la superficie, reparación de grietas e imprimación. Este primer paso crítico asegura una adhesión óptima para un sellado impecable y duradero.",
            imageColor: "bg-blue-100" // Placeholder for preparation image
        },
        {
            id: 2,
            title: "Aplicación de Poliuretano",
            description: "Utilizando equipos especializados, aplicamos una capa continua de espuma de poliuretano de alta densidad, creando una barrera monolítica que proporciona un aislamiento térmico y una impermeabilización excepcionales.",
            imageColor: "bg-orange-100" // Placeholder for application image
        },
        {
            id: 3,
            title: "Acabado Acrílico Protector",
            description: "Para completar el sistema, aplicamos una capa final acrílica resistente a los rayos UV e impermeable. Esta última capa protege el poliuretano y asegura la máxima durabilidad contra los elementos.",
            imageColor: "bg-yellow-100" // Placeholder for finish image
        }
    ];

    return (
        <section className="py-10 transition-colors duration-500">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-6">
                    <h2 className="text-2xl sm:text-4xl font-bold text-secondary dark:text-white mb-4 md:mb-5">
                        El Método Thermo House
                    </h2>
                    <p className="text-base md:text-lg text-muted-foreground mb-8 md:mb-10">
                        Explore nuestro proceso probado para una impermeabilización y aislamiento térmico superiores, garantizando calidad y durabilidad en cada paso del camino.
                    </p>
                </div>

                <div className="space-y-6 md:space-y-8">
                    {steps.map((step, index) => (
                        <div key={step.id} className={`flex flex-col lg:flex-row items-center gap-8 md:gap-12 ${index % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                            {/* Image Placeholder Area */}
                            <div className="w-full lg:w-1/2">
                                <div className={`aspect-video rounded-2xl shadow-lg border border-border dark:border-slate-800 relative overflow-hidden ${step.imageColor} dark:opacity-80`}>
                                    {/* Visual Placeholder text */}
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 dark:text-slate-400/20 font-bold text-xl md:text-2xl">
                                        Imagen: {step.title}
                                    </div>
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="w-full lg:w-1/2 relative">
                                {/* Step Number Badge */}
                                <div className="absolute -top-8 left-0 lg:-left-16 w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg md:text-xl shadow-lg z-10">
                                    {step.id}
                                </div>

                                <div className="pt-4 lg:pl-8">
                                    <h3 className="text-xl md:text-2xl font-bold text-secondary dark:text-white mb-3 md:mb-4">{step.title}</h3>
                                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 md:mt-16 text-center">
                    <p className="text-slate-600 dark:text-slate-400 mb-6 md:mb-8 max-w-2xl mx-auto text-sm md:text-base">
                        Nuestro compromiso con materiales de calidad y una aplicación experta garantiza una solución duradera y efectiva para su propiedad.
                    </p>
                    <button
                        onClick={() => document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full sm:w-auto bg-primary hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg shadow-orange-500/20 transition-all"
                        aria-label="Solicitar consulta gratuita sobre impermeabilización"
                    >
                        Solicite su Consulta Gratuita
                    </button>
                </div>
            </div>
        </section>
    );
}
