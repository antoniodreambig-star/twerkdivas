import * as db from './db';
import { snapshot, availability, onSale } from './tickets';
import { sendEmail, layout, button, esc } from './email';
import { fmtWhen } from './tz';
// Tells people waiting for a sold-out class that seats are free, first come first served.
export async function notifyWaitlist(classId, origin) {
  const snap = await snapshot(); const cls = snap.cb[classId]; if (!cls || !onSale(cls, snap.now)) return 0;
  let left = availability(cls, snap).left; if (left <= 0) return 0;
  const waiting = (await db.list('waitlist')).filter((w) => w.classId === classId && !w.notifiedAt).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  let sent = 0;
  for (const w of waiting) {
    if (w.qty > left) continue; left -= w.qty; sent++;
    await db.put('waitlist', w.id, { ...w, notifiedAt: new Date().toISOString() });
    const base = (process.env.APP_URL || w.origin || '').replace(/\/$/, '');
    await sendEmail({ to: w.email, subject: `A spot opened up: ${cls.title}`, html: layout('A spot opened up!', `<p>Hi ${esc(String(w.name).split(' ')[0])}, good news: ${w.qty > 1 ? `${w.qty} spots` : 'a spot'} just opened for <b>${esc(cls.title)}</b> on ${esc(fmtWhen(cls.start, cls.tz || 'America/Chicago', true))}.</p><p>Spots go to whoever books first, so grab yours now.</p>${button(`${base}/classes/${cls.id}`, 'Book my spot')}`) });
  }
  return sent;
}
