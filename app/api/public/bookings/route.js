export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { sendEmail, emailOn, layout, button, esc, appUrl } from '@/lib/email';
import { isEmail, str } from '@/lib/rules';
import { magicParams } from '@/lib/magic';
const hits = new Map();
// Emails a private "My bookings" link. The answer is the same whether or not the email has bookings.
export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0]; const now = Date.now();
  const h = (hits.get(ip) || []).filter((t) => now - t < 36e5); if (h.length >= 5) return NextResponse.json({ error: 'Too many requests. Try again in an hour.' }, { status: 429 }); hits.set(ip, [...h, now]);
  const b = await req.json().catch(() => ({})); const email = str(b.email, 120).toLowerCase(); if (!emailOn()) return NextResponse.json({ ok: true, configured: false });
  if (isEmail(email)) {
    const has = (await db.list('orders')).some((o) => o.email === email && o.status === 'paid') || (await db.list('passes')).some((p) => p.email === email && p.status === 'active');
    if (has) await sendEmail({ to: email, subject: 'Your Cakes and Core bookings', html: layout('Your bookings', `<p>Tap below to see your tickets and class pack balance. This private link works for 2 hours.</p>${button(`${appUrl(req)}/bookings?${magicParams(email)}`, 'Open my bookings')}<p style="font-size:12px;color:#6E5A66">Didn't ask for this? You can ignore this email.</p>`) });
  }
  return NextResponse.json({ ok: true, configured: true });
}
