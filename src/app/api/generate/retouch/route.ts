import { NextResponse } from 'next/server';
import axios from 'axios';
import { rateLimit } from '@/lib/rateLimit';
import { validateImageDataUrl } from '@/lib/validation';
import { ensureUrl } from '@/lib/kieUpload';
import { createClient } from '@/lib/supabase/server';
import { deductCredits, refundCredits } from '@/lib/credits';

export const maxDuration = 26;

const KIE_BASE = 'https://api.kie.ai';
const getKieKey = () => {
  const k = process.env.KIE_API_KEY;
  if (!k) throw new Error('KIE_API_KEY env değişkeni tanımlı değil');
  return k;
};

type Payload = {
  sourceUrl: string;
  maskUrl?: string;
  referenceUrl?: string;
  instruction?: string;
  region?: string;
  color?: string;
  aspectRatio?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });

    const limit = parseInt(process.env.RATE_LIMIT_PER_MIN || '10', 10);
    const rl = rateLimit(`gen:${user.id}`, limit, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Çok fazla istek. ${Math.ceil(rl.retryAfterMs / 1000)} saniye sonra tekrar deneyin.` },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const body = (await request.json()) as Payload;
    const { sourceUrl, maskUrl, referenceUrl, instruction, region, color, aspectRatio } = body;

    if (!sourceUrl) return NextResponse.json({ error: 'sourceUrl gerekli' }, { status: 400 });
    if (!instruction && !referenceUrl && !color && !maskUrl) {
      return NextResponse.json({ error: 'Talimat, renk, referans veya maske gerekli' }, { status: 400 });
    }

    const maxBytes = parseInt(process.env.MAX_UPLOAD_BYTES || '8388608', 10);
    for (const u of [sourceUrl, referenceUrl, maskUrl]) {
      if (u?.startsWith('data:image')) {
        const v = validateImageDataUrl(u, maxBytes);
        if (!v.ok) return NextResponse.json({ error: v.reason }, { status: 400 });
      }
    }

    const hostedSource = await ensureUrl(sourceUrl);
    const hostedRef = referenceUrl ? await ensureUrl(referenceUrl) : null;
    const hostedMask = maskUrl ? await ensureUrl(maskUrl) : null;
    if (!hostedSource) return NextResponse.json({ error: 'Kaynak görsel yüklenemedi' }, { status: 500 });

    const regionTxt = region ? ` in the ${region}` : '';
    const colorTxt = color ? ` Apply the color ${color} (CSS/hex value).` : '';
    const refTxt = hostedRef
      ? ' Use the reference image (material/color/texture) as the source of the new appearance — match it precisely.'
      : '';
    const maskTxt = hostedMask
      ? ' A binary MASK image is provided (white = edit region, black = keep unchanged). STRICTLY apply changes only inside the WHITE areas of the mask; outside the white mask the output must be pixel-identical to the source.'
      : '';
    const instr = instruction?.trim() ? `Targeted change: ${instruction.trim()}.` : 'Apply the requested change.';

    const prompt =
      `${instr}${regionTxt}.${colorTxt}${refTxt}${maskTxt} ` +
      'CRITICAL: only modify the requested element/region. Preserve every other detail of the original shoe perfectly — silhouette, sole, stitching, eyelets, accessories outside the target area, lighting, background and composition must stay IDENTICAL to the source image. Output a photo-realistic image of the same shoe with the requested change applied.';

    // Sıra: [kaynak, maske, referans] — prompt'taki "MASK" / "reference image" sıralamasıyla eşleşir
    const imageUrls = [hostedSource, hostedMask, hostedRef].filter((x): x is string => !!x);

    const input: Record<string, unknown> = {
      prompt,
      image_urls: imageUrls,
      image_input: imageUrls,
      image_url: hostedSource,
      aspect_ratio: aspectRatio || '1:1',
    };
    // Bazı Kie modelleri ayrı mask_url alanını da destekliyor; varsa ekstradan veriyoruz
    if (hostedMask) input.mask_url = hostedMask;

    const charge = await deductCredits(user.id, 'retouch');
    if (!charge.ok) {
      if (charge.error === 'insufficient') {
        return NextResponse.json(
          { error: 'Krediniz yetersiz. Fiyatlandırma sayfasından kredi yükleyin.', code: 'insufficient_credits', balance: charge.balance ?? 0 },
          { status: 402 }
        );
      }
      return NextResponse.json({ error: 'Kredi işlemi başarısız' }, { status: 500 });
    }

    let taskId: string | undefined;
    try {
      const createRes = await axios.post(
        `${KIE_BASE}/api/v1/jobs/createTask`,
        { model: 'nano-banana-pro', input },
        { headers: { Authorization: `Bearer ${getKieKey()}`, 'Content-Type': 'application/json' } }
      );
      taskId = createRes.data?.data?.taskId;
      if (!taskId) throw new Error('Could not get taskId');
    } catch (kieErr) {
      await refundCredits(user.id, 'retouch');
      throw kieErr;
    }

    return NextResponse.json({ taskId, stage: 'retouch', balance: charge.balance });
  } catch (error: unknown) {
    const e = error as { response?: { data?: { msg?: string } }; message?: string };
    const msg = e?.response?.data?.msg || e?.message || 'Rötuş Hatası';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
