import { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';

export const metadata: Metadata = {
    title: 'Garantía de Por Vida | Thermo House',
    description: 'En Thermo House respaldamos nuestro trabajo con una garantía de por vida. Protección total contra goteras, defectos y degradación UV.',
};

export default function GarantiaPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': 'Impermeabilización con Garantía de Por Vida',
        'provider': {
            '@type': 'Organization',
            'name': 'Thermo House',
            'url': 'https://thermohouse.mx'
        },
        'serviceType': 'Roofing',
        'offers': {
            '@type': 'Offer',
            'warranty': {
                '@type': 'WarrantyPromise',
                'durationOfWarranty': {
                    '@type': 'QuantitativeValue',
                    'value': 99,
                    'unitCode': 'ANN'
                },
                'warrantyScope': 'Lifetime Warranty covering leaks and material defects'
            }
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
