import zlib from 'zlib';
import * as db from './db';
import { sendEmail, layout, esc } from './email';
const SKIP = ['backups', 'resets'];
// Password hashes never leave the database, so a restored backup asks people to use "Forgot password".
const clean = (cols) => { const c = { ...cols }; if (c.users) c.users = c.users.map(({ hash, ...u }) => u); return c; };
export async function exportAll() { const cols = clean(await db.allCollections(SKIP)); return { app: 'twerkdivas', version: 1, at: new Date().toISOString(), counts: Object.fromEntries(Object.entries(cols).map(([k, v]) => [k, v.length])), collections: cols }; }
export async function runBackup({ email = true } = {}) {
  const data = await exportAll(); const gz = zlib.gzipSync(JSON.stringify(data)); const id = `bk-${data.at.slice(0, 10)}`;
  await db.put('backups', id, { id, at: data.at, bytes: gz.length, records: Object.values(data.counts).reduce((a, b) => a + b, 0), data: gz.toString('base64') });
  const all = (await db.list('backups')).sort((a, b) => String(b.at).localeCompare(String(a.at))); if (all.length > 7) await db.delMany('backups', all.slice(7).map((x) => x.id));
  let emailed = false; const to = process.env.BACKUP_EMAIL || process.env.ADMIN_EMAIL;
  if (email && to && gz.length < 2.5 * 1024 * 1024) { const r = await sendEmail({ to, subject: `Cakes and Core backup ${id.slice(3)}`, html: layout('Daily backup', `<p>Attached is today's backup (${Math.round(gz.length / 1024)} KB, ${Object.values(data.counts).reduce((a, b) => a + b, 0)} records). Keep it somewhere safe. It does not include password hashes.</p>`), attachment: [{ name: `twerkdivas-${id.slice(3)}.json.gz`, content: gz.toString('base64') }] }); emailed = r.sent; }
  return { id, bytes: gz.length, records: Object.values(data.counts).reduce((a, b) => a + b, 0), emailed };
}
export const listBackups = async () => (await db.list('backups')).sort((a, b) => String(b.at).localeCompare(String(a.at))).map(({ data, ...x }) => x);
export async function getBackup(id) { const b = await db.get('backups', id); return b ? zlib.gunzipSync(Buffer.from(b.data, 'base64')).toString() : null; }
