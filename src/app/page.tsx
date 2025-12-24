import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import SystemsSection from '@/components/SystemsSection';
import MethodSection from '@/components/MethodSection';
import TechComparisonSection from '@/components/TechComparisonSection';
import WarrantySection from '@/components/WarrantySection';
import BranchesSection from '@/components/BranchesSection';
import Footer from '@/components/Footer';
import CalculatorSection from '@/components/CalculatorSection';
import SectionWrapper, { CTASection } from '@/components/SectionWrapper';

export default function Home() {
  return (
    <main className="min-h-screen font-sans selection:bg-primary/30 bg-slate-50 dark:bg-slate-950 overflow-y-auto scroll-smooth transition-colors duration-500">
      <Navbar />
      <div className="max-w-[1440px] mx-auto min-h-screen transition-colors duration-500">
        <section className="bg-white dark:bg-slate-950">
          <Hero />
        </section>

        <div className="space-y-0">
          <SectionWrapper bg="slate">
            <SystemsSection />
          </SectionWrapper>

          <SectionWrapper bg="white">
            <MethodSection />
          </SectionWrapper>

          <SectionWrapper bg="slate">
            <TechComparisonSection />
          </SectionWrapper>

          <SectionWrapper bg="white">
            <WarrantySection />
          </SectionWrapper>
        </div>

        {/* Sección Cotizador (Cargada dinámicamente con estado interno) */}
        <CalculatorSection />

        <SectionWrapper bg="white">
          <BranchesSection />
        </SectionWrapper>

        {/* Final Call to Action */}
        <CTASection />

        <Footer />
      </div>
    </main>
  );
}
