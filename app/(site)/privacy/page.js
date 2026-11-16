import Policy, { policyMeta } from '@/components/Policy';
export const dynamic = 'force-dynamic';
export const generateMetadata = () => policyMeta('privacy');
export default function Page() { return <Policy k="privacy" />; }
