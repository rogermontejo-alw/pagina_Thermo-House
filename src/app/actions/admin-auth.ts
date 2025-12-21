'use server';

import { cookies } from 'next/headers';

export async function loginAdmin(password: string) {
    const adminPasswordEnv = process.env.ADMIN_PASSWORD;

    if (!adminPasswordEnv) {
        console.error('ADMIN_PASSWORD no está configurada en las variables de entorno.');
        return { success: false, message: 'Error de configuración del servidor.' };
    }

    if (password === adminPasswordEnv) {
        const cookieStore = await cookies();

        // Establecer una cookie segura que expire en 24 horas
        cookieStore.set('admin_session', adminPasswordEnv, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 día
            path: '/',
        });

        return { success: true };
    }

    return { success: false, message: 'Contraseña incorrecta.' };
}

export async function logoutAdmin() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    return { success: true };
}
