import { NextResponse } from 'next/server';
import axios from 'axios';
import { buildPrompt, buildPosePrompt, POSE_CATALOG } from '@/lib/promptBuilder';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 26;

const KIE_BASE = 'https://api.kie.ai';
const getKieKey = () => {
  const k = process.env.KIE_API_KEY;
  if (!k) throw new Error('KIE_API_KEY env değişkeni tanımlı değil');
  return k;
};

type VibePayload = {
  studioImageUrl: string;
  isDesignMode?: boolean;
  vibe: string;
  poseId?: string;
  shoeType?: string;
  material?: string;
  prompt?: string;
  aspectRatio?: string;
  preserveForm?: boolean;
  preserveDetails?: boolean;
  seed?: number;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
    }

    const body = (await request.json()) as VibePayload;
    const {
      studioImageUrl,
      isDesignMode,
      vibe,
      poseId,
      shoeType,
      material,
      prompt,
      aspectRatio,
      preserveForm,
      preserveDetails,
      seed,
    } = body;

    if (!studioImageUrl || (!vibe && !poseId)) {
      return NextResponse.json({ error: 'studioImageUrl ve vibe/poseId gerekli' }, { status: 400 });
    }

    const protections: string[] = [];
    if (preserveForm !== false) protections.push('Strictly preserve silhouette, sole height and toe shape.');
    if (preserveDetails !== false) protections.push('Maintain stitching, eyelets and accessory placement exactly.');
    const protectionRule = protections.join(' ');

    const isPose = !!(poseId && POSE_CATALOG[poseId]);
    const generatedVibePrompt = isPose
      ? `${buildPosePrompt(poseId!, shoeType, prompt)} ${protectionRule}`
      : `${buildPrompt(vibe, shoeType, material, prompt)} ${protectionRule}`;

    const defaultAspect = isPose
      ? POSE_CATALOG[poseId!].aspect
      : (vibe === 'Albüm' ? '16:9' : '3:4');
    const vibeAspect = aspectRatio || defaultAspect;

    const vibeInput: Record<string, unknown> = {
      prompt: generatedVibePrompt,
      image_urls: [studioImageUrl],
      image_input: [studioImageUrl],
      image_url: studioImageUrl,
      aspect_ratio: vibeAspect,
    };
    if (isDesignMode) vibeInput.imageScale = 0.8;
    if (typeof seed === 'number') vibeInput.seed = seed;

    const createRes = await axios.post(
      `${KIE_BASE}/api/v1/jobs/createTask`,
      { model: 'nano-banana-pro', input: vibeInput },
      { headers: { Authorization: `Bearer ${getKieKey()}`, 'Content-Type': 'application/json' } }
    );
    const taskId = createRes.data?.data?.taskId;
    if (!taskId) throw new Error('Could not get taskId');

    return NextResponse.json({ taskId, stage: 'vibe', isDesignMode });
  } catch (error: unknown) {
    const e = error as { response?: { data?: { msg?: string } }; message?: string };
    const msg = e?.response?.data?.msg || e?.message || 'Vibe Üretim Hatası';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
