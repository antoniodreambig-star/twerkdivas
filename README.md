# TwerkDivas Instructor Academy

Members-only app for TwerkDivas instructors: sign up, pay a monthly membership, learn the routines from video, get certified, list classes, and message the team. Built with Next.js 14. Uses the TwerkDivas logo from twerkdivas.com.

## How it works
- **Instructors** sign up (and accept the instructor agreement), then pay via Stripe Checkout. Access opens the moment payment succeeds and closes if the subscription is canceled or unpaid.
- **Learn**: programs (Twerk Cardio, Barre, Mat Pilates) with videos by level, notes, music, and watched-progress.
- **Certify**: instructors submit a teaching video; you approve or request changes with feedback. Certified instructors get a badge and appear in the directory. CPR/AED link and the agreement are prerequisites.
- **Classes & tickets**: instructors add online or in-person classes at a **partner studio** and set a ticket price. Tickets are sold **only on this website** (Stripe one-time checkout, free classes supported). Each studio has a **maximum attendance** that is enforced across every class overlapping at that studio, with seats held for 30 minutes during checkout and an oversell guard. Online links are shown only on a paid ticket.
- **Check-in & attendance**: on class day, instructors open Roster & check-in, type or scan the ticket code (or tap a name), and see checked-in vs. sold vs. max attendance. Check-in opens 4 hours before class and closes 12 hours after it ends (admins can always check in). Undo is available.
- **Pop-up events** (Admin > Pop-up events, public page `/popups`): create one-night events with location, date, start/end time, capacity, price, an instructor picked from a drop-down, a tagline and event information. They use the same ticketing, capacity limit, refunds and check-in as classes.
- **Public website** (no login): `/classes` (filter by state, city, program, in-person/online), `/classes/<id>` (buy tickets), `/studios` (**partner-studio link with state and city filters**), `/studios/<slug>`, `/instructors`, `/orders/<id>` (QR tickets) and `/tickets` (email me my tickets). Every filtered view has a shareable URL, e.g. `/studios?state=TX&city=Killeen`.
- **Also**: announcements, resources (music, class plans, forms), community directory, support messages, profile, and a billing portal (update card / cancel).
- **Admin (/admin)**: members (add instructors, free pass, suspend, make admin, set temporary password), review queue, **Partner studios** (address, time zone, max attendance, link builder with state/city filters), **Classes & tickets** (sold, checked in, gross, instructor share, per-order refunds, cancel class and refund everyone), programs & videos, announcements, resources, support inbox, settings (price text, welcome, agreement, prerequisite).

## Deploy (Vercel + Neon + Stripe)
1. Push this folder to a GitHub repo and import it in Vercel (framework: Next.js).
2. Add a Postgres database (Vercel Storage > Neon) and copy its connection string to `DATABASE_URL`.
3. In Stripe: create a Product with a **monthly recurring** price; copy the price id to `STRIPE_PRICE_ID`; copy the secret key to `STRIPE_SECRET_KEY`.
4. In Stripe > Developers > Webhooks add endpoint `https://YOUR-DOMAIN/api/webhooks/stripe` with events `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`; copy the signing secret to `STRIPE_WEBHOOK_SECRET`. In Stripe > Settings > Billing > Customer portal, enable cancel and payment-method updates.
5. Set `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, then deploy. For password-reset and ticket emails also set `BREVO_API_KEY` and `EMAIL_FROM` (a sender verified in Brevo); optionally `APP_URL` (e.g. https://app.twerkdivas.com) so email links always use your real domain. Sign in at `/login` with the admin email; open `/admin`.
6. Optional: add the domain `app.twerkdivas.com` in Vercel and a CNAME at your DNS host. Link to it from the WordPress site.
7. First things in the admin: Settings (price text matching your Stripe price, review the agreement, optional platform fee % and contact email), add your first **Partner studios**, then add videos under Programs & videos.
8. Optional protected video (Mux): create a Mux signing key, set `MUX_SIGNING_KEY_ID` and `MUX_SIGNING_PRIVATE_KEY` (the private key, base64-encoded), upload videos with **signed** playback policy, and paste `mux:PLAYBACK_ID` as the video link. Members get a short-lived signed token and a name/email watermark. The watermark deters screen recording; it cannot fully prevent it.

## Notes
- Host the videos on Vimeo, YouTube (unlisted) or Mux and paste the link; Vimeo/Mux with domain-restriction is best for keeping routines private.
- Public endpoints for twerkdivas.com: `/api/public/classes` (upcoming public classes) and `/api/public/instructors` (certified, listed instructors). Names/bio/city only, no emails.
- **Forgot password** emails a one-hour, single-use link; resetting signs out all other sessions. Without Brevo configured, use Admin > Members > Set password.
- **Ticket money** goes to your Stripe account. Payouts to instructors are manual: the Classes & tickets tab shows each class's gross and the instructor share (using the platform fee % in Settings). Refunds and class cancellations refund buyers through Stripe and email them.
- Free classes issue tickets instantly without payment; they are rate-limited per IP but emails are not verified.
- Public site pages can be linked or embedded from the WordPress site (e.g. a button to `/studios`).
- Have a lawyer review the instructor agreement. Insurance, music licensing and CPR requirements are your responsibility.
- Local test: `npm install && npm run dev` (port 3200), data stored in `.data/db.json`.


## Growth features
- **Setup check** (Admin > Settings): shows which environment variables are missing (database, Stripe, webhook, email, cron).
- **Policies**: starter Terms, Privacy, Refund and Waiver pages (editable in Settings). They are templates, so have an attorney review them. Buyers must accept the waiver at checkout; buyers can cancel themselves up to the configured number of hours before class.
- **Stripe Connect payouts**: instructors link their bank on the Earnings tab; ticket sales then split automatically (platform fee kept). Others are paid by hand and logged under Analytics > Instructor payouts.
- **Class packs**, **waitlist**, **weekly recurring classes** (up to 12 weeks), **reviews and ratings** (request email sent a few hours after class), **email list** (opt-in at checkout, CSV export, unsubscribe link), **analytics**, **share previews**, **WordPress widget** (copy code in Settings), **certificates** (`/certificate/<id>`, verify at `/verify/<code>`), **camera check-in**, and **daily backups** (`/api/cron/daily`, scheduled in vercel.json at 09:00 UTC; requires CRON_SECRET).
- Marketing emails you send yourself must include an unsubscribe link: `/unsubscribe?email=...&t=...` (token from `unsubToken`).
