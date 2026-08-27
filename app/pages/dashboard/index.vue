<script setup lang="ts">
import TrendChart from '../../components/dashboard/TrendChart.vue'

type DashboardData = {
  active: { id: string; name: string; updatedAt: string } | null
  totals?: { allow: number; review: number; block: number; amountAtRiskCents: number }
  total?: number
  weekly?: { week: string; allow: number; review: number; block: number; amountAtRiskCents: number }[]
  branchBreakdown?: { id: string; description: string; tier: string; action: string; count: number }[]
  unmatchedCount?: number
}

const data = ref<DashboardData | null>(null)

onMounted(async () => {
  data.value = await $fetch<DashboardData>('/api/dashboard')
})

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function pct(n: number, total: number) {
  return total ? Math.round((n / total) * 100) : 0
}
</script>

<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
    <h1 id="main-content" class="text-2xl font-semibold">Risk dashboard</h1>

    <p v-if="data === null" class="text-sm text-muted-foreground">Loading…</p>

    <div v-else-if="!data.active" class="rounded-lg border border-dashed border-border p-8 text-center">
      <p class="text-muted-foreground">
        No rule is active yet.
        <NuxtLink to="/rules" class="text-primary underline underline-offset-2">Activate one</NuxtLink>
        to see its impact here.
      </p>
    </div>

    <template v-else-if="data.totals && data.total !== undefined">
      <p class="text-sm text-muted-foreground">
        Showing the impact of <span class="font-medium text-foreground">{{ data.active.name }}</span>
        against the last 90 days of order data.
      </p>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-lg border border-border bg-card p-3 text-center">
          <p class="text-2xl font-semibold tabular-nums">{{ data.total }}</p>
          <p class="text-xs text-muted-foreground">Total orders</p>
        </div>
        <div class="rounded-lg border border-border bg-card p-3 text-center">
          <p class="text-2xl font-semibold tabular-nums text-destructive">
            {{ pct(data.totals.block, data.total) }}%
          </p>
          <p class="text-xs text-muted-foreground">Block rate ({{ data.totals.block }})</p>
        </div>
        <div class="rounded-lg border border-border bg-card p-3 text-center">
          <p class="text-2xl font-semibold tabular-nums text-warning">
            {{ pct(data.totals.review, data.total) }}%
          </p>
          <p class="text-xs text-muted-foreground">Review rate ({{ data.totals.review }})</p>
        </div>
        <div class="rounded-lg border border-border bg-card p-3 text-center">
          <p class="text-2xl font-semibold tabular-nums">{{ formatMoney(data.totals.amountAtRiskCents) }}</p>
          <p class="text-xs text-muted-foreground">Amount at risk</p>
        </div>
      </div>

      <section aria-labelledby="trend-heading" class="rounded-lg border border-border bg-card p-4">
        <h2 id="trend-heading" class="mb-3 text-sm font-semibold">Weekly trend</h2>
        <TrendChart v-if="data.weekly" :weeks="data.weekly" />
      </section>

      <section aria-labelledby="branch-heading" class="rounded-lg border border-border bg-card p-4">
        <h2 id="branch-heading" class="mb-3 text-sm font-semibold">Which branch is doing the work</h2>
        <ul class="flex flex-col gap-2 text-sm">
          <li
            v-for="b in data.branchBreakdown"
            :key="b.id"
            class="flex items-center justify-between gap-2 rounded-md bg-secondary px-3 py-2"
          >
            <span class="text-secondary-foreground">{{ b.description }}</span>
            <span class="shrink-0 tabular-nums text-muted-foreground">{{ b.count }} orders</span>
          </li>
          <li
            v-if="data.unmatchedCount"
            class="flex items-center justify-between gap-2 rounded-md bg-secondary px-3 py-2"
          >
            <span class="text-secondary-foreground">Fell through to default</span>
            <span class="shrink-0 tabular-nums text-muted-foreground">{{ data.unmatchedCount }} orders</span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
