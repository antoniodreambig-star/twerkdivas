export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { isEmail, str } from '@/lib/rules';
import { settings } from '@/lib/data';
import { sendEmail, layout, esc } from '@/lib/email';
const hits = new Map(); const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0]; const now = Date.now(); const h = (hits.get(ip) || []).filter((t) => now - t < 36e5); if (h.length >= 5) return err('Too many messages. Please try again later.', 429); hits.set(ip, [...h, now]);
  try {
    const b = await req.json(); const name = str(b.name, 80), email = str(b.email, 120).toLowerCase(), msg = str(b.message, 2000); if (!name || !isEmail(email) || msg.length < 5) return err('Add your name, a valid email and a message');
    const set = await settings(); const to = set.contactEmail || process.env.ADMIN_EMAIL; if (!to) return err('Messaging is not set up yet', 503);
    await sendEmail({ to, subject: `Website message from ${name}`, html: layout('New website message', `<p><b>${esc(name)}</b> (${esc(email)})</p><p style="white-space:pre-wrap">${esc(msg)}</p>`) });
    return NextResponse.json({ ok: true });
  } catch (e) { return err(e.message); }
}
