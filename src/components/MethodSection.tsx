'use client';

import { Play } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getCloudinaryUrl, getCloudinaryVideoUrl } from '@/lib/cloudinary-client';
import SourceIndicator from './SourceIndicator';

const LazyVideo = ({ videoPublicId, folder, posterPublicId }: {
    videoPublicId: string;
    folder: string;
    posterPublicId: string;
}) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize with Cloudinary ONLY - User requested removal of Supabase and no local fallback exists for these
    const [videoSrc, setVideoSrc] = useState(getCloudinaryVideoUrl(videoPublicId, folder, undefined, { width: 800, crop: 'limit' }));
    const [posterSrc, setPosterSrc] = useState(getCloudinaryUrl(posterPublicId, folder, undefined, { width: 800, crop: 'limit' }));

    // Note: If Cloudinary fails here, there is NO fallback as requested (local files don't exist for these steps)
    // We will just let it fail but show the Green dot if it tries to load Cloudinary.

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsIntersecting(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full">
            {isIntersecting ? (
                <>
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        poster={posterSrc}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        onError={(e) => console.error(`Video failed to load: ${videoSrc}`, e)}
                    >
                        <source src={videoSrc} type="video/mp4" />
                    </video>
                    <SourceIndicator src={videoSrc} />
                </>
            ) : (
                <img
                    src={posterSrc}
                    alt="Video preview"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}
        </div>
    );
};

export default function MethodSection() {
    const steps = [
        {
            id: 1,
            title: "Preparación Meticulosa",
            description: "Nuestro proceso comienza con una limpieza profunda de la superficie, la protección de las estructuras de su techo y la detección de áreas críticas. Este primer paso crítico asegura una adhesión óptima para un sellado impecable y duradero.",
            videoPublicId: "paso1_f5nssr",
            posterPublicId: "paso1_dptq3n",
            folder: "",
            imageColor: "bg-blue-100"
        },
        {
            id: 2,
            title: "Aplicación de Poliuretano",
            description: "Utilizando equipos especializados, sellamos las grietas existentes aplicamos una capa continua de espuma de poliuretano de alta densidad, creando una barrera monolítica que proporciona un aislamiento térmico y una impermeabilización excepcionales.",
            videoPublicId: "paso2_rddtso",
            posterPublicId: "paso2_hg2pps",
            folder: "",
            imageColor: "bg-orange-100"
        },
        {
            id: 3,
            title: "Acabado Acrílico Protector",
            description: "Para completar el sistema, aplicamos una capa final acrílica resistente a los rayos UV e impermeable. Esta última capa protege el poliuretano y asegura la máxima durabilidad contra los elementos.",
            videoPublicId: "paso3_h8k5qq",
            posterPublicId: "paso3_aubpi7",
            folder: "",
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

                <div className="space-y-24 md:space-y-32 lg:space-y-48">
                    {steps.map((step, index) => (
                        <div key={step.id} className={`flex flex-col lg:flex-row items-center gap-12 md:gap-16 lg:gap-24 ${index % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                            {/* Video/Image Area (40% width on Desktop, Capped on Tablet) */}
                            <div className="w-full max-w-sm md:max-w-md mx-auto lg:max-w-none lg:w-[42%] relative">
                                {/* Step Number Badge (Pinned to Image) */}
                                <div className={`absolute -top-6 md:-top-10 ${index % 2 === 0 ? '-right-6 md:-right-10' : '-left-6 md:-left-10'} w-14 h-14 md:w-20 md:h-20 bg-white dark:bg-slate-900 border-2 border-primary/20 rounded-2xl md:rounded-[2rem] flex items-center justify-center font-black text-xl md:text-3xl text-primary shadow-2xl z-20 -rotate-6 backdrop-blur-xl`}>
                                    {step.id}
                                </div>

                                <div className={`aspect-[4/5] rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800/50 relative overflow-hidden ${step.imageColor} dark:opacity-90 group transition-all duration-500 hover:shadow-primary/10`}>
                                    <LazyVideo
                                        videoPublicId={step.videoPublicId}
                                        folder={step.folder}
                                        posterPublicId={step.posterPublicId}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />
                                </div>
                            </div>

                            {/* Text Content (60% width on Desktop) */}
                            <div className="w-full lg:w-[58%]">
                                <div className="text-center lg:text-left lg:pl-12">
                                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-secondary dark:text-white mb-4 md:mb-8 bg-gradient-to-r from-secondary to-secondary/70 dark:from-white dark:to-white/60 bg-clip-text uppercase tracking-tight">
                                        {step.title}
                                    </h3>
                                    <div className="h-1 w-12 bg-primary mb-6 md:mb-8 rounded-full mx-auto lg:mx-0" />
                                    <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
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
