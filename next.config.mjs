/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Let static files in /src and other public assets pass through
      // Rewrite all other paths to xstore.html (SPA catch-all)
      {
        source: '/:path((?!src|manifest|sw|_next|favicon|tc|install|mx-store|\\.well-known).*)',
        destination: '/xstore.html',
      },
    ];
  },
};

export default nextConfig;
