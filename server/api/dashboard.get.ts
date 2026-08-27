import { getOrdersCollection, getSavedRulesCollection } from '../utils/mongo'
import { compileRule } from '../utils/compileRule'
import { RuleTreeSchema } from '#shared/types/rule'
import { describeBranch } from '#shared/utils/describeBranch'

export default defineEventHandler(async () => {
  const savedRules = await getSavedRulesCollection()
  const activeDoc = await savedRules.findOne({ active: true })

  if (!activeDoc) {
    return { active: null }
  }

  const rule = RuleTreeSchema.parse(activeDoc.rule)
  const compiled = compileRule(rule)
  const orders = await getOrdersCollection()

  const weeklyPipeline = [
    compiled.addFieldsStage,
    { $addFields: { weekBucket: { $dateTrunc: { date: '$createdAt', unit: 'week' as const } } } },
    {
      $group: {
        _id: '$weekBucket',
        allow: { $sum: { $cond: [{ $eq: ['$action', 'allow'] }, 1, 0] } },
        review: { $sum: { $cond: [{ $eq: ['$action', 'review'] }, 1, 0] } },
        block: { $sum: { $cond: [{ $eq: ['$action', 'block'] }, 1, 0] } },
        amountAtRiskCents: {
          $sum: { $cond: [{ $in: ['$action', ['review', 'block']] }, '$amountCents', 0] },
        },
      },
    },
    { $sort: { _id: 1 as const } },
  ]

  const branchPipeline = [
    compiled.addFieldsStage,
    { $group: { _id: '$matchedBranchId', count: { $sum: 1 } } },
  ]

  const [weekly, branchCounts] = await Promise.all([
    orders.aggregate(weeklyPipeline).toArray(),
    orders.aggregate(branchPipeline).toArray(),
  ])

  const totals = { allow: 0, review: 0, block: 0, amountAtRiskCents: 0 }
  for (const w of weekly) {
    totals.allow += w.allow
    totals.review += w.review
    totals.block += w.block
    totals.amountAtRiskCents += w.amountAtRiskCents
  }

  const branchCountMap = new Map(branchCounts.map((b) => [b._id, b.count as number]))
  const branchBreakdown = rule.branches.map((b) => ({
    id: b.id,
    description: describeBranch(b),
    tier: b.tier,
    action: b.action,
    count: branchCountMap.get(b.id) ?? 0,
  }))
  const unmatchedCount = branchCountMap.get(null) ?? 0

  return {
    active: {
      id: String(activeDoc._id),
      name: activeDoc.name,
      updatedAt: (activeDoc.updatedAt as Date).toISOString(),
    },
    totals,
    total: totals.allow + totals.review + totals.block,
    weekly: weekly.map((w) => ({
      week: (w._id as Date).toISOString(),
      allow: w.allow,
      review: w.review,
      block: w.block,
      amountAtRiskCents: w.amountAtRiskCents,
    })),
    branchBreakdown,
    unmatchedCount,
  }
})
