import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { currentUser } from '@/lib/auth';
import { settings } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function Signup() { if (await currentUser().catch(() => null)) redirect('/app'); const s = await settings(); return <AuthForm mode="signup" agreement={s.agreement} />; }
