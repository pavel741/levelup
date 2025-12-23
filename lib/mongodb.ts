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
  // URI logging removed to avoid unused variable
}

// MongoDB connection options with better timeout and retry settings
const options = {
  serverSelectionTimeoutMS: 15000, // 15 seconds timeout (increased from 10)
  socketTimeoutMS: 45000, // 45 seconds socket timeout
  connectTimeoutMS: 15000, // 15 seconds connection timeout (increased from 10)
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
    delete globalWithMongo._mongoClientPromise
  }

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoUri = cleanUri
    client = new MongoClient(cleanUri, options)
    globalWithMongo._mongoClientPromise = client.connect().catch((error) => {
      console.error('❌ MongoDB connection failed:', error.message)
      console.error('💡 URI being used:', cleanUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))
      
      // Check for DNS resolution errors
      if (error.message?.includes('ENOTFOUND') || error.message?.includes('querySrv') || error.message?.includes('getaddrinfo')) {
        console.error('💡 DNS resolution failed. Possible causes:')
        console.error('   1. MongoDB Atlas cluster is PAUSED (free tier auto-pauses after inactivity)')
        console.error('   2. Network/DNS connectivity issues')
        console.error('   3. Incorrect hostname in connection string')
        console.error('💡 Solutions:')
        console.error('   - Go to MongoDB Atlas → Clusters → Click "Resume" if cluster is paused')
        console.error('   - Check your internet connection')
        console.error('   - Verify the connection string hostname is correct')
        console.error('   - Try: https://cloud.mongodb.com/ → Clusters → Resume Cluster')
      } else {
        console.error('💡 Make sure your IP is whitelisted in MongoDB Atlas')
        console.error('💡 If you\'re using a VPN, add your VPN IP to the whitelist')
        console.error('💡 Go to: MongoDB Atlas → Network Access → Add IP Address')
        console.error('💡 Or disconnect VPN and use your real IP')
      }
      
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
    
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('querySrv') || error.message?.includes('getaddrinfo')) {
      console.error('💡 DNS resolution failed. Possible causes:')
      console.error('   1. MongoDB Atlas cluster is PAUSED (free tier auto-pauses after inactivity)')
      console.error('   2. Network/DNS connectivity issues')
      console.error('   3. Incorrect hostname in connection string')
      console.error('💡 Current URI:', cleanUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))
      console.error('💡 Solutions:')
      console.error('   - Go to MongoDB Atlas → Clusters → Click "Resume" if cluster is paused')
      console.error('   - Check your internet connection')
      console.error('   - Verify the connection string hostname is correct')
      console.error('   - Try: https://cloud.mongodb.com/ → Clusters → Resume Cluster')
      throw new Error('MongoDB DNS resolution failed. Your MongoDB Atlas cluster may be paused. Please check MongoDB Atlas dashboard and resume the cluster if needed.')
    }
    
    if (error.message?.includes('ETIMEDOUT') || error.message?.includes('timeout') || error.message?.includes('Server selection timed out')) {
      console.error('💡 MongoDB connection timeout detected.')
      console.error('💡 Common causes:')
      console.error('   1. Your IP address is not whitelisted in MongoDB Atlas')
      console.error('   2. MongoDB Atlas cluster is paused (free tier)')
      console.error('   3. Network connectivity issues')
      console.error('   4. VPN or firewall blocking the connection')
      console.error('💡 Solutions:')
      console.error('   - Go to MongoDB Atlas → Network Access → Add IP Address (or use 0.0.0.0/0 for testing)')
      console.error('   - Check if your cluster is running (MongoDB Atlas → Clusters)')
      console.error('   - Try disconnecting VPN if you\'re using one')
      console.error('   - Check your internet connection')
      throw new Error('MongoDB connection timeout. Please check your network connection, IP whitelist settings, and ensure your MongoDB Atlas cluster is running.')
    }
    
    if (error.message?.includes('ReplicaSetNoPrimary') || error.message?.includes('no primary')) {
      console.error('💡 MongoDB replica set has no primary server.')
      console.error('💡 This usually means:')
      console.error('   1. MongoDB Atlas cluster is paused or unavailable')
      console.error('   2. Network connectivity issues preventing connection to primary')
      console.error('   3. Cluster is in the process of failing over')
      console.error('💡 Solutions:')
      console.error('   - Check MongoDB Atlas dashboard to ensure cluster is running')
      console.error('   - Wait a few minutes and try again')
      console.error('   - Check your network connection')
      throw new Error('MongoDB cluster unavailable. Please check MongoDB Atlas to ensure your cluster is running.')
    }
    
    throw error
  }
}

