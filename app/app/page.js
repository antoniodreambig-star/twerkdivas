import { redirect } from 'next/navigation';
import MemberApp from '@/components/MemberApp';
import { currentUser, hasAccess } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function Page() { const u = await currentUser(); if (!u) redirect('/login'); if (!hasAccess(u)) redirect('/join'); return <MemberApp isAdmin={u.role === 'admin'} />; }
