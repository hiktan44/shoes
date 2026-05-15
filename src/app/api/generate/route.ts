import { NextResponse } from 'next/server';
import axios from 'axios';
import { SHOE_NEGATIVE_PROMPT, buildStudioPrompt } from '@/lib/promptBuilder';
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

type References = {
  sketch?: string;
  sole?: string;
  leather?: string;
  accessory?: string;
  secondary?: string;
};

type GeneratePayload = {
  imageUrl?: string | null;
  vibe?: string;
  prompt?: string;
  shoeType?: string;
  references?: References;
  preserveForm?: boolean;
  preserveDetails?: boolean;
  pairMode?: 'auto' | 'off';
};

// Image_urls dizisindeki sıra ile birebir eşleşen, konum bazlı (Image #N) prompt enumeration.
// Bu sayede model "hangi referans neyi temsil ediyor" karışıklığa düşmüyor.
function buildEnumeratedHints(primaryUrl: string | null, refs?: References): string {
  const lines: string[] = [];
  let idx = 1;
  if (primaryUrl) {
    lines.push(`Image #${idx}: PRIMARY SUBJECT — the main shoe to preserve / transform.`);
    idx++;
  }
  if (refs?.sketch) {
    lines.push(`Image #${idx}: SKETCH — use this drawing as the silhouette and structural blueprint of the final shoe.`);
    idx++;
  }
  if (refs?.sole) {
    lines.push(`Image #${idx}: SOLE / OUTSOLE — CRITICAL: replicate the tread pattern, sole thickness, sole color, and rubber/foam texture from this image EXACTLY on the bottom of the shoe. The shoe in the final output MUST have this exact sole — do not invent a different sole.`);
    idx++;
  }
  if (refs?.leather) {
    lines.push(`Image #${idx}: UPPER MATERIAL — apply this material/texture/color to the upper part of the shoe (the body above the sole).`);
    idx++;
  }
  if (refs?.accessory) {
    lines.push(`Image #${idx}: BUCKLE / ACCESSORY — integrate the buckle or hardware style from this image into the shoe.`);
    idx++;
  }
  if (refs?.secondary) {
    lines.push(`Image #${idx}: LACES / SECONDARY PANEL — use this color/material for the laces or secondary panel.`);
    idx++;
  }
  return lines.length ? `REFERENCE MAP (numbered to match the order of input images):\n${lines.join('\n')}` : '';
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
    }

    const limit = parseInt(process.env.RATE_LIMIT_PER_MIN || '10', 10);
    const rl = rateLimit(`gen:${user.id}`, limit, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Çok fazla istek. ${Math.ceil(rl.retryAfterMs / 1000)} saniye sonra tekrar deneyin.` },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const body = (await request.json()) as GeneratePayload;
    const { imageUrl, prompt, shoeType, references, preserveForm, preserveDetails, pairMode } = body;

    const maxBytes = parseInt(process.env.MAX_UPLOAD_BYTES || '8388608', 10);
    const dataUrls: string[] = [];
    if (imageUrl?.startsWith('data:image')) dataUrls.push(imageUrl);
    if (references) {
      for (const v of [references.sketch, references.sole, references.leather, references.accessory, references.secondary]) {
        if (v?.startsWith('data:image')) dataUrls.push(v);
      }
    }
    for (const u of dataUrls) {
      const v = validateImageDataUrl(u, maxBytes);
      if (!v.ok) return NextResponse.json({ error: v.reason }, { status: 400 });
    }

    const isDesignMode = !!prompt;

    if (!isDesignMode && !imageUrl) {
      return NextResponse.json({ error: 'Görsel URL gereklidir' }, { status: 400 });
    }

    const primaryUrl = await ensureUrl(imageUrl);
    const refUrls = await Promise.all([
      ensureUrl(references?.sketch),
      ensureUrl(references?.sole),
      ensureUrl(references?.leather),
      ensureUrl(references?.accessory),
      ensureUrl(references?.secondary),
    ]);
    const allInputUrls = [primaryUrl, ...refUrls].filter((u): u is string => !!u);

    if (allInputUrls.length === 0) {
      return NextResponse.json({ error: 'En az bir görsel veya prompt gerekli' }, { status: 400 });
    }

    const refHints = buildEnumeratedHints(primaryUrl, references);

    const protections: string[] = [];
    if (preserveForm !== false) protections.push('Strictly preserve silhouette, sole height and toe shape.');
    if (preserveDetails !== false) protections.push('Maintain stitching, eyelets and accessory placement exactly.');
    if (pairMode !== 'off') protections.push('If only one shoe is in the reference, output a properly mirrored matched pair (left + right).');
    const protectionRule = protections.join(' ');

    const firstStagePrompt = `${buildStudioPrompt({ isDesignMode, shoeType, customPrompt: prompt, refHints })} ${protectionRule}`;

    // Multi-image composition gerektiren tasarım modunda nano-banana-pro kullan (referansları gerçekten okur).
    // Tek görselli foto modunda seedream-lite yeterli ve daha hızlı.
    const hasMultipleRefs = allInputUrls.length > 1;
    const useNanoBanana = isDesignMode || hasMultipleRefs;

    const studioInput: Record<string, unknown> = useNanoBanana
      ? {
          prompt: firstStagePrompt,
          // nano-banana-pro tüm 3 alan adını da tanıyor — belirsizlik kalmasın
          image_urls: allInputUrls,
          image_input: allInputUrls,
          image_url: allInputUrls[0],
          aspect_ratio: '1:1',
        }
      : {
          prompt: firstStagePrompt,
          negative_prompt: SHOE_NEGATIVE_PROMPT,
          image_urls: allInputUrls,
          image_url: allInputUrls[0],
          imageScale: 0.9,
          aspect_ratio: '1:1',
          quality: 'basic',
        };

    const modelSlug = useNanoBanana ? 'nano-banana-pro' : 'seedream/5-lite-image-to-image';

    // Kredi düş (stage 1 = 'studio' = 1 kredi) — yetersizse 402
    const charge = await deductCredits(user.id, 'studio');
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
        { model: modelSlug, input: studioInput },
        { headers: { Authorization: `Bearer ${getKieKey()}`, 'Content-Type': 'application/json' } }
      );
      taskId = createRes.data?.data?.taskId;
      if (!taskId) throw new Error('Could not get taskId');
    } catch (kieErr) {
      await refundCredits(user.id, 'studio');
      throw kieErr;
    }

    return NextResponse.json({ taskId, stage: 'studio', isDesignMode, balance: charge.balance });
  } catch (error: unknown) {
    const e = error as { response?: { data?: { msg?: string } }; message?: string };
    const msg = e?.response?.data?.msg || e?.message || 'Üretim Hatası';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
