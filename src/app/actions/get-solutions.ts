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

export async function getAllSolutions(cityFilter?: string) {
    try {
        const targetCity = cityFilter || 'Mérida';
        const normTargetCity = normalizeCity(targetCity);
        const normMerida = normalizeCity('Mérida');

        // 1. Fetch from 'productos' table (Master Catalog)
        const { data: masterSols, error: masterError } = await supabaseAdmin
            .from('productos')
            .select('*')
            .eq('activo', true)
            .order('orden', { ascending: true });

        if (masterError) {
            console.error('Error fetching master products:', masterError);
            return { success: false, data: [] };
        }

        // 2. Fetch Relevant Prices (Mérida + Regional if applicable)
        let priceQuery = supabaseAdmin.from('soluciones_precios').select('*').eq('activo', true);

        // Fetch Mérida and target city prices
        const { data: prices, error: priceError } = await priceQuery;

        if (priceError) {
            console.error('Error fetching solution prices:', priceError);
        }

        const meridaPrices = prices?.filter(p => normalizeCity(p.ciudad || '') === normMerida) || [];
        const regionalPrices = (normTargetCity !== normMerida)
            ? prices?.filter(p => normalizeCity(p.ciudad || '') === normTargetCity) || []
            : [];

        const refinedData = masterSols.map(prod => {
            // Priority 1: Regional Price
            // Priority 2: Mérida Price
            // Priority 3: Zero
            const regionalPrice = regionalPrices.find(p => p.producto_id === prod.id || p.internal_id === prod.internal_id);
            const meridaPrice = meridaPrices.find(p => p.producto_id === prod.id || p.internal_id === prod.internal_id);

            const activePrice = regionalPrice || meridaPrice;

            return {
                ...prod,
                precio_contado_m2: activePrice?.precio_contado_m2 || 0,
                precio_msi_m2: activePrice?.precio_msi_m2 || 0,
                ciudad: activePrice?.ciudad || 'Mérida',
                id: activePrice?.id || prod.id // Use pricing ID for technical reasons if needed, or keep master ID
            };
        });

        return { success: true, data: refinedData as Solution[] };
    } catch (error) {
        console.error('Unexpected error in getAllSolutions:', error);
        return { success: false, data: [] };
    }
}
