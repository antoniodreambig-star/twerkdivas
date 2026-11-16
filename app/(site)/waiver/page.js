import Policy, { policyMeta } from '@/components/Policy';
export const dynamic = 'force-dynamic';
export const generateMetadata = () => policyMeta('waiver');
export default function Page() { return <Policy k="waiver" />; }
