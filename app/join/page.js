import { redirect } from 'next/navigation';
import JoinClient from '@/components/JoinClient';
import { currentUser, hasAccess } from '@/lib/auth';
import { settings } from '@/lib/data';
import { stripeOn } from '@/lib/stripe';
export const dynamic = 'force-dynamic';
export default async function Join({ searchParams }) {
  const u = await currentUser(); if (!u) redirect('/login'); if (hasAccess(u)) redirect('/app');
  const s = await settings();
  return <JoinClient name={u.name} price={s.price} welcome={s.welcome} on={stripeOn()} paid={searchParams?.paid || ''} canceled={!!searchParams?.canceled} status={u.sub?.status || ''} />;
}
