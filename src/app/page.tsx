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
    <main className="min-h-screen font-sans selection:bg-primary/30 bg-slate-50/30 overflow-y-auto scroll-smooth scroll-snap-y">
      <Navbar />
      <div className="max-w-[1440px] mx-auto shadow-2xl shadow-slate-200/50 bg-white min-h-screen scroll-snap-type-y-mandatory">
        <section className="scroll-snap-align-start">
          <Hero />
        </section>

        <div className="max-w-5xl mx-auto space-y-0">
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="scroll-snap-align-start"
          >
            <SystemsSection />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="scroll-snap-align-start"
          >
            <MethodSection />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="scroll-snap-align-start"
          >
            <TechComparisonSection />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="scroll-snap-align-start"
          >
            <WarrantySection />
          </motion.section>
        </div>

        {/* Sección Cotizador */}
        <motion.section
          id="cotizador"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="py-4 md:py-8 relative px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-slate-100 scroll-snap-align-start bg-muted/20"
        >
          <div className="space-y-4 md:space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-1 md:space-y-2">
              <h2 className="text-2xl sm:text-4xl font-black text-secondary tracking-tight">
                ¿Listo para su Cotización?
              </h2>
              <p className="text-xs md:text-base text-muted-foreground leading-relaxed">
                Mida su techo satelitalmente y reciba su propuesta en segundos.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
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

        {/* Final Call to Action */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="dark-section py-6 md:py-10 text-center rounded-[3rem] mx-4 md:mx-12 mb-8 scroll-snap-align-start"
        >
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-black text-white mb-4">¿Preparado para la Tranquilidad?</h2>
            <p className="text-sm md:text-lg text-slate-300 mb-8 opacity-80">Permita que Thermo House proteja su hogar de por vida.</p>
            <button
              onClick={() => document.getElementById('cotizador')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto bg-white text-secondary hover:bg-slate-100 px-10 py-4 rounded-xl font-black transition-all shadow-xl active:scale-95"
            >
              Obtenga su Cotización Gratis
            </button>
          </div>
        </motion.section>

        <footer className="bg-slate-950 py-12 border-t border-white/5 font-sans rounded-t-[3rem] scroll-snap-align-end">
          <div className="max-w-5xl mx-auto px-4 text-center text-slate-500 text-xs tracking-widest uppercase">
            <p>© 2025 Thermo House. Protección Térmica Avanzada.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
