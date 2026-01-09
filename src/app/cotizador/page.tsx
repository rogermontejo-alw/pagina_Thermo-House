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
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Cotizador de Impermeabilización Thermo House',
        'description': 'Herramienta online para calcular costos de impermeabilización térmica midiendo su techo satelitalmente.',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'All',
        'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'MXN'
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <LandingPage />
        </>
    );
}
