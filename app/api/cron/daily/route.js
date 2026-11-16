export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { releaseOrder } from '@/lib/tickets';
import { notifyWaitlist } from '@/lib/waitlist';
import { runBackup } from '@/lib/backup';
import { sendEmail, layout, button, esc } from '@/lib/email';
import { fmtWhen } from '@/lib/tz';
// Runs once a day (see vercel.json). Vercel sends Authorization: Bearer <CRON_SECRET>.
export async function GET(req) {
  const secret = process.env.CRON_SECRET; if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not set' }, { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const out = { released: 0, waitlist: 0, reviewEmails: 0, backup: null }; const now = Date.now();
  try {
    for (const o of (await db.list('orders')).filter((x) => x.status === 'held' && x.holdUntil < now)) { await releaseOrder(o.id); out.released++; }
    const classes = (await db.list('classes')).filter((c) => !c.canceled && Date.parse(c.start) > now); for (const c of classes) out.waitlist += await notifyWaitlist(c.id, '');
    const reviews = new Set((await db.list('reviews')).map((r) => r.id)); const cb = Object.fromEntries((await db.list('classes')).map((c) => [c.id, c]));
    for (const o of (await db.list('orders')).filter((x) => x.status === 'paid' && !x.reviewAskedAt && !reviews.has(x.id))) {
      const c = cb[o.classId]; if (!c || c.canceled) continue; const end = c.end ? Date.parse(c.end) : Date.parse(c.start) + 90 * 60000; if (end > now - 3 * 36e5 || end < now - 4 * 864e5) continue;
      const base = (process.env.APP_URL || o.origin || '').replace(/\/$/, ''); await db.put('orders', o.id, { ...o, reviewAskedAt: new Date().toISOString() });
      await sendEmail({ to: o.email, subject: `How was ${c.title}?`, html: layout('How was your class?', `<p>Hi ${esc(String(o.name).split(' ')[0])}, thanks for coming to <b>${esc(c.title)}</b> (${esc(fmtWhen(c.start, c.tz || 'America/Chicago', true))}). Tell us how it went. It takes 10 seconds.</p>${button(`${base}/orders/${o.id}#rate`, 'Rate your class')}`) }); out.reviewEmails++;
    }
    out.backup = await runBackup();
  } catch (e) { out.error = e.message; return NextResponse.json(out, { status: 500 }); }
  return NextResponse.json(out);
}
