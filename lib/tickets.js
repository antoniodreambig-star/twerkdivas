import crypto from 'crypto';
import * as db from './db';
import { refund as stripeRefund } from './stripe';
import { sendEmail, layout, button, esc } from './email';

export const HOLD_MS = 32 * 60 * 1000; // a bit longer than the 31-minute Stripe session
export const newId = (p) => `${p}-${crypto.randomBytes(8).toString('hex')}`;
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const mkCode = () => Array.from(crypto.randomBytes(8), (b) => ALPHA[b % 31]).join('');
export const slot = (c) => { const s = Date.parse(c.start); const e = c.end ? Date.parse(c.end) : NaN; return [s, Number.isFinite(e) && e > s ? e : s + 90 * 60000]; };
const overlap = (a, b) => a[0] < b[1] && b[0] < a[1];
export const onSale = (c, now = Date.now()) => !!c && !c.canceled && c.public !== false && Date.parse(c.start) > now;

// Everything needed to count seats, loaded once per request.
export async function snapshot() {
  const now = Date.now();
  const [classes, venues, orders, tickets] = await Promise.all([db.list('classes'), db.list('venues'), db.list('orders'), db.list('tickets')]);
  const ob = Object.fromEntries(orders.map((o) => [o.id, o])); const seats = {}, checked = {};
  for (const t of tickets) {
    const o = ob[t.orderId]; const live = t.status === 'valid' || (t.status === 'held' && o && o.status === 'held' && o.holdUntil > now);
    if (live) seats[t.classId] = (seats[t.classId] || 0) + 1;
    if (t.status === 'valid' && t.checkedInAt) checked[t.classId] = (checked[t.classId] || 0) + 1;
  }
  return { now, classes, venues, orders, tickets, ob, seats, checked, vb: Object.fromEntries(venues.map((v) => [v.id, v])), cb: Object.fromEntries(classes.map((c) => [c.id, c])) };
}
// Spots left = the smaller of the class limit and the studio's max attendance shared by every class running at the same time there.
export function availability(c, snap) {
  const v = snap.vb[c.venueId]; let cap = Number(c.spots) > 0 ? Number(c.spots) : v ? v.capacity : 0; if (v) cap = Math.min(cap, v.capacity);
  const sold = snap.seats[c.id] || 0; let raw = cap - sold;
  if (v) { const me = slot(c); const used = snap.classes.filter((x) => x.venueId === c.venueId && !x.canceled && overlap(slot(x), me)).reduce((n, x) => n + (snap.seats[x.id] || 0), 0); raw = Math.min(raw, v.capacity - used); }
  return { cap, venueCap: v?.capacity || 0, sold, checkedIn: snap.checked[c.id] || 0, rawLeft: raw, left: Math.max(0, raw) };
}

export async function createOrder({ cls, name, email, qty, origin, extra = {} }) {
  qty = Math.floor(Number(qty)); if (!(qty >= 1 && qty <= 6)) throw new Error('Choose 1 to 6 tickets');
  let snap = await snapshot(); if (!onSale(cls, snap.now)) throw new Error('Tickets for this class are not on sale');
  const a = availability(cls, snap); if (a.left <= 0) throw new Error('This class is sold out'); if (qty > a.left) throw new Error(`Only ${a.left} spot${a.left === 1 ? '' : 's'} left`);
  if (snap.orders.filter((o) => o.classId === cls.id && o.email === email && o.status === 'held' && o.holdUntil > snap.now).length >= 2) throw new Error('You already have tickets waiting for payment for this class. Finish that checkout or try again in a few minutes.');
  const id = newId('ord'), iso = new Date(snap.now).toISOString();
  const order = { id, classId: cls.id, name, email, qty, price: cls.price || 0, amount: (cls.price || 0) * qty, status: 'held', holdUntil: snap.now + HOLD_MS, createdAt: iso, origin, ...extra };
  const taken = new Set(snap.tickets.map((t) => t.code)); const ts = [];
  for (let i = 0; i < qty; i++) { let c; do c = mkCode(); while (taken.has(c)); taken.add(c); ts.push({ id: newId('tkt'), orderId: id, classId: cls.id, code: c, name: qty > 1 ? `${name} (${i + 1} of ${qty})` : name, status: 'held', createdAt: iso }); }
  await db.put('orders', id, order); await db.putMany('tickets', ts);
  // Re-count after writing: if two buyers raced for the last seats, undo ours instead of overselling.
  if (availability(cls, await snapshot()).rawLeft < 0) { await db.delMany('tickets', ts.map((t) => t.id)); await db.del('orders', id); throw new Error('Sorry, those spots were just taken. Please try again.'); }
  sweep(snap).catch(() => {});
  return order;
}
async function sweep(snap) { const old = snap.orders.filter((o) => o.status === 'held' && o.holdUntil < Date.now() - 3 * 36e5).map((o) => o.id); if (!old.length) return; await db.delMany('tickets', snap.tickets.filter((t) => old.includes(t.orderId)).map((t) => t.id)); await db.delMany('orders', old); }

async function context(o) {
  const cls = await db.get('classes', o.classId); const [v, ins] = await Promise.all([cls?.venueId ? db.get('venues', cls.venueId) : null, cls ? db.get('users', cls.userId) : null]); return { cls, v, ins };
}
import { fmtWhen } from './tz';
const when = (iso, tz) => fmtWhen(iso, tz || 'America/Chicago', true);
export async function markPaid(orderId, { session = '', pi = '' } = {}) {
  let o = await db.get('orders', orderId); if (!o || ['paid', 'refunded', 'refund_due'].includes(o.status)) return o;
  const now = new Date().toISOString();
  if (o.status !== 'held') { // the hold lapsed before payment arrived: only honor it if the room is still there
    const snap = await snapshot(); const cls = snap.cb[o.classId];
    if (!cls || cls.canceled || availability(cls, snap).left < o.qty) { o = { ...o, status: 'refund_due', session, pi, paidAt: now }; await db.put('orders', o.id, o); return o; }
  }
  o = { ...o, status: 'paid', session: session || o.session || '', pi: pi || o.pi || '', paidAt: now, holdUntil: 0 }; await db.put('orders', o.id, o);
  const ts = (await db.list('tickets')).filter((t) => t.orderId === o.id); await db.putMany('tickets', ts.map((t) => ({ ...t, status: 'valid' })));
  const { cls, v, ins } = await context(o);
  if (cls) {
    const where = cls.mode === 'online' ? 'Online. Your class link is on your ticket page.' : `${esc(v?.name || '')}${v ? `, ${esc(v.address)}, ${esc(v.city)}, ${esc(v.state)}` : ''}`;
    await sendEmail({ to: o.email, subject: `Your tickets: ${cls.title}`, html: layout('You are in!', `<p>Hi ${esc(o.name.split(' ')[0])}, your ${o.qty > 1 ? `${o.qty} tickets are` : 'ticket is'} confirmed.</p><p><b>${esc(cls.title)}</b><br>${esc(when(cls.start, cls.tz))}<br>${where}<br>With ${esc(ins?.name || 'TwerkDivas')}</p>${button(`${o.origin}/orders/${o.id}`, 'View my tickets')}<p style="font-size:13px;color:#6E5A66">Show the QR code or ticket code at check-in. Tickets are non-transferable and sold only through our website.</p>`) });
  }
  return o;
}
export async function releaseOrder(orderId) {
  const o = await db.get('orders', orderId); if (!o || o.status !== 'held') return;
  await db.put('orders', o.id, { ...o, status: 'expired', holdUntil: 0 });
  const ts = (await db.list('tickets')).filter((t) => t.orderId === o.id); await db.putMany('tickets', ts.map((t) => ({ ...t, status: 'void' })));
  freed(o);
}
const freed = (o) => import('./waitlist').then((w) => w.notifyWaitlist(o.classId, o.origin)).catch(() => {});
async function voidTickets(orderId) { const ts = (await db.list('tickets')).filter((t) => t.orderId === orderId); if (ts.length) await db.putMany('tickets', ts.map((t) => ({ ...t, status: 'void' }))); }
export async function refundOrder(orderId) {
  const o = await db.get('orders', orderId); if (!o) throw new Error('Unknown order'); if (o.status === 'refunded') return o;
  if (!['paid', 'refund_due'].includes(o.status)) throw new Error('Only paid orders can be refunded');
  if (o.amount > 0) { if (!o.pi) throw new Error('No payment is on file for this order. Refund it in Stripe.'); await stripeRefund(o.pi, `refund-${o.id}`, { reverse: !!o.dest }); }
  if (o.pass) await returnCredits(o);
  await voidTickets(o.id); const n = { ...o, status: 'refunded', refundedAt: new Date().toISOString() }; await db.put('orders', o.id, n); freed(o); return n;
}
async function returnCredits(o) { const p = await db.get('passes', o.pass); if (p) await db.put('passes', p.id, { ...p, used: Math.max(0, (p.used || 0) - o.qty) }); }
// Cancels a class: voids every ticket, refunds paid orders, and tells the buyers.
export async function cancelClass(classId) {
  const cls = await db.get('classes', classId); if (!cls) throw new Error('Unknown class');
  await db.put('classes', cls.id, { ...cls, canceled: true, canceledAt: new Date().toISOString() });
  const orders = (await db.list('orders')).filter((o) => o.classId === classId); let refunded = 0; const failed = [];
  for (const o of orders) {
    if (o.status === 'held') { await releaseOrder(o.id); continue; }
    if (!['paid', 'refund_due'].includes(o.status)) continue;
    try { await refundOrder(o.id); refunded++; } catch (e) { failed.push(`${o.name}: ${e.message}`); await voidTickets(o.id); await db.put('orders', o.id, { ...o, status: 'refund_due', refundError: e.message }); }
    await sendEmail({ to: o.email, subject: `Class canceled: ${cls.title}`, html: layout('Your class was canceled', `<p>Hi ${esc(o.name.split(' ')[0])}, we are sorry: <b>${esc(cls.title)}</b> on ${esc(when(cls.start, cls.tz))} has been canceled.</p><p>${o.amount > 0 ? 'Your payment is being refunded to your original payment method.' : 'Your free ticket has been released.'}</p>${button(`${o.origin}/classes`, 'Find another class')}`) });
  }
  return { refunded, failed };
}
export const maskEmail = (e) => { const [a, b] = String(e).split('@'); return `${a.slice(0, 1)}***@${b || ''}`; };

// A buyer cancels their own paid order. Allowed until `cancelHours` before the class starts and before anyone is checked in.
export async function cancelByBuyer(orderId, cancelHours) {
  const o = await db.get('orders', orderId); if (!o) throw new Error('Unknown order'); if (o.status !== 'paid') throw new Error('Only paid orders can be canceled');
  const cls = await db.get('classes', o.classId); if (!cls) throw new Error('Unknown class');
  if (Date.parse(cls.start) - Date.now() < Number(cancelHours) * 36e5) throw new Error(`Tickets can be canceled until ${cancelHours} hours before the class. This one is now non-refundable.`);
  if ((await db.list('tickets')).some((t) => t.orderId === o.id && t.checkedInAt)) throw new Error('This ticket was already used');
  const n = await refundOrder(o.id); await db.put('orders', o.id, { ...n, canceledBy: 'buyer' });
  await sendEmail({ to: o.email, subject: `Canceled: ${cls.title}`, html: layout('Your tickets were canceled', `<p>Your ${o.qty} ticket${o.qty === 1 ? '' : 's'} for <b>${esc(cls.title)}</b> ${o.amount > 0 && !o.pass ? 'will be refunded to your original payment method.' : 'were released.'}</p>${button(`${o.origin}/classes`, 'Find another class')}`) }).catch(() => {});
  return n;
}
