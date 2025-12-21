'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

export async function getAdminUsers() {
    try {
        const { data, error } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        return { success: false, message: 'Error al cargar usuarios.' };
    }
}

export async function createAdminUser(payload: { email: string; password: string; name: string; role: 'admin' | 'editor' }) {
    try {
        const { error } = await supabaseAdmin
            .from('admin_users')
            .insert(payload);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message || 'Error al crear usuario.' };
    }
}

export async function deleteAdminUser(id: string) {
    try {
        // Prevent deleting the last admin if we wanted to (omitted for simplicity now)
        const { error } = await supabaseAdmin
            .from('admin_users')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err) {
        return { success: false, message: 'Error al eliminar usuario.' };
    }
}
