import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 26;

const KIE_BASE = 'https://api.kie.ai';
const getKieKey = () => {
  const k = process.env.KIE_API_KEY;
  if (!k) throw new Error('KIE_API_KEY env değişkeni tanımlı değil');
  return k;
};

type AlbumPayload = {
  imageUrls: string[];
  layout?: 'magazine' | 'lookbook' | 'mosaic';
  aspectRatio?: '16:9' | '4:5' | '1:1' | '3:4';
  shoeType?: string;
};

const LAYOUT_PROMPTS: Record<string, string> = {
  magazine:
    'a high-fashion magazine spread layout combining the provided shots into one editorial collage. Multiple panels of varying sizes elegantly arranged on a clean off-white background, thin minimalist dividers between panels, mixed full-body and crop framings, premium typography placeholders left blank, soft drop shadows, premium fashion editorial aesthetic.',
  lookbook:
    'a fashion lookbook page combining the provided shots into one cohesive grid. Equal-size frames arranged in a clean editorial grid, generous white space, subtle film grain, neutral backdrop, brand catalog feel.',
  mosaic:
    'a creative mosaic collage of the provided shots with overlapping and tilted panels in a single composition, gallery-wall style, deep neutral background, dramatic studio lighting unifying the panels.',
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
    }

    const body = (await request.json()) as AlbumPayload;
    const { imageUrls, layout = 'magazine', aspectRatio = '16:9', shoeType } = body;

    if (!Array.isArray(imageUrls) || imageUrls.length < 2) {
      return NextResponse.json({ error: 'En az 2 görsel gerekli' }, { status: 400 });
    }

    const layoutPrompt = LAYOUT_PROMPTS[layout] || LAYOUT_PROMPTS.magazine;
    const typeNote = shoeType && shoeType !== 'Genel Ayakkabı' ? ` The featured product is a ${shoeType}.` : '';
    const prompt = `Compose ${layoutPrompt} The same model in the same outfit appears across multiple poses in the panels — preserve identity, wardrobe, and shoe details exactly from the provided reference images. Keep the FOOTWEAR clearly visible and consistent in every panel.${typeNote} Hyper-realistic, 8k, sharp.`;

    const input: Record<string, unknown> = {
      prompt,
      image_urls: imageUrls.slice(0, 8),
      image_input: imageUrls.slice(0, 8),
      aspect_ratio: aspectRatio,
    };

    const createRes = await axios.post(
      `${KIE_BASE}/api/v1/jobs/createTask`,
      { model: 'nano-banana-pro', input },
      { headers: { Authorization: `Bearer ${getKieKey()}`, 'Content-Type': 'application/json' } }
    );
    const taskId = createRes.data?.data?.taskId;
    if (!taskId) throw new Error('Could not get taskId');

    return NextResponse.json({ taskId, stage: 'album' });
  } catch (error: unknown) {
    const e = error as { response?: { data?: { msg?: string } }; message?: string };
    const msg = e?.response?.data?.msg || e?.message || 'Albüm Üretim Hatası';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
