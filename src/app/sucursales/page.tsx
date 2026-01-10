import { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';

export const metadata: Metadata = {
    title: 'Sucursales de Impermeabilización | Cobertura Nacional Thermo House',
    description: 'Encuentre su sucursal Thermo House más cercana. Mérida, Cancún, Playa del Carmen y más. Expertos en aislamiento térmico y poliuretano con presencia líder en México.',
    alternates: {
        canonical: 'https://thermohouse.mx/sucursales',
    },
};

export default function SucursalesPage() {
    return <LandingPage />;
}
