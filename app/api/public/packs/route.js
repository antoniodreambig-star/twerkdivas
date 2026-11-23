export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { settings } from '@/lib/data';
import { passCheckout, paymentsOn } from '@/lib/stripe';
import { appUrl } from '@/lib/email';
import { isEmail, str } from '@/lib/rules';
import { newId } from '@/lib/tickets';
import { addSubscriber } from '@/lib/subscribers';
const hits = new Map(); const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function GET() { const s = await settings(); return NextResponse.json({ packs: (s.packs || []).map((p) => ({ id: p.id, name: p.name, credits: p.credits, price: p.price })) }); }
export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0]; const now = Date.now(); const h = (hits.get(ip) || []).filter((t) => now - t < 36e5); if (h.length >= 8) return err('Too many attempts. Please try again later.', 429); hits.set(ip, [...h, now]);
  try {
    const b = await req.json(); const s = await settings(); const pack = (s.packs || []).find((p) => p.id === b.packId); if (!pack) return err('That pack is not available', 404);
    const name = str(b.name, 80), email = str(b.email, 120).toLowerCase(); if (!name) return err('Add your name'); if (!isEmail(email)) return err('Enter a valid email'); if (b.agree !== true) return err('Please accept the refund policy to continue'); if (!paymentsOn()) return err('Payments are not switched on yet', 503);
    const pass = { id: newId('pass'), packId: pack.id, name: pack.name, buyer: name, email, credits: pack.credits, used: 0, price: pack.price, status: 'held', createdAt: new Date().toISOString(), origin: appUrl(req) };
    await db.put('passes', pass.id, pass);
    if (b.optIn === true) addSubscriber({ email, name, source: 'pack' }).catch(() => {});
    try { const c = await passCheckout(pass, pass.origin); await db.put('passes', pass.id, { ...pass, session: c.id }); return NextResponse.json({ url: c.url }); } catch { await db.del('passes', pass.id); return err('Could not start payment. Please try again.', 502); }
  } catch (e) { return err(e.message); }
}
