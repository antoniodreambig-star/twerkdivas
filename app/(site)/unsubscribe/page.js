import Unsub from '@/components/Unsub';
export const metadata = { title: 'Unsubscribe · Cakes and Core', robots: { index: false } };
export default function Page({ searchParams }) { return (<><h1 className="pubh">Unsubscribe</h1>{searchParams?.e && searchParams?.t ? <Unsub email={searchParams.e} t={searchParams.t} /> : <p className="mute">This link is incomplete.</p>}</>); }
