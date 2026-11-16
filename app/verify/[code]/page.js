import * as db from '@/lib/db';
import { certCode } from '@/lib/certs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Verify a certificate · TwerkDivas', robots: { index: false } };
export default async function Page({ params }) {
  const code = String(params.code).toUpperCase(); const subs = (await db.list('submissions')).filter((s) => s.status === 'approved'); const s = subs.find((x) => certCode(x.id) === code);
  const owner = s && (await db.get('users', s.userId)); const prog = s && (await db.get('programs', s.programId));
  return (<main style={{ maxWidth: 560, margin: '60px auto', padding: 20, fontFamily: 'DM Sans, Arial, sans-serif' }}><h1>Certificate check</h1>
    {s && owner && !owner.suspended ? <div className="ok" style={{ padding: 16, borderRadius: 12, background: '#e8fff4' }}><b>Valid.</b> {owner.name} is a TwerkDivas certified instructor in {prog?.title}. Certified {new Date(s.reviewedAt || s.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.</div> : <div style={{ padding: 16, borderRadius: 12, background: '#ffeef0' }}><b>Not found.</b> We could not match code {code.replace(/[^A-Z0-9-]/g, '')} to a current certificate.</div>}</main>);
}
