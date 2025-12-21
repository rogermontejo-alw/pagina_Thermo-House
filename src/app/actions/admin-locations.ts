'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from './admin-auth';

export async function getLocations() {
    try {
        const { data, error } = await supabaseAdmin
            .from('ubicaciones')
            .select('*')
            .order('estado', { ascending: true })
            .order('ciudad', { ascending: true });

        if (error) {
            // If table doesn't exist yet, return empty or default for now
            if (error.code === '42P01') return { success: true, data: [] };
            throw error;
        }
        return { success: true, data };
    } catch (err: any) {
        return { success: false, message: 'Error al cargar las ubicaciones.' };
    }
}

export async function createLocation(locationData: { ciudad: string, estado: string }) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos para modificar ubicaciones.' };
        }

        const { error } = await supabaseAdmin
            .from('ubicaciones')
            .insert(locationData);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message || 'Error al crear ubicación.' };
    }
}

export async function deleteLocation(id: string) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos para eliminar ubicaciones.' };
        }

        const { error } = await supabaseAdmin
            .from('ubicaciones')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message };
    }
}
