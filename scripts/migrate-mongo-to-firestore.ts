/**
 * Migration script to copy data from MongoDB to Firestore
 * Run this when MongoDB is accessible to sync your data to Firestore
 * 
 * Usage: npx ts-node scripts/migrate-mongo-to-firestore.ts <userId>
 */

import { getDatabase } from '../lib/mongodb'
import { db } from '../lib/firebase'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

async function migrateRoutines(userId: string) {
  console.log(`📦 Migrating routines for user ${userId}...`)
  
  try {
    const mongoDb = await getDatabase()
    const routinesCollection = mongoDb.collection('routines')
    const routines = await routinesCollection.find({ userId }).toArray()
    
    console.log(`   Found ${routines.length} routines`)
    
    let migrated = 0
    for (const routine of routines) {
      try {
        const routineData: any = {
          ...routine,
          id: routine.id || routine._id.toString(),
          createdAt: routine.createdAt instanceof Date ? Timestamp.fromDate(routine.createdAt) : Timestamp.now(),
          updatedAt: routine.updatedAt instanceof Date ? Timestamp.fromDate(routine.updatedAt) : Timestamp.now(),
        }
        
        // Remove MongoDB _id
        delete routineData._id
        
        // Remove undefined fields
        Object.keys(routineData).forEach(key => {
          if (routineData[key] === undefined) {
            delete routineData[key]
          }
        })
        
        await setDoc(doc(db!, 'routines', routineData.id), routineData)
        migrated++
      } catch (error: any) {
        console.error(`   ❌ Failed to migrate routine ${routine.id || routine._id}:`, error.message)
      }
    }
    
    console.log(`   ✅ Migrated ${migrated}/${routines.length} routines`)
    return migrated
  } catch (error: any) {
    console.error(`   ❌ Error migrating routines:`, error.message)
    return 0
  }
}

async function migrateWorkoutLogs(userId: string) {
  console.log(`📦 Migrating workout logs for user ${userId}...`)
  
  try {
    const mongoDb = await getDatabase()
    const logsCollection = mongoDb.collection('workout_logs')
    const logs = await logsCollection.find({ userId }).toArray()
    
    console.log(`   Found ${logs.length} workout logs`)
    
    let migrated = 0
    for (const log of logs) {
      try {
        const logData: any = {
          ...log,
          id: log.id || log._id.toString(),
          date: log.date instanceof Date ? Timestamp.fromDate(log.date) : Timestamp.now(),
          startTime: log.startTime instanceof Date ? Timestamp.fromDate(log.startTime) : Timestamp.now(),
        }
        
        if (log.endTime) {
          logData.endTime = log.endTime instanceof Date ? Timestamp.fromDate(log.endTime) : Timestamp.fromDate(new Date())
        }
        
        // Remove MongoDB _id
        delete logData._id
        
        // Remove undefined fields
        Object.keys(logData).forEach(key => {
          if (logData[key] === undefined) {
            delete logData[key]
          }
        })
        
        await setDoc(doc(db!, 'workoutLogs', logData.id), logData)
        migrated++
      } catch (error: any) {
        console.error(`   ❌ Failed to migrate log ${log.id || log._id}:`, error.message)
      }
    }
    
    console.log(`   ✅ Migrated ${migrated}/${logs.length} workout logs`)
    return migrated
  } catch (error: any) {
    console.error(`   ❌ Error migrating workout logs:`, error.message)
    return 0
  }
}

async function migrateTransactions(userId: string) {
  console.log(`📦 Migrating transactions for user ${userId}...`)
  
  try {
    const mongoDb = await getDatabase()
    const transactionsCollection = mongoDb.collection('finance_transactions')
    const transactions = await transactionsCollection.find({ userId }).toArray()
    
    console.log(`   Found ${transactions.length} transactions`)
    
    let migrated = 0
    for (const tx of transactions) {
      try {
        const txData: any = {
          ...tx,
          id: tx.id || tx._id.toString(),
          date: tx.date instanceof Date ? Timestamp.fromDate(tx.date) : Timestamp.now(),
          createdAt: tx.createdAt instanceof Date ? Timestamp.fromDate(tx.createdAt) : Timestamp.now(),
        }
        
        // Remove MongoDB _id
        delete txData._id
        
        // Remove undefined fields
        Object.keys(txData).forEach(key => {
          if (txData[key] === undefined) {
            delete txData[key]
          }
        })
        
        await setDoc(doc(db!, 'finance_transactions', txData.id), txData)
        migrated++
      } catch (error: any) {
        console.error(`   ❌ Failed to migrate transaction ${tx.id || tx._id}:`, error.message)
      }
    }
    
    console.log(`   ✅ Migrated ${migrated}/${transactions.length} transactions`)
    return migrated
  } catch (error: any) {
    console.error(`   ❌ Error migrating transactions:`, error.message)
    return 0
  }
}

async function main() {
  const userId = process.argv[2]
  
  if (!userId) {
    console.error('❌ Usage: npx ts-node scripts/migrate-mongo-to-firestore.ts <userId>')
    process.exit(1)
  }
  
  console.log(`🚀 Starting migration for user: ${userId}`)
  console.log(`⚠️  Make sure MongoDB is accessible and Firestore is initialized\n`)
  
  try {
    // Wait for Firebase to initialize
    const { waitForFirebaseInit } = await import('../lib/firebase')
    await waitForFirebaseInit()
    
    if (!db) {
      throw new Error('Firestore is not initialized')
    }
    
    const routinesCount = await migrateRoutines(userId)
    const logsCount = await migrateWorkoutLogs(userId)
    const transactionsCount = await migrateTransactions(userId)
    
    console.log(`\n✅ Migration complete!`)
    console.log(`   Routines: ${routinesCount}`)
    console.log(`   Workout Logs: ${logsCount}`)
    console.log(`   Transactions: ${transactionsCount}`)
    console.log(`\n💡 Your data is now available in Firestore and will work even when MongoDB is blocked.`)
  } catch (error: any) {
    console.error(`\n❌ Migration failed:`, error.message)
    if (error.message?.includes('MongoDB') || error.message?.includes('timeout')) {
      console.error(`\n💡 Make sure MongoDB is accessible. If you're in the office,`)
      console.error(`   you may need to run this script from home or a location where MongoDB is accessible.`)
    }
    process.exit(1)
  }
}

main()

