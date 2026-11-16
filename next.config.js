/** @type {import('next').NextConfig} */
module.exports = { reactStrictMode: true, poweredByHeader: false, async redirects() { return [{ source: '/tickets', destination: '/bookings', permanent: false }]; } };
