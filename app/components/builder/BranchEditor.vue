<script setup lang="ts">
import { RISK_TIERS, ACTIONS } from '#shared/types/rule'
import type { Branch, Condition } from '#shared/types/rule'
import ConditionEditor from './ConditionEditor.vue'

const props = defineProps<{
  branch: Branch
  index: number
  total: number
}>()

const builder = useBuilderStore()

const tierStyles: Record<string, string> = {
  low: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive',
}
</script>

<template>
  <div class="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span
          class="rounded-full px-2 py-0.5 text-xs font-medium"
          :class="tierStyles[branch.tier]"
        >
          Branch {{ index + 1 }}
        </span>
        <span class="text-xs text-muted-foreground">match</span>
        <label :for="`${branch.id}-combinator`" class="sr-only">Match type</label>
        <select
          :id="`${branch.id}-combinator`"
          :value="branch.combinator"
          class="rounded border border-input bg-background px-2 py-1 text-xs"
          @change="builder.updateBranch(branch.id, { combinator: ($event.target as HTMLSelectElement).value as 'and' | 'or' })"
        >
          <option value="and">ALL of</option>
          <option value="or">ANY of</option>
        </select>
        <span class="text-xs text-muted-foreground">these conditions</span>
      </div>

      <div
        role="group"
        :aria-label="`Reorder branch ${index + 1}`"
        class="flex items-center gap-1"
      >
        <button
          type="button"
          class="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent disabled:opacity-30"
          :disabled="index === 0"
          aria-label="Move branch up (evaluated earlier)"
          @click="builder.moveBranch(branch.id, 'up')"
        >
          ↑
        </button>
        <button
          type="button"
          class="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent disabled:opacity-30"
          :disabled="index === total - 1"
          aria-label="Move branch down (evaluated later)"
          @click="builder.moveBranch(branch.id, 'down')"
        >
          ↓
        </button>
        <button
          type="button"
          class="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-destructive"
          :aria-label="`Remove branch ${index + 1}`"
          :disabled="total === 1"
          @click="builder.removeBranch(branch.id)"
        >
          Remove
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <ConditionEditor
        v-for="(condition, i) in branch.conditions"
        :key="i"
        :condition="condition"
        :branch-id="branch.id"
        :index="i"
        :can-remove="branch.conditions.length > 1"
        @update="(c: Condition) => builder.updateCondition(branch.id, i, c)"
        @remove="builder.removeCondition(branch.id, i)"
      />
      <button
        type="button"
        class="self-start rounded px-2 py-1 text-xs text-primary hover:bg-accent"
        @click="builder.addCondition(branch.id)"
      >
        + Add condition
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-sm">
      <span class="text-muted-foreground">Then set risk to</span>
      <label :for="`${branch.id}-tier`" class="sr-only">Risk tier</label>
      <select
        :id="`${branch.id}-tier`"
        :value="branch.tier"
        class="rounded border border-input bg-background px-2 py-1 text-sm capitalize"
        @change="builder.updateBranch(branch.id, { tier: ($event.target as HTMLSelectElement).value as Branch['tier'] })"
      >
        <option v-for="t in RISK_TIERS" :key="t" :value="t" class="capitalize">{{ t }}</option>
      </select>
      <span class="text-muted-foreground">and</span>
      <label :for="`${branch.id}-action`" class="sr-only">Action</label>
      <select
        :id="`${branch.id}-action`"
        :value="branch.action"
        class="rounded border border-input bg-background px-2 py-1 text-sm capitalize"
        @change="builder.updateBranch(branch.id, { action: ($event.target as HTMLSelectElement).value as Branch['action'] })"
      >
        <option v-for="a in ACTIONS" :key="a" :value="a" class="capitalize">{{ a }}</option>
      </select>
      <span class="text-muted-foreground">the order.</span>
    </div>
  </div>
</template>
