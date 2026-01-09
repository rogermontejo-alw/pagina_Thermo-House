'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from './admin-auth';
import { cookies } from 'next/headers';

export async function getAdminUsers() {
    try {
        const session = await getAdminSession();
        if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
            return { success: false, message: 'No tienes permisos.' };
        }

        let query = supabaseAdmin
            .from('admin_users')
            .select('*')
            .order('created_at', { ascending: false });

        if (session.role === 'manager') {
            // Manager sees: Editors in their city OR themselves
            if (session.ciudad && session.ciudad !== 'Todas') {
                // Logic: (role='editor' AND city=my_city) OR id=my_id
                query = query.or(`and(role.eq.editor,ciudad.eq.${session.ciudad}),id.eq.${session.id}`);
            } else {
                // Global Manager: Sees all Editors + Themselves (but not other managers/admins ideally, 
                // strictly per request "no editar gerencias", likely shouldn't see them to avoid confusion, 
                // or just read-only. Let's restrict to Editors + Self for safety).
                query = query.or(`role.eq.editor,id.eq.${session.id}`);
            }
        }

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data };
    } catch (err) {
        return { success: false, message: 'Error al cargar usuarios.' };
    }
}

export async function createAdminUser(payload: {
    email: string;
    password: string;
    name: string;
    apellido?: string;
    role: 'admin' | 'manager' | 'editor';
    ciudad?: string;
    base?: string;
    telefono?: string;
    contacto_email?: string;
}) {
    try {
        const session = await getAdminSession();
        if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
            return { success: false, message: 'No tienes permisos para crear usuarios.' };
        }

        // Strict Manager Restrictions
        if (session.role === 'manager') {
            if (payload.role !== 'editor') {
                return { success: false, message: 'Como Gerente, solo puedes crear cuentas de Asesor (Editor).' };
            }
            if (session.ciudad !== 'Todas' && payload.ciudad !== session.ciudad) {
                return { success: false, message: `Solo puedes crear usuarios para tu zona: ${session.ciudad}.` };
            }
        }

        // Verificar correo único
        const { data: existing } = await supabaseAdmin
            .from('admin_users')
            .select('id')
            .eq('email', payload.email.trim())
            .single();

        if (session.role === 'manager' && payload.role === 'admin') {
            return { success: false, message: 'No tienes privilegios para crear administradores.' };
        }

        if (existing) return { success: false, message: 'Este correo ya está registrado.' };

        const { error } = await supabaseAdmin
            .from('admin_users')
            .insert({
                ...payload,
                ciudad: payload.ciudad || ((payload.role === 'admin' || payload.role === 'manager') ? 'Todas' : 'General')
            });

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message || 'Error al crear usuario.' };
    }
}

export async function updateAdminUser(id: string, payload: Partial<{
    name: string;
    apellido: string;
    role: 'admin' | 'manager' | 'editor';
    ciudad: string;
    base: string;
    telefono: string;
    contacto_email: string;
    email: string;
    password?: string;
}>) {
    try {
        const session = await getAdminSession();
        if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
            return { success: false, message: 'No tienes permisos para modificar usuarios.' };
        }

        if (session.role === 'manager') {
            // Prevent promoting to admin
            if (payload.role === 'admin') {
                return { success: false, message: 'No puedes asignar el rol de administrador.' };
            }
            // Prevent editing an admin
            const { data: target } = await supabaseAdmin.from('admin_users').select('role').eq('id', id).single();
            if (target?.role === 'admin') {
                return { success: false, message: 'No puedes modificar a un administrador.' };
            }
        }

        if (session.role === 'manager') {
            // Check target user first
            const { data: target } = await supabaseAdmin.from('admin_users').select('role, ciudad').eq('id', id).single();

            if (!target) return { success: false, message: 'Usuario no encontrado.' };

            // Allow modifying SELF (limited? usually profile updates are ok) OR Advisors in zone
            const isSelf = session.id === id;
            const isTargetAdvisor = target.role === 'editor';
            const isTargetInZone = session.ciudad === 'Todas' || target.ciudad === session.ciudad;

            if (!isSelf) {
                if (!isTargetAdvisor) {
                    return { success: false, message: 'Solo puedes modificar perfiles de Asesores.' };
                }
                if (!isTargetInZone) {
                    return { success: false, message: 'No puedes modificar usuarios fuera de tu zona.' };
                }
            }

            // Prevent Manager from escalating privileges or changing restricted fields
            if (payload.role && payload.role !== 'editor' && !isSelf) { // If editing other, must remain editor
                return { success: false, message: 'No puedes asignar otros roles.' };
            }
            if (payload.role && isSelf && payload.role !== 'manager') { // Cannot change own role
                return { success: false, message: 'No puedes cambiar tu propio rol.' };
            }
        }

        // Verificar correo único si se está cambiando
        if (payload.email) {
            const { data: existing } = await supabaseAdmin
                .from('admin_users')
                .select('id')
                .eq('email', payload.email.trim())
                .neq('id', id)
                .single();
            if (existing) return { success: false, message: 'Este correo ya está registrado por otro usuario.' };
        }

        const { error } = await supabaseAdmin
            .from('admin_users')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (err: any) {
        return { success: false, message: err.message || 'Error al actualizar usuario.' };
    }
}

export async function resetAdminPassword(id: string, newPassword: string) {
    try {
        const session = await getAdminSession();
        if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
            return { success: false, message: 'No tienes permisos para resetear contraseñas.' };
        }

        if (session.role === 'manager') {
            const { data: target } = await supabaseAdmin.from('admin_users').select('role').eq('id', id).single();
            if (target?.role === 'admin') {
                return { success: false, message: 'No puedes cambiar la contraseña de un administrador.' };
            }
        }

        if (session.role === 'manager') {
            const { data: target } = await supabaseAdmin.from('admin_users').select('role, ciudad').eq('id', id).single();

            if (!target) return { success: false, message: 'Usuario no encontrado.' };

            const isSelf = session.id === id;
            const isTargetAdvisor = target.role === 'editor';
            const isTargetInZone = session.ciudad === 'Todas' || target.ciudad === session.ciudad;

            if (!isSelf && (!isTargetAdvisor || !isTargetInZone)) {
                return { success: false, message: 'No puedes restablecer la contraseña de este usuario.' };
            }
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
        if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
            return { success: false, message: 'No tienes permisos para eliminar usuarios.' };
        }

        if (session.role === 'manager') {
            const { data: target, error: targetError } = await supabaseAdmin.from('admin_users').select('role, ciudad').eq('id', id).single();

            if (targetError || !target) {
                return { success: false, message: 'Usuario no encontrado o error al verificar permisos.' };
            }

            if (target.role === 'admin') {
                return { success: false, message: 'No puedes eliminar a un administrador.' };
            }

            if (target.role !== 'editor') {
                return { success: false, message: 'Solo puedes eliminar cuentas de Asesor.' };
            }
            if (session.ciudad !== 'Todas' && target.ciudad !== session.ciudad) {
                return { success: false, message: 'No puedes eliminar usuarios de otra zona.' };
            }
        }

        const { error } = await supabaseAdmin
            .from('admin_users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting user:', error);
            if (error.code === '23503') {
                return { success: false, message: 'No se puede eliminar el usuario porque tiene registros asociados (leads, historial, etc). Desactívalo en su lugar.' };
            }
            throw error;
        }
        return { success: true };
    } catch (err: any) {
        console.error('Delete user exception:', err);
        return { success: false, message: err.message || 'Error al eliminar usuario.' };
    }
}
