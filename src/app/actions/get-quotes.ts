'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from './admin-auth';

export async function getQuotes(cityFilter?: string) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, message: 'No session' };

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
                        ),
                        assigned_user:admin_users!assigned_to (
                            id,
                            name,
                            apellido
                        )
                    `);

        // Access Logic:
        // Admin & Manager see EVERYTHING (Global)
        // Editor sees: Leads assigned to them OR Leads in their city NOT assigned to anyone
        if (session.role === 'editor') {
            query = query.or(`assigned_to.eq.${session.id},and(assigned_to.is.null,ciudad.eq.${session.ciudad})`);
        } else if (session.role === 'manager') {
            // Manager sees: All leads in their assigned city (or ALL if 'Todas')
            if (session.ciudad && session.ciudad !== 'Todas') {
                query = query.eq('ciudad', session.ciudad);
            }
        } else if (session.role !== 'admin') {
            return { success: false, message: 'Rol no admitido' };
        }

        // Apply city filter if provided (Admins/Managers only, or specific search)
        // For editors, we skip this strict filter here because their .or() condition 
        // already manages their city-based access + assigned leads across cities.
        if (cityFilter && cityFilter !== 'Todas' && session.role !== 'editor') {
            query = query.eq('ciudad', cityFilter);
        }

        const { data, error } = await query
            .order('ciudad', { ascending: true })
            .order('created_at', { ascending: true });

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

export async function getQuote(id: string) {
    try {
        const { data, error } = await supabaseAdmin
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
                ),
                assigned_user:admin_users!assigned_to (
                    id,
                    name,
                    apellido
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        console.error('Error fetching single quote:', err);
        return { success: false, message: err.message || 'Error al obtener la cotización.' };
    }
}

export async function createQuote(data: any) {
    try {
        const session = await getAdminSession();
        if (!session) return { success: false, message: 'Sesión no válida.' };

        const { error } = await supabaseAdmin
            .from('cotizaciones')
            .insert({
                ...data,
                created_by: session.id,
                created_at: new Date().toISOString()
            });

        if (error) throw error;
        return { success: true };
    } catch (err) {
        console.error('Error creating manual quote:', err);
        return { success: false, message: 'Error al crear el lead manual.' };
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

            if (currentQuote.status === 'Cerrado') {
                // Allow specific safe fields even if closed (Logistics adjustment, Internal Notes, Assignments)
                const allowedKeys = ['costo_logistico', 'notas', 'assigned_to', 'assigned_user'];
                const attemptToEditRestricted = Object.keys(updates).some(key => !allowedKeys.includes(key) && (updates as any)[key] !== (currentQuote as any)[key]);

                if (attemptToEditRestricted && !updates.assigned_to) {
                    return { success: false, message: 'Esta cotización está cerrada para cambios comerciales mayores. Contacte a administración.' };
                }
            }
        } else if (session.role === 'manager') {
            // Manager verification: Can only edit if in their city (or Global)
            if (session.ciudad && session.ciudad !== 'Todas') {
                const { data: currentQuote } = await supabaseAdmin.from('cotizaciones').select('ciudad').eq('id', id).single();
                if (!currentQuote || currentQuote.ciudad !== session.ciudad) {
                    return { success: false, message: 'No tienes permisos para editar leads de otra plaza.' };
                }
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
export async function purgeQuotes(password: string) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos de administrador para purgar la base de datos.' };
        }

        // Verify purge password
        const { data: config, error: configError } = await supabaseAdmin
            .from('app_config')
            .select('value')
            .eq('key', 'PURGE_PASSWORD')
            .single();

        const validPassword = configError ? 'TH-ADMIN-PURGE' : config.value;

        if (password !== validPassword) {
            return { success: false, message: 'Contraseña de depuración incorrecta.' };
        }

        const { error } = await supabaseAdmin
            .from('cotizaciones')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (error) throw error;
        return { success: true, message: 'Base de datos de leads limpiada correctamente.' };
    } catch (err: any) {
        console.error('Error purging quotes:', err);
        return { success: false, message: err.message || 'Error al limpiar la base de datos.' };
    }
}
