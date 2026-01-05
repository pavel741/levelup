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
      
      // Use a custom resolver plugin to intercept module resolution early
      // This runs before webpack tries to resolve the module
      const stubAbsolutePath = path.resolve(__dirname, 'lib/utils/encryption/csfle-client-stub')
      
      // Create a custom resolver plugin
      const EncryptionResolverPlugin = {
        apply: (resolver) => {
          // Hook into the 'described-resolve' hook which runs early in resolution
          resolver.hooks.describedResolve.tapAsync(
            'EncryptionModuleResolver',
            (request, resolveContext, callback) => {
              // Check if this is a request for csfle-key-management
              if (request.request && typeof request.request === 'string') {
                const req = request.request
                // Match the exact import patterns we use
                if (
                  req === './csfle-key-management' ||
                  req === './utils/encryption/csfle-key-management' ||
                  (req.includes('csfle-key-management') && !req.includes('csfle-client-stub'))
                ) {
                  // Calculate relative path from the requesting file's directory to the stub
                  const requestingDir = request.context ? request.context.issuer : __dirname
                  let stubRelativePath = path.relative(requestingDir || __dirname, stubAbsolutePath)
                  
                  // Normalize path separators for webpack (use forward slashes)
                  stubRelativePath = stubRelativePath.split(path.sep).join('/')
                  
                  // Ensure it starts with ./ if it's not already absolute or node_modules
                  if (!stubRelativePath.startsWith('.') && !stubRelativePath.startsWith('/')) {
                    stubRelativePath = './' + stubRelativePath
                  }
                  
                  // Replace the request with the stub path
                  const newRequest = {
                    ...request,
                    request: stubRelativePath,
                  }
                  // Continue resolution with the new request
                  return resolver.doResolve(
                    resolver.hooks.describedResolve,
                    newRequest,
                    null,
                    resolveContext,
                    callback
                  )
                }
              }
              // Continue with normal resolution
              callback()
            }
          )
        },
      }
      
      // Add the resolver plugin
      if (!config.resolve.plugins) {
        config.resolve.plugins = []
      }
      config.resolve.plugins.push(EncryptionResolverPlugin)
      
      // Also add NormalModuleReplacementPlugin as a fallback
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /csfle-key-management(?!-client-stub)/,
          stubAbsolutePath
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

