import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import SectionWrapper, { CTASection } from '@/components/SectionWrapper';

import SystemsSection from '@/components/SystemsSection';
import MethodSection from '@/components/MethodSection';
import TechComparisonSection from '@/components/TechComparisonSection';
import WarrantySection from '@/components/WarrantySection';
import BranchesSection from '@/components/BranchesSection';
import Footer from '@/components/Footer';

const CalculatorSection = dynamic(() => import('@/components/CalculatorSection'), {
    loading: () => <div className="h-96 flex items-center justify-center bg-slate-100 dark:bg-slate-900 animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Herramientas Técnicas...</div>
});
const BlogPreviewSection = dynamic(() => import('@/components/BlogPreviewSection'));

export default function LandingPage() {
    return (
        <main className="min-h-screen font-sans selection:bg-primary/30 bg-slate-50 dark:bg-slate-950 overflow-y-auto scroll-smooth transition-colors duration-500">
            <Navbar />
            <div className="max-w-[1440px] mx-auto min-h-screen transition-colors duration-500">
                <section className="bg-white dark:bg-slate-950">
                    <Hero />
                </section>

                <div className="space-y-0">
                    <SectionWrapper bg="slate" id="sistemas">
                        <SystemsSection />
                    </SectionWrapper>

                    <SectionWrapper bg="white" id="metodo">
                        <MethodSection />
                    </SectionWrapper>

                    <SectionWrapper bg="slate" id="garantia">
                        <WarrantySection />
                    </SectionWrapper>

                    <SectionWrapper bg="white" id="tecnologia">
                        <TechComparisonSection />
                    </SectionWrapper>

                    {/* Sección Cotizador (Cargada dinámicamente) */}
                    <div id="cotizador">
                        <CalculatorSection />
                    </div>

                    <SectionWrapper bg="slate">
                        <BlogPreviewSection />
                    </SectionWrapper>

                    <SectionWrapper bg="white" id="sucursales">
                        <BranchesSection />
                    </SectionWrapper>

                    <div className="max-w-5xl mx-auto px-4">
                        <CTASection />
                        <Footer />
                    </div>
                </div>
            </div>
        </main>
    );
}
