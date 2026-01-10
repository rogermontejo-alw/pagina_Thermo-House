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
    return <LandingPage />;
}
