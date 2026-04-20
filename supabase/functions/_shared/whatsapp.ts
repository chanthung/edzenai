// Shared WhatsApp delivery helper for all edge functions.
// Standardizes phone normalization, retries, timeouts, and error classification.

export function normalizeIndianPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  const local = normalizeIndianPhone(raw);
  if (!local || local.length !== 10) return null;
  return `91${local}`;
}

export function getWhatsAppApiKey(): string | null {
  return Deno.env.get('WA_API_KEY') || Deno.env.get('WHATSAPP_API_KEY') || null;
}

export type WhatsAppFailureKind = 'invalid_number' | 'transient' | 'config_error';

export interface WhatsAppResult {
  ok: boolean;
  failureKind?: WhatsAppFailureKind;
  providerMessage?: string;
  attempts: number;
}

const INVALID_NUMBER_PATTERNS = [
  /not\s*registered/i,
  /not\s*on\s*whatsapp/i,
  /invalid\s*(phone|number|recipient|wa)/i,
  /no\s*whatsapp\s*account/i,
  /number\s*does\s*not\s*exist/i,
  /unregistered/i,
];

function classifyProviderError(msg: string): WhatsAppFailureKind {
  if (!msg) return 'transient';
  for (const re of INVALID_NUMBER_PATTERNS) {
    if (re.test(msg)) return 'invalid_number';
  }
  return 'transient';
}

export interface SendWhatsAppOptions {
  toRaw: string;
  message: string;
  footer?: string;
  sender?: string;
  maxAttempts?: number;
  timeoutMs?: number;
}

export async function sendWhatsApp(opts: SendWhatsAppOptions): Promise<WhatsAppResult> {
  const apiKey = getWhatsAppApiKey();
  if (!apiKey) {
    console.error('[whatsapp] No API key (WA_API_KEY / WHATSAPP_API_KEY) configured');
    return { ok: false, failureKind: 'config_error', providerMessage: 'WhatsApp service not configured', attempts: 0 };
  }

  const number = toWhatsAppNumber(opts.toRaw);
  if (!number) {
    return { ok: false, failureKind: 'invalid_number', providerMessage: 'Invalid phone format', attempts: 0 };
  }

  const payload = {
    api_key: apiKey,
    sender: opts.sender ?? '919366084335',
    number,
    message: opts.message,
    footer: opts.footer ?? '',
  };

  const maxAttempts = opts.maxAttempts ?? 3;
  const timeoutMs = opts.timeoutMs ?? 12000;
  let lastProviderMsg = '';
  let lastKind: WhatsAppFailureKind = 'transient';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch('https://wp.mayaviinfotech.in/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      let body: any = null;
      try { body = await res.json(); } catch { body = null; }

      if (res.ok && body?.status) {
        return { ok: true, attempts: attempt };
      }

      lastProviderMsg = body?.msg || body?.message || `HTTP ${res.status}`;
      lastKind = classifyProviderError(lastProviderMsg);
      console.warn(`[whatsapp] attempt ${attempt}/${maxAttempts} failed:`, res.status, lastProviderMsg);

      // If provider clearly says number is invalid, no point retrying
      if (lastKind === 'invalid_number') {
        return { ok: false, failureKind: 'invalid_number', providerMessage: lastProviderMsg, attempts: attempt };
      }
    } catch (err) {
      clearTimeout(timer);
      lastProviderMsg = err instanceof Error ? err.message : String(err);
      lastKind = 'transient';
      console.warn(`[whatsapp] attempt ${attempt}/${maxAttempts} network error:`, lastProviderMsg);
    }

    if (attempt < maxAttempts) {
      const backoff = 800 * Math.pow(2, attempt - 1); // 800ms, 1600ms, ...
      await new Promise(r => setTimeout(r, backoff));
    }
  }

  return { ok: false, failureKind: lastKind, providerMessage: lastProviderMsg, attempts: maxAttempts };
}
