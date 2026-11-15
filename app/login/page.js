import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { currentUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default async function Login() { if (await currentUser().catch(() => null)) redirect('/app'); return <AuthForm mode="login" />; }
