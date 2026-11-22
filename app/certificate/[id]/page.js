import { notFound, redirect } from 'next/navigation';
import * as db from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { certCode } from '@/lib/certs';
import PrintButton from '@/components/PrintButton';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Certificate · Cakes and Core', robots: { index: false } };
// Only the instructor who earned it (or an admin) can open the printable certificate.
export default async function Page({ params }) {
  const u = await currentUser(); if (!u) redirect('/login');
  const s = await db.get('submissions', params.id); if (!s || s.status !== 'approved' || (s.userId !== u.id && u.role !== 'admin')) notFound();
  const [owner, prog] = await Promise.all([db.get('users', s.userId), db.get('programs', s.programId)]); if (!owner || !prog) notFound();
  const when = new Date(s.reviewedAt || s.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); const code = certCode(s.id);
  return (<div className="certpage"><div className="noprint" style={{ textAlign: 'center', margin: 16 }}><PrintButton /></div>
    <div className="cert"><div className="certin"><div className="eyebrow">Cakes and Core Instructor Academy</div><h1 className="disp certh">Certificate of Certification</h1><p>This certifies that</p><div className="certname">{owner.name}</div><p>has completed the Cakes and Core training and passed the teaching review to lead</p><div className="certprog">{prog.title}</div><p>classes as a certified Cakes and Core instructor.</p>
      <div className="certfoot"><div><b>{when}</b><span>Date certified</span></div><div><b>{code}</b><span>Verify at /verify/{code}</span></div></div></div></div></div>);
}
