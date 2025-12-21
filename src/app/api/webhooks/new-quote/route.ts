
import { NextResponse } from 'next/server';
import { sendWhatsAppNotification } from '@/lib/whatsapp';

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        // Log payload for debugging
        console.log("Webhook received:", payload);

        // Supabase Database Webhook structure:
        // payload.type = 'INSERT' | 'UPDATE' | 'DELETE'
        // payload.table = 'cotizaciones'
        // payload.record = { ...column values... }

        if (payload.type === 'INSERT' && payload.table === 'cotizaciones') {
            const quote = payload.record;
            await sendWhatsAppNotification(quote);
            return NextResponse.json({ success: true, message: 'Notification sent' });
        }

        return NextResponse.json({ success: true, message: 'Ignored (not an INSERT on cotizaciones)' });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: 'Error processing webhook' }, { status: 400 });
    }
}
