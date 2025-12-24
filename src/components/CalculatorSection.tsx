'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Carga dinámica de los componentes pesados (sin SSR)
const MapCalculator = dynamic(() => import('./MapCalculator'), {
    ssr: false,
    loading: () => <div className="h-[400px] flex items-center justify-center bg-slate-100 dark:bg-slate-900 animate-pulse rounded-3xl">Cargando Mapa...</div>
});

const QuoteGenerator = dynamic(() => import('./QuoteGenerator'), {
    ssr: false
});

export default function CalculatorSection() {
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
        <section
            id="cotizador"
            className="py-16 md:py-24 relative px-4 sm:px-6 lg:px-8 border-y border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80"
        >
            <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-4 md:space-y-6">
                    <h2 className="text-2xl sm:text-4xl font-black text-secondary dark:text-white uppercase tracking-tight">
                        ¿Listo para su Cotización?
                    </h2>
                    <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
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
        </section>
    );
}
