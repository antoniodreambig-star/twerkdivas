import { dbHealth, usingPostgres } from './db';
export async function healthChecks() {
  const e = process.env; const d = await dbHealth(); const prod = !!e.VERCEL || e.NODE_ENV === 'production';
  const row = (k, label, ok, why, fix, optional = false) => ({ k, label, ok, optional, note: ok ? 'Ready' : why, fix: ok ? '' : fix });
  return [
    row('db', 'Database (keeps accounts, tickets, everything)', d.ok, prod ? 'Not connected. On Vercel, data would be lost between deploys.' : 'Using a local file (fine for testing).', 'Vercel > Storage > Create Neon Postgres and connect it to this project (adds DATABASE_URL), then redeploy.'),
    row('session', 'Session secret', (e.SESSION_SECRET || '').length >= 16, 'Missing or shorter than 16 characters.', 'Set SESSION_SECRET to a long random string.'),
    row('admin', 'Admin login', !!(e.ADMIN_EMAIL && e.ADMIN_PASSWORD), 'ADMIN_EMAIL / ADMIN_PASSWORD not set.', 'Set ADMIN_EMAIL and ADMIN_PASSWORD.'),
    row('stripe', 'Stripe payments', !!(e.STRIPE_SECRET_KEY && e.STRIPE_PRICE_ID), 'STRIPE_SECRET_KEY or STRIPE_PRICE_ID missing.', 'Add STRIPE_SECRET_KEY and the monthly membership STRIPE_PRICE_ID.'),
    row('webhook', 'Stripe webhook', !!e.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET missing, so tickets are only confirmed when the buyer returns to the site.', 'Create a webhook to /api/webhooks/stripe (events: checkout.session.completed, checkout.session.expired, customer.subscription.*, invoice.payment_failed, account.updated) and set STRIPE_WEBHOOK_SECRET.'),
    row('email', 'Email (Brevo)', !!(e.BREVO_API_KEY && e.EMAIL_FROM), 'No emails (tickets, resets, reminders) can be sent.', 'Set BREVO_API_KEY and EMAIL_FROM (a sender verified in Brevo).'),
    row('url', 'Site address', !!e.APP_URL, 'Links in emails use the address of whoever triggers them.', 'Set APP_URL to your live address, e.g. https://app.twerkdivas.com.', true),
    row('cron', 'Daily jobs and backups', !!e.CRON_SECRET, 'The daily job (backups, review requests, waitlist sweep) is locked until CRON_SECRET is set.', 'Set CRON_SECRET to a random string. vercel.json already schedules the job.'),
    row('mux', 'Protected video (Mux)', !!(e.MUX_SIGNING_KEY_ID && e.MUX_SIGNING_PRIVATE_KEY), 'Optional. Videos still play from Vimeo/YouTube links.', 'Set MUX_SIGNING_KEY_ID and MUX_SIGNING_PRIVATE_KEY.', true),
    row('list', 'Brevo mailing list sync', !!e.BREVO_LIST_ID, 'Optional. Opt-in buyers are kept in the Audience tab only.', 'Set BREVO_LIST_ID to the numeric list id to also add opt-ins to Brevo.', true),
  ];
}
export const setupSummary = () => ({ db: usingPostgres(), prod: !!process.env.VERCEL });
