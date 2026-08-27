import type { Document } from 'mongodb'
import { ORDER_FIELD_NAMES } from '#shared/types/order'
import { VALUE_OPS } from '#shared/types/rule'
import type { Branch, Condition, RuleTree } from '#shared/types/rule'

const VALUE_OP_TO_MONGO: Record<(typeof VALUE_OPS)[number], string> = {
  eq: '$eq',
  neq: '$ne',
  gt: '$gt',
  gte: '$gte',
  lt: '$lt',
  lte: '$lte',
}

/** Every field reference here is checked against ORDER_FIELD_NAMES before it's
 * allowed anywhere near a "$fieldName" string — this is what stops a rule
 * (however it was authored — by hand or by the intent agent) from ever
 * referencing an arbitrary, non-whitelisted document path in the aggregation. */
function fieldRef(field: string): string {
  if (!ORDER_FIELD_NAMES.includes(field as never)) {
    throw new Error(`Refusing to compile unknown field "${field}"`)
  }
  return `$${field}`
}

function conditionToMongoExpr(cond: Condition): Document {
  if (cond.kind === 'field') {
    const op = cond.op === 'eq' ? '$eq' : '$ne'
    return { [op]: [fieldRef(cond.field), fieldRef(cond.compareField)] }
  }
  const op = VALUE_OP_TO_MONGO[cond.op]
  return { [op]: [fieldRef(cond.field), cond.value] }
}

function branchToMongoExpr(branch: Branch): Document {
  const exprs = branch.conditions.map(conditionToMongoExpr)
  if (exprs.length === 1) return exprs[0] as Document
  return { [branch.combinator === 'and' ? '$and' : '$or']: exprs }
}

export type CompiledRule = {
  /** The $addFields stage — pass straight into an aggregation pipeline. */
  addFieldsStage: Document
  /** Same case expressions, exposed separately so the UI can show the reader
   * exactly what got generated for each branch (a "compiled output" panel). */
  branchExpressions: { branchId: string; expr: Document }[]
}

export function compileRule(rule: RuleTree): CompiledRule {
  const compiled = rule.branches.map((branch) => ({
    branchId: branch.id,
    expr: branchToMongoExpr(branch),
    tier: branch.tier,
    action: branch.action,
  }))

  const tierSwitch = {
    $switch: {
      branches: compiled.map((c) => ({ case: c.expr, then: c.tier })),
      default: rule.defaultTier,
    },
  }
  const actionSwitch = {
    $switch: {
      branches: compiled.map((c) => ({ case: c.expr, then: c.action })),
      default: rule.defaultAction,
    },
  }
  const matchedRuleSwitch = {
    $switch: {
      branches: compiled.map((c) => ({ case: c.expr, then: c.branchId })),
      default: null,
    },
  }

  return {
    addFieldsStage: {
      $addFields: {
        riskTier: tierSwitch,
        action: actionSwitch,
        matchedBranchId: matchedRuleSwitch,
      },
    },
    branchExpressions: compiled.map(({ branchId, expr }) => ({ branchId, expr })),
  }
}
