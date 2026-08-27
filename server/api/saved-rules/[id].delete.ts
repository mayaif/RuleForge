import { ObjectId } from 'mongodb'
import { getSavedRulesCollection } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const collection = await getSavedRulesCollection()
  await collection.deleteOne({ _id: new ObjectId(id) })

  return { ok: true }
})
