import { ObjectId } from 'mongodb'
import { SavedRuleInputSchema } from '#shared/types/savedRule'
import { getSavedRulesCollection } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const body = await readBody(event)
  const parsed = SavedRuleInputSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues.map((i) => i.message).join('; ') })
  }

  const collection = await getSavedRulesCollection()
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { name: parsed.data.name, rule: parsed.data.rule, updatedAt: new Date() } }
  )
  if (result.matchedCount === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return { ok: true }
})
