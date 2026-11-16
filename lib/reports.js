import * as db from './db';
import { snapshot, availability } from './tickets';
import { settings } from './data';
import { reviewStats } from './reviews';

const paidish = (o) => o.status === 'paid';
const cash = (o) => (o.pass ? 0 : o.amount || 0); const value = (o) => (o.pass ? o.packValue || 0 : o.amount || 0);
const fee = (v, pct) => Math.round((v * pct) / 100);
export async function earningsFor(userId, snap, set) {
  snap = snap || (await snapshot()); set = set || (await settings()); const pct = Math.min(100, Math.max(0, Number(set.feePct) || 0));
  const mine = snap.classes.filter((c) => c.userId === userId); const rows = [];
  let T = { gross: 0, fee: 0, net: 0, auto: 0, manual: 0, tickets: 0, packValue: 0 };
  for (const c of mine) {
    const os = snap.orders.filter((o) => o.classId === c.id && paidish(o)); if (!os.length) continue;
    const r = { id: c.id, title: c.title, start: c.start, tz: c.tz || 'America/Chicago', tickets: 0, gross: 0, packValue: 0, fee: 0, net: 0, auto: 0, manual: 0 };
    for (const o of os) { const v = value(o); const f = o.dest ? (o.fee ?? fee(v, pct)) : fee(v, pct); r.tickets += o.qty; r.gross += cash(o); r.packValue += o.pass ? v : 0; r.fee += f; r.net += v - f; if (o.dest) r.auto += v - f; else r.manual += v - f; }
    rows.push(r); for (const k of ['gross', 'fee', 'net', 'auto', 'manual', 'tickets', 'packValue']) T[k] += r[k];
  }
  const paid = (await db.list('payouts')).filter((p) => p.userId === userId).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const paidOut = paid.reduce((n, p) => n + p.amount, 0);
  return { feePct: pct, rows: rows.sort((a, b) => String(b.start).localeCompare(String(a.start))), totals: T, payouts: paid, paidOut, owed: Math.max(0, T.manual - paidOut) };
}
export async function analytics() {
  const snap = await snapshot(); const set = await settings(); const users = await db.list('users'); const un = Object.fromEntries(users.map((u) => [u.id, u.name])); const rating = await reviewStats();
  const programs = Object.fromEntries((await db.list('programs')).map((p) => [p.id, p.title]));
  const paid = snap.orders.filter(paidish); const refunded = snap.orders.filter((o) => o.status === 'refunded');
  const passes = (await db.list('passes')).filter((p) => p.status === 'active');
  const T = { sales: paid.reduce((n, o) => n + value(o), 0), cash: paid.reduce((n, o) => n + cash(o), 0), tickets: paid.reduce((n, o) => n + o.qty, 0), orders: paid.length, refunds: refunded.length, refundAmt: refunded.reduce((n, o) => n + (o.amount || 0), 0), packSales: passes.reduce((n, p) => n + p.price, 0), packs: passes.length };
  const months = []; const d0 = new Date(); for (let i = 5; i >= 0; i--) { const d = new Date(d0.getFullYear(), d0.getMonth() - i, 1); months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-US', { month: 'short' }), cash: 0, tickets: 0 }); }
  for (const o of paid) { const m = months.find((x) => x.key === String(o.paidAt || o.createdAt).slice(0, 7)); if (m) { m.cash += cash(o); m.tickets += o.qty; } }
  for (const p of passes) { const m = months.find((x) => x.key === String(p.paidAt || p.createdAt).slice(0, 7)); if (m) m.cash += p.price; }
  const group = (keyFn) => { const g = {}; for (const o of paid) { const c = snap.cb[o.classId]; if (!c) continue; const k = keyFn(c); if (!k) continue; const x = (g[k] ||= { key: k, sales: 0, tickets: 0 }); x.sales += value(o); x.tickets += o.qty; } return Object.values(g).sort((a, b) => b.sales - a.sales); };
  const byState = group((c) => snap.vb[c.venueId]?.state || (c.mode === 'online' ? 'Online' : '')); const byProgram = group((c) => programs[c.programId] || 'Other');
  const byInstructor = group((c) => c.userId).map((x) => ({ ...x, name: un[x.key] || 'Unknown', rating: rating[x.key] || null }));
  const byCity = group((c) => { const v = snap.vb[c.venueId]; return v ? `${v.city}, ${v.state}` : ''; }).slice(0, 8);
  const top = group((c) => c.id).slice(0, 8).map((x) => ({ ...x, title: snap.cb[x.key]?.title || '', start: snap.cb[x.key]?.start || '' }));
  const past = snap.classes.filter((c) => !c.canceled && c.public !== false && Date.parse(c.start) < snap.now); let capSum = 0, soldSum = 0; for (const c of past) { const a = availability(c, snap); if (a.cap > 0) { capSum += a.cap; soldSum += a.sold; } }
  const attended = snap.tickets.filter((t) => t.status === 'valid'); const checked = attended.filter((t) => t.checkedInAt).length;
  const subs = (await db.list('subscribers')).filter((s) => !s.unsubscribed).length; const wl = (await db.list('waitlist')).filter((w) => !w.notifiedAt).length;
  const reviews = (await db.list('reviews')).filter((r) => !r.hidden); const avgRating = reviews.length ? Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10 : 0;
  // payouts: what each instructor is owed by hand (orders that did not split automatically)
  const payouts = []; for (const u of users.filter((x) => x.role !== 'admin' || snap.classes.some((c) => c.userId === x.id))) { const e = await earningsFor(u.id, snap, set); if (!e.rows.length && !e.paidOut) continue; payouts.push({ userId: u.id, name: u.name, connect: !!u.connect?.ready, net: e.totals.net, auto: e.totals.auto, manual: e.totals.manual, paidOut: e.paidOut, owed: e.owed }); }
  return { feePct: Number(set.feePct) || 0, totals: T, months, byState, byProgram, byInstructor, byCity, top, fillRate: capSum ? Math.round((soldSum / capSum) * 100) : null, attendRate: attended.length ? Math.round((checked / attended.length) * 100) : null, subscribers: subs, waitlist: wl, reviewCount: reviews.length, avgRating, payouts: payouts.sort((a, b) => b.owed - a.owed) };
}
