import { z } from 'zod'
import { ORDER_FIELDS, ORDER_FIELD_NAMES } from './order'

export const RISK_TIERS = ['low', 'medium', 'high'] as const
export const ACTIONS = ['allow', 'review', 'block'] as const
export const VALUE_OPS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'] as const
export const FIELD_OPS = ['eq', 'neq'] as const
export const COMBINATORS = ['and', 'or'] as const

export type RiskTier = (typeof RISK_TIERS)[number]
export type Action = (typeof ACTIONS)[number]

/** A leaf condition. "value" compares a field against a literal (e.g. amountCents
 * > 50000); "field" compares two fields against each other (e.g. shippingCountry
 * != billingCountry) — the cross-field comparisons a fraud rule actually needs
 * that a flat field/op/value model alone can't express. */
export const ConditionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('value'),
    field: z.enum(ORDER_FIELD_NAMES as [string, ...string[]]),
    op: z.enum(VALUE_OPS),
    value: z.union([z.string(), z.number()]),
  }),
  z.object({
    kind: z.literal('field'),
    field: z.enum(ORDER_FIELD_NAMES as [string, ...string[]]),
    op: z.enum(FIELD_OPS),
    compareField: z.enum(ORDER_FIELD_NAMES as [string, ...string[]]),
  }),
])

export const BranchSchema = z.object({
  id: z.string(),
  combinator: z.enum(COMBINATORS),
  conditions: z.array(ConditionSchema).min(1),
  tier: z.enum(RISK_TIERS),
  action: z.enum(ACTIONS),
})

export const RuleTreeSchema = z
  .object({
    name: z.string().min(1).max(100),
    branches: z.array(BranchSchema).min(1).max(8),
    defaultTier: z.enum(RISK_TIERS).default('low'),
    defaultAction: z.enum(ACTIONS).default('allow'),
  })
  .superRefine((rule, ctx) => {
    for (const [i, branch] of rule.branches.entries()) {
      for (const cond of branch.conditions) {
        const field = ORDER_FIELDS[cond.field as keyof typeof ORDER_FIELDS]
        if (!field) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unknown field "${cond.field}"`,
            path: ['branches', i],
          })
          continue
        }
        if (cond.kind === 'value') {
          if (field.type === 'number' && (cond.op === 'eq' || cond.op === 'neq') === false) {
            // gt/gte/lt/lte only make sense on numbers; eq/neq are fine on either type
          }
          if (field.type !== 'number' && ['gt', 'gte', 'lt', 'lte'].includes(cond.op)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `"${cond.op}" only applies to numeric fields, not "${cond.field}"`,
              path: ['branches', i],
            })
          }
          if (field.type === 'enum' && !(field.values as readonly string[]).includes(String(cond.value))) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `"${cond.value}" is not a valid value for "${cond.field}"`,
              path: ['branches', i],
            })
          }
        } else {
          const compareField = ORDER_FIELDS[cond.compareField as keyof typeof ORDER_FIELDS]
          if (compareField && compareField.type !== field.type) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Cannot compare "${cond.field}" (${field.type}) with "${cond.compareField}" (${compareField.type})`,
              path: ['branches', i],
            })
          }
        }
      }
    }
  })

export type Condition = z.infer<typeof ConditionSchema>
export type Branch = z.infer<typeof BranchSchema>
export type RuleTree = z.infer<typeof RuleTreeSchema>
