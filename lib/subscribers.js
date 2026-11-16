import crypto from 'crypto';
import * as db from './db';
const secret = () => process.env.SESSION_SECRET || 'dev-secret';
export const unsubToken = (email) => crypto.createHmac('sha256', secret()).update(`unsub:${email}`).digest('hex').slice(0, 24);
export const unsubOk = (email, t) => { try { return crypto.timingSafeEqual(Buffer.from(unsubToken(email)), Buffer.from(String(t))); } catch { return false; } };
export async function addSubscriber({ email, name = '', source = 'checkout' }) {
  email = String(email).toLowerCase(); const old = await db.get('subscribers', email);
  await db.put('subscribers', email, { ...(old || {}), id: email, email, name: old?.name || name, source: old?.source || source, optInAt: old?.optInAt || new Date().toISOString(), unsubscribed: false });
  const list = Number(process.env.BREVO_LIST_ID); if (process.env.BREVO_API_KEY && list) {
    fetch('https://api.brevo.com/v3/contacts', { method: 'POST', headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ email, attributes: { FIRSTNAME: String(name).split(' ')[0] }, listIds: [list], updateEnabled: true }) }).catch(() => {});
  }
}
export async function unsubscribe(email) {
  email = String(email).toLowerCase(); const old = await db.get('subscribers', email); if (old) await db.put('subscribers', email, { ...old, unsubscribed: true, unsubAt: new Date().toISOString() });
  const list = Number(process.env.BREVO_LIST_ID); if (process.env.BREVO_API_KEY && list) fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, { method: 'PUT', headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ emailBlacklisted: true }) }).catch(() => {});
}
