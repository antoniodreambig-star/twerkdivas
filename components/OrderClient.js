'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Confirms the payment when the buyer lands back from Stripe.
export default function OrderClient({ orderId, session }) {
  const router = useRouter(); const [msg, setMsg] = useState('Confirming your payment...');
  useEffect(() => { let off = false; (async () => { for (let i = 0; i < 5 && !off; i++) { const r = await fetch('/api/public/orders/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId, session }) }); const j = await r.json().catch(() => ({})); if (j.status === 'paid') { router.replace(`/orders/${orderId}`); router.refresh(); return; } if (!r.ok) { setMsg(j.error || 'We could not confirm the payment yet. Refresh in a moment.'); return; } await new Promise((s) => setTimeout(s, 1500)); } if (!off) setMsg('Still confirming. Refresh this page in a minute. If you were charged, your tickets will be emailed.'); })(); return () => { off = true; }; }, [orderId, session, router]);
  return <div className="ok">{msg}</div>;
}
