import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBalance } from '@/lib/credits';

export const maxDuration = 26;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
    const credits = await getBalance(user.id);
    return NextResponse.json({ credits });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'Bakiye alınamadı' }, { status: 500 });
  }
}
