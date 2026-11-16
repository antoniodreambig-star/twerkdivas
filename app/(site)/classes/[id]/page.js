import Link from 'next/link';
import { notFound } from 'next/navigation';
import BuyBox from '@/components/BuyBox';
import WaitlistForm from '@/components/WaitlistForm';
import { settings } from '@/lib/data';
import { money } from '@/components/ClassCard';
import { classPage } from '@/lib/data';
import { fmtWhen, fmtTime } from '@/lib/tz';
import Stars from '@/components/Stars';
import ShareButton from '@/components/ShareButton';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }) { const c = await classPage(params.id); if (!c) return { title: 'Class' }; const d = `${fmtWhen(c.start, c.tz, true)} with ${c.instructor}${c.venueFull ? ` at ${c.venueFull.name}, ${c.venueFull.city}` : ' (online)'}`; return { title: `${c.title} · TwerkDivas`, description: d, openGraph: { title: c.title, description: d, type: 'website' }, twitter: { card: 'summary_large_image', title: c.title, description: d } }; }
export default async function Page({ params, searchParams }) {
  const c = await classPage(params.id); if (!c) notFound(); const v = c.venueFull;
  const closed = c.canceled || !c.open; const out = c.left <= 0; const set = await settings();
  const ld = { '@context': 'https://schema.org', '@type': 'Event', name: c.title, startDate: c.start, ...(c.end ? { endDate: c.end } : {}), eventAttendanceMode: c.mode === 'online' ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode', location: v ? { '@type': 'Place', name: v.name, address: `${v.address}, ${v.city}, ${v.state}` } : { '@type': 'VirtualLocation', url: `/classes/${c.id}` }, offers: { '@type': 'Offer', price: (c.price / 100).toFixed(2), priceCurrency: 'USD', availability: out ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' }, performer: { '@type': 'Person', name: c.instructor } };
  return (<><p className="small"><Link href="/classes">← All classes</Link></p><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    <div className="two"><div>
      <div className="row" style={{ gap: 8 }}>{c.popup && <span className="tag pink">Pop-up event</span>}{c.program && <span className="tag volt">{c.program}</span>}<span className={`tag ${c.mode === 'online' ? 'cyan' : ''}`}>{c.mode === 'online' ? 'Online' : 'In person'}</span><ShareButton title={c.title} text={`Join me at ${c.title} with TwerkDivas`} /></div>
      <h1 className="pubh" style={{ marginTop: 10 }}>{c.title}</h1>
      <p style={{ fontSize: 17, margin: '4px 0' }}><b>{fmtWhen(c.start, c.tz, true)}</b>{c.end ? ` – ${fmtTime(c.end, c.tz)}` : ''}</p>
      {v ? <p className="mute" style={{ margin: '4px 0' }}>{v.name} · {v.address}, {v.city}, {v.state} {v.zip} · <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.name} ${v.address} ${v.city} ${v.state}`)}`} target="_blank" rel="noopener noreferrer">Map</a> · <Link href={`/studios/${v.slug}`}>About this studio</Link></p> : <p className="mute">Online. Your private class link appears on your ticket page after you book.</p>}
      {c.tagline && <p style={{ fontSize: 18, color: 'var(--violet2)', fontWeight: 600 }}>{c.tagline}</p>}{c.notes && <p style={{ whiteSpace: 'pre-wrap' }}>{c.notes}</p>}
      <div className="card" style={{ marginTop: 18, display: 'flex', gap: 16, alignItems: 'center' }}>{c.instructorPhoto && <img src={c.instructorPhoto} alt="" referrerPolicy="no-referrer" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />}<div><span className="small mute">Your instructor</span><div><b><Link href={`/instructors/${c.instructorId}`}>{c.instructor}</Link></b> {c.certified && <span className="tag ok">Certified</span>}</div>{c.rating && <div><Stars {...c.rating} /></div>}{c.instructorBio && <p className="small mute" style={{ margin: '4px 0 0' }}>{c.instructorBio}</p>}</div></div>
      {c.reviews?.length > 0 && <div style={{ marginTop: 18 }}><h2>What students say about {c.instructor}</h2><div style={{ display: 'grid', gap: 10, marginTop: 8 }}>{c.reviews.slice(0, 3).map((r) => <div key={r.id} className="card"><Stars avg={r.rating} count={1} />{r.text && <p style={{ margin: '4px 0' }}>{r.text}</p>}<div className="small mute">{r.name}</div></div>)}</div></div>}
    </div>
    <aside>{closed ? <div className="card"><b>{c.canceled ? 'This class was canceled.' : 'Ticket sales have closed.'}</b><p className="mute small">Take a look at other classes.</p><Link className="btn primary" href="/classes">Browse classes</Link></div>
      : out ? <><WaitlistForm classId={c.id} /><p className="small mute" style={{ marginTop: 12 }}><Link href="/classes">Browse other classes</Link></p></>
      : <><div className="card" style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span className="price" style={{ fontSize: 44 }}>{money(c.price)}</span><span className={c.left <= 5 ? 'low small' : 'mute small'}>{c.left <= 5 ? `Only ${c.left} left` : `${c.left} of ${c.cap} spots left`}</span></div>
        {searchParams?.canceled && <div className="err">Payment was canceled. You have not been charged.</div>}<BuyBox classId={c.id} price={c.price} left={c.left} title={c.title} cancelHours={set.cancelHours ?? 48} packs={(set.packs || []).length > 0} /></>}</aside></div></>);
}
