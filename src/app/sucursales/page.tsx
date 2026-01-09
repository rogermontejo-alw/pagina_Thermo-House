import { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';
import { getLocations } from '@/app/actions/admin-locations';

export const metadata: Metadata = {
    title: 'Sucursales de Impermeabilización | Cobertura Nacional Thermo House',
    description: 'Encuentre su sucursal Thermo House más cercana. Mérida, Cancún, Playa del Carmen y más. Expertos en aislamiento térmico y poliuretano con presencia líder en México.',
    alternates: {
        canonical: 'https://thermohouse.mx/sucursales',
    },
};

export default async function SucursalesPage() {
    const res = await getLocations();
    const branches = res.success ? (res.data || []).filter(l => l.is_branch) : [];

    // Generate dynamic Area Served and Schema
    const cities = branches.map(b => b.ciudad).filter(Boolean);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Thermo House México',
        'url': 'https://thermohouse.mx',
        'logo': 'https://thermohouse.mx/logo.png',
        'description': 'Líderes en impermeabilización técnica y aislamiento térmico con poliuretano de alta densidad.',
        'address': {
            '@type': 'PostalAddress',
            'addressCountry': 'MX'
        },
        'contactPoint': branches.map(b => ({
            '@type': 'ContactPoint',
            'telephone': b.telefono,
            'contactType': 'customer service',
            'areaServed': b.ciudad,
            'availableLanguage': 'Spanish'
        })),
        'department': branches.map(b => ({
            '@type': 'LocalBusiness',
            'name': `Thermo House ${b.ciudad}`,
            'image': 'https://thermohouse.mx/images/hero-poster.webp',
            'telephone': b.telefono,
            'address': {
                '@type': 'PostalAddress',
                'streetAddress': b.direccion,
                'addressLocality': b.ciudad,
                'addressRegion': b.estado || 'México',
                'addressCountry': 'MX'
            }
        }))
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
