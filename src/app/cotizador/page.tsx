import { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';

export const metadata: Metadata = {
    title: 'Cotizador Online | Thermo House',
    description: 'Obtenga una cotización instantánea para la impermeabilización de su techo. Medición satelital y cálculo preciso en segundos.',
    alternates: {
        canonical: 'https://thermohouse.mx/cotizador',
    },
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
