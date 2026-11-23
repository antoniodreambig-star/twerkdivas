// Weekly classes that keep repeating until the instructor stops them.
// An ongoing series always has about AHEAD_WEEKS of classes scheduled. Each top-up copies the latest class in the
// series, so edits to that class (price, notes, spots, booking link) carry forward to the new weeks.
import * as db from './db';
import { zonedToUtcISO, utcToZonedInput } from './tz';

export const AHEAD_WEEKS = 12;
export const addDays = (local, n) => { const [d, t] = local.split('T'); const x = new Date(`${d}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return `${x.toISOString().slice(0, 10)}T${t}`; };

const COPY = ['userId', 'title', 'programId', 'mode', 'venueId', 'tz', 'spots', 'price', 'link', 'bookUrl', 'bookNote', 'notes', 'public', 'seriesId'];

// Adds the missing weeks to every ongoing series (or just one user's). Safe to run often: it only adds classes that are not there yet.
export async function topUpSeries({ userId } = {}) {
  const all = (await db.list('series')).filter((s) => s.ongoing && !s.stoppedAt && (!userId || s.userId === userId));
  if (!all.length) return 0;
  const [classes, venues, users] = await Promise.all([db.list('classes'), db.list('venues'), db.list('users')]);
  const vb = Object.fromEntries(venues.map((v) => [v.id, v])); const ub = Object.fromEntries(users.map((u) => [u.id, u]));
  const horizon = Date.now() + AHEAD_WEEKS * 7 * 864e5; let added = 0;
  for (const s of all) {
    const mine = classes.filter((c) => c.seriesId === s.id).sort((a, b) => String(a.start).localeCompare(String(b.start)));
    const tpl = [...mine].reverse().find((c) => !c.canceled) || mine.at(-1);
    if (!tpl || !ub[s.userId] || ub[s.userId].suspended) continue;
    if (tpl.mode === 'in-person' && (!vb[tpl.venueId] || vb[tpl.venueId].active === false)) continue;
    const tz = tpl.tz || 'America/Chicago'; const dur = tpl.end ? Date.parse(tpl.end) - Date.parse(tpl.start) : 0;
    // Advance from the last week ever scheduled, so a week the instructor deleted is not put back.
    let last = s.lastLocal || utcToZonedInput(mine.at(-1).start, tz); let n = 0;
    while (n < AHEAD_WEEKS * 2) {
      const nextLocal = addDays(last, 7); const start = zonedToUtcISO(nextLocal, tz); if (Date.parse(start) > horizon) break;
      last = nextLocal; n++; if (Date.parse(start) < Date.now()) continue;
      const id = `cls-${s.id.replace(/^ser-/, '')}-${nextLocal.slice(0, 10).replace(/-/g, '')}`;
      if (await db.get('classes', id)) continue;
      const rec = Object.fromEntries(COPY.map((k) => [k, tpl[k]]));
      await db.put('classes', id, { ...rec, id, start, end: dur > 0 ? new Date(Date.parse(start) + dur).toISOString() : '' }); added++;
    }
    if (last !== s.lastLocal) await db.put('series', s.id, { ...s, lastLocal: last });
  }
  return added;
}

// Turns a series on (keep repeating) for the given classes' series, recording where it has got to.
export async function startOngoing(seriesId, userId) {
  const mine = (await db.list('classes')).filter((c) => c.seriesId === seriesId).sort((a, b) => String(a.start).localeCompare(String(b.start)));
  const last = mine.at(-1); if (!last) throw new Error('That series was not found');
  const old = await db.get('series', seriesId);
  await db.put('series', seriesId, { ...(old || { createdAt: new Date().toISOString() }), id: seriesId, userId, ongoing: true, stoppedAt: null, lastLocal: old?.lastLocal && old.lastLocal > utcToZonedInput(last.start, last.tz || 'America/Chicago') ? old.lastLocal : utcToZonedInput(last.start, last.tz || 'America/Chicago') });
  return topUpSeries({ userId });
}
