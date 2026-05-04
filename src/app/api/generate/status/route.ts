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

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    if (!taskId) {
      return NextResponse.json({ error: 'taskId gerekli' }, { status: 400 });
    }

    const res = await axios.get(`${KIE_BASE}/api/v1/jobs/recordInfo`, {
      params: { taskId },
      headers: { Authorization: `Bearer ${getKieKey()}` },
      timeout: 10_000,
    });
    const { state, resultJson, failMsg } = res.data?.data || {};

    if (state === 'success') {
      const parsed = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
      const url = parsed?.resultUrls?.[0] || parsed?.url || '';
      return NextResponse.json({ state: 'success', resultUrl: url });
    }
    if (state === 'failed') {
      return NextResponse.json({ state: 'failed', error: failMsg || 'Kie.ai task failed' });
    }
    return NextResponse.json({ state: state || 'pending' });
  } catch (error: unknown) {
    const e = error as { response?: { data?: { msg?: string } }; message?: string };
    const msg = e?.response?.data?.msg || e?.message || 'Status Hatası';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
