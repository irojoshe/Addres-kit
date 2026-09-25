/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exportación estática para Cloudflare Pages (la demo es 100% cliente)
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
