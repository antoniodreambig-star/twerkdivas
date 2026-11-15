export const dynamic = 'force-dynamic';
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { sendEmail, emailOn, layout, button, appUrl } from '@/lib/email';
import { isEmail, str } from '@/lib/rules';
const hits = new Map();
// Always answers the same way so nobody can use this to find out who has an account.
export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0]; const now = Date.now();
  const h = (hits.get(ip) || []).filter((t) => now - t < 36e5); if (h.length >= 6) return NextResponse.json({ error: 'Too many requests. Try again in an hour.' }, { status: 429 }); hits.set(ip, [...h, now]);
  const b = await req.json().catch(() => ({})); const email = str(b.email, 120).toLowerCase();
  if (!emailOn()) return NextResponse.json({ ok: true, configured: false });
  if (isEmail(email)) {
    const u = (await db.list('users')).find((x) => x.email === email && !x.suspended);
    if (u) {
      const old = (await db.list('resets')).filter((r) => r.userId === u.id && r.exp > now);
      if (old.length < 3) {
        const token = crypto.randomBytes(32).toString('hex'); const id = crypto.createHash('sha256').update(token).digest('hex');
        await db.put('resets', id, { id, userId: u.id, exp: now + 36e5 });
        const link = `${appUrl(req)}/reset?token=${token}`;
        await sendEmail({ to: u.email, subject: 'Reset your TwerkDivas password', html: layout('Reset your password', `<p>Hi ${u.name.split(' ')[0].replace(/[<>&"']/g, '')}, use the button below to choose a new password. The link works for one hour.</p>${button(link, 'Choose a new password')}<p style="font-size:13px;color:#6b5c96">If you did not ask for this, you can ignore this email.</p>`) });
      }
    }
  }
  return NextResponse.json({ ok: true, configured: true });
}
