<script setup lang="ts">
const props = defineProps<{
  weeks: { week: string; block: number; review: number }[]
}>()

const maxValue = computed(() => Math.max(1, ...props.weeks.map((w) => w.block + w.review)))

const chartWidth = 600
const chartHeight = 180
const barGap = 6
const barWidth = computed(() =>
  props.weeks.length ? chartWidth / props.weeks.length - barGap : 0
)

function barX(i: number) {
  return i * (barWidth.value + barGap)
}

function blockHeight(w: { block: number }) {
  return (w.block / maxValue.value) * chartHeight
}

function reviewHeight(w: { review: number }) {
  return (w.review / maxValue.value) * chartHeight
}

function weekLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div>
    <svg
      :viewBox="`0 0 ${chartWidth} ${chartHeight + 24}`"
      class="w-full"
      role="img"
      aria-labelledby="trend-chart-title"
    >
      <title id="trend-chart-title">Blocked and flagged-for-review orders per week</title>
      <g v-for="(w, i) in weeks" :key="w.week">
        <rect
          :x="barX(i)"
          :y="chartHeight - blockHeight(w) - reviewHeight(w)"
          :width="barWidth"
          :height="reviewHeight(w)"
          class="fill-warning/60"
        />
        <rect
          :x="barX(i)"
          :y="chartHeight - blockHeight(w)"
          :width="barWidth"
          :height="blockHeight(w)"
          class="fill-destructive"
        />
        <text
          v-if="i % Math.ceil(weeks.length / 8 || 1) === 0"
          :x="barX(i) + barWidth / 2"
          :y="chartHeight + 16"
          text-anchor="middle"
          class="fill-muted-foreground text-[8px]"
        >
          {{ weekLabel(w.week) }}
        </text>
      </g>
    </svg>

    <details class="mt-2">
      <summary class="cursor-pointer text-xs text-muted-foreground">View as table</summary>
      <table class="mt-2 w-full border-collapse text-xs">
        <caption class="sr-only">Weekly blocked and review counts</caption>
        <thead>
          <tr>
            <th scope="col" class="border border-border p-1 text-left">Week of</th>
            <th scope="col" class="border border-border p-1 text-left">Blocked</th>
            <th scope="col" class="border border-border p-1 text-left">Review</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in weeks" :key="w.week">
            <td class="border border-border p-1">{{ weekLabel(w.week) }}</td>
            <td class="border border-border p-1 tabular-nums">{{ w.block }}</td>
            <td class="border border-border p-1 tabular-nums">{{ w.review }}</td>
          </tr>
        </tbody>
      </table>
    </details>
  </div>
</template>
