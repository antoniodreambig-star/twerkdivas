import Link from 'next/link';
import { notFound } from 'next/navigation';
import ClassCard from '@/components/ClassCard';
import { publicClasses, publicInstructors } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function Page({ params }) {
  const i = (await publicInstructors()).find((x) => x.id === params.id); if (!i) notFound(); const rows = await publicClasses({ instructor: i.id });
  return (<><p className="small"><Link href="/instructors">← All instructors</Link></p>
    <div className="row" style={{ gap: 20, alignItems: 'flex-start' }}>{i.photo && <img src={i.photo} alt="" referrerPolicy="no-referrer" style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover' }} />}<div><h1 className="pubh">{i.name}</h1><div className="mute">{i.city}</div><div style={{ margin: '8px 0' }}>{i.certified.map((c) => <span key={c} className="tag volt" style={{ marginRight: 4 }}>Certified: {c}</span>)}</div>{i.bio && <p style={{ maxWidth: 640 }}>{i.bio}</p>}</div></div>
    <h2 className="dayh">Upcoming classes</h2>{rows.length === 0 ? <p className="mute">No classes on sale right now.</p> : <div style={{ display: 'grid', gap: 10 }}>{rows.map((c) => <ClassCard key={c.id} c={c} />)}</div>}</>);
}
