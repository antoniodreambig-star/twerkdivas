export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getSession, stripeOn } from '@/lib/stripe';
import { markPaid } from '@/lib/tickets';
// Called when the buyer returns from Stripe, so tickets appear instantly instead of waiting for the webhook.
export async function POST(req) {
  try {
    const { orderId, session } = await req.json(); const o = await db.get('orders', String(orderId || '')); if (!o || !stripeOn()) return NextResponse.json({ error: 'Unknown order' }, { status: 404 });
    if (o.status === 'paid') return NextResponse.json({ status: 'paid' });
    const s = await getSession(session); if (s.client_reference_id !== o.id) return NextResponse.json({ error: 'That payment belongs to another order' }, { status: 400 });
    if (s.payment_status !== 'paid') return NextResponse.json({ status: o.status });
    const n = await markPaid(o.id, { session: s.id, pi: typeof s.payment_intent === 'string' ? s.payment_intent : '' }); return NextResponse.json({ status: n.status });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
