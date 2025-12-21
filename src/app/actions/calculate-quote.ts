'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { Solution } from '@/types';

export async function calculateQuote(area: number, solutionId: string, city?: string) {
    try {
        const lookupCity = city || 'Mérida';
        if (!area || area <= 0) throw new Error('Invalid area');
        if (!solutionId) throw new Error('Invalid solution ID');

        // Fetch all solution prices for the city (or fallback) to find current and upsell
        let { data: allSolutions, error } = await supabaseAdmin
            .from('soluciones_precios')
            .select('*')
            .eq('ciudad', lookupCity)
            .order('orden', { ascending: true });

        // Fallback to Merida if specific city price not found
        if ((error || !allSolutions || allSolutions.length === 0) && lookupCity !== 'Mérida') {
            const fallback = await supabaseAdmin
                .from('soluciones_precios')
                .select('*')
                .eq('ciudad', 'Mérida')
                .order('orden', { ascending: true });

            if (fallback.data) {
                allSolutions = fallback.data;
            }
        }

        if (!allSolutions || allSolutions.length === 0) {
            throw new Error('Pricing unavailable');
        }

        const currentSol = allSolutions.find(s => s.internal_id === solutionId);
        if (!currentSol) throw new Error('Solution not found');

        // Calculate current price
        const MIN_PRICE = 5900;
        const totalCash = Math.max(Math.round(area * Number(currentSol.precio_contado_m2)), MIN_PRICE);
        const totalMsi = Math.max(Math.round(area * Number(currentSol.precio_msi_m2)), MIN_PRICE);

        // Find Upsell: Next solution in same category (or 'both') with higher order
        const currentCategory = currentSol.category;
        const upsellSol = allSolutions.find(s =>
            s.orden > currentSol.orden &&
            (s.category === currentCategory || s.category === 'both')
        );

        let upsellData = null;
        if (upsellSol) {
            const upCash = Math.max(Math.round(area * Number(upsellSol.precio_contado_m2)), MIN_PRICE);
            const upMsi = Math.max(Math.round(area * Number(upsellSol.precio_msi_m2)), MIN_PRICE);
            upsellData = {
                totalCash: upCash,
                totalMsi: upMsi,
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
        return { success: false, error: 'Failed to calculate price' };
    }
}
