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
    // Index for duplicate checks (CSV import)
    await db.collection('finance_transactions').createIndex(
      { userId: 1, archiveId: 1 },
      { name: 'userId_archiveId' }
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
    // Compound index for statistics queries
    await db.collection('workout_logs').createIndex(
      { userId: 1, date: -1, routineId: 1 },
      { name: 'userId_date_routineId' }
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
    
    // Todos Collection
    console.log('  - Creating indexes for todos...')
    await db.collection('todos').createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_createdAt_desc' }
    )
    await db.collection('todos').createIndex(
      { userId: 1, isCompleted: 1, createdAt: -1 },
      { name: 'userId_isCompleted_createdAt' }
    )
    await db.collection('todos').createIndex(
      { userId: 1, priority: 1 },
      { name: 'userId_priority' }
    )
    await db.collection('todos').createIndex(
      { userId: 1, dueDate: 1 },
      { name: 'userId_dueDate' }
    )
    console.log('  ✅ Todo indexes created.')
    
    // Focus sessions indexes
    console.log('  - Creating indexes for focus_sessions...')
    await db.collection('focus_sessions').createIndex(
      { userId: 1, startedAt: -1 },
      { name: 'userId_startedAt_desc' }
    )
    await db.collection('focus_sessions').createIndex(
      { userId: 1, isCompleted: 1, startedAt: -1 },
      { name: 'userId_isCompleted_startedAt' }
    )
    await db.collection('focus_sessions').createIndex(
      { userId: 1, type: 1 },
      { name: 'userId_type' }
    )
    // Compound index for statistics queries
    await db.collection('focus_sessions').createIndex(
      { userId: 1, startedAt: -1, isCompleted: 1 },
      { name: 'userId_startedAt_isCompleted' }
    )
    console.log('  ✅ Focus session indexes created.')
    
    // Savings goals indexes
    console.log('  - Creating indexes for savings_goals...')
    await db.collection('savings_goals').createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_createdAt_desc' }
    )
    await db.collection('savings_goals').createIndex(
      { userId: 1, category: 1 },
      { name: 'userId_category' }
    )
    console.log('  ✅ Savings goals indexes created.')
    
    // Goals indexes
    console.log('  - Creating indexes for goals...')
    await db.collection('goals').createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_createdAt_desc' }
    )
    await db.collection('goals').createIndex(
      { userId: 1, status: 1, createdAt: -1 },
      { name: 'userId_status_createdAt' }
    )
    await db.collection('goals').createIndex(
      { userId: 1, category: 1 },
      { name: 'userId_category' }
    )
    await db.collection('goals').createIndex(
      { userId: 1, deadline: 1 },
      { name: 'userId_deadline' }
    )
    console.log('  ✅ Goals indexes created.')
    
    // Notifications indexes
    console.log('  - Creating indexes for notifications...')
    await db.collection('notifications').createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_createdAt_desc' }
    )
    await db.collection('notifications').createIndex(
      { userId: 1, read: 1, createdAt: -1 },
      { name: 'userId_read_createdAt' }
    )
    await db.collection('notifications').createIndex(
      { userId: 1, scheduledFor: 1 },
      { name: 'userId_scheduledFor' }
    )
    console.log('  ✅ Notifications indexes created.')
    
    // Journal entries indexes
    console.log('  - Creating indexes for journal_entries...')
    await db.collection('journal_entries').createIndex(
      { userId: 1, date: -1 },
      { name: 'userId_date_desc' }
    )
    await db.collection('journal_entries').createIndex(
      { userId: 1, type: 1, date: -1 },
      { name: 'userId_type_date' }
    )
    await db.collection('journal_entries').createIndex(
      { userId: 1, date: 1, type: 1 },
      { name: 'userId_date_type' }
    )
    // Text search index for content and title
    await db.collection('journal_entries').createIndex(
      { userId: 1, title: 'text', content: 'text' },
      { name: 'userId_text_search' }
    )
    await db.collection('journal_entries').createIndex(
      { userId: 1, moodRating: 1 },
      { name: 'userId_moodRating' }
    )
    console.log('  ✅ Journal entries indexes created.')
    
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

