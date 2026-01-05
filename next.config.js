/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true, // Enable gzip compression
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  // Experimental features for better performance
  experimental: {
    // optimizeCss: true, // Disabled - requires critters package
  },
  webpack: (config, { isServer }) => {
    // Exclude MongoDB and Node.js modules from client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        'mongodb-client-encryption': false,
      }
      
      // Exclude MongoDB from client bundle
      config.externals = config.externals || []
      config.externals.push('mongodb')
    } else {
      // On server-side, prevent bundling encryption modules that use browser-only APIs
      // These modules are only used client-side via dynamic imports
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/utils/encryption/keyManager': false,
        '@/lib/utils/encryption/crypto': false,
        '@/lib/utils/encryption/financeEncryption': false,
        '@/lib/utils/encryption/routineEncryption': false,
        '@/lib/utils/encryption/config': false,
      }
    }
    return config
  },
}

module.exports = nextConfig
