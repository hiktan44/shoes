// E-posta gönderimi — Resend HTTP API (SDK yok). RESEND_API_KEY yoksa sessiz no-op.
const RESEND_URL = 'https://api.resend.com/emails';

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Fasheone Shoes <noreply@fasheone.com>';
  if (!key || !opts.to) return false;
  try {
    const r = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// Ortak şablon sarmalayıcı (basit, marka uyumlu)
function wrap(title: string, body: string): string {
  return `<div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#18181b">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">
      <div style="width:32px;height:32px;border-radius:8px;background:#18181b;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800">F</div>
      <strong style="font-size:18px">Fasheone <span style="color:#a1a1aa;font-weight:500">Shoes</span></strong>
    </div>
    <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
    ${body}
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0" />
    <p style="font-size:12px;color:#a1a1aa">Bu e-posta Fasheone Shoes tarafından gönderildi · <a href="https://shoes.fasheone.com" style="color:#6366f1">shoes.fasheone.com</a></p>
  </div>`;
}

export async function sendPurchaseReceipt(opts: {
  to: string; credits: number; amount: number; balance?: number;
}): Promise<boolean> {
  const html = wrap('Ödemeniz alındı 🎉', `
    <p style="font-size:14px;line-height:1.6">Merhaba,</p>
    <p style="font-size:14px;line-height:1.6">Kredi satın alımınız başarıyla tamamlandı. Krediler hesabınıza tanımlandı.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      <tr><td style="padding:8px 0;color:#71717a">Yüklenen kredi</td><td style="padding:8px 0;text-align:right;font-weight:600">${opts.credits} kredi</td></tr>
      <tr><td style="padding:8px 0;color:#71717a">Ödenen tutar</td><td style="padding:8px 0;text-align:right;font-weight:600">${opts.amount.toLocaleString('tr-TR')} ₺</td></tr>
      ${typeof opts.balance === 'number' ? `<tr><td style="padding:8px 0;color:#71717a">Güncel bakiye</td><td style="padding:8px 0;text-align:right;font-weight:600">${opts.balance} kredi</td></tr>` : ''}
    </table>
    <a href="https://shoes.fasheone.com/studio" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px">Stüdyoya git →</a>
  `);
  return sendEmail({ to: opts.to, subject: 'Fasheone Shoes — Ödemeniz alındı', html });
}
