import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WarrantySection from '@/components/WarrantySection';
import SectionWrapper from '@/components/SectionWrapper';

export const metadata: Metadata = {
    title: 'Garantía de Por Vida | Thermo House',
    description: 'En Thermo House respaldamos nuestro trabajo con una garantía de por vida. Protección total contra goteras, defectos y degradación UV.',
    alternates: {
        canonical: 'https://thermohouse.mx/garantia',
    },
};

export default function GarantiaPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <div className="pt-24 space-y-0">
                <SectionWrapper bg="white">
                    <WarrantySection />
                </SectionWrapper>
            </div>
            <div className="max-w-5xl mx-auto px-4 mt-12">
                <Footer />
            </div>
        </main>
    );
}
