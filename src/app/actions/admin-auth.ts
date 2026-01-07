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
            if (error.code === 'PGRST116') return { success: false, message: 'Credenciales inválidas.' };
            return { success: false, message: `Error DB: ${error.message}` };
        }

        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const minutesLeft = Math.ceil((new Date(user.locked_until).getTime() - new Date().getTime()) / 60000);
            return { success: false, message: `Cuenta bloqueada temporalmente. Intente de nuevo en ${minutesLeft} minutos.` };
        }

        if (user.password !== password) {
            // Increment failed attempts
            const newAttempts = (user.failed_attempts || 0) + 1;
            const updateData: any = { failed_attempts: newAttempts };

            if (newAttempts >= 5) {
                const lockTime = new Date();
                lockTime.setMinutes(lockTime.getMinutes() + 15);
                updateData.locked_until = lockTime.toISOString();
            }

            // Update DB without exposing error details to user yet
            await supabaseAdmin
                .from('admin_users')
                .update(updateData)
                .eq('id', user.id); // Assuming 'id' exists, verified in table selects usually. If not, email.

            if (newAttempts >= 5) {
                return { success: false, message: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.' };
            }

            return { success: false, message: `Credenciales inválidas (Intento ${newAttempts} de 5).` };
        }

        // Reset failures on success
        if ((user.failed_attempts || 0) > 0 || user.locked_until) {
            await supabaseAdmin
                .from('admin_users')
                .update({ failed_attempts: 0, locked_until: null })
                .eq('id', user.id);
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
