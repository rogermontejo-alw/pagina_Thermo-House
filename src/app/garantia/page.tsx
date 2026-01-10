import { Metadata } from 'next';
import LandingPage from '@/components/LandingPage';

export const metadata: Metadata = {
    title: 'Garantía de Por Vida | Thermo House',
    description: 'En Thermo House respaldamos nuestro trabajo con una garantía de por vida. Protección total contra goteras, defectos y degradación UV.',
    alternates: {
        canonical: 'https://thermohouse.mx/garantia',
    },
};

export default function GarantiaPage() {
    return <LandingPage />;
}
