/**
 * Build restoration script - Solution #7
 * Restores the original csfle-key-management file after build
 * This ensures the file is correct for runtime/server usage
 */

const fs = require('fs')
const path = require('path')

const encryptionDir = path.resolve(__dirname, '../lib/utils/encryption')
const originalFile = path.join(encryptionDir, 'csfle-key-management.ts')
const backupFile = path.join(encryptionDir, 'csfle-key-management.backup.ts')

console.log('🔄 [POSTBUILD] Restoring original csfle-key-management file...')

if (fs.existsSync(backupFile)) {
  // Check if file needs restoration
  const currentContent = fs.readFileSync(originalFile, 'utf8')
  if (currentContent.includes('Encryption modules are server-only')) {
    // File is still stub, restore it
    console.log('🔄 Restoring original file from backup...')
    fs.copyFileSync(backupFile, originalFile)
    console.log('✅ Original file restored')
    
    // Verify restoration
    const restoredContent = fs.readFileSync(originalFile, 'utf8')
    if (restoredContent.includes('MongoDB CSFLE Key Management')) {
      console.log('✅ Verification: File correctly restored')
    } else {
      console.warn('⚠️  Warning: File restoration may not have worked correctly')
    }
  } else {
    console.log('ℹ️  File is already original, no restoration needed')
  }
} else {
  console.warn('⚠️  No backup file found')
  console.warn('⚠️  This might be OK if build failed before replacement')
}

console.log('✅ Build restoration complete')

