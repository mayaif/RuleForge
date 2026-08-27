import { SavedRuleInputSchema } from '#shared/types/savedRule'
import { getSavedRulesCollection } from '../../utils/mongo'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = SavedRuleInputSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues.map((i) => i.message).join('; ') })
  }

  const collection = await getSavedRulesCollection()
  const now = new Date()
  const result = await collection.insertOne({
    name: parsed.data.name,
    rule: parsed.data.rule,
    active: false,
    createdAt: now,
    updatedAt: now,
  })

  return { id: String(result.insertedId) }
})
