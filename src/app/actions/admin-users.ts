'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from './admin-auth';
import { cookies } from 'next/headers';

export async function getAdminUsers() {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos.' };
        }

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

export async function createAdminUser(payload: { email: string; password: string; name: string; role: 'admin' | 'editor', ciudad?: string }) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos para crear usuarios.' };
        }

        const { error } = await supabaseAdmin
            .from('admin_users')
            .insert({
                ...payload,
                ciudad: payload.ciudad || (payload.role === 'admin' ? 'Todas' : 'General')
            });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message || 'Error al crear usuario.' };
    }
}

export async function resetAdminPassword(id: string, newPassword: string) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos para resetear contraseñas.' };
        }

        const { error } = await supabaseAdmin
            .from('admin_users')
            .update({ password: newPassword })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, message: 'Error al resetear contraseña.' };
    }
}

export async function deleteAdminUser(id: string) {
    try {
        const session = await getAdminSession();
        if (!session || session.role !== 'admin') {
            return { success: false, message: 'No tienes permisos para eliminar usuarios.' };
        }

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
