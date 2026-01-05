/**
 * Build restoration script - Solution #7 (Modified)
 * Cleans up temporary client file after build
 */

const fs = require('fs')
const path = require('path')

const encryptionDir = path.resolve(__dirname, '../lib/utils/encryption')
const clientFile = path.join(encryptionDir, 'csfle-key-management.client.ts')

console.log('🔄 Cleaning up build artifacts...')

if (fs.existsSync(clientFile)) {
  fs.unlinkSync(clientFile)
  console.log('✅ Cleanup complete')
} else {
  console.warn('⚠️  No client file found, skipping cleanup')
}

