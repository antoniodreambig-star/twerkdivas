import Link from 'next/link';
import { notFound } from 'next/navigation';
import ClassCard from '@/components/ClassCard';
import { publicClasses, venueBySlug } from '@/lib/data';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }) { const v = await venueBySlug(params.slug); return { title: v ? `${v.name} · Cakes and Core partner studio` : 'Studio' }; }
export default async function Page({ params }) {
  const v = await venueBySlug(params.slug); if (!v) notFound(); const rows = await publicClasses({ venue: v.id });
  return (<><p className="small"><Link href={`/studios?state=${v.state}`}>← Partner studios</Link></p><h1 className="pubh">{v.name}</h1>
    <p style={{ margin: '4px 0' }}>{v.address}, {v.city}, {v.state} {v.zip} · <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.name} ${v.address} ${v.city} ${v.state}`)}`} target="_blank" rel="noopener noreferrer">Map</a>{v.website && <> · <a href={v.website} target="_blank" rel="noopener noreferrer">Website</a></>}{v.phone && <> · {v.phone}</>}</p>
    <p className="mute">Maximum attendance: <b style={{ color: 'var(--ink)' }}>{v.capacity}</b> people, shared across all classes at the same time.</p>{v.notes && <p>{v.notes}</p>}
    <h2 className="dayh">Upcoming classes</h2>{rows.length === 0 ? <p className="mute">No classes scheduled here right now.</p> : <div style={{ display: 'grid', gap: 10 }}>{rows.map((c) => <ClassCard key={c.id} c={c} />)}</div>}</>);
}
