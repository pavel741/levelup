/** @type {import('next').NextConfig} */
const path = require('path')

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
    // Ensure TypeScript files can be resolved
    config.resolve.extensions = [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      ...(config.resolve.extensions || []),
    ]
    
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
      
      // Replace encryption modules with stubs
      // The key is to match the exact import path before webpack tries to resolve it
      const stubPath = path.resolve(__dirname, 'lib/utils/encryption/csfle-client-stub.ts')
      
      // Use NormalModuleReplacementPlugin with exact string matching
      // This must match BEFORE webpack tries to resolve the module
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          // Match the exact relative import: './csfle-key-management'
          /^\.\/csfle-key-management$/,
          stubPath
        )
      )
      
      // Also handle the other import pattern from lib/mongodb-encrypted.ts
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          // Match: './utils/encryption/csfle-key-management'
          /^\.\/utils\/encryption\/csfle-key-management$/,
          stubPath
        )
      )
      
      // Ignore native .node files
      config.module.rules.push({
        test: /\.node$/,
        use: 'ignore-loader',
      })
      
      // Ignore mongodb-client-encryption package entirely on client side
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^mongodb-client-encryption$/,
        })
      )
      
      // Note: We don't ignore the encryption utility modules (csfle-key-management, csfle-explicit)
      // because they need to be resolvable during server-side builds.
      // They will fail at runtime on client-side anyway due to mongodb being externalized.
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

