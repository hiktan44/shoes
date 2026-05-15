import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin';

export const maxDuration = 26;

export async function GET() {
  const admin = await getAdminUser();
  return NextResponse.json({ admin: !!admin });
}
