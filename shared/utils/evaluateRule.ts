import type { Order } from '../types/order'
import type { Condition, RuleTree, RiskTier, Action } from '../types/rule'

/** Pure, client-safe evaluator used for the instant live preview as someone
 * edits a rule — no round trip to Mongo needed. server/utils/compileRule.ts
 * implements the same semantics as a real Mongo aggregation expression; the
 * two must be kept in sync (evaluateRule.test-style parity is checked by
 * comparing preview results against the actual pipeline run). */
function testCondition(order: Order, cond: Condition): boolean {
  const left = order[cond.field as keyof Order]

  if (cond.kind === 'field') {
    const right = order[cond.compareField as keyof Order]
    return cond.op === 'eq' ? left === right : left !== right
  }

  const right = cond.value
  switch (cond.op) {
    case 'eq':
      return left === right
    case 'neq':
      return left !== right
    case 'gt':
      return typeof left === 'number' && left > Number(right)
    case 'gte':
      return typeof left === 'number' && left >= Number(right)
    case 'lt':
      return typeof left === 'number' && left < Number(right)
    case 'lte':
      return typeof left === 'number' && left <= Number(right)
    default:
      return false
  }
}

export type RuleOutcome = { tier: RiskTier; action: Action; matchedBranchId: string | null }

export function evaluateRule(order: Order, rule: RuleTree): RuleOutcome {
  for (const branch of rule.branches) {
    const results = branch.conditions.map((c) => testCondition(order, c))
    const matched = branch.combinator === 'and' ? results.every(Boolean) : results.some(Boolean)
    if (matched) {
      return { tier: branch.tier, action: branch.action, matchedBranchId: branch.id }
    }
  }
  return { tier: rule.defaultTier, action: rule.defaultAction, matchedBranchId: null }
}
