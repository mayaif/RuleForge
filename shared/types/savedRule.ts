import { z } from 'zod'
import { RuleTreeSchema } from './rule'

export const SavedRuleInputSchema = z.object({
  name: z.string().min(1).max(100),
  rule: RuleTreeSchema,
})

export type SavedRuleInput = z.infer<typeof SavedRuleInputSchema>

export type SavedRuleSummary = {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
  summary: { allow: number; review: number; block: number }
}
