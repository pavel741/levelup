import { MongoClient, Db } from 'mongodb'

// Get MongoDB URI from environment variable
// Make sure to add MONGODB_URI to .env.local
// Connection string format: mongodb+srv://username:password@cluster.mongodb.net/database?options
// NEVER commit credentials to the repository - always use environment variables!
const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error(
    'MONGODB_URI environment variable is not set. ' +
    'Please add it to .env.local file. ' +
    'Format: mongodb+srv://username:password@cluster.mongodb.net/database?options'
  )
}

// Clean up the URI - remove any line breaks or extra spaces
const cleanUri = uri.trim().replace(/\s+/g, '').replace(/\r?\n/g, '')

// Validate connection string format
if (!cleanUri.includes('mongodb.net')) {
  throw new Error(
    'Invalid MongoDB connection string format. ' +
    'Expected format: mongodb+srv://user:pass@cluster.mongodb.net/database'
  )
}

// Debug: Log the URI being used (hide credentials)
if (process.env.NODE_ENV === 'development') {
  const maskedUri = cleanUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
  console.log('🔍 MongoDB URI:', maskedUri)
  console.log('🔍 URI ends with .mongodb.net:', cleanUri.includes('.mongodb.net'))
  console.log('🔍 URI length:', cleanUri.length)
}

// MongoDB connection options with better timeout and retry settings
const options = {
  serverSelectionTimeoutMS: 10000, // 10 seconds timeout
  socketTimeoutMS: 45000, // 45 seconds socket timeout
  connectTimeoutMS: 10000, // 10 seconds connection timeout
  maxPoolSize: 10, // Maximum number of connections
  retryWrites: true,
  retryReads: true,
}

let client: MongoClient | undefined
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
    _mongoUri?: string
  }

  // Clear cached connection if URI changed (for hot reload)
  if (globalWithMongo._mongoUri && globalWithMongo._mongoUri !== cleanUri) {
    console.log('🔄 MongoDB URI changed, clearing cached connection')
    delete globalWithMongo._mongoClientPromise
  }

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoUri = cleanUri
    client = new MongoClient(cleanUri, options)
    globalWithMongo._mongoClientPromise = client.connect().catch((error) => {
      console.error('❌ MongoDB connection failed:', error.message)
      console.error('💡 URI being used:', cleanUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))
      console.error('💡 Make sure your IP is whitelisted in MongoDB Atlas')
      console.error('💡 If you\'re using a VPN, add your VPN IP to the whitelist')
      console.error('💡 Go to: MongoDB Atlas → Network Access → Add IP Address')
      console.error('💡 Or disconnect VPN and use your real IP')
      // Clear the promise so it can be retried
      delete globalWithMongo._mongoClientPromise
      throw error
    })
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(cleanUri, options)
  clientPromise = client.connect().catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message)
    throw error
  })
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise
    // Extract database name from connection string or use default
    // Connection string format: mongodb+srv://user:pass@cluster.mongodb.net/dbname
    let dbName = 'levelup' // Default database name
    
    // Try to extract database name from URI
    const dbMatch = cleanUri.match(/mongodb\+srv:\/\/[^/]+\/([^?]+)/)
    if (dbMatch && dbMatch[1]) {
      dbName = dbMatch[1]
    }
    
    return client.db(dbName)
  } catch (error: any) {
    console.error('❌ Error getting MongoDB database:', error.message)
    
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('querySrv')) {
      console.error('💡 DNS resolution failed. Check your connection string:')
      console.error('💡 Make sure it ends with .mongodb.net (not .mongo)')
      console.error('💡 Current URI:', cleanUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))
      throw new Error('MongoDB DNS resolution failed. Please check your connection string format.')
    }
    
    if (error.message?.includes('ETIMEDOUT') || error.message?.includes('timeout')) {
      throw new Error('MongoDB connection timeout. Please check your network connection and IP whitelist settings in MongoDB Atlas.')
    }
    
    throw error
  }
}

