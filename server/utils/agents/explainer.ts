import { getGroq, EXPLAINER_MODEL, REASONING_PARAMS } from '../groq'
import type { RuleTree } from '#shared/types/rule'

/** Writes a plain-English walkthrough of a rule tree for a non-technical
 * stakeholder — the guided, human-readable summary a fraud-ops manager
 * (not an engineer) needs to sign off on a rule before it goes live. */
export async function runExplainerAgent(rule: RuleTree, summary?: { allow: number; review: number; block: number }): Promise<string> {
  const groq = getGroq()

  const summaryLine = summary
    ? `\n\nWhen run against the current order data, this rule would: allow ${summary.allow}, flag ${summary.review} for review, and block ${summary.block} orders.`
    : ''

  const completion = await groq.chat.completions.create({
    model: EXPLAINER_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are the explainer agent in a multi-agent no-code rule builder. Given a rule tree (as JSON) written for a fraud-ops team, write a short, plain-English walkthrough a non-technical stakeholder could read to understand and sign off on the rule — one sentence per branch, in order, plus one closing sentence about the fallback. No jargon, no JSON, no markdown. Mention concrete numbers if given.',
      },
      {
        role: 'user',
        content: `Rule:\n${JSON.stringify(rule, null, 2)}${summaryLine}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 500,
    ...REASONING_PARAMS,
  })

  return (completion.choices[0]?.message?.content ?? '').trim()
}
