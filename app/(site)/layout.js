import Link from 'next/link';
export const metadata = { title: 'TwerkDivas Classes', description: 'Find and book TwerkDivas classes with certified instructors.' };
export default function SiteLayout({ children }) {
  return (<><div className="nav-top"><div className="wrap top"><Link href="/"><img src="/logo.svg" alt="TwerkDivas" /></Link>
    <nav className="row pubnav"><Link href="/classes">Classes</Link><Link href="/popups">Pop-up events</Link><Link href="/studios">Partner studios</Link><Link href="/instructors">Instructors</Link><Link className="btn sm" href="/login">Instructor login</Link></nav></div></div>
    <main className="wrap pub">{children}</main>
    <div className="wrap"><footer><span>© {new Date().getFullYear()} TwerkDivas · Tickets are sold only on this website</span><span className="row" style={{ gap: 14 }}><Link href="/packs">Class packs</Link><Link href="/tickets">Find my tickets</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/refunds">Refunds</Link><Link href="/contact">Contact</Link></span></footer></div></>);
}
