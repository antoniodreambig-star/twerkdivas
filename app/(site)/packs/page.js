import PackBuy from '@/components/PackBuy';
import { settings } from '@/lib/data';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Class packs · TwerkDivas', description: 'Save with a TwerkDivas class pack.' };
export default async function Page({ searchParams }) {
  const set = await settings(); const packs = (set.packs || []);
  return (<><h1 className="pubh">Class packs</h1><p className="mute" style={{ maxWidth: 620 }}>Buy credits once, then book any ticketed class with your pack code. Valid for 12 months. One credit equals one ticket.</p>{searchParams?.canceled && <div className="err">Payment was canceled. You have not been charged.</div>}
    {packs.length === 0 ? <div className="card" style={{ textAlign: 'center' }}><p className="mute">No packs are on sale right now.</p></div> : <PackBuy packs={packs} />}</>);
}
