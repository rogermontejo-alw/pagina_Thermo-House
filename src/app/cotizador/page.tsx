import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CalculatorSection from '@/components/CalculatorSection';

export const metadata: Metadata = {
    title: 'Cotizador de Impermeabilización en Línea | Cotización en Segundos',
    description: 'Calcula el costo de impermeabilizar tu techo al instante con nuestro cotizador en línea. Medición satelital precisa y precios reales en segundos. ¡Pruébalo gratis!',
    alternates: {
        canonical: 'https://thermohouse.mx/cotizador',
    },
    openGraph: {
        title: 'Cotizador de Impermeabilización en Línea | Cotización en Segundos',
        description: 'Mide tu techo satelitalmente y obtén tu cotización de impermeabilización al instante. 100% online y gratuito.',
        url: 'https://thermohouse.mx/cotizador',
        type: 'website',
    }
};

export default function CotizadorPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <div className="pt-20">
                <CalculatorSection />
            </div>
            <div className="max-w-5xl mx-auto px-4 mt-12">
                <Footer />
            </div>
        </main>
    );
}
