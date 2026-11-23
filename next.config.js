/** @type {import('next').NextConfig} */
// Share-image fonts are read from assets/fonts at runtime, so ship them with the server functions.
module.exports = { reactStrictMode: true, experimental: { outputFileTracingIncludes: { '/**/*': ['./assets/fonts/**'] } }, poweredByHeader: false, async redirects() { return [{ source: '/tickets', destination: '/bookings', permanent: false }]; } };
