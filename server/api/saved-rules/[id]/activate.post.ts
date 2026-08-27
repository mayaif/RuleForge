import { ObjectId } from 'mongodb'
import { getSavedRulesCollection } from '../../../utils/mongo'

/** Only one rule is "active" at a time — the one whose outcome the dashboard
 * reports on, standing in for "the rule currently applied to production
 * orders." Deactivating everything else first keeps that invariant simple. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const collection = await getSavedRulesCollection()
  const objectId = new ObjectId(id)

  const doc = await collection.findOne({ _id: objectId })
  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  await collection.updateMany({ _id: { $ne: objectId } }, { $set: { active: false } })
  await collection.updateOne({ _id: objectId }, { $set: { active: true } })

  return { ok: true }
})
