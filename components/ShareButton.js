'use client';
import { useState } from 'react';
export default function ShareButton({ title, text, path }) {
  const [ok, setOk] = useState(false);
  const go = async () => { const url = location.origin + (path || location.pathname); try { if (navigator.share) { await navigator.share({ title, text, url }); return; } await navigator.clipboard.writeText(url); setOk(true); setTimeout(() => setOk(false), 2000); } catch {} };
  return <button type="button" className="btn sm" onClick={go}>{ok ? 'Link copied!' : 'Share'}</button>;
}
