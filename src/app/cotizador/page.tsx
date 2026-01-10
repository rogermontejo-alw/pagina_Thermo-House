import { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';

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
    return <LandingPage />;
}
