import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { addCredits } from '@/lib/credits';
import { sendPurchaseReceipt } from '@/lib/email';

export const maxDuration = 26;
// Stripe imza doğrulaması için ham gövde gerekir — bodyParser kapalı olmalı
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whSecret) {
    return NextResponse.json({ error: 'Stripe yapılandırılmamış' }, { status: 500 });
  }

  const stripe = new Stripe(secret);
  const sig = request.headers.get('stripe-signature');
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig || '', whSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook imza hatası: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === 'paid') {
      const userId = session.metadata?.user_id || session.client_reference_id || '';
      const credits = parseInt(session.metadata?.credits || '0', 10);
      const pkgId = session.metadata?.package_id || 'unknown';
      const amountPaid = (session.amount_total ?? 0) / 100;

      if (userId && credits > 0) {
        try {
          const res = await addCredits({
            userId,
            credits,
            amountPaid,
            reason: `package_${pkgId}`,
            provider: 'stripe',
            providerRef: session.id, // idempotent anahtar
          });
          // Satın alma onayı e-postası (yalnızca ilk işlemede; idempotent dup ise atla)
          const email = session.customer_details?.email || session.customer_email || '';
          if (email && !res.duplicate) {
            await sendPurchaseReceipt({ to: email, credits, amount: amountPaid, balance: res.balance });
          }
        } catch (e) {
          // Stripe'a 500 dönersek tekrar dener; addCredits zaten idempotent
          return NextResponse.json({ error: `Kredi yükleme hatası: ${(e as Error).message}` }, { status: 500 });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
