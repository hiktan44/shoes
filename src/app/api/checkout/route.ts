import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { CREDIT_PACKAGES, type PackageId } from '@/lib/credits';
import { rateLimit } from '@/lib/rateLimit';

export const maxDuration = 26;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });

    const rl = rateLimit(`checkout:${user.id}`, 12, 60_000);
    if (!rl.ok) return NextResponse.json({ error: 'Çok fazla istek, biraz sonra deneyin.' }, { status: 429 });

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Ödeme sistemi yapılandırılmamış (STRIPE_SECRET_KEY)' }, { status: 500 });

    const { packageId } = (await request.json()) as { packageId: PackageId };
    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) return NextResponse.json({ error: 'Geçersiz paket' }, { status: 400 });

    const stripe = new Stripe(secret);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shoes.fasheone.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'try',
            product_data: {
              name: `Fasheone Shoes — ${pkg.label} Paketi`,
              description: `${pkg.credits} kredi`,
            },
            unit_amount: pkg.priceTRY * 100, // kuruş
          },
          quantity: 1,
        },
      ],
      // Webhook + başarı sayfası için gerekli bilgiler
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: {
        user_id: user.id,
        package_id: pkg.id,
        credits: String(pkg.credits),
      },
      success_url: `${appUrl}/pricing?success=1&pkg=${pkg.id}`,
      cancel_url: `${appUrl}/pricing?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const e = error as { message?: string };
    return NextResponse.json({ error: e?.message || 'Ödeme oturumu oluşturulamadı' }, { status: 500 });
  }
}
