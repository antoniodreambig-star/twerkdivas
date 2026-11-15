export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { sendEmail, emailOn, layout, esc, appUrl } from '@/lib/email';
import { isEmail, str } from '@/lib/rules';
import { fmtWhen } from '@/lib/tz';
const hits = new Map();
// "I lost my tickets": emails the links for upcoming paid orders. Same answer whether or not the email has orders.
export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0]; const now = Date.now();
  const h = (hits.get(ip) || []).filter((t) => now - t < 36e5); if (h.length >= 4) return NextResponse.json({ error: 'Too many requests. Try again in an hour.' }, { status: 429 }); hits.set(ip, [...h, now]);
  const b = await req.json().catch(() => ({})); const email = str(b.email, 120).toLowerCase();
  if (!emailOn()) return NextResponse.json({ ok: true, configured: false });
  if (isEmail(email)) {
    const orders = (await db.list('orders')).filter((o) => o.email === email && o.status === 'paid'); const classes = Object.fromEntries((await db.list('classes')).map((c) => [c.id, c])); const origin = appUrl(req);
    const up = orders.filter((o) => classes[o.classId] && !classes[o.classId].canceled && Date.parse(classes[o.classId].start) > now - 864e5);
    if (up.length) await sendEmail({ to: email, subject: 'Your TwerkDivas tickets', html: layout('Your tickets', up.map((o) => `<p><b>${esc(classes[o.classId].title)}</b><br>${esc(fmtWhen(classes[o.classId].start, classes[o.classId].tz, true))}<br><a href="${esc(origin)}/orders/${esc(o.id)}">View tickets</a></p>`).join('')) });
  }
  return NextResponse.json({ ok: true, configured: true });
}
