import { getGroq, INTENT_MODEL, REASONING_PARAMS, extractJson } from '../groq'
import { RuleTreeSchema, SCHEMA_DESCRIPTION } from '../../../shared/types/rule'
import type { RuleTree } from '../../../shared/types/rule'

export type IntentResult = { ok: true; rule: RuleTree } | { ok: false; error: string }

export async function runIntentAgent(description: string, feedback?: string): Promise<IntentResult> {
  const groq = getGroq()

  const messages: { role: 'system' | 'user'; content: string }[] = [
    {
      role: 'system',
      content: `You are the intent agent in a multi-agent no-code rule builder. Your only job is to translate a plain-English fraud-rule description into a structured, validated rule tree — you never invent fields that aren't listed below.\n\n${SCHEMA_DESCRIPTION}`,
    },
    { role: 'user', content: description },
  ]

  if (feedback) {
    messages.push({
      role: 'user',
      content: `A reviewing agent rejected your previous rule with this feedback: "${feedback}". Produce a corrected JSON rule.`,
    })
  }

  const completion = await groq.chat.completions.create({
    model: INTENT_MODEL,
    messages,
    temperature: 0.1,
    max_tokens: 1500,
    ...REASONING_PARAMS,
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  const json = extractJson(raw)

  try {
    const parsed = JSON.parse(json)
    const result = RuleTreeSchema.safeParse(parsed)
    if (!result.success) {
      return { ok: false, error: result.error.issues.map((i) => i.message).join('; ') }
    }
    return { ok: true, rule: result.data }
  } catch {
    return { ok: false, error: 'Intent agent did not return valid JSON' }
  }
}
