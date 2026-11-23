import Link from 'next/link';
import Filters from '@/components/Filters';
import Avatar from '@/components/Avatar';
import { publicInstructors, publicPrograms } from '@/lib/data';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Instructors · Cakes and Core', description: 'Meet certified Cakes and Core instructors.' };
export default async function Page({ searchParams }) {
  const f = { city: searchParams.city || '', program: searchParams.program || '', q: searchParams.q || '' };
  const [rows, programs, everyone] = await Promise.all([publicInstructors(f), publicPrograms(), publicInstructors()]);
  const cities = { _: [...new Set(everyone.map((i) => i.city).filter(Boolean))].sort() };
  return (<><h1 className="pubh">Certified instructors</h1><p className="mute" style={{ maxWidth: 620 }}>Every instructor here has been reviewed and certified by Cakes and Core.</p>
    <Filters base="/instructors" values={{ ...f, state: '' }} cities={cities} programs={programs} />
    {rows.length === 0 ? <div className="card" style={{ textAlign: 'center' }}><p className="mute">No instructors match.</p></div> : <div className="grid" style={{ marginTop: 16 }}>{rows.map((i) => <Link key={i.id} href={`/instructors/${i.id}`} className="card feat studio" style={{ textAlign: 'center' }}><Avatar src={i.photo} name={i.name} size={112} style={{ margin: '0 auto 10px' }} /><h3 style={{ margin: 0 }}>{i.name}</h3>{i.city && <div className="small mute">{i.city}</div>}<div className="small mute" style={{ margin: '10px 0 4px', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>Certified in</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>{i.certified.map((c) => <span key={c} className="tag volt">✓ {c}</span>)}</div>{i.bio && <p className="small mute" style={{ margin: '10px 0 0' }}>{i.bio.slice(0, 120)}</p>}{i.upcoming > 0 && <p className="small" style={{ margin: '10px 0 0' }}><b>{i.upcoming}</b> upcoming class{i.upcoming === 1 ? '' : 'es'}</p>}</Link>)}</div>}</>);
}
