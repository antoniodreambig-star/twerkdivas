import { settings } from '@/lib/data';
import { policyText, POLICY_KEYS } from '@/lib/policies';
export async function policyMeta(k) { return { title: `${POLICY_KEYS.find((p) => p[0] === k)[1]} · Cakes and Core` }; }
export default async function Policy({ k }) {
  const set = await settings(); const title = POLICY_KEYS.find((p) => p[0] === k)[1]; const text = policyText(set, k);
  return (<div style={{ maxWidth: 760 }}><h1 className="pubh">{title}</h1>{text.split(/\n\n+/).map((p, i) => <p key={i} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{p}</p>)}<p className="small mute">Questions? <a href="/contact">Contact us</a>.</p></div>);
}
