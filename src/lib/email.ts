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

export async function sendWelcome(to: string): Promise<boolean> {
  const html = wrap('Fasheone Shoes\'a hoş geldin 👟', `
    <p style="font-size:14px;line-height:1.6">Merhaba,</p>
    <p style="font-size:14px;line-height:1.6">Aramıza katıldığın için teşekkürler! Hesabına <strong>10 ücretsiz kredi</strong> tanımlandı — hemen üretmeye başlayabilirsin.</p>
    <ul style="font-size:14px;line-height:1.8;color:#3f3f46;padding-left:18px">
      <li>📸 Telefon fotoğrafını <strong>stüdyo görseline</strong> çevir</li>
      <li>🎨 Çizim + taban + materyalden <strong>sıfır tasarım</strong> üret</li>
      <li>🚶 Aynı modelle <strong>çoklu poz</strong> ve albüm oluştur</li>
      <li>🪄 <strong>Rötuş</strong> ile bölgesel düzenleme yap</li>
      <li>🧾 <strong>E-ticaret metni</strong> + SEO çıkar</li>
    </ul>
    <a href="https://shoes.fasheone.com/studio" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px;margin-top:8px">İlk görselini üret →</a>
  `);
  return sendEmail({ to, subject: 'Fasheone Shoes\'a hoş geldin — 10 ücretsiz kredin hazır', html });
}

export async function sendDailySummary(to: string, d: {
  date: string; newUsers: number; revenueToday: number; ordersToday: number;
  generationsToday: number; totalUsers: number; totalRevenue: number; totalCredits: number;
}): Promise<boolean> {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;color:#71717a;font-size:14px">${label}</td><td style="padding:8px 0;text-align:right;font-weight:600;font-size:14px">${value}</td></tr>`;
  const html = wrap(`Günlük Özet · ${d.date}`, `
    <p style="font-size:14px;color:#71717a;margin-bottom:8px">Bugünkü hareketler</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      ${row('Yeni kullanıcı', String(d.newUsers))}
      ${row('Gelir (bugün)', `${d.revenueToday.toLocaleString('tr-TR')} ₺`)}
      ${row('Sipariş (bugün)', String(d.ordersToday))}
      ${row('Üretim (bugün)', String(d.generationsToday))}
    </table>
    <p style="font-size:14px;color:#71717a;margin-bottom:8px">Genel toplam</p>
    <table style="width:100%;border-collapse:collapse">
      ${row('Toplam kullanıcı', String(d.totalUsers))}
      ${row('Toplam gelir', `${d.totalRevenue.toLocaleString('tr-TR')} ₺`)}
      ${row('Dağıtılan kredi (bakiye)', String(d.totalCredits))}
    </table>
    <a href="https://shoes.fasheone.com/admin" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px;margin-top:16px">Admin paneli →</a>
  `);
  return sendEmail({ to, subject: `Fasheone Shoes — Günlük Özet ${d.date}`, html });
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
