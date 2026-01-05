/**
 * Build preparation script - Solution #7 (Modified)
 * Creates a client-side version of the file that webpack can resolve
 * The original file remains for server builds
 */

const fs = require('fs')
const path = require('path')

const encryptionDir = path.resolve(__dirname, '../lib/utils/encryption')
const stubFile = path.join(encryptionDir, 'csfle-client-stub.ts')
const clientFile = path.join(encryptionDir, 'csfle-key-management.client.ts')

console.log('🔧 Preparing build: Creating client-side stub file...')

if (!fs.existsSync(stubFile)) {
  console.error('❌ Error: Stub file not found:', stubFile)
  process.exit(1)
}

// Copy stub to a client-specific file name
// Webpack will use this via alias during client builds
fs.copyFileSync(stubFile, clientFile)

console.log('✅ Build preparation complete')

