'use server';

import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function loginAdmin(email: string, password: string) {
    try {
        console.log('Intento de login para:', email);

        if (!supabaseAdmin) {
            return { success: false, message: 'Supabase no inicializado.' };
        }

        const { data: user, error } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('email', email.trim())
            .single();

        if (error) {
            console.error('Error de consulta Supabase:', error);
            if (error.code === 'PGRST116') return { success: false, message: 'Usuario no encontrado.' };
            return { success: false, message: `Error DB: ${error.message}` };
        }

        if (!user || user.password !== password) {
            return { success: false, message: 'Contraseña incorrecta.' };
        }

        const cookieStore = await cookies();

        cookieStore.set('admin_session', user.email, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 día
            path: '/',
        });

        console.log('Login exitoso para:', email);
        return { success: true };
    } catch (err: any) {
        console.error('Error crítico en loginAdmin:', err);
        return { success: false, message: `Error crítico: ${err.message || 'Desconocido'}` };
    }
}

export async function logoutAdmin() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    return { success: true };
}

export async function getAdminSession() {
    try {
        const cookieStore = await cookies();
        const email = cookieStore.get('admin_session')?.value;

        if (!email) return null;

        const { data: user, error } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) return null;
        return user;
    } catch (err) {
        return null;
    }
}
