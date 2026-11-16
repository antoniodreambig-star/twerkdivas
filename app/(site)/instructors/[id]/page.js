import Link from 'next/link';
import { notFound } from 'next/navigation';
import ClassCard from '@/components/ClassCard';
import { publicClasses, publicInstructors } from '@/lib/data';
import { reviewsFor } from '@/lib/reviews';
import Stars from '@/components/Stars';
import ShareButton from '@/components/ShareButton';
export const dynamic = 'force-dynamic';
export default async function Page({ params }) {
  const i = (await publicInstructors()).find((x) => x.id === params.id); if (!i) notFound(); const rows = await publicClasses({ instructor: i.id }); const revs = await reviewsFor({ userId: i.id }, 12);
  const links = [[i.instagram && `https://instagram.com/${i.instagram}`, 'Instagram'], [i.tiktok && `https://tiktok.com/@${i.tiktok}`, 'TikTok'], [i.website, 'Website']].filter((x) => x[0]);
  return (<><p className="small"><Link href="/instructors">← All instructors</Link></p>
    <div className="row" style={{ gap: 20, alignItems: 'flex-start' }}>{i.photo && <img src={i.photo} alt="" referrerPolicy="no-referrer" style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover' }} />}<div><h1 className="pubh">{i.name}</h1><div className="mute">{i.city}</div><div style={{ margin: '8px 0' }}>{i.certified.map((c) => <span key={c} className="tag volt" style={{ marginRight: 4 }}>Certified: {c}</span>)}</div>{i.rating && <div><Stars {...i.rating} /></div>}{i.specialties && <div className="small mute">{i.specialties}</div>}{i.bio && <p style={{ maxWidth: 640 }}>{i.bio}</p>}{i.cities && <div className="small"><b>Also teaches in:</b> {i.cities}</div>}<div className="row" style={{ marginTop: 8 }}>{links.map(([u, l]) => <a key={l} className="btn sm" href={u} target="_blank" rel="noopener noreferrer">{l}</a>)}<ShareButton title={i.name} text={`Dance with ${i.name} at TwerkDivas`} /></div></div></div>
    <h2 className="dayh">Upcoming classes</h2>{rows.length === 0 ? <p className="mute">No classes on sale right now.</p> : <div style={{ display: 'grid', gap: 10 }}>{rows.map((c) => <ClassCard key={c.id} c={c} />)}</div>}{revs.length > 0 && <><h2 className="dayh">What students say</h2><div style={{ display: 'grid', gap: 10 }}>{revs.map((r) => <div key={r.id} className="card"><Stars avg={r.rating} count={1} /><p style={{ margin: '4px 0' }}>{r.text}</p><div className="small mute">{r.name}{r.classTitle ? ` · ${r.classTitle}` : ''}</div></div>)}</div></>}</>);
}
