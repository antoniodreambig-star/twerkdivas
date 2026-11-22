import Link from 'next/link';
import * as db from '@/lib/db';
import { magicOk } from '@/lib/magic';
import BookingsForm from '@/components/BookingsForm';
import { fmtWhen } from '@/lib/tz';
import { money } from '@/components/ClassCard';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'My bookings · Cakes and Core', robots: { index: false } };
export default async function Page({ searchParams: q }) {
  const email = String(q.e || '').toLowerCase(); const signed = q.e && q.t;
  if (!signed || !magicOk(email, q.x, q.t)) return (<><h1 className="pubh">My bookings</h1><p className="mute">Enter the email you used at checkout. We will send you a private link to see your tickets and class pack balance. No password needed.</p><BookingsForm expired={!!signed} /></>);
  const classes = Object.fromEntries((await db.list('classes')).map((c) => [c.id, c])); const now = Date.now();
  const orders = (await db.list('orders')).filter((o) => o.email === email && o.status === 'paid' && classes[o.classId]); const end = (c) => (c.end ? Date.parse(c.end) : Date.parse(c.start) + 90 * 60000);
  const up = orders.filter((o) => !classes[o.classId].canceled && end(classes[o.classId]) > now).sort((a, b) => classes[a.classId].start.localeCompare(classes[b.classId].start)); const past = orders.filter((o) => !up.includes(o)).sort((a, b) => classes[b.classId].start.localeCompare(classes[a.classId].start)).slice(0, 10);
  const packs = (await db.list('passes')).filter((p) => p.email === email && p.status === 'active'); const wl = (await db.list('waitlist')).filter((w) => w.email === email && !w.notifiedAt && classes[w.classId] && Date.parse(classes[w.classId].start) > now);
  const Row = ({ o }) => { const c = classes[o.classId]; return (<Link href={`/orders/${o.id}`} className="card" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, textDecoration: 'none', color: 'inherit' }}><div><b>{c.title}</b>{c.canceled && <span className="tag pink" style={{ marginLeft: 8 }}>Canceled</span>}<div className="small mute">{fmtWhen(c.start, c.tz || 'America/Chicago', true)} · {o.qty} ticket{o.qty === 1 ? '' : 's'}</div></div><span className="btn sm">View tickets</span></Link>); };
  return (<><h1 className="pubh">My bookings</h1><p className="mute small">Signed in as {email} for the next couple of hours.</p>
    <h2 className="dayh">Upcoming classes</h2>{up.length === 0 ? <p className="mute">No upcoming tickets. <Link href="/classes">Browse classes</Link></p> : <div style={{ display: 'grid', gap: 10 }}>{up.map((o) => <Row key={o.id} o={o} />)}</div>}
    <h2 className="dayh">Class packs</h2>{packs.length === 0 ? <p className="mute">No class packs. <Link href="/packs">See packs</Link></p> : <div style={{ display: 'grid', gap: 10 }}>{packs.map((p) => { const left = p.credits - (p.used || 0); const exp = Date.parse(p.expiresAt) < now; return (<div className="card" key={p.id}><div className="row" style={{ justifyContent: 'space-between' }}><b>{p.name}</b>{exp ? <span className="tag pink">Expired</span> : <span className="tag ok">{left} of {p.credits} left</span>}</div><div className="meter" aria-label={`${left} of ${p.credits} credits left`}><i style={{ width: `${Math.round((left / p.credits) * 100)}%` }} /></div><div className="small" style={{ marginTop: 6 }}>Your code: <b style={{ letterSpacing: '.1em' }}>{p.code}</b> · {exp ? 'expired' : 'valid until'} {new Date(p.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div><div className="small mute">Enter this code and your email at checkout on any class.</div></div>); })}</div>}
    {wl.length > 0 && <><h2 className="dayh">On the waitlist</h2><div style={{ display: 'grid', gap: 10 }}>{wl.map((w) => <Link key={w.id} href={`/classes/${w.classId}`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}><b>{classes[w.classId].title}</b><div className="small mute">{fmtWhen(classes[w.classId].start, classes[w.classId].tz || 'America/Chicago', true)} · we will email you if a spot opens</div></Link>)}</div></>}
    {past.length > 0 && <><h2 className="dayh">Past classes</h2><div style={{ display: 'grid', gap: 10 }}>{past.map((o) => <Row key={o.id} o={o} />)}</div></>}</>);
}
