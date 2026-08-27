import { MongoClient, type Db } from 'mongodb'

let clientPromise: Promise<MongoClient> | null = null

function getClient(): Promise<MongoClient> {
  const config = useRuntimeConfig()
  if (!config.mongodbUri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.')
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(config.mongodbUri).connect()
  }
  return clientPromise
}

/** Cached across requests within a server process — avoids reconnecting to
 * Atlas on every request in dev, and Nitro's request-scoped nature means this
 * module-level cache is shared for the process lifetime. */
export async function getDb(): Promise<Db> {
  const config = useRuntimeConfig()
  const client = await getClient()
  return client.db(config.mongodbDb || 'ruleforge')
}

export async function getOrdersCollection() {
  const db = await getDb()
  return db.collection('orders')
}

export async function getSavedRulesCollection() {
  const db = await getDb()
  return db.collection('saved_rules')
}
