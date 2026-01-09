import { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';

export const metadata: Metadata = {
    title: 'Sistemas de Impermeabilización Elite | Thermo House',
    description: 'Conozca nuestros sistemas de impermeabilización térmica: TH FIX, TH LIGHT, TH FORTE y más. Protección avanzada para techos de concreto y lámina.',
    alternates: {
        canonical: 'https://thermohouse.mx/sistemas',
    },
};

export default function SistemasPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'itemListElement': [
            {
                '@type': 'Service',
                'position': 1,
                'name': 'TH FIX',
                'description': 'Protección preventiva avanzada para techos de concreto.',
                'provider': {
                    '@type': 'Organization',
                    'name': 'Thermo House',
                    'url': 'https://thermohouse.mx'
                }
            },
            {
                '@type': 'Service',
                'position': 2,
                'name': 'TH LIGHT',
                'description': 'Impermeabilidad total y confort térmico.',
            },
            {
                '@type': 'Service',
                'position': 3,
                'name': 'TH FORTE',
                'description': 'Aislamiento térmico de alto nivel para reducción de temperatura.',
            }
        ]
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
