import Groq from 'groq-sdk'

let client: Groq | null = null

export function getGroq(): Groq {
  const config = useRuntimeConfig()
  if (!config.groqApiKey) {
    throw new Error('GROQ_API_KEY is not set. Copy .env.example to .env and fill it in.')
  }
  if (!client) client = new Groq({ apiKey: config.groqApiKey })
  return client
}

// Reasoning models (they think before answering) — verified against the live
// Groq API for this project; see InsightPilot's lib/groq.ts for the same
// finding. reasoning_effort/reasoning_format keep the visible `content` field
// to just the answer instead of a chain-of-thought trace.
export const INTENT_MODEL = 'openai/gpt-oss-120b'
export const VALIDATOR_MODEL = 'openai/gpt-oss-20b'
export const EXPLAINER_MODEL = 'openai/gpt-oss-20b'

export const REASONING_PARAMS = {
  reasoning_effort: 'low' as const,
  reasoning_format: 'hidden' as const,
}

/** Extracts the first balanced top-level JSON object/array from a model
 * response that may wrap it in prose or markdown code fences. */
export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1] ?? text
  const start = candidate.search(/[{[]/)
  if (start === -1) return candidate.trim()

  const open = candidate[start]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) return candidate.slice(start, i + 1)
    }
  }
  return candidate.slice(start).trim()
}
