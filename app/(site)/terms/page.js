import Policy, { policyMeta } from '@/components/Policy';
export const dynamic = 'force-dynamic';
export const generateMetadata = () => policyMeta('terms');
export default function Page() { return <Policy k="terms" />; }
