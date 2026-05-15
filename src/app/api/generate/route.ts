import { NextResponse } from 'next/server';
import axios from 'axios';
import { SHOE_NEGATIVE_PROMPT, buildStudioPrompt } from '@/lib/promptBuilder';
import { rateLimit } from '@/lib/rateLimit';
import { validateImageDataUrl } from '@/lib/validation';
import { ensureUrl } from '@/lib/kieUpload';
import { createClient } from '@/lib/supabase/server';

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

function buildReferenceHints(refs?: References): string {
  if (!refs) return '';
  const parts: string[] = [];
  if (refs.sole) parts.push('replicate the sole/outsole tread pattern, height, color and rubber texture from the sole reference image exactly');
  if (refs.leather) parts.push('apply the material/texture from the upper-material reference image to the upper');
  if (refs.accessory) parts.push('integrate the buckle/accessory style from the accessory reference image');
  if (refs.secondary) parts.push('use the lace/secondary panel color from the secondary reference image');
  return parts.length ? `Reference guidance: ${parts.join('; ')}.` : '';
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

    const refHints = buildReferenceHints(references);

    const protections: string[] = [];
    if (preserveForm !== false) protections.push('Strictly preserve silhouette, sole height and toe shape.');
    if (preserveDetails !== false) protections.push('Maintain stitching, eyelets and accessory placement exactly.');
    if (pairMode !== 'off') protections.push('If only one shoe is in the reference, output a properly mirrored matched pair (left + right).');
    const protectionRule = protections.join(' ');

    const firstStagePrompt = `${buildStudioPrompt({ isDesignMode, shoeType, customPrompt: prompt, refHints })} ${protectionRule}`;

    const studioInput: Record<string, unknown> = {
      prompt: firstStagePrompt,
      negative_prompt: SHOE_NEGATIVE_PROMPT,
      image_urls: allInputUrls,
      imageScale: isDesignMode ? 0.65 : 0.9,
      aspect_ratio: '1:1',
      quality: 'basic',
    };

    const createRes = await axios.post(
      `${KIE_BASE}/api/v1/jobs/createTask`,
      { model: 'seedream/5-lite-image-to-image', input: studioInput },
      { headers: { Authorization: `Bearer ${getKieKey()}`, 'Content-Type': 'application/json' } }
    );
    const taskId = createRes.data?.data?.taskId;
    if (!taskId) throw new Error('Could not get taskId');

    return NextResponse.json({ taskId, stage: 'studio', isDesignMode });
  } catch (error: unknown) {
    const e = error as { response?: { data?: { msg?: string } }; message?: string };
    const msg = e?.response?.data?.msg || e?.message || 'Üretim Hatası';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
