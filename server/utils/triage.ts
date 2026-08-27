import { compileRule, type CompiledRule } from './compileRule'
import { getOrdersCollection } from './mongo'
import type { RuleTree } from '#shared/types/rule'

export type TriageSummary = { allow: number; review: number; block: number }

export type TriageRun = {
  results: Record<string, unknown>[]
  summary: TriageSummary
  compiled: CompiledRule
}

/** Compiles a rule and runs it against the live seeded orders — the one place
 * this happens, shared by the preview endpoint, the AI pipeline, the saved
 * rules list (for each rule's summary badge), and the dashboard. */
export async function runRuleAgainstOrders(rule: RuleTree): Promise<TriageRun> {
  const compiled = compileRule(rule)
  const orders = await getOrdersCollection()
  const results = await orders
    .aggregate([compiled.addFieldsStage, { $project: { _id: 0 } }])
    .toArray()

  const summary: TriageSummary = { allow: 0, review: 0, block: 0 }
  for (const row of results) {
    const action = row.action as keyof TriageSummary
    if (action in summary) summary[action]++
  }

  return { results, summary, compiled }
}
