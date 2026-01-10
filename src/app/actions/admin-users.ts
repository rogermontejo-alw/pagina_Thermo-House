'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAdminSession } from './admin-auth';
import { cookies } from 'next/headers';

export async function getAdminUsers() {
    try {
        const session = await getAdminSession();
        if (!session || (session.role !== 'admin' && session.role !== 'manager' && session.role !== 'direccion')) {
            return { success: false, message: 'No tienes permisos.' };
        }

        let query = supabaseAdmin
            .from('admin_users')
            .select('*')
            .order('created_at', { ascending: false });

        if (session.role === 'manager') {
            // Manager sees: Everyone EXCEPT admin (visualize full hierarchy)
            query = query.neq('role', 'admin');
        } else if (session.role === 'direccion') {
            // Director sees: Everyone EXCEPT admin (and implicitly themselves)
            query = query.neq('role', 'admin');
        } else if (session.role === 'admin') {
            // Admin sees everyone
        } else {
            // Editors or others shouldn't be calling this, but safe fallback
            return { success: false, message: 'No tienes permisos.' };
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
    role: 'admin' | 'direccion' | 'manager' | 'editor';
    ciudad?: string;
    base?: string;
    telefono?: string;
    contacto_email?: string;
}) {
    try {
        const session = await getAdminSession();
        if (!session || (session.role !== 'admin' && session.role !== 'manager' && session.role !== 'direccion')) {
            return { success: false, message: 'No tienes permisos para crear usuarios.' };
        }

        // Strict Role Restrictions
        if (session.role === 'manager') {
            if (payload.role !== 'editor') {
                return { success: false, message: 'Como Gerente, solo puedes crear cuentas de Asesor (Editor).' };
            }
            if (session.ciudad !== 'Todas' && payload.ciudad !== session.ciudad) {
                return { success: false, message: `Solo puedes crear usuarios para tu zona: ${session.ciudad}.` };
            }
        }

        if (session.role === 'direccion') {
            if (payload.role !== 'manager' && payload.role !== 'editor') {
                return { success: false, message: 'Como Dirección, solo puedes crear cuentas de Gerente o Asesor.' };
            }
        }

        if (payload.role === 'direccion' && session.role !== 'admin') {
            return { success: false, message: 'Solo un Administrador puede crear cuentas de Dirección.' };
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
    role: 'admin' | 'direccion' | 'manager' | 'editor';
    ciudad: string;
    base: string;
    telefono: string;
    contacto_email: string;
    email: string;
    password?: string;
}>) {
    try {
        const session = await getAdminSession();
        if (!session || (session.role !== 'admin' && session.role !== 'manager' && session.role !== 'direccion')) {
            return { success: false, message: 'No tienes permisos para modificar usuarios.' };
        }

        // Fetch target user to verify permissions
        const { data: target } = await supabaseAdmin.from('admin_users').select('role, ciudad').eq('id', id).single();
        if (!target) return { success: false, message: 'Usuario no encontrado.' };

        const isSelf = session.id === id;

        // --- Permission Logic ---

        // 1. Admin Protection: Only Admin can touch Admin
        if (target.role === 'admin' && session.role !== 'admin') {
            return { success: false, message: 'No puedes modificar a un administrador.' };
        }

        // 2. Same Rank Restriction (Strict Hierarchy)
        // Peers cannot modify peers (except themselves)
        if (session.role !== 'admin' && session.role === target.role && !isSelf) {
            return { success: false, message: 'No puedes modificar a un usuario de tu mismo rango.' };
        }

        // 3. Manager/Director Specific Restrictions
        if (session.role === 'manager' || session.role === 'direccion') {
            // Can only create/promote up to their own level (handled in create) or below.
            // But actually, Managers can only manage Editors. Directors can manage Managers & Editors.

            // Prevent assigning roles higher or equal to self (unless self)
            // Actually, Manager can only assign 'editor'. Director can assign 'manager', 'editor'.
            if (payload.role) {
                if (session.role === 'manager' && payload.role !== 'editor' && !isSelf) {
                    return { success: false, message: 'Solo puedes asignar el rol de Asesor.' };
                }
                if (session.role === 'direccion' && (payload.role === 'admin' || payload.role === 'direccion') && !isSelf) {
                    return { success: false, message: 'No tienes permisos para asignar ese rol.' };
                }
            }
        }

        if (session.role === 'manager') {
            // Zone restriction
            const isTargetInZone = session.ciudad === 'Todas' || target.ciudad === session.ciudad;
            if (!isSelf) {
                if (target.role !== 'editor') {
                    // Managers can strictly only touch Editors (and checked above Admin/SameRank protection)
                    return { success: false, message: 'Solo puedes modificar cuentas de Asesor.' };
                }
                if (!isTargetInZone) {
                    return { success: false, message: 'No puedes modificar usuarios fuera de tu zona.' };
                }
            }
        }

        // Director Restrictions
        if (session.role === 'direccion') {
            // Director has global access (no zone restriction), but checks on Admin/SameRank are already done.
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
        if (!session || (session.role !== 'admin' && session.role !== 'manager' && session.role !== 'direccion')) {
            return { success: false, message: 'No tienes permisos para resetear contraseñas.' };
        }

        // Fetch target
        const { data: target } = await supabaseAdmin.from('admin_users').select('role, ciudad').eq('id', id).single();
        if (!target) return { success: false, message: 'Usuario no encontrado.' };

        const isSelf = session.id === id;

        // 1. Admin Protection
        if (target.role === 'admin' && session.role !== 'admin') {
            return { success: false, message: 'No puedes cambiar la contraseña de un administrador.' };
        }

        // 2. Same Rank Restriction
        if (session.role !== 'admin' && session.role === target.role && !isSelf) {
            return { success: false, message: 'No puedes cambiar la contraseña de un usuario de tu mismo rango.' };
        }

        // 3. Manager Specifics
        if (session.role === 'manager' && !isSelf) {
            if (target.role !== 'editor') return { success: false, message: 'Solo puedes gestionar Asesores.' };
            if (session.ciudad !== 'Todas' && target.ciudad !== session.ciudad) {
                return { success: false, message: 'No puedes gestionar usuarios de otra zona.' };
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
        if (!session || (session.role !== 'admin' && session.role !== 'manager' && session.role !== 'direccion')) {
            return { success: false, message: 'No tienes permisos para eliminar usuarios.' };
        }

        // Fetch target
        const { data: target, error: targetError } = await supabaseAdmin.from('admin_users').select('role, ciudad').eq('id', id).single();

        if (targetError || !target) {
            return { success: false, message: 'Usuario no encontrado o error al verificar permisos.' };
        }

        // 1. Admin Protection
        if (target.role === 'admin') {
            return { success: false, message: 'No puedes eliminar a un administrador.' };
        }

        // 2. Same Rank Restriction
        if (session.role !== 'admin' && session.role === target.role) {
            return { success: false, message: 'No puedes eliminar a un usuario de tu mismo rango.' };
        }

        // 3. Manager/Director Logic
        if (session.role === 'manager') {
            if (target.role !== 'editor') return { success: false, message: 'Solo puedes eliminar cuentas de Asesor.' };
            if (session.ciudad !== 'Todas' && target.ciudad !== session.ciudad) {
                return { success: false, message: 'No puedes eliminar usuarios de otra zona.' };
            }
        }

        if (session.role === 'direccion') {
            if (target.role !== 'manager' && target.role !== 'editor') {
                return { success: false, message: 'Solo puedes eliminar cuentas de Gerente o Asesor.' };
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
