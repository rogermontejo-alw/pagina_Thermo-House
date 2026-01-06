import { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';

export const metadata: Metadata = {
    title: 'Nuestras Sucursales | Thermo House',
    description: 'Visite nuestras sucursales en Mérida, Playa del Carmen, Cancún y Tulum. Cobertura peninsular para brindarle el mejor servicio.',
};

export default function SucursalesPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': 'Thermo House',
        'image': 'https://thermohouse.mx/logo.png',
        'telephone': '+529992006267',
        'address': {
            '@type': 'PostalAddress',
            'streetAddress': 'Calle 20 x 15 y 17',
            'addressLocality': 'Mérida',
            'addressRegion': 'YUC',
            'postalCode': '97130',
            'addressCountry': 'MX'
        },
        'areaServed': ['Mérida', 'Cancún', 'Playa del Carmen', 'Tulum'],
        'url': 'https://thermohouse.mx'
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
