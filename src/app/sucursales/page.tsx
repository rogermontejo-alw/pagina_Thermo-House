import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BranchesSection from '@/components/BranchesSection';
import SectionWrapper from '@/components/SectionWrapper';

export const metadata: Metadata = {
    title: 'Sucursales de Impermeabilización | Cobertura Nacional Thermo House',
    description: 'Encuentre su sucursal Thermo House más cercana. Mérida, Cancún, Playa del Carmen y más. Expertos en aislamiento térmico y poliuretano con presencia líder en México.',
    alternates: {
        canonical: 'https://thermohouse.mx/sucursales',
    },
};

export default function SucursalesPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <div className="pt-24 space-y-0">
                <SectionWrapper bg="white">
                    <BranchesSection />
                </SectionWrapper>
            </div>
            <div className="max-w-5xl mx-auto px-4 mt-12">
                <Footer />
            </div>
        </main>
    );
}
