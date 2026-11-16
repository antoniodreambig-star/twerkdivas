import './globals.css';
export const metadata = { metadataBase: new URL(process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')), openGraph: { siteName: 'TwerkDivas', type: 'website' }, title: 'TwerkDivas Instructor Academy', description: 'Learn the TwerkDivas routines, get certified, and teach.', manifest: '/manifest.webmanifest', icons: { icon: '/icon.svg' } };
export const viewport = { themeColor: '#1B0A3C' };
export default function Root({ children }) {
  return (<html lang="en"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
  </head><body>{children}</body></html>);
}
