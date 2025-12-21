'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from './admin-auth';

export async function getQuotes(cityFilter?: string) {
    try {
        let query = supabaseAdmin
            .from('cotizaciones')
            .select(`
                *,
                soluciones_precios (
                    title,
                    internal_id
                ),
                advisor:admin_users!created_by (
                    name,
                    apellido,
                    telefono,
                    email,
                    contacto_email
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
        const session = await getAdminSession();
        if (!session) return { success: false, message: 'Sesión no válida.' };

        // If editor, check if quote is still in 'Nuevo' status to allow initial edits
        if (session.role === 'editor') {
            const { data: currentQuote, error: fetchError } = await supabaseAdmin
                .from('cotizaciones')
                .select('status')
                .eq('id', id)
                .single();

            if (fetchError || !currentQuote) {
                return { success: false, message: 'No se pudo verificar el estado de la cotización.' };
            }

            if (currentQuote.status !== 'Nuevo') {
                return { success: false, message: 'Esta cotización ya fue procesada y no puede ser modificada por un asesor. Contacte a administración.' };
            }
        } else if (session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos para realizar esta acción.' };
        }

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
