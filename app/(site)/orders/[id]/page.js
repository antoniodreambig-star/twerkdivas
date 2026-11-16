import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import * as db from '@/lib/db';
import OrderClient from '@/components/OrderClient';
import CancelOrder from '@/components/CancelOrder';
import { settings } from '@/lib/data';
import { fmtWhen, fmtTime } from '@/lib/tz';
import { money } from '@/components/ClassCard';
import ReviewForm from '@/components/ReviewForm';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your tickets · TwerkDivas', robots: { index: false } };
export default async function Page({ params, searchParams }) {
  const o = await db.get('orders', params.id); if (!o) notFound();
  const cls = await db.get('classes', o.classId); const v = cls?.venueId ? await db.get('venues', cls.venueId) : null; const ins = cls ? await db.get('users', cls.userId) : null;
  const tickets = (await db.list('tickets')).filter((t) => t.orderId === o.id).sort((a, b) => a.name.localeCompare(b.name));
  const paid = o.status === 'paid'; const qrs = paid ? await Promise.all(tickets.filter((t) => t.status === 'valid').map(async (t) => [t.id, await QRCode.toString(t.code, { type: 'svg', margin: 1, width: 170, color: { dark: '#1D0B4A', light: '#FFFFFF' } })])) : [];
  const qr = Object.fromEntries(qrs); const set = await settings(); const hrs = set.cancelHours ?? 48; const used = tickets.some((t) => t.checkedInAt); const canCancel = paid && cls && !cls.canceled && !used && Date.parse(cls.start) - Date.now() >= hrs * 36e5;
  const ended = cls && (cls.end ? Date.parse(cls.end) : Date.parse(cls.start) + 90 * 60000) < Date.now(); const reviewed = paid && !!(await db.get('reviews', o.id)); const canRate = paid && ended && !cls.canceled && !reviewed;
  const gcal = cls ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(cls.title)}&dates=${new Date(cls.start).toISOString().replace(/[-:]|\.\d{3}/g, '')}/${new Date(cls.end || Date.parse(cls.start) + 90 * 60000).toISOString().replace(/[-:]|\.\d{3}/g, '')}&location=${encodeURIComponent(v ? `${v.name}, ${v.address}, ${v.city}, ${v.state}` : 'Online')}` : '';
  return (<><p className="small"><Link href="/classes">← All classes</Link></p><h1 className="pubh">{paid ? 'You are in!' : 'Your order'}</h1>
    {searchParams?.paid && o.status === 'held' && <OrderClient orderId={o.id} session={searchParams.paid} />}
    {o.status === 'held' && !searchParams?.paid && <div className="err">Waiting for payment. Your seats are held for a short time. <Link href={`/classes/${o.classId}`}>Go back to the class</Link> to finish.</div>}
    {['refunded', 'refund_due'].includes(o.status) && <div className="err">This order was {o.status === 'refunded' ? 'refunded' : 'canceled and a refund is being processed'}. These tickets are no longer valid.</div>}
    {['expired', 'canceled'].includes(o.status) && <div className="err">This order expired before payment. <Link href={`/classes/${o.classId}`}>Try again</Link>.</div>}
    {cls && <div className="card" style={{ margin: '12px 0' }}><b style={{ fontSize: 18 }}>{cls.title}</b>{cls.canceled && <span className="tag pink" style={{ marginLeft: 8 }}>Canceled</span>}<p style={{ margin: '6px 0' }}>{fmtWhen(cls.start, cls.tz, true)}{cls.end ? ` – ${fmtTime(cls.end, cls.tz)}` : ''}<br />{v ? `${v.name} · ${v.address}, ${v.city}, ${v.state}` : 'Online'} · with {ins?.name}</p>
      {paid && cls.mode === 'online' && cls.link && <p><b>Class link:</b> <a href={cls.link} target="_blank" rel="noopener noreferrer">{cls.link}</a></p>}
      <p className="small mute" style={{ margin: 0 }}>{o.qty} ticket{o.qty === 1 ? '' : 's'} · {money(o.amount)} total · {o.name} ({o.email}){paid && <> · <a href={gcal} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a></>}</p></div>}
    {paid && <div className="tickets">{tickets.filter((t) => t.status === 'valid').map((t) => <div className="ticket" key={t.id}><div className="qr" dangerouslySetInnerHTML={{ __html: qr[t.id] }} /><div><span className="small mute">Ticket code</span><div className="code">{t.code}</div><div>{t.name}</div>{t.checkedInAt ? <span className="tag ok">Checked in</span> : <span className="tag">Valid</span>}</div></div>)}</div>}
    {canCancel && <CancelOrder orderId={o.id} hours={hrs} refundable={!o.pass && o.amount > 0} />}
    {canRate && <ReviewForm orderId={o.id} />}{reviewed && <div className="ok">You rated this class. Thank you!</div>}
    {paid && <p className="small mute">Show the QR or code at check-in. Tickets are non-transferable and sold only on this website. Lost them? <Link href="/tickets">Email them to me again</Link>.</p>}</>);
}
