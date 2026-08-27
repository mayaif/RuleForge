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

function describeField(name: string) {
  const field = ORDER_FIELDS[name as keyof typeof ORDER_FIELDS]
  if (field.type === 'enum') return `${name} (enum: ${field.values.join(', ')})`
  return `${name} (number)`
}

/** Fed to the intent agent so it only ever names fields, ops, and values that
 * actually exist — generated from ORDER_FIELDS so it can never drift out of
 * sync with the real whitelist. */
export const SCHEMA_DESCRIPTION = `
You are drafting a fraud/risk rule for e-commerce orders. Available fields:
${ORDER_FIELD_NAMES.map((f) => `- ${describeField(f)}`).join('\n')}

A rule is an ordered list of branches — the first branch whose conditions match
an order wins; if none match, the rule falls through to a default tier/action.

Each branch has:
- combinator: "and" | "or" — how its conditions combine
- conditions: an array of 1+ conditions, each either:
  - { "kind": "value", "field": <field name>, "op": "eq"|"neq"|"gt"|"gte"|"lt"|"lte", "value": <number or the exact enum string> }
    (gt/gte/lt/lte only valid on number fields)
  - { "kind": "field", "field": <field name>, "op": "eq"|"neq", "compareField": <another field name of the SAME type> }
    (for comparisons between two fields, e.g. shippingCountry != billingCountry)
- tier: "low" | "medium" | "high"
- action: "allow" | "review" | "block"

Respond with ONLY a single JSON object matching this shape, no prose, no markdown fences:
{
  "name": string (short, human-readable, max 100 chars),
  "branches": [ { "id": string, "combinator": "and"|"or", "conditions": [...], "tier": "low"|"medium"|"high", "action": "allow"|"review"|"block" } ],
  "defaultTier": "low"|"medium"|"high",
  "defaultAction": "allow"|"review"|"block"
}
Order branches from most to least severe — the first matching branch wins, so
put the highest-confidence fraud signals first. Give each branch a short
unique id like "b1", "b2".
`.trim()
