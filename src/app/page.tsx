import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import SectionWrapper from '@/components/SectionWrapper';
const SystemsSection = dynamic(() => import('@/components/SystemsSection'));
const MethodSection = dynamic(() => import('@/components/MethodSection'));
const TechComparisonSection = dynamic(() => import('@/components/TechComparisonSection'));
const WarrantySection = dynamic(() => import('@/components/WarrantySection'));
const BranchesSection = dynamic(() => import('@/components/BranchesSection'));
const CalculatorSection = dynamic(() => import('@/components/CalculatorSection'), {
  loading: () => <div className="h-96 flex items-center justify-center bg-slate-100 dark:bg-slate-900 animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando Herramientas Técnicas...</div>
});
const Footer = dynamic(() => import('@/components/Footer'));
const CTASection = dynamic(() => import('@/components/SectionWrapper').then(mod => mod.CTASection));
const BlogPreviewSection = dynamic(() => import('@/components/BlogPreviewSection'));

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

        <SectionWrapper bg="slate">
          <BlogPreviewSection />
        </SectionWrapper>

        <div className="max-w-5xl mx-auto px-4">
          <CTASection />
          <Footer />
        </div>
      </div>
    </main>
  );
}
