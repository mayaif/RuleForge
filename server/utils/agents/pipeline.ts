import { runIntentAgent } from './intent'
import { runValidatorAgent } from './validator'
import { runExplainerAgent } from './explainer'
import { compileRule } from '../compileRule'
import { getOrdersCollection } from '../mongo'
import type { RuleTree } from '../../../shared/types/rule'

export type TriageSummary = { allow: number; review: number; block: number }

export type PipelineEvent =
  | { stage: 'drafting'; message: string }
  | { stage: 'reviewing'; message: string }
  | { stage: 'revising'; message: string }
  | { stage: 'previewing'; message: string }
  | { stage: 'explaining'; message: string }
  | { stage: 'done'; rule: RuleTree; summary: TriageSummary; explanation: string }
  | { stage: 'error'; message: string }

export async function* runRuleGenerationPipeline(description: string): AsyncGenerator<PipelineEvent> {
  yield { stage: 'drafting', message: 'Intent agent is drafting a rule tree…' }

  let intentResult = await runIntentAgent(description)
  if (!intentResult.ok) {
    yield { stage: 'error', message: `Intent agent failed: ${intentResult.error}` }
    return
  }

  yield { stage: 'reviewing', message: 'Validator agent is reviewing the rule…' }
  let validation = await runValidatorAgent(description, intentResult.rule)

  if (!validation.approved) {
    yield {
      stage: 'revising',
      message: `Validator requested a revision: ${validation.feedback ?? 'no reason given'}`,
    }
    const revised = await runIntentAgent(description, validation.feedback ?? undefined)
    if (revised.ok) {
      intentResult = revised
      validation = await runValidatorAgent(description, intentResult.rule)
    }
  }

  const rule = intentResult.rule

  yield { stage: 'previewing', message: 'Running the compiled rule against seeded orders…' }
  let summary: TriageSummary = { allow: 0, review: 0, block: 0 }
  try {
    const compiled = compileRule(rule)
    const orders = await getOrdersCollection()
    const results = await orders
      .aggregate([compiled.addFieldsStage, { $project: { action: 1, _id: 0 } }])
      .toArray()
    for (const row of results) {
      const action = row.action as keyof TriageSummary
      if (action in summary) summary[action]++
    }
  } catch (err) {
    yield {
      stage: 'error',
      message: `Failed to preview the rule: ${err instanceof Error ? err.message : 'unknown error'}`,
    }
    return
  }

  yield { stage: 'explaining', message: 'Explainer agent is writing a plain-English summary…' }
  const explanation = await runExplainerAgent(rule, summary).catch(() => '')

  yield { stage: 'done', rule, summary, explanation }
}
