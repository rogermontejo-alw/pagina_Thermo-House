'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { Solution } from '@/types';

export async function calculateQuote(area: number, solutionId: string, city?: string) {
    try {
        const lookupCity = city || 'Mérida';
        if (!area || area <= 0) throw new Error('Invalid area');
        if (!solutionId) throw new Error('Invalid solution ID');

        // 1. Fetch EVERYTHING from solutions_precios to build a robust catalog
        const { data: allSolsRaw, error } = await supabaseAdmin
            .from('soluciones_precios')
            .select('*')
            .order('orden', { ascending: true });

        if (error || !allSolsRaw || allSolsRaw.length === 0) {
            throw new Error('Database pricing catalog empty');
        }

        // 2. Filter for the target city + Get Mérida as fallback items
        const citySols = allSolsRaw.filter(s => s.ciudad === lookupCity);
        const meridaSols = allSolsRaw.filter(s => s.ciudad === 'Mérida');

        // 3. Create a unified catalog: prefer city price, else Mérida price
        // This ensures that even if a city is missing a system, we can still "see" it from the catalog
        const unifiedCatalog: any[] = [];
        const uniqueIds = Array.from(new Set(allSolsRaw.map(s => s.internal_id)));

        uniqueIds.forEach(id => {
            const cityPrice = citySols.find(s => s.internal_id === id);
            const meridaPrice = meridaSols.find(s => s.internal_id === id);

            if (cityPrice) {
                unifiedCatalog.push(cityPrice);
            } else if (meridaPrice) {
                // If missing in city, we use Mérida price but mark it
                unifiedCatalog.push(meridaPrice);
            }
        });

        // Re-sort unified catalog by orden
        unifiedCatalog.sort((a, b) => (a.orden || 0) - (b.orden || 0));

        // 4. Find current solution 
        const currentSol = unifiedCatalog.find(s => s.internal_id.toLowerCase() === solutionId.toLowerCase());
        if (!currentSol) throw new Error(`Solution ${solutionId} not found`);

        const MIN_PRICE = 5900;
        const totalCash = Math.max(Math.round(area * Number(currentSol.precio_contado_m2)), MIN_PRICE);
        const totalMsi = Math.max(Math.round(area * Number(currentSol.precio_msi_m2)), MIN_PRICE);

        // 5. Intelligent Upsell Search in the Unified Catalog
        const currentCategory = (currentSol.category || 'concrete').toLowerCase();
        const currentIndex = unifiedCatalog.findIndex(s => s.internal_id === currentSol.internal_id);

        const upsellSol = unifiedCatalog.slice(currentIndex + 1).find(s => {
            const sCat = (s.category || 'concrete').toLowerCase();
            if (currentCategory === 'concrete') return sCat === 'concrete' || sCat === 'both';
            if (currentCategory === 'sheet') return sCat === 'sheet' || sCat === 'both';
            return true;
        });

        let upsellData = null;
        if (upsellSol) {
            upsellData = {
                totalCash: Math.max(Math.round(area * Number(upsellSol.precio_contado_m2)), MIN_PRICE),
                totalMsi: Math.max(Math.round(area * Number(upsellSol.precio_msi_m2)), MIN_PRICE),
                title: upsellSol.title,
                internal_id: upsellSol.internal_id
            };
        }

        return {
            success: true,
            data: { totalCash, totalMsi },
            upsell: upsellData
        };
    } catch (error) {
        console.error('Calculation error:', error);
        return { success: false, error: 'Error al calcular' };
    }
}
