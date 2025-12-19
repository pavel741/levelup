// Quick MongoDB connection test script
// Run with: node scripts/test-mongodb.js

require('dotenv').config({ path: '.env.local' })

const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || 'mongodb+srv://paveltim1991_db_user:ZqtmOj5hoH8BI1Qx@globalexpat.wgwihbe.mongodb.net/?appName=globalexpat'

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...')
  console.log('URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')) // Hide credentials
  
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  })

  try {
    console.log('⏳ Connecting...')
    await client.connect()
    console.log('✅ Connected successfully!')
    
    // Test database access
    const db = client.db('levelup')
    console.log('✅ Database "levelup" accessible')
    
    // List collections
    const collections = await db.listCollections().toArray()
    console.log('📁 Collections:', collections.length > 0 ? collections.map(c => c.name).join(', ') : 'None (this is normal for a new database)')
    
    await client.close()
    console.log('✅ Connection closed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    if (error.message.includes('timeout')) {
      console.error('💡 This might be a network/IP whitelist issue')
      console.error('💡 Make sure 0.0.0.0/0 is added in MongoDB Atlas → Network Access')
    }
    process.exit(1)
  }
}

testConnection()

