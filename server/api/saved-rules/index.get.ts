import { getSavedRulesCollection } from '../../utils/mongo'
import { runRuleAgainstOrders } from '../../utils/triage'
import { RuleTreeSchema } from '#shared/types/rule'
import type { SavedRuleSummary } from '#shared/types/savedRule'

export default defineEventHandler(async (): Promise<{ rules: SavedRuleSummary[] }> => {
  const collection = await getSavedRulesCollection()
  const docs = await collection.find({}).sort({ updatedAt: -1 }).toArray()

  const rules = await Promise.all(
    docs.map(async (doc) => {
      const rule = RuleTreeSchema.parse(doc.rule)
      const { summary } = await runRuleAgainstOrders(rule)
      return {
        id: String(doc._id),
        name: doc.name as string,
        active: Boolean(doc.active),
        createdAt: (doc.createdAt as Date).toISOString(),
        updatedAt: (doc.updatedAt as Date).toISOString(),
        summary,
      }
    })
  )

  return { rules }
})
