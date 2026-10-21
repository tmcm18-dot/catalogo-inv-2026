/** @type {import('next').NextConfig} */
const dulcesMaxiRootRedirect = process.env.DULCES_MAXI_ROOT_REDIRECT === '1';

const nextConfig = {
  output: 'standalone',
  async redirects() {
    // Solo para el despliegue dedicado de la tienda Dulces Maxi; el catálogo no define esta variable.
    return dulcesMaxiRootRedirect
      ? [{ source: '/', destination: '/dulces-maxi', permanent: false }]
      : [];
  },
};
module.exports = nextConfig;
