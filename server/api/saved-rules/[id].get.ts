import { ObjectId } from 'mongodb'
import { getSavedRulesCollection } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const collection = await getSavedRulesCollection()
  const doc = await collection.findOne({ _id: new ObjectId(id) })
  if (!doc) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return {
    id: String(doc._id),
    name: doc.name,
    rule: doc.rule,
    active: Boolean(doc.active),
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  }
})
