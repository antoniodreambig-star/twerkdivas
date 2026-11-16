import Policy, { policyMeta } from '@/components/Policy';
export const dynamic = 'force-dynamic';
export const generateMetadata = () => policyMeta('refunds');
export default function Page() { return <Policy k="refunds" />; }
