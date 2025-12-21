'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function getQuotes(cityFilter?: string) {
    try {
        let query = supabaseAdmin
            .from('cotizaciones')
            .select(`
                *,
                soluciones_precios (
                    title,
                    internal_id
                )
            `);

        if (cityFilter && cityFilter !== 'Todas') {
            query = query.eq('ciudad', cityFilter);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching quotes:', error);
            return { success: false, message: error.message };
        }

        return { success: true, data };
    } catch (err) {
        console.error('Unexpected error fetching quotes:', err);
        return { success: false, message: 'Error interno del servidor.' };
    }
}

export async function updateQuote(id: string, updates: any) {
    try {
        const { error } = await supabaseAdmin
            .from('cotizaciones')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('Error updating quote:', err);
        return { success: false, message: 'Error al actualizar el registro.' };
    }
}
