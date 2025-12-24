import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
    title: 'Términos y Condiciones',
    description: 'Términos y condiciones de uso de la plataforma y servicios de Thermo House.',
};

export default function TermsPage() {
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
                        Términos y <span className="text-primary">Condiciones</span>
                    </h1>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-slate-600 dark:text-slate-400 leading-relaxed">
                        <section aria-labelledby="t-estimaciones">
                            <h2 id="t-estimaciones" className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">01</span>
                                Cotizaciones y Estimaciones
                            </h2>
                            <p className="mt-4">
                                Las cotizaciones generadas mediante nuestra calculadora satelital son **estimaciones informativas**. El precio final y la viabilidad técnica están sujetos a una inspección física obligatoria por parte de nuestro personal experto para verificar el estado real de la superficie y accesos.
                            </p>
                        </section>

                        <section aria-labelledby="t-vigencia">
                            <h2 id="t-vigencia" className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">02</span>
                                Vigencia de Precios
                            </h2>
                            <p className="mt-4">
                                Toda propuesta económica tiene una vigencia de **15 días naturales** a partir de su emisión. Tras este periodo, los precios pueden estar sujetos a cambios según la fluctuación de costos de materiales o insumos especializados.
                            </p>
                        </section>

                        <section aria-labelledby="t-garantia">
                            <h2 id="t-garantia" className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">03</span>
                                Garantía de Por Vida
                            </h2>
                            <p className="mt-4">
                                La "Garantía de Por Vida" de Thermo House es un compromiso de calidad permanente, cuya vigencia está condicionada al cumplimiento del **Programa de Mantenimiento Preventivo**. Este programa requiere una inspección y mantenimiento menor cada **2 o 3 años** (según el sistema contratado). La falta de este mantenimiento anulará la cobertura de garantía sobre filtraciones.
                            </p>
                        </section>

                        <section aria-labelledby="t-responsabilidad">
                            <h2 id="t-responsabilidad" className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">04</span>
                                Limitación de Responsabilidad
                            </h2>
                            <p className="mt-4">
                                Thermo House no se responsabiliza por daños derivados de:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li>Fallas estructurales preexistentes no reportadas por el cliente.</li>
                                <li>Modificaciones realizadas al sistema por terceros no autorizados.</li>
                                <li>Desastres naturales que excedan las especificaciones técnicas del material.</li>
                                <li>Uso inadecuado del área impermeabilizada (tránsito pesado no previsto).</li>
                            </ul>
                        </section>

                        <section aria-labelledby="t-jurisdiccion">
                            <h2 id="t-jurisdiccion" className="text-xl font-black text-secondary dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">05</span>
                                Jurisdicción
                            </h2>
                            <p className="mt-4">
                                Para cualquier controversia derivada del uso de este sitio o la contratación de nuestros servicios, las partes se someten a las leyes aplicables en los Estados Unidos Mexicanos y a la jurisdicción de los tribunales de la ciudad de **Mérida, Yucatán**, renunciando a cualquier otro fuero.
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
