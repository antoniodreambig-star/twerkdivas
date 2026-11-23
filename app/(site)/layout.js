import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
export const metadata = { title: 'Cakes and Core Classes', description: 'Find and book Cakes and Core classes with certified instructors.' };
export default function SiteLayout({ children }) {
  return (<><PublicNav links={[{ href: 'https://cakesandcore.com/', label: 'Home', external: true }, { href: '/classes', label: 'Classes' }, { href: '/popups', label: 'Pop-up events' }, { href: '/studios', label: 'Partner studios' }, { href: '/instructors', label: 'Instructors' }]} ctas={[{ href: '/login', label: 'Instructor login' }]} />
    <main className="wrap pub">{children}</main>
    <div className="wrap"><footer><span>© {new Date().getFullYear()} Cakes and Core · Tickets are sold only on this website</span><span className="row" style={{ gap: 14 }}><Link href="/packs">Class packs</Link><Link href="/bookings">My bookings</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/refunds">Refunds</Link><Link href="/contact">Contact</Link></span></footer></div></>);
}
