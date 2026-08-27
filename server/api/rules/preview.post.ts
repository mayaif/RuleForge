import { RuleTreeSchema } from '#shared/types/rule'
import { runRuleAgainstOrders } from '../../utils/triage'

/** Runs a rule tree against the real seeded orders collection and returns a
 * triage summary — the "so what" of the rule, not just whether it compiles. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = RuleTreeSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues.map((i) => i.message).join('; ') })
  }

  const { results, summary, compiled } = await runRuleAgainstOrders(parsed.data)

  return {
    total: results.length,
    summary,
    orders: results,
    compiledPipeline: [compiled.addFieldsStage],
    branchExpressions: compiled.branchExpressions,
  }
})
