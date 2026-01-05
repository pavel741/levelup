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
  webpack: (config, { isServer, webpack }) => {
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
      const path = require('path')
      const fs = require('fs')
      const stubPath = path.resolve(__dirname, 'lib', 'utils', 'encryption', 'server-stub.js')
      
      // Ensure stub file exists
      if (!fs.existsSync(stubPath)) {
        // Create stub file if it doesn't exist
        const stubDir = path.dirname(stubPath)
        if (!fs.existsSync(stubDir)) {
          fs.mkdirSync(stubDir, { recursive: true })
        }
      }
      
      // Use webpack's NormalModuleReplacementPlugin to replace encryption modules with stubs
      // Match both absolute (@/) and relative (./) paths
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^(?:@\/lib\/utils\/encryption\/|\.\/)(keyManager|crypto|financeEncryption|routineEncryption|config)$/,
          (resource) => {
            // Only replace if it's from the encryption directory or loader
            if (resource.context && (
              resource.context.includes(path.join('lib', 'utils', 'encryption')) ||
              resource.context.includes('loader')
            )) {
              resource.request = stubPath
            }
          }
        )
      )
      
      // Add to resolve.alias as backup
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/utils/encryption/keyManager': stubPath,
        '@/lib/utils/encryption/crypto': stubPath,
        '@/lib/utils/encryption/financeEncryption': stubPath,
        '@/lib/utils/encryption/routineEncryption': stubPath,
        '@/lib/utils/encryption/config': stubPath,
      }
    }
    return config
  },
}

module.exports = nextConfig
