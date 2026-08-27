import { defineStore } from 'pinia'
import { evaluateRule } from '#shared/utils/evaluateRule'
import type { Order } from '#shared/types/order'
import type { Branch, Condition, RuleTree } from '#shared/types/rule'

function makeId() {
  return Math.random().toString(36).slice(2, 9)
}

function defaultRule(): RuleTree {
  return {
    name: 'Untitled rule',
    branches: [
      {
        id: makeId(),
        combinator: 'and',
        conditions: [{ kind: 'value', field: 'amountCents', op: 'gt', value: 30000 }],
        tier: 'medium',
        action: 'review',
      },
    ],
    defaultTier: 'low',
    defaultAction: 'allow',
  }
}

export const useBuilderStore = defineStore('builder', {
  state: () => ({
    rule: defaultRule() as RuleTree,
    orders: [] as Order[],
    ordersLoaded: false,
    explanation: '' as string,
  }),

  getters: {
    /** Instant client-side preview — no server round trip. Mirrors exactly
     * what server/utils/compileRule.ts would produce as a real Mongo
     * aggregation; see evaluateRule.ts for why the two must stay in sync. */
    triageResults(state): { order: Order; tier: string; action: string; matchedBranchId: string | null }[] {
      return state.orders.map((order) => ({ order, ...evaluateRule(order, state.rule) }))
    },
    summary(): { allow: number; review: number; block: number } {
      const summary = { allow: 0, review: 0, block: 0 }
      for (const r of this.triageResults) {
        if (r.action in summary) summary[r.action as keyof typeof summary]++
      }
      return summary
    },
  },

  actions: {
    async fetchOrders() {
      if (this.ordersLoaded) return
      const { orders } = await $fetch<{ orders: Order[] }>('/api/orders')
      this.orders = orders
      this.ordersLoaded = true
    },

    reset() {
      this.rule = defaultRule()
      this.explanation = ''
    },

    applyGeneratedRule(rule: RuleTree, explanation: string) {
      this.rule = rule
      this.explanation = explanation
    },

    setName(name: string) {
      this.rule.name = name
    },

    setDefault(tier: RuleTree['defaultTier'], action: RuleTree['defaultAction']) {
      this.rule.defaultTier = tier
      this.rule.defaultAction = action
    },

    addBranch() {
      this.rule.branches.push({
        id: makeId(),
        combinator: 'and',
        conditions: [{ kind: 'value', field: 'amountCents', op: 'gt', value: 0 }],
        tier: 'medium',
        action: 'review',
      })
    },

    removeBranch(branchId: string) {
      this.rule.branches = this.rule.branches.filter((b) => b.id !== branchId)
    },

    moveBranch(branchId: string, direction: 'up' | 'down') {
      const i = this.rule.branches.findIndex((b) => b.id === branchId)
      const j = direction === 'up' ? i - 1 : i + 1
      if (i < 0 || j < 0 || j >= this.rule.branches.length) return
      const branches = [...this.rule.branches]
      ;[branches[i], branches[j]] = [branches[j] as Branch, branches[i] as Branch]
      this.rule.branches = branches
    },

    updateBranch(branchId: string, patch: Partial<Pick<Branch, 'combinator' | 'tier' | 'action'>>) {
      const branch = this.rule.branches.find((b) => b.id === branchId)
      if (branch) Object.assign(branch, patch)
    },

    addCondition(branchId: string) {
      const branch = this.rule.branches.find((b) => b.id === branchId)
      if (branch) branch.conditions.push({ kind: 'value', field: 'amountCents', op: 'gt', value: 0 })
    },

    removeCondition(branchId: string, index: number) {
      const branch = this.rule.branches.find((b) => b.id === branchId)
      if (branch && branch.conditions.length > 1) branch.conditions.splice(index, 1)
    },

    updateCondition(branchId: string, index: number, condition: Condition) {
      const branch = this.rule.branches.find((b) => b.id === branchId)
      if (branch) branch.conditions.splice(index, 1, condition)
    },
  },
})
