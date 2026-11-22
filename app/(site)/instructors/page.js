import Link from 'next/link';
import Filters from '@/components/Filters';
import { publicInstructors, publicPrograms } from '@/lib/data';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Instructors · Cakes and Core', description: 'Meet certified Cakes and Core instructors.' };
export default async function Page({ searchParams }) {
  const f = { city: searchParams.city || '', program: searchParams.program || '', q: searchParams.q || '' };
  const [rows, programs, everyone] = await Promise.all([publicInstructors(f), publicPrograms(), publicInstructors()]);
  const cities = { _: [...new Set(everyone.map((i) => i.city).filter(Boolean))].sort() };
  return (<><h1 className="pubh">Certified instructors</h1><p className="mute" style={{ maxWidth: 620 }}>Every instructor here has been reviewed and certified by Cakes and Core.</p>
    <Filters base="/instructors" values={{ ...f, state: '' }} cities={cities} programs={programs} />
    {rows.length === 0 ? <div className="card" style={{ textAlign: 'center' }}><p className="mute">No instructors match.</p></div> : <div className="grid" style={{ marginTop: 16 }}>{rows.map((i) => <Link key={i.id} href={`/instructors/${i.id}`} className="card feat studio">{i.photo && <img src={i.photo} alt="" referrerPolicy="no-referrer" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 10 }} />}<h3>{i.name}</h3><div className="small mute">{i.city}</div><p className="small mute" style={{ margin: '6px 0' }}>{i.bio.slice(0, 120)}</p><div>{i.certified.map((c) => <span key={c} className="tag volt" style={{ marginRight: 4 }}>{c}</span>)}</div>{i.upcoming > 0 && <p className="small" style={{ margin: '10px 0 0' }}><b>{i.upcoming}</b> upcoming class{i.upcoming === 1 ? '' : 'es'}</p>}</Link>)}</div>}</>);
}
