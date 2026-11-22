import './globals.css';
export const metadata = { metadataBase: new URL(process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')), openGraph: { siteName: 'Cakes and Core Twerk Fitness', type: 'website' }, title: 'TwerkDivas Instructor Academy', description: 'Learn the TwerkDivas routines, get certified, and teach.', manifest: '/manifest.webmanifest' };
export const viewport = { themeColor: '#0B0B10' };
export default function Root({ children }) {
  return (<html lang="en"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;1,700;1,800;1,900&family=Lobster+Two:ital,wght@0,700;1,700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
  </head><body>{children}</body></html>);
}
