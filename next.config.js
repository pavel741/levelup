/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  compress: true, // Enable gzip compression
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  // Note: serverComponentsExternalPackages is available in Next.js 13.4+
  // For Next.js 14, we handle this via webpack externals instead
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
    
    // Ensure @ alias is configured (Next.js should do this, but we'll verify)
    if (!config.resolve.alias) {
      config.resolve.alias = {}
    }
    // Ensure @ points to the root directory
    if (!config.resolve.alias['@']) {
      config.resolve.alias['@'] = path.resolve(__dirname)
    }
    
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
      
      // DIRECT APPROACH: Use resolve.alias to map the import directly to stub
      // This works at the resolve level before webpack tries to bundle
      const stubPath = path.resolve(__dirname, 'lib/utils/encryption/csfle-client-stub')
      
      // Map the absolute import path directly to the stub file
      config.resolve.alias['@/lib/utils/encryption/csfle-key-management'] = stubPath
      
      // Also map relative imports from different locations
      // For imports from lib/utils/encryption/csfle-explicit.ts
      config.resolve.alias['./csfle-key-management'] = stubPath
      
      // For imports from lib/mongodb-encrypted.ts  
      config.resolve.alias['./utils/encryption/csfle-key-management'] = stubPath
      
      // Add NormalModuleReplacementPlugin as additional safety
      config.plugins.unshift(
        new webpack.NormalModuleReplacementPlugin(
          /csfle-key-management(?!-client-stub)/,
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

