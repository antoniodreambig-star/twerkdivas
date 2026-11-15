export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { createOrder, markPaid, releaseOrder } from '@/lib/tickets';
import { ticketCheckout, stripeOn } from '@/lib/stripe';
import { appUrl } from '@/lib/email';
import { isEmail, str } from '@/lib/rules';
const hits = new Map();
const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
// Tickets are sold only here: this is the single door, and it checks the class, the seats and the studio's max attendance every time.
export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0]; const now = Date.now();
  const h = (hits.get(ip) || []).filter((t) => now - t < 36e5); if (h.length >= 12) return err('Too many attempts. Please try again later.', 429); hits.set(ip, [...h, now]);
  try {
    const b = await req.json(); const name = str(b.name, 80), email = str(b.email, 120).toLowerCase();
    if (!name) return err('Add your name'); if (!isEmail(email)) return err('Enter a valid email so we can send your tickets');
    const cls = await db.get('classes', str(b.classId, 80)); if (!cls || cls.public === false) return err('That class is not available', 404);
    const ins = await db.get('users', cls.userId); if (!ins || ins.suspended || !(ins.role === 'admin' || ins.comp || ['active', 'trialing', 'past_due'].includes(ins.sub?.status))) return err('That class is not available', 404);
    const origin = appUrl(req); if ((cls.price || 0) > 0 && !stripeOn()) return err('Ticket sales are not switched on yet. Please check back soon.', 503);
    const order = await createOrder({ cls, name, email, qty: b.qty, origin });
    if (order.amount === 0) { await markPaid(order.id); return NextResponse.json({ url: `${origin}/orders/${order.id}` }); }
    try { const s = await ticketCheckout(order, cls, origin); await db.put('orders', order.id, { ...order, session: s.id }); return NextResponse.json({ url: s.url }); }
    catch (e) { await releaseOrder(order.id); return err('Could not start payment. Please try again.', 502); }
  } catch (e) { return err(e.message); }
}
