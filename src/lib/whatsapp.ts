
export async function sendWhatsAppNotification(quote: any) {
    const { nombre_cliente, telefono, precio_total_contado, precio_total_msi, ciudad, solucion_seleccionada, metros_cuadrados } = quote;

    // Formatting currency
    const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    const pContado = fmt.format(precio_total_contado);
    const pMSI = fmt.format(precio_total_msi);

    const message = `
Hola *${nombre_cliente}*, gracias por cotizar con *Thermo House*. 🏠

Aquí tienes los detalles de tu presupuesto para ${ciudad}:

📏 Area: ${metros_cuadrados}m²
🛡️ Solución: ${solucion_seleccionada}

💰 *Precio de Contado:* ${pContado}
💳 *12 MSI de:* ${pMSI}

Si deseas agendar una visita técnica, responde a este mensaje.
    `.trim();

    console.log(`[MOCK] Sending WhatsApp to ${telefono}: ${message}`);

    // IMPLEMENTATION FOR META WHATSAPP API
    // Requires: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID in env
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
        console.warn("WhatsApp credentials not found. Message mocked.");
        return;
    }

    try {
        const res = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: telefono,
                type: 'text',
                text: { body: message }
            })
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("WhatsApp API Error:", err);
        }
    } catch (error) {
        console.error("Failed to send WhatsApp:", error);
    }
}
