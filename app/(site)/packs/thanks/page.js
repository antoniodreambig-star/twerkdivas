import PackThanks from '@/components/PackThanks';
export const metadata = { title: 'Your class pack · TwerkDivas', robots: { index: false } };
export default function Page({ searchParams }) { return (<><h1 className="pubh">Thank you!</h1>{searchParams?.pass && searchParams?.paid ? <PackThanks passId={searchParams.pass} session={searchParams.paid} /> : <p className="mute">Missing payment reference.</p>}</>); }
