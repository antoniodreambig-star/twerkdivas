export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { createOrder, markPaid, releaseOrder } from '@/lib/tickets';
import { ticketCheckout, paymentsOn } from '@/lib/stripe';
import { appUrl } from '@/lib/email';
import { isEmail, str } from '@/lib/rules';
import { settings } from '@/lib/data';
import { waiverVersion } from '@/lib/policies';
import { addSubscriber } from '@/lib/subscribers';
import { takeCredits } from '@/lib/packs';
const hits = new Map();
const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
// Tickets are sold only here: this is the single door, and it checks the class, the seats and the studio's max attendance every time.
export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0]; const now = Date.now();
  const h = (hits.get(ip) || []).filter((t) => now - t < 36e5); if (h.length >= 12) return err('Too many attempts. Please try again later.', 429); hits.set(ip, [...h, now]);
  try {
    const b = await req.json(); const name = str(b.name, 80), email = str(b.email, 120).toLowerCase();
    if (!name) return err('Add your name'); if (!isEmail(email)) return err('Enter a valid email so we can send your tickets');
    if (b.agree !== true) return err('Please accept the participation waiver and refund policy to continue');
    const cls = await db.get('classes', str(b.classId, 80)); if (!cls || cls.public === false) return err('That class is not available', 404);
    const ins = await db.get('users', cls.userId); if (!ins || ins.suspended || !(ins.role === 'admin' || ins.comp || ['active', 'trialing', 'past_due'].includes(ins.sub?.status))) return err('That class is not available', 404);
    const set = await settings(); const origin = appUrl(req); const usePack = !!str(b.packCode, 20);
    if ((cls.price || 0) > 0 && !usePack && !paymentsOn()) return err('Ticket sales are not switched on yet. Please check back soon.', 503);
    const extra = { waiverAt: new Date().toISOString(), waiverVer: waiverVersion(set), optIn: b.optIn === true };
    const order = await createOrder({ cls, name, email, qty: b.qty, origin, extra });
    if (b.optIn === true) addSubscriber({ email, name, source: 'checkout' }).catch(() => {});
    if (usePack) {
      if (!(cls.price > 0)) { await releaseOrder(order.id); return err('This class is free, no pack needed'); }
      try { const { pass, unit } = await takeCredits({ code: b.packCode, email, qty: order.qty }); await db.put('orders', order.id, { ...order, amount: 0, price: 0, pass: pass.id, packValue: unit * order.qty }); await markPaid(order.id); return NextResponse.json({ url: `${origin}/orders/${order.id}` }); }
      catch (e) { await releaseOrder(order.id); return err(e.message); }
    }
    if (order.amount === 0) { await markPaid(order.id); return NextResponse.json({ url: `${origin}/orders/${order.id}` }); }
    // Automatic payout split when the instructor finished Stripe Connect onboarding; otherwise the money stays with Cakes and Core for a manual payout.
    const dest = ins.connect?.ready && ins.connect.acct ? ins.connect.acct : ''; const fee = dest ? Math.round((order.amount * Math.min(100, Math.max(0, Number(set.feePct) || 0))) / 100) : 0;
    try { const s = await ticketCheckout(order, cls, origin, dest ? { dest, fee } : null); await db.put('orders', order.id, { ...order, session: s.id, ...(dest ? { dest, fee } : {}) }); return NextResponse.json({ url: s.url }); }
    catch (e) { await releaseOrder(order.id); return err('Could not start payment. Please try again.', 502); }
  } catch (e) { return err(e.message); }
}
