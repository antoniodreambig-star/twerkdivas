import { ImageResponse } from 'next/og';
import { classPage } from '@/lib/data';
import { ClassCard, ogFonts } from '@/lib/og-card';
export const runtime = 'nodejs'; export const alt = 'Cakes and Core class'; export const size = { width: 1200, height: 630 }; export const contentType = 'image/png';
export default async function Image({ params }) {
  const c = await classPage(params.id).catch(() => null);
  const host = (process.env.APP_URL || 'https://app.cakesandcore.com').replace(/^https?:\/\//, '').replace(/\/$/, '');
  return new ImageResponse(<ClassCard c={c} host={host} />, { ...size, fonts: await ogFonts() });
}
