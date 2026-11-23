'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Public header. On phones it works like the cakesandcore.com menu: logo on the left,
// a "Menu" pill on the right, and a black panel that drops down under the header with
// big italic links and the buttons stacked at the bottom.
// links: [{ href, label, external }]  ctas: [{ href, label, primary }]
export default function PublicNav({ logoHref = '/', links = [], ctas = [] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  const close = () => setOpen(false);
  const item = (l, cls) => l.external
    ? <a key={l.href + l.label} className={cls} href={l.href} onClick={close}>{l.label}</a>
    : <Link key={l.href + l.label} className={cls} href={l.href} onClick={close} aria-current={path === l.href ? 'page' : undefined}>{l.label}</Link>;
  return (
    <div className="nav-top pubhead">
      <div className="wrap top">
        {logoHref ? <Link href={logoHref} className="pubbrand"><img src="/logo-sm.png" alt="Cakes and Core Twerk Fitness" /></Link> : <span className="pubbrand"><img src="/logo-sm.png" alt="Cakes and Core Twerk Fitness" /></span>}
        <button type="button" className="pubtoggle" aria-expanded={open} aria-controls="pubmenu" onClick={() => setOpen((o) => !o)}>Menu</button>
        <nav id="pubmenu" className={'row pubnav' + (open ? ' is-open' : '')} aria-label="Main">
          <div className="publinks">{links.map((l) => item(l))}</div>
          {ctas.length > 0 && <div className="pubcta">{ctas.map((c) => item(c, 'btn sm' + (c.primary ? ' primary' : '')))}</div>}
        </nav>
      </div>
    </div>
  );
}
