'use client';

import { Play } from 'lucide-react';

export default function MethodSection() {
    const steps = [
        {
            id: 1,
            title: "Preparación Meticulosa",
            description: "Nuestro proceso comienza con una limpieza profunda de la superficie, reparación de grietas e imprimación. Este primer paso crítico asegura una adhesión óptima para un sellado impecable y duradero.",
            videoUrl: "", // URL de Supabase para el video 1
            posterUrl: "", // URL de Supabase para la imagen fija 1
            imageColor: "bg-blue-100"
        },
        {
            id: 2,
            title: "Aplicación de Poliuretano",
            description: "Utilizando equipos especializados, aplicamos una capa continua de espuma de poliuretano de alta densidad, creando una barrera monolítica que proporciona un aislamiento térmico y una impermeabilización excepcionales.",
            videoUrl: "", // URL de Supabase para el video 2
            posterUrl: "", // URL de Supabase para la imagen fija 2
            imageColor: "bg-orange-100"
        },
        {
            id: 3,
            title: "Acabado Acrílico Protector",
            description: "Para completar el sistema, aplicamos una capa final acrílica resistente a los rayos UV e impermeable. Esta última capa protege el poliuretano y asegura la máxima durabilidad contra los elementos.",
            videoUrl: "", // URL de Supabase para el video 3
            posterUrl: "", // URL de Supabase para la imagen fija 3
            imageColor: "bg-yellow-100"
        }
    ];

    return (
        <section id="metodo" className="py-20 transition-colors duration-500">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-secondary dark:text-white mb-6 uppercase tracking-tight">
                        El Método <span className="text-primary italic">Thermo</span> House
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
                        Explora nuestro proceso tecnológico para una impermeabilización de élite, garantizando protección de por vida en cada paso.
                    </p>
                </div>

                <div className="space-y-24 md:space-y-32">
                    {steps.map((step, index) => (
                        <div key={step.id} className={`flex flex-col lg:flex-row items-center gap-12 md:gap-20 ${index % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                            {/* Video/Image Area */}
                            <div className="w-full lg:w-1/2">
                                <div className={`aspect-video rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden ${step.imageColor} dark:opacity-90 group`}>
                                    {step.videoUrl ? (
                                        <video
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            poster={step.posterUrl}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        >
                                            <source src={step.videoUrl} type="video/mp4" />
                                        </video>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-700 font-black text-4xl italic">
                                            TH-0{step.id}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="w-full lg:w-1/2 relative">
                                {/* Step Number Badge */}
                                <div className="absolute -top-12 left-0 lg:-left-20 w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-primary/20 z-10 rotate-3">
                                    {step.id}
                                </div>

                                <div className="pt-8 lg:pl-10">
                                    <h3 className="text-2xl md:text-3xl font-black text-secondary dark:text-white mb-6 uppercase tracking-tight">{step.title}</h3>
                                    <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
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
