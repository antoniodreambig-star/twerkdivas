import Link from 'next/link';
import { publicPopups, settings } from '@/lib/data';
import { fmtDay, fmtTime } from '@/lib/tz';
import { money } from '@/components/ClassCard';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pop-up events · TwerkDivas', description: 'Limited-capacity TwerkDivas pop-up events. Get your ticket before they sell out.' };
function Card({ e, big }) {
  const v = e.venueFull; const d = new Date(e.start); const mo = d.toLocaleDateString('en-US', { timeZone: e.tz, month: 'short' }); const dd = d.toLocaleDateString('en-US', { timeZone: e.tz, day: 'numeric' }); const wk = d.toLocaleDateString('en-US', { timeZone: e.tz, weekday: 'short' });
  const taken = e.cap - e.left; const pct = e.cap ? Math.min(100, Math.round((taken / e.cap) * 100)) : 0; const out = e.left <= 0;
  return (<article className={`popcard ${big ? 'big' : ''}`}><div className="popdate"><span>{wk}</span><b>{dd}</b><span>{mo}</span></div>
    <div className="popbody"><div className="row" style={{ gap: 8 }}><span className="tag pink">Pop-up</span>{e.program && <span className="tag volt">{e.program}</span>}{!out && e.left <= 10 && <span className="tag cyan">Only {e.left} left</span>}</div>
      <h2 className="poptitle">{e.title}</h2>{e.tagline && <p className="poptag">{e.tagline}</p>}
      <p className="popmeta"><b>{fmtDay(e.start, e.tz)}</b> · {fmtTime(e.start, e.tz)}{e.end ? ` – ${fmtTime(e.end, e.tz)}` : ''}<br />{v ? `${v.name} · ${v.address}, ${v.city}, ${v.state}` : ''}</p>
      {big && e.notes && <p className="popnotes">{e.notes.slice(0, 280)}{e.notes.length > 280 ? '…' : ''}</p>}
      <div className="popinst">{e.instructorPhoto ? <img src={e.instructorPhoto} alt="" referrerPolicy="no-referrer" /> : <span className="av">{e.instructor.slice(0, 1)}</span>}<span className="small"><span className="mute">With </span><b><Link href={`/instructors/${e.instructorId}`}>{e.instructor}</Link></b></span></div>
      <div className="meter" aria-label={`${taken} of ${e.cap} spots taken`}><i style={{ width: `${pct}%` }} /></div><div className="small mute" style={{ marginTop: 4 }}>{out ? 'Sold out' : `${e.left} of ${e.cap} spots left`}</div></div>
    <div className="popbuy"><span className="price">{money(e.price)}</span>{out ? <span className="btn" style={{ pointerEvents: 'none', opacity: .6 }}>Sold out</span> : <Link className="btn primary lg" href={`/classes/${e.id}`}>Get tickets</Link>}</div></article>);
}
export default async function Page() {
  const list = await publicPopups(); const set = await settings(); const [first, ...rest] = list;
  return (<><section className="pophero"><span className="popbadge">Limited capacity</span><h1>Pop-up <em>events</em></h1><p>One-night-only TwerkDivas experiences. Small rooms, big energy, and once the room is full it is full.</p></section>
    {list.length === 0 ? <div className="card" style={{ textAlign: 'center', padding: 36 }}><h2 style={{ marginTop: 0 }}>Next pop-up coming soon</h2><p className="mute">No pop-ups on sale right now. Browse regular classes in the meantime.</p><Link className="btn primary" href="/classes">Browse classes</Link></div>
      : <><Card e={first} big />{rest.length > 0 && <><h2 className="dayh">More pop-ups</h2><div className="popgrid">{rest.map((e) => <Card key={e.id} e={e} />)}</div></>}</>}
    {set.contactEmail && <div className="card" style={{ marginTop: 32, textAlign: 'center' }}><b>Want a pop-up in your city?</b><p className="mute small" style={{ margin: '4px 0 12px' }}>Studios and venues: bring TwerkDivas to your space.</p><a className="btn primary" href={`mailto:${set.contactEmail}?subject=Pop-up event inquiry`}>Get in touch</a></div>}</>);
}
