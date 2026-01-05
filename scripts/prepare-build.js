/**
 * Build preparation script - Solution #7
 * Replaces csfle-key-management with stub BEFORE webpack runs
 * This ensures webpack can always resolve the import, even with Vercel cache
 * 
 * IMPORTANT: This runs BEFORE Next.js build, so webpack sees the stub file
 */

const fs = require('fs')
const path = require('path')

const encryptionDir = path.resolve(__dirname, '../lib/utils/encryption')
const originalFile = path.join(encryptionDir, 'csfle-key-management.ts')
const stubFile = path.join(encryptionDir, 'csfle-client-stub.ts')
const backupFile = path.join(encryptionDir, 'csfle-key-management.backup.ts')

console.log('🔧 [PREBUILD] Preparing build: Replacing csfle-key-management with stub...')
console.log('📁 Encryption dir:', encryptionDir)
console.log('📄 Original file exists:', fs.existsSync(originalFile))
console.log('📄 Stub file exists:', fs.existsSync(stubFile))
console.log('📂 Files in directory:', fs.readdirSync(encryptionDir))

// Always check and backup - Vercel cache might restore files
if (!fs.existsSync(originalFile)) {
  console.error('❌ Error: Original file not found:', originalFile)
  console.error('📂 Files in directory:', fs.readdirSync(encryptionDir))
  
  // Check if backup exists and restore it
  if (fs.existsSync(backupFile)) {
    console.log('🔄 Restoring from backup file...')
    fs.copyFileSync(backupFile, originalFile)
    console.log('✅ Restored from backup')
  } else {
    console.error('❌ No backup file found either. Cannot proceed.')
    process.exit(1)
  }
}

if (!fs.existsSync(stubFile)) {
  console.error('❌ Error: Stub file not found:', stubFile)
  process.exit(1)
}

// ALWAYS backup original (in case cache restored it)
if (fs.existsSync(backupFile)) {
  // Check if backup is actually the real file (not stub)
  const backupContent = fs.readFileSync(backupFile, 'utf8')
  if (!backupContent.includes('MongoDB CSFLE Key Management')) {
    // Backup is wrong, recreate it
    console.log('⚠️  Backup file appears incorrect, recreating...')
    fs.copyFileSync(originalFile, backupFile)
  }
} else {
  console.log('📦 Creating backup of original file...')
  fs.copyFileSync(originalFile, backupFile)
}

// Check if file is already the stub (from previous build)
const currentContent = fs.readFileSync(originalFile, 'utf8')
if (currentContent.includes('Encryption modules are server-only')) {
  console.log('ℹ️  File is already stub, skipping replacement')
} else {
  // Replace with stub - this ensures webpack can resolve it
  console.log('🔄 Replacing original file with stub...')
  fs.copyFileSync(stubFile, originalFile)
  console.log('✅ File replaced successfully')
  
  // Verify replacement
  const replacedContent = fs.readFileSync(originalFile, 'utf8')
  if (replacedContent.includes('Encryption modules are server-only')) {
    console.log('✅ Verification: File correctly replaced with stub')
  } else {
    console.error('❌ ERROR: File replacement failed!')
    process.exit(1)
  }
}

console.log('✅ Build preparation complete - webpack will see stub file')

