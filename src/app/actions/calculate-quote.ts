'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function calculateQuote(area: number, solutionId: string, city?: string) {
    try {
        const lookupCity = city || 'Mérida';
        if (!area || area <= 0) {
            throw new Error('Invalid area');
        }
        if (!solutionId) {
            throw new Error('Invalid solution ID');
        }

        // Fetch solution price details from DB
        // We try to match by internal_id (e.g., 'conc-1') first, as that's what the frontend likely uses currently.
        // If solutionId is a UUID, it might also work if we adjusted the query, but 'conc-1' is text.
        // The query `.or` handles both if we cast properly, but `internal_id` is text. `id` is uuid.
        // Mixing types in .or() can be tricky in Supabase unless we use filter logic carefully.
        // For safety, let's assume solutionId is the internal_id string for now as per `solutions.ts`.

        let { data: solution, error } = await supabaseAdmin
            .from('soluciones_precios')
            .select('precio_contado_m2, precio_msi_m2, ciudad')
            .eq('internal_id', solutionId)
            .eq('ciudad', lookupCity)
            .single();

        // Fallback to Merida if specific city price not found
        if ((error || !solution) && lookupCity !== 'Mérida') {
            const fallback = await supabaseAdmin
                .from('soluciones_precios')
                .select('precio_contado_m2, precio_msi_m2, ciudad')
                .eq('internal_id', solutionId)
                .eq('ciudad', 'Mérida')
                .single();

            if (fallback.data) {
                solution = fallback.data;
            }
        }

        if (!solution) {
            console.error('Error fetching solution or fallback:', error);
            throw new Error('Solution not found or pricing unavailable');
        }

        // Server-side calculation with 5900 MXN Minimum
        const rawCash = Math.round(area * Number(solution.precio_contado_m2));
        const rawMsi = Math.round(area * Number(solution.precio_msi_m2));

        const MIN_PRICE = 5900;
        const totalCash = Math.max(rawCash, MIN_PRICE);
        const totalMsi = Math.max(rawMsi, MIN_PRICE);

        return {
            success: true,
            data: {
                totalCash,
                totalMsi
            }
        };
    } catch (error) {
        console.error('Calculation error:', error);
        return {
            success: false,
            error: 'Failed to calculate price'
        };
    }
}
