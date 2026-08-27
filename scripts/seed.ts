import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env' })

import { MongoClient } from 'mongodb'
import { CURRENCIES, PAYMENT_METHODS, COUNTRIES, type Order } from '../shared/types/order'

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.')
}

const DB_NAME = process.env.MONGODB_DB || 'ruleforge'
const ORDER_COUNT = 400

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDateWithinDays(daysAgo: number): Date {
  const now = Date.now()
  const past = now - daysAgo * 24 * 60 * 60 * 1000
  return new Date(past + Math.random() * (now - past))
}

/** Generates a mostly-legitimate order, occasionally with the kind of
 * mismatches a fraud rule should catch: a new account, a large order, a
 * shipping/billing/IP country mismatch, or a customer with prior chargebacks.
 * Weighted so most orders are unremarkable — the point is to have a
 * realistic minority for rules to actually surface. */
function generateOrder(index: number): Order {
  const isSuspicious = Math.random() < 0.15
  const billingCountry = pick(COUNTRIES)
  const countryMismatch = isSuspicious && Math.random() < 0.6

  return {
    orderId: `ORD-${String(10000 + index)}`,
    createdAt: randomDateWithinDays(90),
    amountCents: isSuspicious
      ? randomInt(30000, 250000)
      : randomInt(1500, 40000),
    currency: pick(CURRENCIES),
    billingCountry,
    shippingCountry: countryMismatch ? pick(COUNTRIES.filter((c) => c !== billingCountry)) : billingCountry,
    ipCountry: countryMismatch && Math.random() < 0.5
      ? pick(COUNTRIES.filter((c) => c !== billingCountry))
      : billingCountry,
    paymentMethod: pick(PAYMENT_METHODS),
    accountAgeDays: isSuspicious ? randomInt(0, 6) : randomInt(7, 1200),
    priorChargebacks: isSuspicious && Math.random() < 0.3 ? randomInt(1, 3) : 0,
    itemCount: randomInt(1, 8),
    customerEmail: `customer${index}@example.com`,
  }
}

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI as string)
  await client.connect()
  const db = client.db(DB_NAME)
  const orders = db.collection('orders')

  console.log('Clearing existing orders...')
  await orders.deleteMany({})

  console.log(`Seeding ${ORDER_COUNT} orders...`)
  const rows = Array.from({ length: ORDER_COUNT }, (_, i) => generateOrder(i))
  await orders.insertMany(rows)

  await orders.createIndex({ createdAt: -1 })

  console.log('Seed complete.')
  await client.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
