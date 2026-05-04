import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 26;

type SavePayload = {
  resultUrl: string;
  mode: 'foto' | 'tasarim';
  vibe?: string | null;
  shoeType?: string | null;
  prompt?: string | null;
  aspectRatio?: string | null;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
    }

    const body = (await request.json()) as SavePayload;
    if (!body.resultUrl || !body.mode) {
      return NextResponse.json({ error: 'resultUrl ve mode gerekli' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        result_url: body.resultUrl,
        mode: body.mode,
        vibe: body.vibe || null,
        shoe_type: body.shoeType || null,
        prompt: body.prompt || null,
        aspect_ratio: body.aspectRatio || null,
      })
      .select('id, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ generation: data });
  } catch (error: unknown) {
    const e = error as { message?: string };
    return NextResponse.json({ error: e?.message || 'Save Hatası' }, { status: 500 });
  }
}
