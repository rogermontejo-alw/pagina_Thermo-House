import { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SystemsSection from '@/components/SystemsSection';
import SectionWrapper from '@/components/SectionWrapper';

export const metadata: Metadata = {
    title: 'Sistemas de Impermeabilización Elite | Thermo House',
    description: 'Conozca nuestros sistemas de impermeabilización térmica: TH FIX, TH LIGHT, TH FORTE y más. Protección avanzada para techos de concreto y lámina.',
    alternates: {
        canonical: 'https://thermohouse.mx/sistemas',
    },
};

export default function SistemasPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <div className="pt-24 space-y-0">
                <SectionWrapper bg="white">
                    <SystemsSection />
                </SectionWrapper>
            </div>
            <div className="max-w-5xl mx-auto px-4 mt-12">
                <Footer />
            </div>
        </main>
    );
}
