import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
    title: 'Aviso de Privacidad',
    description: 'Aviso de Privacidad integral de Thermo House conforme a la Ley Federal de Protección de Datos Personales.',
};

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <div className="max-w-4xl mx-auto px-6 pt-32 pb-24">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px] mb-8 hover:gap-3 transition-all"
                >
                    <ArrowLeft className="w-3 h-3" />
                    Volver al inicio
                </Link>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-16 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                    <h1 className="text-3xl md:text-5xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-8 leading-none">
                        Aviso de <span className="text-primary">Privacidad</span>
                    </h1>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-600 dark:text-slate-400 leading-relaxed">
                        <section aria-labelledby="r-social">
                            <h2 id="r-social" className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">01</span>
                                Responsable de los Datos
                            </h2>
                            <p className="mt-4">
                                Thermo House, con domicilio en Mérida, Yucatán, es responsable del tratamiento de sus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
                            </p>
                        </section>

                        <section aria-labelledby="r-datos">
                            <h2 id="r-datos" className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">02</span>
                                Datos que Recabamos
                            </h2>
                            <p className="mt-4">
                                Para brindarle nuestros servicios de cotización e impermeabilización, recabamos:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4 font-medium">
                                <li>Nombre completo y/o razón social.</li>
                                <li>Número telefónico (WhatsApp).</li>
                                <li>Ubicación geográfica de la propiedad.</li>
                                <li>Medidas y características técnicas de su techo mediante herramientas satelitales.</li>
                            </ul>
                        </section>

                        <section aria-labelledby="r-finalidad">
                            <h2 id="r-finalidad" className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">03</span>
                                Finalidad del Tratamiento
                            </h2>
                            <p className="mt-4">
                                Sus datos serán utilizados exclusivamente para:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li>Generar cotizaciones precisas de nuestros sistemas de aislamiento.</li>
                                <li>Programar visitas de inspección técnica.</li>
                                <li>Informarle sobre promociones y el estado de su garantía de por vida.</li>
                                <li>Realizar encuestas de satisfacción y mejora del servicio.</li>
                            </ul>
                        </section>

                        <section aria-labelledby="r-seguridad">
                            <h2 id="r-seguridad" className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">04</span>
                                Seguridad y Transferencia
                            </h2>
                            <p className="mt-4">
                                Sus datos están protegidos por medidas de seguridad administrativas y técnicas. Thermo House no vende ni transfiere sus datos a terceros sin su consentimiento, excepto por requerimientos legales o para la ejecución técnica de nuestros servicios (infraestructura en la nube).
                            </p>
                        </section>

                        <section aria-labelledby="r-arco">
                            <h2 id="r-arco" className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">05</span>
                                Derechos ARCO
                            </h2>
                            <p className="mt-4">
                                Usted tiene derecho al Acceso, Rectificación, Cancelación u Oposición del tratamiento de sus datos. Para ejercerlos, por favor envíe un correo a la dirección de contacto proporcionada en nuestro sitio web oficial.
                            </p>
                        </section>

                        <div className="pt-12 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            Última actualización: Diciembre 2025
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
