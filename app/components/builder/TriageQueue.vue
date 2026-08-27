<script setup lang="ts">
const builder = useBuilderStore()

const total = computed(() => builder.orders.length)

function pct(n: number) {
  return total.value ? Math.round((n / total.value) * 100) : 0
}

const actionStyles: Record<string, string> = {
  allow: 'bg-success/10 text-success',
  review: 'bg-warning/10 text-warning',
  block: 'bg-destructive/10 text-destructive',
}

const sortedResults = computed(() => {
  const order: Record<string, number> = { block: 0, review: 1, allow: 2 }
  return [...builder.triageResults].sort((a, b) => (order[a.action] ?? 3) - (order[b.action] ?? 3))
})
</script>

<template>
  <section aria-labelledby="triage-heading" class="flex flex-col gap-4">
    <h2 id="triage-heading" class="text-lg font-semibold">Live preview</h2>

    <div class="grid grid-cols-3 gap-3" role="status" aria-live="polite">
      <div class="rounded-lg border border-border bg-card p-3 text-center">
        <p class="text-2xl font-semibold tabular-nums text-success">{{ builder.summary.allow }}</p>
        <p class="text-xs text-muted-foreground">Allow ({{ pct(builder.summary.allow) }}%)</p>
      </div>
      <div class="rounded-lg border border-border bg-card p-3 text-center">
        <p class="text-2xl font-semibold tabular-nums text-warning">{{ builder.summary.review }}</p>
        <p class="text-xs text-muted-foreground">Review ({{ pct(builder.summary.review) }}%)</p>
      </div>
      <div class="rounded-lg border border-border bg-card p-3 text-center">
        <p class="text-2xl font-semibold tabular-nums text-destructive">{{ builder.summary.block }}</p>
        <p class="text-xs text-muted-foreground">Block ({{ pct(builder.summary.block) }}%)</p>
      </div>
    </div>

    <div v-if="!builder.ordersLoaded" class="text-sm text-muted-foreground">Loading orders…</div>

    <div v-else class="max-h-96 overflow-auto rounded-lg border border-border">
      <table class="w-full border-collapse text-sm">
        <caption class="sr-only">Orders triaged by the current rule, most severe first</caption>
        <thead class="sticky top-0 bg-secondary">
          <tr>
            <th scope="col" class="p-2 text-left font-medium">Order</th>
            <th scope="col" class="p-2 text-left font-medium">Amount</th>
            <th scope="col" class="p-2 text-left font-medium">Billing → Shipping</th>
            <th scope="col" class="p-2 text-left font-medium">Account age</th>
            <th scope="col" class="p-2 text-left font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in sortedResults.slice(0, 50)" :key="r.order.orderId" class="border-t border-border">
            <td class="p-2">{{ r.order.orderId }}</td>
            <td class="p-2 tabular-nums">${{ (r.order.amountCents / 100).toFixed(2) }}</td>
            <td class="p-2">{{ r.order.billingCountry }} → {{ r.order.shippingCountry }}</td>
            <td class="p-2 tabular-nums">{{ r.order.accountAgeDays }}d</td>
            <td class="p-2">
              <span class="rounded-full px-2 py-0.5 text-xs font-medium capitalize" :class="actionStyles[r.action]">
                {{ r.action }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="sortedResults.length > 50" class="p-2 text-center text-xs text-muted-foreground">
        Showing 50 of {{ sortedResults.length }} orders (blocked and flagged shown first)
      </p>
    </div>
  </section>
</template>
