/**
 * MongoDB Index Creation Script
 * Run this once to create performance-critical indexes
 * 
 * Usage: node scripts/create-indexes.js
 */

const { MongoClient } = require('mongodb')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim()
    // Skip comments and empty lines
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
  })
  console.log('✅ Loaded environment variables from .env.local')
} else {
  console.log('⚠️  .env.local not found, using environment variables')
}

const uri = process.env.MONGODB_URI

if (!uri) {
  console.error('❌ MONGODB_URI environment variable is not set')
  console.error('💡 Add it to .env.local file')
  process.exit(1)
}

async function createIndexes() {
  let client
  
  try {
    console.log('🔌 Connecting to MongoDB...')
    client = await MongoClient.connect(uri)
    const db = client.db()
    
    console.log('📊 Creating indexes...')
    
    // Finance transactions indexes
    console.log('  - Creating indexes for finance_transactions...')
    await db.collection('finance_transactions').createIndex(
      { userId: 1, date: -1 },
      { name: 'userId_date_desc' }
    )
    await db.collection('finance_transactions').createIndex(
      { userId: 1, date: 1, amount: 1 },
      { name: 'userId_date_amount' }
    )
    await db.collection('finance_transactions').createIndex(
      { userId: 1, category: 1 },
      { name: 'userId_category' }
    )
    
    // Workout routines indexes
    console.log('  - Creating indexes for workout_routines...')
    await db.collection('workout_routines').createIndex(
      { userId: 1, updatedAt: -1 },
      { name: 'userId_updatedAt_desc' }
    )
    
    // Workout logs indexes
    console.log('  - Creating indexes for workout_logs...')
    await db.collection('workout_logs').createIndex(
      { userId: 1, date: -1 },
      { name: 'userId_date_desc' }
    )
    await db.collection('workout_logs').createIndex(
      { userId: 1, routineId: 1, date: -1 },
      { name: 'userId_routineId_date' }
    )
    
    // Finance categories indexes
    console.log('  - Creating indexes for finance_categories...')
    try {
      await db.collection('finance_categories').createIndex(
        { userId: 1 },
        { name: 'userId', unique: true }
      )
    } catch (error) {
      if (error.code === 11000) {
        console.log('    ⚠️  Unique index skipped - duplicates found. Consider cleaning up duplicate documents first.')
      } else {
        throw error
      }
    }
    
    // Finance settings indexes
    console.log('  - Creating indexes for finance_settings...')
    try {
      // Check for duplicates first
      const duplicateSettings = await db.collection('finance_settings').aggregate([
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]).toArray()
      
      if (duplicateSettings.length > 0) {
        console.log(`    ⚠️  Found ${duplicateSettings.length} users with duplicate settings. Creating non-unique index instead.`)
        await db.collection('finance_settings').createIndex(
          { userId: 1 },
          { name: 'userId' }
        )
      } else {
        await db.collection('finance_settings').createIndex(
          { userId: 1 },
          { name: 'userId', unique: true }
        )
      }
    } catch (error) {
      if (error.code === 11000) {
        console.log('    ⚠️  Unique index skipped - duplicates found. Creating non-unique index instead.')
        await db.collection('finance_settings').createIndex(
          { userId: 1 },
          { name: 'userId' }
        )
      } else {
        throw error
      }
    }
    
    console.log('✅ All indexes created successfully!')
    console.log('💡 These indexes will significantly improve query performance')
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message)
    if (error.message.includes('already exists')) {
      console.log('💡 Some indexes already exist - this is fine')
    } else {
      throw error
    }
  } finally {
    if (client) {
      await client.close()
      console.log('🔌 Connection closed')
    }
  }
}

createIndexes()
  .then(() => {
    console.log('✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })

