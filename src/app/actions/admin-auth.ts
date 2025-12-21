'use server';

import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function loginAdmin(email: string, password: string) {
    try {
        const { data: user, error } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .eq('password', password) // En producción usar hashing
            .single();

        if (error || !user) {
            return { success: false, message: 'Credenciales inválidas.' };
        }

        const cookieStore = await cookies();

        // El token ahora es el email para identificar al usuario
        cookieStore.set('admin_session', user.email, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 día
            path: '/',
        });

        return { success: true };
    } catch (err) {
        return { success: false, message: 'Error de servidor.' };
    }
}

export async function logoutAdmin() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    return { success: true };
}
