import { RuleTreeSchema } from '#shared/types/rule'
import { compileRule } from '../../utils/compileRule'
import { getOrdersCollection } from '../../utils/mongo'

/** Runs a rule tree against the real seeded orders collection and returns a
 * triage summary — the "so what" of the rule, not just whether it compiles. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = RuleTreeSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues.map((i) => i.message).join('; ') })
  }

  const rule = parsed.data
  const compiled = compileRule(rule)
  const orders = await getOrdersCollection()

  const results = await orders
    .aggregate([
      compiled.addFieldsStage,
      { $sort: { createdAt: -1 } },
      { $project: { _id: 0 } },
    ])
    .toArray()

  const summary = { allow: 0, review: 0, block: 0 }
  for (const row of results) {
    const action = row.action as keyof typeof summary
    if (action in summary) summary[action]++
  }

  return {
    total: results.length,
    summary,
    orders: results,
    compiledPipeline: [compiled.addFieldsStage],
    branchExpressions: compiled.branchExpressions,
  }
})
