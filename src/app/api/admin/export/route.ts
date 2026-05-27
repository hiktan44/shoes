import { NextResponse } from 'next/server';
import { getAdminUser, exportUsers, exportTransactions } from '@/lib/admin';
import { rateLimit } from '@/lib/rateLimit';

export const maxDuration = 26;

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map(h => esc(r[h])).join(','));
  return '﻿' + lines.join('\n'); // BOM → Excel Türkçe karakter
}

export async function GET(request: Request) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  if (!rateLimit(`admin:${admin.id}`, 30, 60_000).ok)
    return NextResponse.json({ error: 'Çok fazla istek' }, { status: 429 });

  const type = new URL(request.url).searchParams.get('type') || 'users';
  try {
    const rows = type === 'transactions' ? await exportTransactions() : await exportUsers();
    const csv = toCsv(rows);
    const today = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="fasheone_${type}_${today}.csv"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
