'use client';

import { ShieldCheck, Droplets, Sun, ChevronDown } from 'lucide-react';

export default function WarrantySection() {
    return (
        <section id="garantia" className="py-2 transition-colors duration-500">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row items-center gap-8 mb-6">
                    <div className="flex-1 space-y-4 text-center lg:text-left">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-secondary dark:text-white leading-tight">
                            Garantía de Por Vida: <br />
                            Protección Total Para Su Hogar
                        </h2>
                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                            En Thermo House, respaldamos nuestro trabajo con una garantía de por vida inigualable, asegurando que su hogar permanezca protegido y su tranquilidad garantizada por años.
                        </p>
                        <button
                            onClick={() => document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto bg-secondary dark:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold"
                            aria-label="Contactar para recibir más información sobre la garantía"
                        >
                            Contáctenos para Más Información
                        </button>
                    </div>
                    <div className="flex-1 flex justify-center order-first lg:order-last">
                        <div className="w-48 h-48 md:w-64 md:h-64 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-300 dark:border-white/5">
                            <ShieldCheck className="w-24 h-24 md:w-32 md:h-32 text-slate-400 dark:text-slate-600" />
                        </div>
                    </div>
                </div>

                {/* Coverage Cards */}
                <div className="text-center mb-8 md:mb-12">
                    <h3 className="text-xl md:text-2xl font-bold text-secondary dark:text-white">Qué Cubre Nuestra Garantía</h3>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                    {[
                        { icon: Droplets, title: "Protección Contra Goteras", desc: "Cobertura completa contra cualquier filtración de agua causada por fallas en la aplicación." },
                        { icon: ShieldCheck, title: "Defectos de Materiales", desc: "Garantizamos la calidad e integridad de todos los materiales utilizados en nuestros servicios." },
                        { icon: Sun, title: "Protección Rayos UV", desc: "Asegura que las propiedades de aislamiento térmico se mantengan frente a la degradación solar." }
                    ].map((card, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md">
                            <card.icon className="w-8 h-8 md:w-10 md:h-10 text-primary mb-4" />
                            <h4 className="text-base md:text-lg font-bold text-secondary dark:text-white mb-2">{card.title}</h4>
                            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{card.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Maintenance Section (Active Warranty) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-border dark:border-slate-700 flex flex-col lg:flex-row items-center gap-8 mb-12">
                    <div className="flex-1 space-y-4 md:space-y-6">
                        <h3 className="text-xl md:text-2xl font-bold text-secondary dark:text-white">Manteniendo Su Garantía Activa</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Para asegurar una protección continua a largo plazo, se requiere una revisión de mantenimiento preventivo simple cada 2 o 3 años. Esta inspección rápida nos ayuda a garantizar la integridad del sistema de por vida.
                        </p>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Nuestro equipo se encargará de todo. Le recordaremos cuándo es el momento y programaremos una visita a su conveniencia.
                        </p>
                        <button
                            onClick={() => document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto bg-accent hover:bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                            aria-label="Programar una visita de mantenimiento preventivo"
                        >
                            Programar Mantenimiento
                        </button>
                    </div>
                    <div className="flex-1 w-full h-48 md:h-64 bg-slate-200 dark:bg-slate-700/50 rounded-xl overflow-hidden relative border border-slate-300/50 dark:border-transparent">
                        {/* Placeholder for Roof Image */}
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">
                            Imagen Mantenimiento Techo
                        </div>
                    </div>
                </div>

                {/* FAQ Accordion Placeholder */}
                <div className="max-w-3xl mx-auto">
                    <h3 className="text-xl md:text-2xl font-bold text-secondary dark:text-white text-center mb-6 md:mb-8">Preguntas Frecuentes</h3>
                    <div className="space-y-3 md:space-y-4">
                        {["¿La garantía es transferible si vendo mi casa?", "¿Qué implica el mantenimiento preventivo?", "¿Qué pasa si olvido programar el mantenimiento?"].map((q, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-3 md:p-4 rounded-xl border border-border dark:border-slate-800 flex justify-between items-center cursor-pointer hover:border-primary/50 transition-colors">
                                <span className="text-sm md:text-base font-medium text-secondary dark:text-slate-300">{q}</span>
                                <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
