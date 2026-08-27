import { z } from 'zod'
import { getGroq, VALIDATOR_MODEL, REASONING_PARAMS, extractJson } from '../groq'
import type { RuleTree } from '#shared/types/rule'

const ValidatorResponseSchema = z.object({
  approved: z.boolean(),
  feedback: z.string().nullable().optional(),
})

export type ValidatorResult = { approved: boolean; feedback: string | null }

/** Reviews a structurally-valid rule tree for things Zod's schema can't catch:
 * contradictory conditions in the same branch (amountCents > 1000 AND
 * amountCents < 500), a branch that can never be reached because an earlier
 * one already covers it, or a description mismatch (the rule doesn't actually
 * do what the user asked for). */
export async function runValidatorAgent(description: string, rule: RuleTree): Promise<ValidatorResult> {
  const groq = getGroq()

  const completion = await groq.chat.completions.create({
    model: VALIDATOR_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are the validator agent in a multi-agent no-code rule builder. You receive the user's original plain-English description and a structurally-valid rule tree drafted by an intent agent. Check for: contradictory conditions within one branch (e.g. a number both > 1000 and < 500), a branch that can never be reached because an earlier branch already fully covers its conditions, or the rule simply not matching what the user described.\n\nRespond with ONLY a JSON object: { "approved": boolean, "feedback": string | null }. Set approved=false and give one short, actionable feedback sentence only if there's a real problem. Be lenient — approve reasonable rules.`,
      },
      {
        role: 'user',
        content: `Description: "${description}"\n\nRule:\n${JSON.stringify(rule, null, 2)}`,
      },
    ],
    temperature: 0,
    max_tokens: 500,
    ...REASONING_PARAMS,
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  try {
    const parsed = JSON.parse(extractJson(raw))
    const result = ValidatorResponseSchema.safeParse(parsed)
    if (!result.success) return { approved: true, feedback: null }
    return { approved: result.data.approved, feedback: result.data.feedback ?? null }
  } catch {
    return { approved: true, feedback: null }
  }
}
