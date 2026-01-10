'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Droplets, Sun, ChevronDown } from 'lucide-react';
import { getLocations } from '@/app/actions/admin-locations';
import { Location } from '@/types';
import { getCloudinaryUrl } from '@/lib/cloudinary-client';
import SourceIndicator from './SourceIndicator';

export default function WarrantySection() {
    const [phoneNumber, setPhoneNumber] = useState("529992006267"); // Fallback
    const [maintenanceImg, setMaintenanceImg] = useState(getCloudinaryUrl('maintenance-bg_jntbuz', '', '/images/maintenance-bg.webp', { width: 1200, crop: 'limit' }));

    useEffect(() => {
        const fetchPhone = async () => {
            const res = await getLocations();
            if (res.success && res.data) {
                const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const merida = res.data.find((l: Location) => norm(l.ciudad) === 'merida');
                if (merida && merida.telefono) {
                    // Clean and ensure 52 prefix for WhatsApp
                    const clean = merida.telefono.replace(/\D/g, '');
                    const finalPhone = clean.startsWith('52') ? clean : `52${clean}`;
                    setPhoneNumber(finalPhone);
                }
            }
        };
        fetchPhone();
    }, []);

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
                        <Link
                            href="/cotizador"
                            onClick={(e) => {
                                e.preventDefault();
                                window.history.pushState(null, '', '/cotizador');
                                document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full sm:w-auto bg-secondary dark:bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center"
                            aria-label="Contactar para recibir más información sobre la garantía"
                        >
                            Contáctenos para Más Información
                        </Link>
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
                <div className="relative bg-teal-50/50 dark:bg-teal-950/30 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-accent/5 border border-accent/30 dark:border-white/40 flex flex-col lg:flex-row items-center gap-12 mb-16 overflow-hidden transition-all duration-500">
                    {/* Background accent for the highlight */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                    <div className="flex-1 space-y-4 md:space-y-6">
                        <h3 className="text-xl md:text-2xl font-bold text-secondary dark:text-white">Manteniendo Su Garantía Activa</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Para asegurar una protección continua a largo plazo, se requiere una revisión de mantenimiento preventivo simple cada 2 o 3 años. Esta inspección rápida nos ayuda a garantizar la integridad del sistema de por vida.
                        </p>
                        <p className="text-sm md:text-base text-muted-foreground">
                            Nuestro equipo se encargará de todo. Le recordaremos cuándo es el momento y programaremos una visita a su conveniencia.
                        </p>
                        <motion.button
                            onClick={() => {
                                const message = encodeURIComponent("Hola, me gustaría programar una revisión de mantenimiento preventivo para mi sistema Thermo House.");
                                window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
                            }}
                            animate={{
                                scale: [1, 1.05, 1],
                                boxShadow: [
                                    "0 0 0px rgba(20, 184, 166, 0)",
                                    "0 0 20px rgba(20, 184, 166, 0.4)",
                                    "0 0 0px rgba(20, 184, 166, 0)"
                                ]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="w-full sm:w-auto bg-accent hover:bg-teal-600 text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest transition-colors shadow-xl relative z-10"
                            aria-label="Programar una visita de mantenimiento preventivo en WhatsApp"
                        >
                            Programar Mantenimiento
                        </motion.button>
                    </div>
                    <div className="flex-1 w-full h-48 md:h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl overflow-hidden relative border border-slate-300/50 dark:border-white/10 group/img shadow-inner">
                        <img
                            src={maintenanceImg}
                            alt="Mantenimiento Preventivo Thermo House"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110"
                            onError={(e) => {
                                if (maintenanceImg !== '/images/maintenance-bg.webp') {
                                    setMaintenanceImg('/images/maintenance-bg.webp');
                                } else {
                                    // If fallback also fails, hide
                                    e.currentTarget.style.display = 'none';
                                }
                            }}
                        />
                        <SourceIndicator src={maintenanceImg} />
                        {/* Subtle overlay to blend with the card */}
                        <div className="absolute inset-0 bg-teal-900/10 dark:bg-teal-900/20" />


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
