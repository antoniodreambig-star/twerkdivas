export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { currentUser, hasAccess, hashPassword, safeUser } from '@/lib/auth';
import { AGREEMENT_VERSION, isEmail } from '@/lib/rules';
import { memberView, adminView, settings } from '@/lib/data';
import { cleanUrl, cleanVideoRef } from '@/lib/video';
import { str } from '@/lib/rules';
import { STATES, slugify, STATE_TZ, TZ_OPTIONS, DEFAULT_TZ } from '@/lib/us';
import { zonedToUtcISO } from '@/lib/tz';
import { snapshot, availability, slot, refundOrder, cancelClass, maskEmail } from '@/lib/tickets';
import { healthChecks, setupSummary } from '@/lib/health';
import { analytics, earningsFor } from '@/lib/reports';
import { runBackup, listBackups } from '@/lib/backup';
import { unsubscribe } from '@/lib/subscribers';
import { addDays, topUpSeries, startOngoing, AHEAD_WEEKS } from '@/lib/series';

const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const url = (v, label) => { const x = str(v, 600); if (!x) return ''; const c = cleanUrl(x); if (!c) throw new Error(`${label} must be a full https:// link`); return c; };
// Saves an uploaded photo (a small data: URL made in the browser) and returns the link to show it.
async function savePhoto(userId, data) {
  const d = String(data || ''); if (!d) { await db.del('photos', userId); return ''; }
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(d)) throw new Error('Upload a JPG, PNG or WebP image');
  if (d.length > 700000) throw new Error('That photo is too large. Try a smaller one.');
  await db.put('photos', userId, { id: userId, data: d, at: new Date().toISOString() }); return `/api/photo/${userId}?v=${Date.now().toString(36)}`;
}
const date = (v, label) => { const t = new Date(v); if (!v || Number.isNaN(t.getTime())) throw new Error(`Pick a valid ${label}`); return t.toISOString(); };

export async function GET(req) {
  const u = await currentUser(); if (!u) return bad('Sign in first', 401);
  const view = new URL(req.url).searchParams.get('view');
  if (view === 'admin') return u.role === 'admin' ? NextResponse.json(await adminView()) : bad('Admins only', 403);
  if (view === 'health') return u.role === 'admin' ? NextResponse.json({ checks: await healthChecks(), setup: setupSummary() }) : bad('Admins only', 403);
  if (view === 'analytics') return u.role === 'admin' ? NextResponse.json(await analytics()) : bad('Admins only', 403);
  if (view === 'audience') { if (u.role !== 'admin') return bad('Admins only', 403); const l = (await db.list('subscribers')).sort((a, b) => String(b.optInAt).localeCompare(String(a.optInAt))); return NextResponse.json({ subscribers: l, active: l.filter((x) => !x.unsubscribed).length }); }
  if (view === 'backups') return u.role === 'admin' ? NextResponse.json({ backups: await listBackups() }) : bad('Admins only', 403);
  if (view === 'orders') { if (u.role !== 'admin') return bad('Admins only', 403); const cid = new URL(req.url).searchParams.get('classId'); return NextResponse.json({ orders: (await db.list('orders')).filter((o) => o.classId === cid).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).map((o) => ({ id: o.id, name: o.name, email: o.email, qty: o.qty, amount: o.amount, status: o.status, createdAt: o.createdAt, refundError: o.refundError || '' })) }); }
  if (view === 'me') { const s = await settings(); return NextResponse.json({ me: safeUser(u), access: hasAccess(u), settings: { price: s.price, welcome: s.welcome, agreement: s.agreement } }); }
  if (!hasAccess(u)) return bad('Membership required', 402);
  if (view === 'earnings') return NextResponse.json(await earningsFor(u.id));
  if (view === 'roster') {
    const c = await db.get('classes', new URL(req.url).searchParams.get('classId') || ''); if (!c || (c.userId !== u.id && u.role !== 'admin')) return bad('Not your class', 403);
    const snap = await snapshot(); const a = availability(c, snap); const v = snap.vb[c.venueId];
    return NextResponse.json({ cls: { id: c.id, title: c.title, start: c.start, end: c.end || '', mode: c.mode, tz: c.tz || 'America/Chicago', canceled: !!c.canceled, venue: v ? `${v.name}, ${v.city}, ${v.state}` : '', venueCap: a.venueCap }, cap: a.cap, sold: a.sold, checkedIn: a.checkedIn,
      tickets: snap.tickets.filter((t) => t.classId === c.id && t.status === 'valid').sort((x, y) => x.name.localeCompare(y.name)).map((t) => ({ id: t.id, code: t.code, name: t.name, checkedInAt: t.checkedInAt || '', email: maskEmail(snap.ob[t.orderId]?.email || '') })) });
  }
  await topUpSeries({ userId: u.id }).catch(() => 0);
  return NextResponse.json(await memberView(u));
}

export async function POST(req) {
  const u = await currentUser(); if (!u) return bad('Sign in first', 401);
  try {
    const b = await req.json(); const op = String(b.op || ''); const admin = u.role === 'admin'; const out = {};
    // ----- admin only -----
    if (/^((program|video|announce|resource|member|reply|settings|venue|order|popup|cert)\.|class\.cancel$)/.test(op) || op === 'review' || /^(rating|payout|backup|audience)\./.test(op)) {
      if (!admin) return bad('Admins only', 403);
      const now = new Date().toISOString();
      switch (op) {
        case 'program.save': { const id = b.id || `prog-${db.uid()}`; const old = b.id ? await db.get('programs', id) : null; const title = str(b.title, 80); if (!title) throw new Error('Name the program'); await db.put('programs', id, { ...(old || {}), id, title, blurb: str(b.blurb, 300), certInfo: b.certInfo !== undefined ? str(b.certInfo, 1500) : old?.certInfo || '', order: Number(b.order) || old?.order || 99 }); break; }
        case 'program.del': {
          const pid = str(b.id, 60); if ((await db.list('videos')).some((v) => v.programId === pid)) throw new Error('Remove or move its videos first');
          // Take the badge away from everyone certified in it, so no orphaned certificates keep showing up.
          const subs = (await db.list('submissions')).filter((x) => x.programId === pid && ['approved', 'pending'].includes(x.status));
          await db.putMany('submissions', subs.map((x) => ({ ...x, status: 'revoked', feedback: 'This program was removed.', reviewedAt: now })));
          await db.del('programs', pid); break; }
        // ----- certifications (one per program) -----
        case 'cert.grant': {
          const t = await db.get('users', str(b.userId, 60)); if (!t) throw new Error('Pick an instructor');
          const prog = await db.get('programs', str(b.programId, 60)); if (!prog) throw new Error('Unknown certification'); if (prog.cert === false) throw new Error('Turn this certification back on first');
          const mine = (await db.list('submissions')).filter((x) => x.userId === t.id && x.programId === prog.id);
          if (mine.some((x) => x.status === 'approved')) throw new Error(`${t.name} is already certified in ${prog.title}`);
          const pend = mine.find((x) => x.status === 'pending');
          if (pend) await db.put('submissions', pend.id, { ...pend, status: 'approved', feedback: '', reviewedAt: now });
          else { const sid = `sub-${db.uid()}`; await db.put('submissions', sid, { id: sid, userId: t.id, programId: prog.id, url: '', note: 'Certified by admin', status: 'approved', createdAt: now, reviewedAt: now, feedback: '' }); }
          break; }
        case 'cert.revoke': {
          const s = await db.get('submissions', str(b.id, 60)); if (!s || s.status !== 'approved') throw new Error('That certification was not found');
          await db.put('submissions', s.id, { ...s, status: 'revoked', feedback: str(b.reason, 2000) || 'Your certification was removed by the Cakes and Core team.', reviewedAt: now }); break; }
        case 'cert.hide': {
          // Hidden: members who don't already have it can't see it or apply for it. People who hold it keep their badge.
          const prog = await db.get('programs', str(b.id, 60)); if (!prog) throw new Error('Unknown certification');
          await db.put('programs', prog.id, { ...prog, certHidden: !!b.hidden }); break; }
        case 'cert.retire': {
          // Removes a certification type: the program and its videos stay, but nobody holds or can earn this badge until it is turned back on.
          const prog = await db.get('programs', str(b.id, 60)); if (!prog) throw new Error('Unknown certification');
          const subs = (await db.list('submissions')).filter((x) => x.programId === prog.id && ['approved', 'pending'].includes(x.status));
          await db.putMany('submissions', subs.map((x) => ({ ...x, status: 'revoked', retired: true, prevStatus: x.status, prevFeedback: x.feedback || '', feedback: 'This certification is no longer offered.', reviewedAt: now })));
          await db.put('programs', prog.id, { ...prog, cert: false, certRemovedAt: now }); out.removed = subs.filter((x) => x.status === 'approved').length; break; }
        case 'cert.restore': {
          const prog = await db.get('programs', str(b.id, 60)); if (!prog) throw new Error('Unknown certification');
          // Give back exactly the badges (and pending reviews) that removing the certification took away.
          const subs = (await db.list('submissions')).filter((x) => x.programId === prog.id && x.status === 'revoked' && x.retired);
          await db.putMany('submissions', subs.map(({ retired, prevStatus, prevFeedback, ...x }) => ({ ...x, status: prevStatus || 'approved', feedback: prevFeedback || '' })));
          const { cert, certRemovedAt, ...rest } = prog; await db.put('programs', prog.id, rest); out.restored = subs.filter((x) => x.prevStatus !== 'pending').length; break; }
        case 'video.save': {
          const id = b.id || `vid-${db.uid()}`; const old = b.id ? await db.get('videos', id) : null; const title = str(b.title, 120); if (!title) throw new Error('Name the video');
          if (!(await db.get('programs', str(b.programId, 60)))) throw new Error('Pick a program');
          await db.put('videos', id, { ...(old || { createdAt: now }), id, programId: b.programId, title, url: (() => { const c = cleanVideoRef(b.url); if (!c) throw new Error('The video must be a full https:// link or a mux: playback ID'); return c; })(), level: ['Beginner', 'Intermediate', 'Advanced'].includes(b.level) ? b.level : 'Beginner', minutes: Math.max(0, Math.min(600, Number(b.minutes) || 0)), notes: str(b.notes, 4000), music: str(b.music, 300), order: Number(b.order) || old?.order || 99, published: b.published !== false }); break; }
        case 'video.del': await db.del('videos', str(b.id, 60)); break;
        case 'announce.save': { const id = b.id || `ann-${db.uid()}`; const old = b.id ? await db.get('announcements', id) : null; if (!str(b.title)) throw new Error('Add a title'); await db.put('announcements', id, { ...(old || { createdAt: now }), id, title: str(b.title, 120), body: str(b.body, 2000), pinned: !!b.pinned }); break; }
        case 'announce.del': await db.del('announcements', str(b.id, 60)); break;
        case 'resource.save': { const id = b.id || `res-${db.uid()}`; const old = b.id ? await db.get('resources', id) : null; if (!str(b.title)) throw new Error('Add a title'); await db.put('resources', id, { ...(old || {}), id, title: str(b.title, 120), url: url(b.url, 'The link'), desc: str(b.desc, 300), kind: str(b.kind, 30) || 'Link', order: Number(b.order) || old?.order || 99 }); break; }
        case 'resource.del': await db.del('resources', str(b.id, 60)); break;
        case 'member.create': {
          const name = str(b.name, 80), email = str(b.email, 120).toLowerCase(), pw = String(b.password || '');
          if (!name) throw new Error('Add their name'); if (!isEmail(email)) throw new Error('Enter a valid email'); if (pw.length < 8) throw new Error('Give them a temporary password of at least 8 characters');
          if ((await db.list('users')).some((x) => x.email === email)) throw new Error('That email already has an account');
          const id = `u-${db.uid()}`;
          await db.put('users', id, { id, email, name, role: 'member', hash: hashPassword(pw), city: str(b.city, 60), phone: str(b.phone, 30), comp: !!b.comp, createdAt: now, addedByAdmin: true, ...(b.agreed ? { agreedAt: now, agreedVersion: AGREEMENT_VERSION } : {}) });
          for (const pid of Array.isArray(b.certified) ? b.certified.slice(0, 20) : []) { const cp = await db.get('programs', str(pid, 60)); if (!cp || cp.cert === false) continue; const sid = `sub-${db.uid()}`; await db.put('submissions', sid, { id: sid, userId: id, programId: pid, url: '', note: 'Certified by admin', status: 'approved', createdAt: now, reviewedAt: now, feedback: '' }); }
          break; }
        case 'member.update': {
          const t = await db.get('users', str(b.id, 60)); if (!t) throw new Error('Unknown member'); if (t.id === u.id && (b.suspended || b.role === 'member')) throw new Error('You cannot lock yourself out');
          if ('comp' in b) t.comp = !!b.comp; if ('suspended' in b) t.suspended = !!b.suspended; if (b.role === 'admin' || b.role === 'member') t.role = b.role;
          if ('photoData' in b) t.photo = await savePhoto(t.id, b.photoData);
          if (b.password) { if (String(b.password).length < 8) throw new Error('Use at least 8 characters'); t.hash = hashPassword(String(b.password)); t.sessionsAfter = Date.now(); }
          await db.put('users', t.id, t); break; }
        case 'reply.send': { const t = str(b.text, 2000); if (!t || !b.userId) throw new Error('Write a reply'); await db.put('messages', `msg-${db.uid()}`, { id: `msg-${db.uid()}`, userId: b.userId, from: 'admin', text: t, createdAt: now, read: false }); for (const m of (await db.list('messages')).filter((x) => x.userId === b.userId && x.from === 'member' && !x.read)) await db.put('messages', m.id, { ...m, read: true }); break; }
        case 'settings.save': { const cur = await settings(); await db.put('settings', 'app', { id: 'app', ...cur, price: str(b.price, 60), welcome: str(b.welcome, 400), agreement: str(b.agreement, 5000), prereqs: str(b.prereqs, 300), feePct: Math.min(100, Math.max(0, Number(b.feePct) || 0)), contactEmail: str(b.contactEmail, 120), cancelHours: Math.min(720, Math.max(0, Math.floor(Number(b.cancelHours ?? cur.cancelHours ?? 48)))), terms: str(b.terms ?? cur.terms, 20000), privacy: str(b.privacy ?? cur.privacy, 20000), refundPolicy: str(b.refundPolicy ?? cur.refundPolicy, 20000), waiver: str(b.waiver ?? cur.waiver, 20000),
          packs: Array.isArray(b.packs) ? b.packs.slice(0, 6).map((p, i) => ({ id: str(p.id, 30) || `pk${i + 1}`, name: str(p.name, 60), credits: Math.floor(Number(p.credits)), price: Math.round((Number(p.price) || 0) * 100) })).filter((p) => { if (!p.name) return false; if (!(p.credits >= 2 && p.credits <= 50)) throw new Error(`Pack "${p.name}" needs 2 to 50 classes`); if (!(p.price >= 100 && p.price <= 100000)) throw new Error(`Pack "${p.name}" needs a price from $1 to $1,000`); return true; }) : (cur.packs || []) }); break; }
        case 'rating.hide': { const r = await db.get('reviews', str(b.id, 80)); if (r) await db.put('reviews', r.id, { ...r, hidden: b.hidden !== false }); break; }
        case 'payout.record': { const ins = await db.get('users', str(b.userId, 60)); if (!ins) throw new Error('Unknown instructor'); const cents = Math.round((Number(b.amount) || 0) * 100); if (!(cents > 0 && cents <= 10000000)) throw new Error('Enter the amount you paid out'); const id = `pay-${db.uid()}`; await db.put('payouts', id, { id, userId: ins.id, amount: cents, method: str(b.method, 40), note: str(b.note, 200), at: now }); break; }
        case 'payout.del': await db.del('payouts', str(b.id, 60)); break;
        case 'backup.run': out.backup = await runBackup({ email: b.email !== false }); break;
        case 'audience.unsub': await unsubscribe(str(b.email, 120)); break;
        case 'venue.save': {
          const id = b.id || `ven-${db.uid()}`; const old = b.id ? await db.get('venues', id) : null; const name = str(b.name, 100), city = str(b.city, 60), address = str(b.address, 160), st = String(b.state || '').toUpperCase();
          if (!name) throw new Error('Name the studio'); if (!address) throw new Error('Add the street address'); if (!city) throw new Error('Add the city'); if (!STATES[st]) throw new Error('Pick a state');
          const cap = Math.floor(Number(b.capacity)); if (!(cap >= 1 && cap <= 5000)) throw new Error('Set the maximum attendance (1 to 5,000)');
          if (old && cap < old.capacity) { const snap = await snapshot(); for (const c of snap.classes.filter((x) => x.venueId === id && !x.canceled && Date.parse(x.start) > Date.now())) if (availability(c, snap).sold > cap) throw new Error(`"${c.title}" already has more tickets sold than ${cap}. Lower the limit after that class.`); }
          const all = await db.list('venues'); let slug = old?.slug; if (!slug) { const base = slugify(`${name} ${city}`) || 'studio'; slug = base; let n = 2; while (all.some((x) => x.slug === slug)) slug = `${base}-${n++}`; }
          await db.put('venues', id, { ...(old || { createdAt: now }), id, slug, name, address, city, state: st, zip: str(b.zip, 10), tz: TZ_OPTIONS.some((z) => z[0] === b.tz) ? b.tz : (STATE_TZ[st] || DEFAULT_TZ), capacity: cap, website: url(b.website, 'The website link'), phone: str(b.phone, 30), notes: str(b.notes, 300), active: b.active !== false }); break; }
        case 'venue.del': {
          const v = await db.get('venues', str(b.id, 60)); if (!v) break;
          if ((await db.list('classes')).some((c) => c.venueId === v.id)) { await db.put('venues', v.id, { ...v, active: false }); out.message = 'This studio has classes on record, so it was hidden instead of deleted.'; } else await db.del('venues', v.id); break; }
        case 'popup.save': {
          const id = b.id || `cls-pop-${db.uid()}`; const old = b.id ? await db.get('classes', id) : null; if (b.id && !old?.popup) throw new Error('Unknown pop-up event');
          const title = str(b.title, 100); if (!title) throw new Error('Name the event'); const ins = await db.get('users', str(b.instructorId, 60)); if (!ins || ins.suspended) throw new Error('Choose the instructor from the list');
          const vname = str(b.venueName, 100), address = str(b.address, 160), city = str(b.city, 60), st = String(b.state || '').toUpperCase(); if (!vname) throw new Error('Add the location name'); if (!address) throw new Error('Add the street address'); if (!city) throw new Error('Add the city'); if (!STATES[st]) throw new Error('Pick a state');
          const cap = Math.floor(Number(b.capacity)); if (!(cap >= 1 && cap <= 5000)) throw new Error('Set the capacity (1 to 5,000)');
          const LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/; if (!LOCAL.test(String(b.start || ''))) throw new Error('Pick the date and start time'); if (b.end && !LOCAL.test(String(b.end))) throw new Error('Pick a valid end time');
          const tz = TZ_OPTIONS.some((z) => z[0] === b.tz) ? b.tz : (STATE_TZ[st] || DEFAULT_TZ); const start = zonedToUtcISO(b.start, tz), end = b.end ? zonedToUtcISO(b.end, tz) : '';
          if (end && Date.parse(end) <= Date.parse(start)) throw new Error('The end time must be after the start time'); if ((!old || old.start !== start) && Date.parse(start) < Date.now()) throw new Error('Pick a start time in the future');
          const cents = Math.round((Number(b.price) || 0) * 100); if (!(cents === 0 || (cents >= 50 && cents <= 20000))) throw new Error('Ticket price must be $0 (free) or between $0.50 and $200');
          if (old) { const snap = await snapshot(); const sold = availability(old, snap).sold; if (sold > 0) { if (start !== old.start || end !== (old.end || '')) throw new Error('Tickets are already sold, so the date and time are locked. Cancel the event to refund buyers.'); if (cap < sold) throw new Error(`${sold} tickets are already sold. Use ${sold} or more.`); } }
          const vid = old?.venueId || `ven-pop-${db.uid()}`; const oldV = await db.get('venues', vid);
          await db.put('venues', vid, { ...(oldV || { createdAt: now }), id: vid, slug: oldV?.slug || vid, name: vname, address, city, state: st, zip: str(b.zip, 10), tz, capacity: cap, website: '', phone: '', notes: '', active: true, popup: true });
          await db.put('classes', id, { ...(old || {}), id, popup: true, userId: ins.id, title, tagline: str(b.tagline, 140), programId: str(b.programId, 60), start, end, mode: 'in-person', venueId: vid, tz, spots: 0, price: cents, link: '', notes: str(b.notes, 2000), public: b.public !== false }); break; }
        case 'popup.del': {
          const c = await db.get('classes', str(b.id, 80)); if (!c?.popup) break; const os = (await db.list('orders')).filter((o) => o.classId === c.id);
          if (os.some((o) => !['expired', 'canceled'].includes(o.status) && !(o.status === 'held' && o.holdUntil < Date.now()))) throw new Error('This event has ticket orders. Use Cancel & refund under Classes & tickets.');
          await db.delMany('tickets', (await db.list('tickets')).filter((t) => t.classId === c.id).map((t) => t.id)); await db.delMany('orders', os.map((o) => o.id)); await db.del('classes', c.id); if (c.venueId) await db.del('venues', c.venueId); break; }
        case 'class.cancel': { const r = await cancelClass(str(b.id, 80)); out.refunded = r.refunded; out.failed = r.failed; break; }
        case 'order.refund': await refundOrder(str(b.id, 80)); break;
        case 'review': {
          const s = await db.get('submissions', str(b.id, 60)); if (!s) throw new Error('Unknown submission'); if (!['approved', 'changes'].includes(b.status)) throw new Error('Choose approve or request changes');
          if (b.status === 'approved' && (await db.get('programs', s.programId))?.cert === false) throw new Error('This certification is turned off. Turn it back on under Certifications first.');
          const { retired, prevStatus, prevFeedback, ...rest } = s; await db.put('submissions', s.id, { ...rest, status: b.status, feedback: str(b.feedback, 2000), reviewedAt: now }); break; }
      }
      return NextResponse.json({ ok: true, ...out });
    }
    // ----- members (active subscription or free pass) -----
    if (!hasAccess(u)) return bad('Membership required', 402);
    const now = new Date().toISOString();
    switch (op) {
      case 'progress': { const v = await db.get('videos', str(b.videoId, 60)); if (!v || v.published === false) throw new Error('Unknown video'); const id = `${u.id}_${v.id}`; await db.put('progress', id, { id, userId: u.id, videoId: v.id, done: !!b.done, at: now }); break; }
      case 'submit': {
        const prog = await db.get('programs', str(b.programId, 60)); if (!prog) throw new Error('Pick a program'); if (prog.cert === false) throw new Error('This certification is not offered right now');
        const subs = (await db.list('submissions')).filter((s) => s.userId === u.id && s.programId === prog.id);
        if (prog.certHidden && !subs.length) throw new Error('This certification is not offered right now');
        if (subs.some((s) => s.status === 'approved')) throw new Error('You are already certified in this program');
        if (subs.some((s) => s.status === 'pending')) throw new Error('You already have a video waiting for review');
        const link = url(b.url, 'Your video link'); if (!link) throw new Error('Add the link to your video');
        const id = `sub-${db.uid()}`; await db.put('submissions', id, { id, userId: u.id, programId: prog.id, url: link, note: str(b.note, 1000), status: 'pending', createdAt: now }); break; }
      case 'photo': { await db.put('users', u.id, { ...u, photo: await savePhoto(u.id, b.data) }); break; }
      case 'profile': {
        const cpr = b.cprUrl !== undefined ? url(b.cprUrl, 'The CPR/AED link') : u.cpr?.url || ''; const n = str(b.name, 80); if (!n) throw new Error('Add your name');
        await db.put('users', u.id, { ...u, name: n, bio: str(b.bio, 800), photo: b.photo === undefined || b.photo === u.photo ? (u.photo || '') : url(b.photo, 'The photo link'), city: str(b.city, 60), phone: str(b.phone, 30), listed: b.listed !== false, instagram: str(b.instagram, 60).replace(/^@/, ''), tiktok: str(b.tiktok, 60).replace(/^@/, ''), website: url(b.website, 'Your website link'), specialties: str(b.specialties, 200), cities: str(b.cities, 200), cpr: cpr ? { url: cpr, at: u.cpr?.url === cpr ? u.cpr.at : now } : null }); break; }
      case 'class.save': {
        const id = b.id || `cls-${db.uid()}`; const old = b.id ? await db.get('classes', id) : null; if (old && old.userId !== u.id) throw new Error('That is not your class'); if (old?.popup) throw new Error('Pop-up events are managed by Cakes and Core'); if (old?.canceled) throw new Error('This class was canceled');
        const title = str(b.title, 100); if (!title) throw new Error('Name the class'); const mode = b.mode === 'online' ? 'online' : 'in-person';
        const LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/; if (!LOCAL.test(String(b.start || ''))) throw new Error('Pick a valid start time'); if (b.end && !LOCAL.test(String(b.end))) throw new Error('Pick a valid end time');
        let tz = DEFAULT_TZ, venue = null; if (mode === 'in-person') { venue = await db.get('venues', str(b.venueId, 60)); if (!venue || venue.active === false) throw new Error('Choose a partner studio for in-person classes'); tz = venue.tz || STATE_TZ[venue.state] || DEFAULT_TZ; } else if (TZ_OPTIONS.some((z) => z[0] === b.tz)) tz = b.tz;
        const start = zonedToUtcISO(b.start, tz), end = b.end ? zonedToUtcISO(b.end, tz) : ''; if (end && Date.parse(end) <= Date.parse(start)) throw new Error('The end time must be after the start time');
        if ((!old || old.start !== start) && Date.parse(start) < Date.now()) throw new Error('Pick a start time in the future');
        const cents = Math.round((Number(b.price) || 0) * 100); if (!(cents === 0 || (cents >= 50 && cents <= 20000))) throw new Error('Ticket price must be $0 (free) or between $0.50 and $200');
        const pub = b.public !== false; let venueId = '', spots = Math.max(0, Math.min(1000, Math.floor(Number(b.spots) || 0)));
        if (mode === 'in-person') { const v = venue; venueId = v.id; if (spots > v.capacity) throw new Error(`${v.name} holds ${v.capacity} people at most. Use ${v.capacity} spots or fewer.`); }
        else if (!spots) throw new Error('Set how many spots the online class has (up to 1,000)');
        const programId = str(b.programId, 60);
        if (pub) { if (!programId || !(await db.get('programs', programId))) throw new Error('Choose the program for a public class'); if (!admin && !(await db.list('submissions')).some((x) => x.userId === u.id && x.programId === programId && x.status === 'approved')) throw new Error('You need to be certified in this program before you can sell tickets for it. You can save it as a private class for now.'); }
        if (old) { const snap = await snapshot(); const sold = availability(old, snap).sold; if (sold > 0) { if (venueId !== (old.venueId || '') || start !== old.start || end !== (old.end || '') || mode !== old.mode) throw new Error('Tickets are already sold, so the time, place and type are locked. Ask Cakes and Core to cancel the class if it cannot go ahead.'); if (spots > 0 && spots < sold) throw new Error(`${sold} tickets are already sold. Use ${sold} spots or more.`); if (!pub) throw new Error('Tickets are already sold, so this class has to stay public.'); } }
        const rec = { userId: u.id, title, programId, mode, venueId, tz, spots, price: cents, link: mode === 'online' ? url(b.link, 'The class link') : '', bookUrl: url(b.bookUrl, 'The outside booking link'), bookNote: str(b.bookNote, 300), notes: str(b.notes, 500), public: pub };
        // repeatWeeks 'ongoing' = every week until the instructor stops it: schedule AHEAD_WEEKS now, the rest are added as time passes.
        const ongoing = !old && b.repeatWeeks === 'ongoing'; const weeks = ongoing ? AHEAD_WEEKS : !old ? Math.min(12, Math.max(1, Math.floor(Number(b.repeatWeeks) || 1))) : 1;
        if (weeks > 1) { const seriesId = `ser-${db.uid()}`; for (let i = 0; i < weeks; i++) { const cid = `cls-${db.uid()}`; await db.put('classes', cid, { ...rec, id: cid, seriesId, start: zonedToUtcISO(addDays(b.start, 7 * i), tz), end: b.end ? zonedToUtcISO(addDays(b.end, 7 * i), tz) : '' }); }
          if (ongoing) await db.put('series', seriesId, { id: seriesId, userId: u.id, ongoing: true, lastLocal: addDays(b.start, 7 * (weeks - 1)), createdAt: now });
          out.created = weeks; break; }
        await db.put('classes', id, { ...(old || {}), id, ...rec, start, end }); break; }
      case 'series.ongoing': case 'series.stop': {
        const sid = str(b.seriesId, 60); const mine = (await db.list('classes')).filter((c) => c.seriesId === sid);
        if (!mine.length || mine.some((c) => c.userId !== u.id)) throw new Error('That is not your class series');
        if (op === 'series.ongoing') { out.added = await startOngoing(sid, u.id); break; }
        const s = await db.get('series', sid); if (s) await db.put('series', sid, { ...s, ongoing: false, stoppedAt: now }); break; }
      case 'class.del': {
        const c = await db.get('classes', str(b.id, 60)); if (!c || c.userId !== u.id || c.popup) break; const os = (await db.list('orders')).filter((o) => o.classId === c.id);
        if (os.some((o) => !['expired', 'canceled'].includes(o.status) && !(o.status === 'held' && o.holdUntil < Date.now()))) throw new Error('This class has ticket orders. Ask Cakes and Core to cancel it so buyers are refunded.');
        await db.delMany('tickets', (await db.list('tickets')).filter((t) => t.classId === c.id).map((t) => t.id)); await db.delMany('orders', os.map((o) => o.id)); await db.del('classes', c.id); break; }
      case 'checkin': {
        const tickets = await db.list('tickets'); const code = String(b.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const t = b.id ? tickets.find((x) => x.id === b.id) : code && tickets.find((x) => x.code === code); if (!t) throw new Error('No ticket found with that code');
        const c = await db.get('classes', t.classId); if (!c || (c.userId !== u.id && !admin)) throw new Error('That ticket is for a different class');
        if (c.canceled) throw new Error('This class was canceled'); if (t.status !== 'valid') throw new Error(t.status === 'void' ? 'This ticket was canceled or refunded' : 'This ticket is not paid yet');
        if (b.undo) { const { checkedInAt, checkedInBy, ...rest } = t; await db.put('tickets', t.id, rest); out.name = t.name; break; }
        if (t.checkedInAt) throw new Error(`${t.name} was already checked in at ${new Date(t.checkedInAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
        const [s0, e0] = slot(c); const nowMs = Date.now(); if (!admin && (nowMs < s0 - 4 * 36e5 || nowMs > e0 + 12 * 36e5)) throw new Error('Check-in opens 4 hours before class and closes 12 hours after it ends');
        await db.put('tickets', t.id, { ...t, checkedInAt: now, checkedInBy: u.id }); out.name = t.name; out.class = c.title; break; }
      case 'agree': await db.put('users', u.id, { ...u, agreedAt: now, agreedVersion: AGREEMENT_VERSION }); break;
      case 'message': { const t = str(b.text, 2000); if (!t) throw new Error('Write a message'); const id = `msg-${db.uid()}`; await db.put('messages', id, { id, userId: u.id, from: 'member', text: t, createdAt: now, read: false }); break; }
      default: return bad('Unknown action');
    }
    return NextResponse.json({ ok: true, ...out });
  } catch (e) { return bad(e.message); }
}
