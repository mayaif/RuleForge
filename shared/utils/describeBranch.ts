import { ORDER_FIELDS } from '../types/order'
import type { Branch, Condition } from '../types/rule'

const OP_WORDS: Record<string, string> = {
  eq: 'is',
  neq: 'is not',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
}

function fieldLabel(field: string) {
  return ORDER_FIELDS[field as keyof typeof ORDER_FIELDS]?.label ?? field
}

function describeCondition(c: Condition): string {
  if (c.kind === 'field') return `${fieldLabel(c.field)} ${OP_WORDS[c.op]} ${fieldLabel(c.compareField)}`
  return `${fieldLabel(c.field)} ${OP_WORDS[c.op]} ${c.value}`
}

/** Deterministic, non-AI plain-text summary of a branch's conditions — used
 * anywhere a short human-readable label is needed (dashboard breakdown,
 * builder headers) without a Groq round trip. */
export function describeBranch(branch: Branch): string {
  const joiner = branch.combinator === 'and' ? ' AND ' : ' OR '
  return branch.conditions.map(describeCondition).join(joiner)
}
