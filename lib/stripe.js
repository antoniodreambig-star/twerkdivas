import crypto from 'crypto';
import * as db from './db';
// Stripe over plain HTTPS so there is nothing extra to install. Needs STRIPE_SECRET_KEY and STRIPE_PRICE_ID (a monthly recurring price).
export const stripeOn = () => !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
const form = (o, pre = '', out = []) => { for (const [k, v] of Object.entries(o)) { const key = pre ? `${pre}[${k}]` : k; if (v && typeof v === 'object') form(v, key, out); else if (v != null) out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`); } return out; };
async function sf(path, method = 'GET', params, extra = {}) {
  const r = await fetch(`https://api.stripe.com/v1${path}`, { method, headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, ...(params ? { 'content-type': 'application/x-www-form-urlencoded' } : {}), ...extra }, body: params ? form(params).join('&') : undefined, cache: 'no-store' });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error?.message || `Stripe error ${r.status}`); return j;
}
export async function checkout(user, origin) {
  const p = { mode: 'subscription', 'line_items': { 0: { price: process.env.STRIPE_PRICE_ID, quantity: 1 } }, client_reference_id: user.id, success_url: `${origin}/join?paid={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/join`, allow_promotion_codes: 'true', subscription_data: { metadata: { userId: user.id } } };
  if (user.sub?.customer) p.customer = user.sub.customer; else p.customer_email = user.email;
  if (process.env.STRIPE_TAX === '1') p.automatic_tax = { enabled: 'true' };
  return (await sf('/checkout/sessions', 'POST', p)).url;
}
// One-off ticket payment. The session expires after 31 minutes, which is also how long the seats are held.
export async function ticketCheckout(order, cls, origin, split = null) {
  const p = { mode: 'payment', line_items: { 0: { quantity: order.qty, price_data: { currency: 'usd', unit_amount: order.price, product_data: { name: `${cls.title} (${new Date(cls.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})` } } } }, customer_email: order.email, client_reference_id: order.id, metadata: { orderId: order.id }, payment_intent_data: { metadata: { orderId: order.id }, ...(split ? { transfer_data: { destination: split.dest }, ...(split.fee > 0 ? { application_fee_amount: split.fee } : {}) } : {}) }, success_url: `${origin}/orders/${order.id}?paid={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/classes/${cls.id}?canceled=1`, expires_at: Math.floor(Date.now() / 1000) + 31 * 60 };
  if (process.env.STRIPE_TAX === '1') p.automatic_tax = { enabled: 'true' };
  const s = await sf('/checkout/sessions', 'POST', p); return { id: s.id, url: s.url };
}
export async function passCheckout(pass, origin) {
  const p = { mode: 'payment', line_items: { 0: { quantity: 1, price_data: { currency: 'usd', unit_amount: pass.price, product_data: { name: `${pass.name} (${pass.credits} class credits)` } } } }, customer_email: pass.email, client_reference_id: pass.id, metadata: { passId: pass.id }, payment_intent_data: { metadata: { passId: pass.id } }, success_url: `${origin}/packs/thanks?pass=${pass.id}&paid={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/packs?canceled=1`, expires_at: Math.floor(Date.now() / 1000) + 31 * 60 };
  const s = await sf('/checkout/sessions', 'POST', p); return { id: s.id, url: s.url };
}
export const getSession = (id) => { if (!/^cs_[A-Za-z0-9_]+$/.test(String(id))) throw new Error('Bad checkout reference'); return sf(`/checkout/sessions/${id}`); };
export const refund = (paymentIntent, key, opts = {}) => sf('/refunds', 'POST', { payment_intent: paymentIntent, ...(opts.reverse ? { reverse_transfer: 'true', refund_application_fee: 'true' } : {}) }, key ? { 'Idempotency-Key': key } : {});
// Stripe Connect: instructors get an Express account so ticket money is split automatically at checkout.
export const connectCreate = async (user) => (await sf('/accounts', 'POST', { type: 'express', email: user.email, business_type: 'individual', capabilities: { transfers: { requested: 'true' } }, metadata: { userId: user.id } })).id;
export const connectLink = async (acct, origin) => (await sf('/account_links', 'POST', { account: acct, refresh_url: `${origin}/app?connect=refresh`, return_url: `${origin}/app?connect=done`, type: 'account_onboarding' })).url;
export const connectStatus = async (acct) => { const a = await sf(`/accounts/${acct}`); return { ready: !!(a.payouts_enabled && (a.capabilities?.transfers || 'active') === 'active' && a.details_submitted), detailsSubmitted: !!a.details_submitted, payoutsEnabled: !!a.payouts_enabled }; };
export const connectDashboard = async (acct) => (await sf(`/accounts/${acct}/login_links`, 'POST', {})).url;
export async function portal(user, origin) {
  if (!user.sub?.customer) throw new Error('No billing account yet');
  return (await sf('/billing_portal/sessions', 'POST', { customer: user.sub.customer, return_url: `${origin}/app` })).url;
}
async function saveSub(userId, sub, customer) {
  const u = await db.get('users', userId); if (!u) return null;
  u.sub = { id: sub.id, customer: customer || sub.customer || u.sub?.customer, status: sub.status, periodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : u.sub?.periodEnd, cancelAtEnd: !!sub.cancel_at_period_end };
  await db.put('users', userId, u); return u;
}
// Called when the member comes back from Stripe, so access opens at once instead of waiting for the webhook.
export async function syncCheckout(user, sessionId) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(String(sessionId))) throw new Error('Bad checkout reference');
  const s = await sf(`/checkout/sessions/${sessionId}?expand[]=subscription`);
  if (s.client_reference_id !== user.id) throw new Error('That checkout belongs to another account');
  if (s.subscription && typeof s.subscription === 'object') return saveSub(user.id, s.subscription, s.customer);
  return user;
}
export function verifyWebhook(raw, header) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET; if (!secret) return false;
  const parts = Object.fromEntries(String(header || '').split(',').map((x) => x.split('=')));
  const t = Number(parts.t); if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const good = crypto.createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex');
  const a = Buffer.from(good), b = Buffer.from(String(parts.v1 || '')); return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export async function handleEvent(ev) {
  const o = ev.data?.object || {};
  if (o.metadata?.passId && ev.type.startsWith('checkout.session.')) {
    const p = await import('./packs');
    if (ev.type === 'checkout.session.completed' && o.payment_status === 'paid') await p.markPassPaid(o.metadata.passId, { session: o.id, pi: typeof o.payment_intent === 'string' ? o.payment_intent : '' });
    return;
  }
  if (o.metadata?.orderId && ev.type.startsWith('checkout.session.')) {
    const t = await import('./tickets');
    if (ev.type === 'checkout.session.completed' && o.payment_status === 'paid') await t.markPaid(o.metadata.orderId, { session: o.id, pi: typeof o.payment_intent === 'string' ? o.payment_intent : '' });
    else if (ev.type === 'checkout.session.expired') await t.releaseOrder(o.metadata.orderId);
    return;
  }
  if (ev.type === 'account.updated' && o.metadata?.userId) { const u = await db.get('users', o.metadata.userId); if (u) await db.put('users', u.id, { ...u, connect: { acct: o.id, ready: !!(o.payouts_enabled && o.details_submitted), detailsSubmitted: !!o.details_submitted, updatedAt: new Date().toISOString() } }); return; }
  if (ev.type === 'checkout.session.completed' && o.subscription && o.client_reference_id) {
    const sub = await sf(`/subscriptions/${o.subscription}`); await saveSub(o.client_reference_id, sub, o.customer);
  } else if (ev.type.startsWith('customer.subscription.')) {
    const uid = o.metadata?.userId || (await db.list('users')).find((u) => u.sub?.customer === o.customer)?.id; if (uid) await saveSub(uid, o, o.customer);
  } else if (ev.type === 'invoice.payment_failed') {
    const u = (await db.list('users')).find((x) => x.sub?.customer === o.customer); if (u) { u.sub = { ...u.sub, status: 'past_due' }; await db.put('users', u.id, u); }
  }
}
