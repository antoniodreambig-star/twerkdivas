// Class times are typed and shown in the place where the class happens, whatever the browser or server time zone is.
function offsetAt(ms, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
}
// "2030-05-04T10:00" typed in tz -> UTC ISO string
export function zonedToUtcISO(local, tz) {
  const [d, t] = String(local).split('T'); const [Y, M, D] = d.split('-').map(Number); const [h, m] = t.split(':').map(Number);
  const asUtc = Date.UTC(Y, M - 1, D, h, m); let ms = asUtc - offsetAt(asUtc, tz); ms = asUtc - offsetAt(ms, tz); return new Date(ms).toISOString();
}
// UTC ISO -> "YYYY-MM-DDTHH:mm" as seen in tz (for datetime-local inputs)
export function utcToZonedInput(iso, tz) {
  if (!iso) return ''; const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
export const fmtWhen = (iso, tz = 'America/Chicago', long = false) => iso ? new Date(iso).toLocaleString('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', ...(long ? { year: 'numeric' } : {}), hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : '';
export const fmtDay = (iso, tz = 'America/Chicago') => iso ? new Date(iso).toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric' }) : '';
export const fmtTime = (iso, tz = 'America/Chicago') => iso ? new Date(iso).toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }) : '';
