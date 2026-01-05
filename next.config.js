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
      
      // Exclude MongoDB and encryption modules from client bundle
      config.externals = config.externals || []
      config.externals.push('mongodb')
      config.externals.push('mongodb-client-encryption')
      
      // Ignore native .node files
      config.module.rules.push({
        test: /\.node$/,
        use: 'ignore-loader',
      })
      
      // Ignore mongodb-client-encryption package entirely
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^mongodb-client-encryption$/,
        })
      )
    }
    
    // For server-side builds, exclude .node files from webpack bundling
    // They will be loaded at runtime by Node.js
    if (isServer) {
      config.module.rules.push({
        test: /\.node$/,
        loader: 'ignore-loader',
      })
      
      // Also mark mongodb-client-encryption as external for server builds
      // This prevents webpack from trying to bundle the native module
      const originalExternals = config.externals || []
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals]),
        ({ request }, callback) => {
          if (request && request.includes('mongodb-client-encryption')) {
            return callback(null, `commonjs ${request}`)
          }
          callback()
        },
      ]
    }
    
    return config
  },
}

module.exports = nextConfig

