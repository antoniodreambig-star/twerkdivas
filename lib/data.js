import { reviewStats, reviewsFor } from './reviews';
import * as db from './db';
import { DEFAULT_PROGRAMS, DEFAULT_SETTINGS, withBlurbs } from './rules';
import { safeUser } from './auth';
import { snapshot, availability, onSale } from './tickets';

let seeded = false;
export async function ensureSeed() {
  if (seeded) return; const have = await db.list('programs'); const flag = await db.get('settings', 'seeded').catch(() => null);
  if (!have.length && !flag) await db.putMany('programs', DEFAULT_PROGRAMS);
  if (!flag) await db.put('settings', 'seeded', { id: 'seeded', at: new Date().toISOString() });
  seeded = true;
}
export async function settings() { return { ...DEFAULT_SETTINGS, ...((await db.get('settings', 'app').catch(() => null)) || {}) }; }
const byOrder = (a, b) => (a.order || 0) - (b.order || 0) || String(a.title).localeCompare(String(b.title));
const certsOf = (subs, userId) => subs.filter((s) => s.userId === userId && s.status === 'approved').map((s) => ({ programId: s.programId, at: s.reviewedAt }));

export async function memberView(u) {
  await ensureSeed();
  const snap = await snapshot();
  const [programs, videos, progress, subs, ann, res, classes, msgs, set, users] = await Promise.all([db.list('programs'), db.list('videos'), db.list('progress'), db.list('submissions'), db.list('announcements'), db.list('resources'), db.list('classes'), db.list('messages'), settings(), db.list('users')]);
  const nm = Object.fromEntries(users.map((x) => [x.id, x.name]));
  const mine = (x) => x.userId === u.id; const now = Date.now() - 36e5;
  return {
    me: safeUser(u), settings: { welcome: set.welcome, agreement: set.agreement, prereqs: set.prereqs },
    programs: withBlurbs(programs.sort(byOrder)), videos: videos.filter((v) => v.published !== false).sort(byOrder),
    progress: progress.filter(mine).filter((p) => p.done).map((p) => p.videoId),
    submissions: subs.filter(mine).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    certs: certsOf(subs, u.id),
    announcements: ann.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 20),
    resources: res.sort(byOrder),
    classes: classes.filter(mine).sort((a, b) => String(a.start).localeCompare(String(b.start))).map((c) => { const a = availability(c, snap); return { ...c, cap: a.cap, sold: a.sold, left: a.left, checkedIn: a.checkedIn }; }),
    venues: snap.venues.filter((v) => v.active !== false && !v.popup).sort((a, b) => `${a.state}${a.city}${a.name}`.localeCompare(`${b.state}${b.city}${b.name}`)).map((v) => ({ id: v.id, name: v.name, city: v.city, state: v.state, capacity: v.capacity, tz: v.tz })),
    upcoming: classes.filter((c) => c.public !== false && !c.canceled && new Date(c.start).getTime() >= now).sort((a, b) => String(a.start).localeCompare(String(b.start))).slice(0, 60).map((c) => ({ ...c, who: nm[c.userId] || '' })),
    messages: msgs.filter(mine).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))),
  };
}
export async function adminView() {
  await ensureSeed();
  const [users, programs, videos, progress, subs, ann, res, msgs, classes, set] = await Promise.all([db.list('users'), db.list('programs'), db.list('videos'), db.list('progress'), db.list('submissions'), db.list('announcements'), db.list('resources'), db.list('messages'), db.list('classes'), settings()]);
  const names = Object.fromEntries(users.map((x) => [x.id, x.name]));
  const done = {}; for (const p of progress) if (p.done) done[p.userId] = (done[p.userId] || 0) + 1;
  const members = users.map((x) => ({ ...safeUser(x), videosDone: done[x.id] || 0, certs: certsOf(subs, x.id).map((c) => c.programId), classes: classes.filter((c) => c.userId === x.id).length })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const snap = await snapshot();
  const live = (x) => x.role === 'admin' || x.comp || ['active', 'trialing', 'past_due'].includes(x.sub?.status);
  const threads = {}; for (const m of msgs) (threads[m.userId] ||= []).push(m);
  return {
    setup: (await import('./health')).setupSummary(), settings: set, programs: withBlurbs(programs.sort(byOrder)), videos: videos.sort(byOrder), announcements: ann.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))), resources: res.sort(byOrder),
    venues: snap.venues.filter((v) => !v.popup).map((v) => ({ ...v, upcoming: snap.classes.filter((c) => c.venueId === v.id && !c.canceled && Date.parse(c.start) > Date.now()).length })).sort((a, b) => `${a.state}${a.city}${a.name}`.localeCompare(`${b.state}${b.city}${b.name}`)),
    classRows: classRows(snap, users, programs0(programs), set), ticketStats: ticketStats(snap),
    popups: snap.classes.filter((c) => c.popup).map((c) => { const a = availability(c, snap); const v = snap.vb[c.venueId] || {}; return { id: c.id, title: c.title, tagline: c.tagline || '', notes: c.notes || '', instructorId: c.userId, instructor: names[c.userId] || '', start: c.start, end: c.end || '', tz: c.tz || v.tz || 'America/Chicago', price: c.price || 0, public: c.public !== false, canceled: !!c.canceled, programId: c.programId || '', venueName: v.name || '', address: v.address || '', city: v.city || '', state: v.state || '', zip: v.zip || '', capacity: v.capacity || 0, sold: a.sold, left: a.left, checkedIn: a.checkedIn }; }).sort((a, b) => String(b.start).localeCompare(String(a.start))),
    members, stats: { total: users.filter((x) => x.role !== 'admin').length, active: users.filter((x) => x.role !== 'admin' && live(x)).length, paying: users.filter((x) => x.sub?.status === 'active' && !x.comp).length, pending: subs.filter((s) => s.status === 'pending').length, unpaid: users.filter((x) => x.role !== 'admin' && !live(x)).length },
    submissions: subs.map((s) => ({ ...s, name: names[s.userId] || 'Unknown', cpr: users.find((x) => x.id === s.userId)?.cpr || null })).sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || String(b.createdAt).localeCompare(String(a.createdAt))),
    threads: Object.entries(threads).map(([uid, list]) => ({ userId: uid, name: names[uid] || 'Unknown', list: list.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))), unread: list.filter((m) => m.from === 'member' && !m.read).length })).sort((a, b) => b.unread - a.unread || String(b.list.at(-1).createdAt).localeCompare(String(a.list.at(-1).createdAt))),
  };
}

const programs0 = (list) => Object.fromEntries(list.map((p) => [p.id, p.title]));
const liveUser = (x) => !!x && !x.suspended && (x.role === 'admin' || x.comp || ['active', 'trialing', 'past_due'].includes(x.sub?.status));
function classRows(snap, users, pn, set) {
  const un = Object.fromEntries(users.map((x) => [x.id, x.name])); const fee = Math.min(100, Math.max(0, Number(set.feePct) || 0));
  return snap.classes.filter((c) => Date.parse(c.start) > Date.now() - 60 * 864e5).map((c) => {
    const a = availability(c, snap); const v = snap.vb[c.venueId]; const os = snap.orders.filter((o) => o.classId === c.id);
    const gross = os.filter((o) => o.status === 'paid').reduce((n, o) => n + o.amount, 0);
    return { id: c.id, title: c.title, instructor: un[c.userId] || '', program: pn[c.programId] || '', mode: c.mode, venue: v?.name || '', city: v?.city || '', state: v?.state || '', start: c.start, tz: c.tz || 'America/Chicago', price: c.price || 0, cap: a.cap, sold: a.sold, checkedIn: a.checkedIn, gross, share: Math.round(gross * (1 - fee / 100)), canceled: !!c.canceled, refundDue: os.filter((o) => o.status === 'refund_due').length, public: c.public !== false };
  }).sort((a, b) => String(b.start).localeCompare(String(a.start)));
}
function ticketStats(snap) {
  const paid = snap.orders.filter((o) => o.status === 'paid'); const valid = snap.tickets.filter((t) => t.status === 'valid');
  return { orders: paid.length, tickets: valid.length, checkedIn: valid.filter((t) => t.checkedInAt).length, gross: paid.reduce((n, o) => n + o.amount, 0), refundDue: snap.orders.filter((o) => o.status === 'refund_due').length };
}

// ---------- public website ----------
function cardOf(c, snap, un, pn) {
  const v = snap.vb[c.venueId]; const a = availability(c, snap);
  return { id: c.id, tz: c.tz || v?.tz || 'America/Chicago', title: c.title, programId: c.programId || '', program: pn[c.programId] || '', instructorId: c.userId, instructor: un[c.userId]?.name || '', start: c.start, end: c.end || '', mode: c.mode, price: c.price || 0, bookUrl: c.bookUrl || '', bookNote: c.bookNote || '', notes: c.notes || '', cap: a.cap, left: a.left, open: onSale(c, snap.now), canceled: !!c.canceled, popup: !!c.popup, tagline: c.tagline || '', venue: v ? { id: v.id, slug: v.slug, name: v.name, city: v.city, state: v.state, address: v.address } : null, city: v?.city || '', state: v?.state || '' };
}
async function publicBase() {
  const [snap, users, programs] = await Promise.all([snapshot(), db.list('users'), db.list('programs')]);
  return { snap, un: Object.fromEntries(users.map((u) => [u.id, u])), pn: programs2(programs), programs, users };
}
const programs2 = (l) => Object.fromEntries(l.map((p) => [p.id, p.title]));
export async function publicClasses(f = {}) {
  const { snap, un, pn } = await publicBase(); const q = String(f.q || '').toLowerCase().trim();
  return snap.classes.filter((c) => c.public !== false && !c.canceled && Date.parse(c.start) > snap.now && liveUser(un[c.userId]) && (c.mode === 'online' || snap.vb[c.venueId]?.active !== false)
    && (!f.state || snap.vb[c.venueId]?.state === f.state) && (!f.city || snap.vb[c.venueId]?.city === f.city) && (!f.program || c.programId === f.program) && (!f.mode || c.mode === f.mode) && (!f.venue || snap.vb[c.venueId]?.id === f.venue) && (!f.instructor || c.userId === f.instructor)
    && (!q || `${c.title} ${un[c.userId]?.name} ${snap.vb[c.venueId]?.name || ''}`.toLowerCase().includes(q)))
    .sort((a, b) => String(a.start).localeCompare(String(b.start))).slice(0, 200).map((c) => cardOf(c, snap, un, pn));
}
export async function classPage(id) {
  const { snap, un, pn } = await publicBase(); const c = snap.cb[id]; if (!c || c.public === false || !liveUser(un[c.userId])) return null;
  const ins = un[c.userId]; const subs = await db.list('submissions'); const rate = (await reviewStats())[c.userId] || null; const reviews = await reviewsFor({ userId: c.userId }, 6);
  return { ...cardOf(c, snap, un, pn), rating: rate, reviews, instructorBio: ins.bio || '', instructorPhoto: ins.photo || '', venueFull: snap.vb[c.venueId] || null, certified: subs.some((s) => s.userId === c.userId && s.status === 'approved' && (!c.programId || s.programId === c.programId)) };
}
export async function publicVenues(f = {}) {
  const { snap } = await publicBase(); const q = String(f.q || '').toLowerCase().trim();
  const all = snap.venues.filter((v) => v.active !== false && !v.popup);
  const states = [...new Set(all.map((v) => v.state))].sort(); const cities = {}; for (const v of all) (cities[v.state] ||= new Set()).add(v.city);
  const rows = all.filter((v) => (!f.state || v.state === f.state) && (!f.city || v.city === f.city) && (!q || `${v.name} ${v.city}`.toLowerCase().includes(q)))
    .map((v) => ({ id: v.id, slug: v.slug, name: v.name, address: v.address, city: v.city, state: v.state, zip: v.zip || '', capacity: v.capacity, website: v.website || '', phone: v.phone || '', notes: v.notes || '', upcoming: snap.classes.filter((c) => c.venueId === v.id && onSale(c, snap.now)).length }))
    .sort((a, b) => `${a.state}${a.city}${a.name}`.localeCompare(`${b.state}${b.city}${b.name}`));
  return { rows, states, cities: Object.fromEntries(Object.entries(cities).map(([k, v]) => [k, [...v].sort()])) };
}
export async function venueBySlug(slug) { const v = (await db.list('venues')).find((x) => x.slug === slug && x.active !== false && !x.popup); return v || null; }
export async function publicInstructors(f = {}) {
  const { snap, users, programs } = await publicBase(); const subs = await db.list('submissions'); const pn = programs2(programs); const q = String(f.q || '').toLowerCase().trim(); const rate = await reviewStats();
  return users.filter((u) => u.listed !== false && liveUser(u))
    .map((u) => ({ id: u.id, name: u.name, bio: u.bio || '', photo: u.photo || '', city: u.city || '', instagram: u.instagram || '', tiktok: u.tiktok || '', website: u.website || '', specialties: u.specialties || '', cities: u.cities || '', rating: rate[u.id] || null, certifiedIds: [...new Set(subs.filter((s) => s.userId === u.id && s.status === 'approved').map((s) => s.programId))], upcoming: snap.classes.filter((c) => c.userId === u.id && onSale(c, snap.now)).length }))
    .map((i) => ({ ...i, certified: i.certifiedIds.map((x) => pn[x]).filter(Boolean) })).filter((i) => i.certified.length)
    .filter((i) => (!f.city || i.city.toLowerCase() === String(f.city).toLowerCase()) && (!f.program || i.certifiedIds.includes(f.program)) && (!q || `${i.name} ${i.bio}`.toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name));
}
export async function publicPrograms() { return withBlurbs((await db.list('programs')).sort(byOrder)); }

export async function publicPopups() {
  const { snap, un, pn } = await publicBase();
  return snap.classes.filter((c) => c.popup && c.public !== false && !c.canceled && Date.parse(c.start) > snap.now && liveUser(un[c.userId]))
    .sort((a, b) => String(a.start).localeCompare(String(b.start))).map((c) => ({ ...cardOf(c, snap, un, pn), instructorPhoto: un[c.userId]?.photo || '', instructorBio: un[c.userId]?.bio || '', venueFull: snap.vb[c.venueId] || null }));
}
