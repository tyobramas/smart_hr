export interface SendWhatsAppParams {
  to: string;
  message: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export type WhatsAppTransportResult = SendWhatsAppResult;

/**
 * Normalisasi format nomor telepon ke standar internasional WhatsApp (E.164 tanpa +).
 * Contoh: 081234567890 atau +6281234567890 -> 6281234567890
 */
export function normalizePhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Transport pengiriman WhatsApp melalui proses lokal/remote Hermes Gateway.
 */
export async function sendWhatsAppViaHermes(
  params: SendWhatsAppParams
): Promise<SendWhatsAppResult> {
  const isEnabled = process.env.WHATSAPP_ENABLED === 'true';
  const isDryRun = process.env.COMMUNICATION_DRY_RUN === 'true';

  const normalizedPhone = normalizePhoneNumber(params.to);

  if (!isEnabled || isDryRun) {
    console.log(`[WhatsAppTransport:DRY_RUN] Simulasi kirim pesan ke: ${normalizedPhone}`);
    console.log(`[WhatsAppTransport:DRY_RUN] Pesan:\n${params.message}`);
    return {
      success: true,
      messageId: `dry_run_wa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
  }

  const gatewayUrl = (process.env.HERMES_GATEWAY_URL || 'http://localhost:3000').replace(/\/$/, '');
  const gatewaySecret = process.env.HERMES_GATEWAY_SECRET || '';

  const chatId = normalizedPhone.includes('@')
    ? normalizedPhone
    : `${normalizedPhone}@s.whatsapp.net`;

  console.log(`[WhatsApp:Dispatch] URL: ${gatewayUrl}/send | To: ${chatId}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${gatewayUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(gatewaySecret ? { Authorization: `Bearer ${gatewaySecret}` } : {}),
      },
      body: JSON.stringify({
        chatId,
        message: params.message,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WhatsApp:Response] Status: ${response.status} | Error: ${errorText || response.statusText}`);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText || response.statusText}`,
      };
    }

    const data = (await response.json().catch(() => ({}))) as {
      messageId?: string;
      id?: string;
      key?: { id?: string };
    };
    const messageId = data.messageId || data.id || data.key?.id || `hermes_wa_${Date.now()}`;
    console.log(`[WhatsApp:Response] Status: ${response.status} | ProviderId: ${messageId}`);

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[WhatsApp:Response] Status: Error | Error: ${message}`);
    return {
      success: false,
      error: `Gagal menghubungi Hermes Gateway di ${gatewayUrl}: ${message}`,
    };
  }
}
