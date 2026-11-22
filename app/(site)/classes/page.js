import ClassCard from '@/components/ClassCard';
import Filters from '@/components/Filters';
import { publicClasses, publicVenues, publicPrograms } from '@/lib/data';
import { STATES } from '@/lib/us';
import { fmtDay } from '@/lib/tz';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Classes · Cakes and Core', description: 'Browse upcoming Cakes and Core classes and buy tickets.' };
export default async function Page({ searchParams }) {
  const f = { state: searchParams.state || '', city: searchParams.city || '', program: searchParams.program || '', mode: searchParams.mode || '', q: searchParams.q || '' };
  const [rows, ven, programs] = await Promise.all([publicClasses(f), publicVenues(), publicPrograms()]);
  const days = []; for (const c of rows) { const k = fmtDay(c.start, c.tz); const last = days[days.length - 1]; if (last?.k === k) last.rows.push(c); else days.push({ k, rows: [c] }); }
  return (<><h1 className="pubh">Find a class</h1><p className="mute" style={{ maxWidth: 620 }}>Taught by certified Cakes and Core instructors at partner studios and online. Tickets are sold here and only here.</p>
    <Filters base="/classes" values={f} states={Object.fromEntries(ven.states.map((s) => [s, STATES[s]]))} cities={ven.cities} programs={programs} modes />
    {rows.length === 0 ? <div className="card" style={{ textAlign: 'center' }}><p className="mute">No classes match. Try clearing a filter.</p></div> : days.map((d) => <section key={d.k}><h2 className="dayh">{d.k}</h2><div style={{ display: 'grid', gap: 10 }}>{d.rows.map((c) => <ClassCard key={c.id} c={c} />)}</div></section>)}</>);
}
