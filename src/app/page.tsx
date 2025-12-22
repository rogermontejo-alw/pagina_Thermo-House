'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import SystemsSection from '@/components/SystemsSection';
import MethodSection from '@/components/MethodSection';
import TechComparisonSection from '@/components/TechComparisonSection';
import WarrantySection from '@/components/WarrantySection';
import MapCalculator from '@/components/MapCalculator';
import QuoteGenerator from '@/components/QuoteGenerator';
import BranchesSection from '@/components/BranchesSection';
import Footer from '@/components/Footer';

export default function Home() {
  const [measurement, setMeasurement] = useState({
    area: 0,
    address: '',
    city: '',
    state: '',
    maps_link: '',
    postal_code: ''
  });

  const handleArea = (area: number) => setMeasurement(prev => ({ ...prev, area }));
  const handleLocation = (details: { address: string; city: string; state: string; maps_link: string; postal_code: string }) => {
    setMeasurement(prev => ({ ...prev, ...details }));
  };

  return (
    <main className="min-h-screen font-sans selection:bg-primary/30 bg-slate-50 dark:bg-slate-950 overflow-y-auto scroll-smooth transition-colors duration-500">
      <Navbar />
      <div className="max-w-[1440px] mx-auto min-h-screen transition-colors duration-500">
        <section className="bg-white dark:bg-slate-950">
          <Hero />
        </section>

        <div className="space-y-0">
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-slate-50 dark:bg-slate-900/50 py-16 md:py-24"
          >
            <div className="max-w-5xl mx-auto px-4">
              <SystemsSection />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-white dark:bg-slate-950 py-16 md:py-24"
          >
            <div className="max-w-5xl mx-auto px-4">
              <MethodSection />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-slate-50 dark:bg-slate-900/50 py-16 md:py-24"
          >
            <div className="max-w-5xl mx-auto px-4">
              <TechComparisonSection />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-white dark:bg-slate-950 py-16 md:py-24"
          >
            <div className="max-w-5xl mx-auto px-4">
              <WarrantySection />
            </div>
          </motion.section>
        </div>

        {/* Sección Cotizador */}
        <motion.section
          id="cotizador"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="py-16 md:py-24 relative px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80"
        >
          <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4 md:space-y-6">
              <h2 className="text-2xl sm:text-4xl font-black text-secondary dark:text-white uppercase tracking-tight">
                ¿Listo para su Cotización?
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Mida su techo satelitalmente y reciba su propuesta en segundos.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden">
              <MapCalculator
                onAreaCalculated={handleArea}
                onLocationUpdated={handleLocation}
              />
            </div>

            <QuoteGenerator
              initialArea={measurement.area}
              address={measurement.address}
              city={measurement.city}
              stateName={measurement.state}
              mapsLink={measurement.maps_link}
              postalCode={measurement.postal_code}
            />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="bg-white dark:bg-slate-950 py-16 md:py-24"
        >
          <div className="max-w-5xl mx-auto px-4">
            <BranchesSection />
          </div>
        </motion.section>

        {/* Final Call to Action */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="dark-section py-16 md:py-24 text-center rounded-[3rem] mx-4 md:mx-12 mb-12"
        >
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter">¿Preparado para la Tranquilidad?</h2>
            <p className="text-sm md:text-xl text-slate-300 mb-10 opacity-90 leading-relaxed">Permita que Thermo House proteja su hogar contra el calor y las filtraciones de por vida.</p>
            <button
              onClick={() => document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto bg-primary hover:bg-orange-600 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 text-sm"
            >
              Obtenga su Cotización Gratis
            </button>
          </div>
        </motion.section>

        <Footer />
      </div>
    </main>
  );
}
