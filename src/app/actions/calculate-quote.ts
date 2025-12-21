'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { Solution } from '@/types';

// Utility to normalize city names (remove accents and lower case)
function normalizeCity(city: string) {
    return city.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

export async function calculateQuote(area: number, solutionId: string, city?: string) {
    try {
        const targetCity = city || 'Mérida';
        const normTargetCity = normalizeCity(targetCity);
        const normMerida = normalizeCity('Mérida');

        if (!area || area <= 0) throw new Error('Invalid area');
        if (!solutionId) throw new Error('Invalid solution ID');

        // 1. Fetch entire catalog
        const { data: allSolsRaw, error } = await supabaseAdmin
            .from('soluciones_precios')
            .select('*')
            .order('orden', { ascending: true });

        if (error || !allSolsRaw || allSolsRaw.length === 0) {
            throw new Error('Database pricing catalog empty');
        }

        // 2. Build Hybrid Catalog (Mérida Base + City Overrides)
        const meridaSols = allSolsRaw.filter(s => s.ciudad && normalizeCity(s.ciudad) === normMerida);
        const citySols = (normTargetCity !== normMerida)
            ? allSolsRaw.filter(s => s.ciudad && normalizeCity(s.ciudad) === normTargetCity)
            : [];

        const catalogMap = new Map<string, any>();

        // Step A: Load all Mérida baseline products
        meridaSols.forEach(s => {
            catalogMap.set(s.internal_id.toLowerCase(), s);
        });

        // Step B: Overlay with specific city prices (overwrites Mérida if same internal_id)
        citySols.forEach(s => {
            catalogMap.set(s.internal_id.toLowerCase(), s);
        });

        // Step C: Fallback check - if Catalog is STILL empty (e.g. no Mérida prices either??)
        // just use the raw list to avoid a crash, but this shouldn't happen.
        if (catalogMap.size === 0) {
            allSolsRaw.forEach(s => {
                if (!catalogMap.has(s.internal_id.toLowerCase())) {
                    catalogMap.set(s.internal_id.toLowerCase(), s);
                }
            });
        }

        const unifiedCatalog = Array.from(catalogMap.values())
            .sort((a, b) => (a.orden || 0) - (b.orden || 0));

        // Note: isOutOfZone = true if we didn't find specific prices for THIS city for THIS specific solution ID
        // (will be checked below)

        // 3. Find current solution
        const searchId = solutionId.toLowerCase();
        const currentSol = unifiedCatalog.find(s => s.internal_id.toLowerCase() === searchId);

        if (!currentSol) {
            console.error('[CALC] Current sol NOT found in catalog:', searchId);
            throw new Error('Sistema no encontrado');
        }

        const MIN_PRICE = 5900;
        const totalCash = Math.max(Math.round(area * Number(currentSol.precio_contado_m2)), MIN_PRICE);
        const totalMsi = Math.max(Math.round(area * Number(currentSol.precio_msi_m2)), MIN_PRICE);

        // 4. Find Upsell Logic
        const currentCategory = (currentSol.category || 'concrete').toLowerCase();
        const currentIndex = unifiedCatalog.findIndex(s => s.internal_id.toLowerCase() === searchId);

        const upsellSol = unifiedCatalog.slice(currentIndex + 1).find(s => {
            const sCat = (s.category || 'concrete').toLowerCase();
            return currentCategory === 'concrete' ? (sCat === 'concrete' || sCat === 'both') :
                currentCategory === 'sheet' ? (sCat === 'sheet' || sCat === 'both') :
                    true;
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
            upsell: upsellData,
            // isOutOfZone is true if the price we used doesn't match the target city
            isOutOfZone: currentSol.ciudad ? normalizeCity(currentSol.ciudad) !== normTargetCity : true
        };
    } catch (error) {
        console.error('[CALC] Critical error:', error);
        return { success: false, error: 'Error al calcular el presupuesto' };
    }
}
