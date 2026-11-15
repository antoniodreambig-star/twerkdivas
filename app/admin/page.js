import { redirect } from 'next/navigation';
import AdminApp from '@/components/AdminApp';
import { currentUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function Page() { const u = await currentUser(); if (!u) redirect('/login'); if (u.role !== 'admin') redirect('/app'); return <AdminApp />; }
