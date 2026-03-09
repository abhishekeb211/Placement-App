/** @type {import('next').NextConfig} */
const withSerwist = require('@serwist/next').default;

const withSerwistConfig = withSerwist({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
};

module.exports = withSerwistConfig(nextConfig);
