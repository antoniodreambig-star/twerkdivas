import crypto from 'crypto';
const secret = () => process.env.SESSION_SECRET || 'dev-secret';
const sign = (email, exp) => crypto.createHmac('sha256', secret()).update(`bookings:${email}:${exp}`).digest('hex').slice(0, 32);
// Sign-in-free "magic link": proves the visitor can read the buyer's inbox. Valid for 2 hours.
export const magicParams = (email) => { const x = Date.now() + 2 * 36e5; return `e=${encodeURIComponent(email)}&x=${x}&t=${sign(email, x)}`; };
export const magicOk = (email, x, t) => { try { return Number(x) > Date.now() && crypto.timingSafeEqual(Buffer.from(sign(email, x)), Buffer.from(String(t))); } catch { return false; } };
