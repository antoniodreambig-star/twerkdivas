import Link from 'next/link';
import Filters from '@/components/Filters';
import { publicVenues } from '@/lib/data';
import { settings } from '@/lib/data';
import { STATES } from '@/lib/us';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Partner studios · Cakes and Core', description: 'Cakes and Core partner studios by city and state.' };
export default async function Page({ searchParams }) {
  const f = { state: searchParams.state || '', city: searchParams.city || '', q: searchParams.q || '' };
  const [ven, set] = await Promise.all([publicVenues(f), settings()]); const all = await publicVenues();
  return (<><h1 className="pubh">Partner studios</h1><p className="mute" style={{ maxWidth: 640 }}>Studios hosting Cakes and Core classes. Filter by state and city, then pick a studio to see its schedule. Every studio has a posted maximum attendance.</p>
    <Filters base="/studios" values={f} states={Object.fromEntries(all.states.map((s) => [s, STATES[s]]))} cities={all.cities} />
    {ven.rows.length === 0 ? <div className="card" style={{ textAlign: 'center' }}><p className="mute">No partner studios match yet.</p></div>
      : <div className="grid" style={{ marginTop: 16 }}>{ven.rows.map((v) => <Link key={v.id} href={`/studios/${v.slug}`} className="card feat studio"><span className="tag">{v.city}, {v.state}</span><h3 style={{ margin: '10px 0 4px' }}>{v.name}</h3><p className="small mute" style={{ margin: 0 }}>{v.address}</p><div className="row small" style={{ marginTop: 12, gap: 14 }}><span>Max attendance <b>{v.capacity}</b></span><span>{v.upcoming} upcoming class{v.upcoming === 1 ? '' : 'es'}</span></div></Link>)}</div>}
    {set.contactEmail && <div className="card" style={{ marginTop: 28, textAlign: 'center' }}><b>Run a studio?</b><p className="mute small" style={{ margin: '4px 0 12px' }}>Become a Cakes and Core partner studio and host classes.</p><a className="btn primary" href={`mailto:${set.contactEmail}?subject=Partner studio inquiry`}>Get in touch</a></div>}</>);
}
