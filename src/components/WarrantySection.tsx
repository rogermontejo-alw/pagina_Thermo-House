import { ShieldCheck, Droplets, Sun, ChevronDown } from 'lucide-react';

export default function WarrantySection() {
    return (
        <section id="garantia" className="py-10 md:py-16 bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section (Image 1 Top) */}
                <div className="flex flex-col lg:flex-row items-center gap-10 md:gap-12 mb-12 md:mb-20">
                    <div className="flex-1 space-y-4 md:space-y-6 text-center lg:text-left">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-secondary leading-tight">
                            Garantía de Por Vida: <br />
                            Protección Total Para Su Hogar
                        </h2>
                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                            En Thermo House, respaldamos nuestro trabajo con una garantía de por vida inigualable, asegurando que su hogar permanezca protegido y su tranquilidad garantizada por años.
                        </p>
                        <button
                            onClick={() => document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto bg-secondary hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                            Contáctenos para Más Información
                        </button>
                    </div>
                    <div className="flex-1 flex justify-center order-first lg:order-last">
                        <div className="w-48 h-48 md:w-64 md:h-64 bg-slate-200 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-24 h-24 md:w-32 md:h-32 text-slate-300" />
                        </div>
                    </div>
                </div>

                {/* Coverage Cards */}
                <div className="text-center mb-8 md:mb-12">
                    <h3 className="text-xl md:text-2xl font-bold text-secondary">Qué Cubre Nuestra Garantía</h3>
                </div>

                <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
                    {[
                        { icon: Droplets, title: "Protección Contra Goteras", desc: "Cobertura completa contra cualquier filtración de agua causada por fallas en la aplicación." },
                        { icon: ShieldCheck, title: "Defectos de Materiales", desc: "Garantizamos la calidad e integridad de todos los materiales utilizados en nuestros servicios." },
                        { icon: Sun, title: "Protección Rayos UV", desc: "Asegura que las propiedades de aislamiento térmico se mantengan frente a la degradación solar." }
                    ].map((card, i) => (
                        <div key={i} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-border">
                            <card.icon className="w-8 h-8 md:w-10 md:h-10 text-secondary mb-4" />
                            <h4 className="text-base md:text-lg font-bold text-secondary mb-2">{card.title}</h4>
                            <p className="text-xs md:text-sm text-muted-foreground">{card.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Maintenance Section (Active Warranty) */}
                <div className="bg-white rounded-2xl p-6 md:p-12 shadow-sm border border-border flex flex-col lg:flex-row items-center gap-8 md:gap-12 mb-12 md:mb-20">
                    <div className="flex-1 space-y-4 md:space-y-6">
                        <h3 className="text-xl md:text-2xl font-bold text-secondary">Manteniendo Su Garantía Activa</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Para asegurar una protección continua a largo plazo, se requiere una revisión de mantenimiento preventivo simple cada 2 o 3 años. Esta inspección rápida nos ayuda a garantizar la integridad del sistema de por vida.
                        </p>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Nuestro equipo se encargará de todo. Le recordaremos cuándo es el momento y programaremos una visita a su conveniencia.
                        </p>
                        <button
                            onClick={() => document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto bg-accent hover:bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                        >
                            Programar Mantenimiento
                        </button>
                    </div>
                    <div className="flex-1 w-full h-48 md:h-64 bg-slate-100 rounded-xl overflow-hidden relative">
                        {/* Placeholder for Roof Image */}
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-sm">
                            Imagen Mantenimiento Techo
                        </div>
                    </div>
                </div>

                {/* FAQ Accordion Placeholder */}
                <div className="max-w-3xl mx-auto">
                    <h3 className="text-xl md:text-2xl font-bold text-secondary text-center mb-6 md:mb-8">Preguntas Frecuentes</h3>
                    <div className="space-y-3 md:space-y-4">
                        {["¿La garantía es transferible si vendo mi casa?", "¿Qué implica el mantenimiento preventivo?", "¿Qué pasa si olvido programar el mantenimiento?"].map((q, i) => (
                            <div key={i} className="bg-white p-3 md:p-4 rounded-xl border border-border flex justify-between items-center cursor-pointer hover:border-primary/50 transition-colors">
                                <span className="text-sm md:text-base font-medium text-secondary">{q}</span>
                                <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
