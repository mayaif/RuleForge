import { getOrdersCollection } from '../utils/mongo'

/** Returns the full seeded order set for client-side rule preview. Small
 * enough (a few hundred rows) to just cache client-side and evaluate rules
 * against instantly as someone edits, instead of round-tripping to Mongo on
 * every keystroke. */
export default defineEventHandler(async () => {
  const orders = await getOrdersCollection()
  const rows = await orders.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray()
  return { orders: rows }
})
